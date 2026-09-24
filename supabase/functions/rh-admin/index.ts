// Fonction Edge Supabase : permet au superviseur de créer/gérer les accès RH
// (comptes directeur/chef, un par personne, avec Salle ou Cuisine) directement
// depuis l'appli, sans jamais avoir besoin d'ouvrir Supabase.
//
// Actions :
//   - "lister"       : renvoie tous les accès RH existants (email + établissement + unité).
//   - "creer"        : crée le compte (ou réutilise un compte existant du même email) et
//                      lui donne accès à un établissement + une unité.
//   - "supprimer"     : retire un accès précis (le compte reste, il perd juste ce droit-là).
//   - "envoyerEmail"  : envoie un email (ex : promesse d'embauche) à une adresse donnée,
//                      via le compte Gmail/Google Workspace configuré (voir plus bas).
//
// Toutes les actions sont réservées au superviseur : vérifié en interrogeant Supabase
// Auth avec le jeton de la personne qui appelle (pas en décodant le jeton nous-mêmes,
// pour ne jamais faire confiance à un jeton qu'on n'a pas vérifié).
//
// Variables d'environnement : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY, fournies
// automatiquement par Supabase (aucun secret à configurer manuellement). Pour "envoyerEmail",
// il faut en plus configurer SMTP_USER et SMTP_PASSWORD (voir plus bas).

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") ?? "").trim();
const SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();

// Envoi d'email (ex : promesse d'embauche) via un compte Gmail / Google Workspace, en SMTP
// avec un "mot de passe d'application" (jamais le vrai mot de passe du compte). À configurer
// dans les secrets de la fonction Supabase : SMTP_USER (adresse d'envoi), SMTP_PASSWORD
// (mot de passe d'application Google), SMTP_FROM_NOM (optionnel, nom affiché à l'expéditeur).
const SMTP_USER = (Deno.env.get("SMTP_USER") ?? "").trim();
const SMTP_PASSWORD = (Deno.env.get("SMTP_PASSWORD") ?? "").trim();
const SMTP_FROM_NOM = (Deno.env.get("SMTP_FROM_NOM") ?? "Indie Group").trim();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// Vérifie le jeton auprès de Supabase Auth lui-même (signature + expiration contrôlées
// côté serveur Supabase) : bien plus sûr qu'un simple décodage local du jeton.
async function utilisateurAuthentifie(authHeader: string): Promise<{ id: string; email: string } | null> {
  if (!authHeader) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: SERVICE_ROLE_KEY },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? { id: data.id, email: data.email } : null;
}

async function estSuperviseur(userId: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces?user_id=eq.${userId}&superviseur=is.true&select=id&limit=1`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return false;
  const lignes = await res.json();
  return Array.isArray(lignes) && lignes.length > 0;
}

// N'importe quel compte RH (directeur/chef ou superviseur), pas seulement superviseur —
// utilisé pour l'action "rechercherSalaries" ci-dessous, ouverte à tous les comptes RH.
async function aUnAccesRH(userId: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces?user_id=eq.${userId}&select=id&limit=1`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return false;
  const lignes = await res.json();
  return Array.isArray(lignes) && lignes.length > 0;
}

async function trouverUtilisateurParEmail(email: string): Promise<{ id: string } | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const utilisateurs = Array.isArray(data) ? data : data?.users;
  const trouve = (utilisateurs || []).find((u: { email?: string }) => (u.email || "").toLowerCase() === email.toLowerCase());
  return trouve ? { id: trouve.id } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "methode_non_supportee" }, 405);

  try {
    const corps = await req.json();
    const { action } = corps;

    const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
    if (!appelant) return json({ error: "non_authentifie" }, 401);

    // ---- Recherche de salariés tous établissements confondus (ex : pour identifier qui
    // on emprunte comme "extra" ailleurs). Ouvert à tout compte RH, pas seulement au
    // superviseur — mais ne renvoie que le strict nécessaire pour identifier la personne
    // (jamais salaire, IBAN, etc.), donc pas de fuite de données sensibles inter-sites.
    // Uniquement les salariés RÉELLEMENT sous contrat aujourd'hui : ni les fiches
    // "provisoire" (pas encore réellement embauchées), ni celles d'une saison archivée
    // (l'ancienne saison reste en base pour l'historique, mais ne doit plus être proposée
    // au choix), ni celles dont le contrat est déjà terminé (date_fin dans le passé). ----
    if (action === "rechercherSalaries") {
      if (!(await aUnAccesRH(appelant.id))) return json({ error: "acces_refuse" }, 403);
      const q = String(corps.q || "").trim();
      if (q.length < 2) return json({ ok: true, resultats: [] });
      const anneeActuelle = String(new Date().getFullYear());
      const aujourdHui = new Date().toISOString().slice(0, 10);
      const qEnc = encodeURIComponent(q);
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rh_salaries?and=(saison.eq.${anneeActuelle},provisoire.is.false,or(date_fin.is.null,date_fin.gte.${aujourdHui}),or(nom.ilike.*${qEnc}*,prenom.ilike.*${qEnc}*))&select=id,nom,prenom,resto,unite,poste&order=nom.asc&limit=8`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
      );
      if (!res.ok) return json({ error: "recherche_echouee", detail: await res.text() }, 500);
      return json({ ok: true, resultats: await res.json() });
    }

    if (!(await estSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);

    // ---- Envoi d'un email (ex : promesse d'embauche) à une adresse donnée, via le compte
    // Gmail/Google Workspace configuré en secrets (SMTP_USER + SMTP_PASSWORD = un "mot de
    // passe d'application" Google, jamais le vrai mot de passe du compte). ----
    if (action === "envoyerEmail") {
      if (!SMTP_USER || !SMTP_PASSWORD) {
        return json({ error: "smtp_non_configure", detail: "SMTP_USER / SMTP_PASSWORD manquants dans les secrets de la fonction rh-admin." }, 500);
      }
      const { to, sujet, html, texte } = corps;
      if (!to || !sujet || !html) return json({ error: "champs_manquants" }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(to))) return json({ error: "email_invalide" }, 400);

      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 465,
          tls: true,
          auth: { username: SMTP_USER, password: SMTP_PASSWORD },
        },
      });
      try {
        await client.send({
          from: `${SMTP_FROM_NOM} <${SMTP_USER}>`,
          to: String(to),
          subject: String(sujet),
          content: String(texte || " "),
          html: String(html),
        });
      } catch (e) {
        return json({ error: "envoi_echoue", detail: String((e as Error)?.message || e) }, 500);
      } finally {
        await client.close();
      }
      return json({ ok: true });
    }

    // ---- Liste des accès RH existants ----
    if (action === "lister") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces?select=id,user_id,resto,unite,superviseur,created_at&order=created_at.asc`, {
        headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      });
      if (!res.ok) return json({ error: "lecture_impossible" }, 500);
      const lignes = await res.json();

      // Récupère l'email de chaque compte concerné (un seul appel par utilisateur distinct).
      const idsUniques = Array.from(new Set(lignes.map((l: { user_id: string }) => l.user_id)));
      const emails: Record<string, string> = {};
      for (const id of idsUniques) {
        const r = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
          headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
        });
        if (r.ok) { const u = await r.json(); emails[id as string] = u?.email || "(email introuvable)"; }
      }
      const resultat = lignes.map((l: { id: number; user_id: string; resto: string; unite: string; superviseur: boolean }) => ({
        id: l.id, user_id: l.user_id, email: emails[l.user_id] || "(compte supprimé)", resto: l.resto, unite: l.unite, superviseur: l.superviseur,
      }));
      return json({ ok: true, acces: resultat });
    }

    // ---- Création d'un accès (compte + droit sur un établissement/unité) ----
    if (action === "creer") {
      const { email, motDePasse, resto, unite } = corps;
      if (!email || !resto || !unite) return json({ error: "champs_manquants" }, 400);
      if (!["SALLE", "CUISINE", "TOUS"].includes(unite)) return json({ error: "unite_invalide" }, 400);

      let userId: string | null = null;

      // Le compte existe peut-être déjà (ex : un directeur qu'on ajoute sur un 2e établissement).
      const existant = await trouverUtilisateurParEmail(email);
      if (existant) {
        userId = existant.id;
      } else {
        if (!motDePasse || motDePasse.length < 6) return json({ error: "mot_de_passe_trop_court" }, 400);
        const resCreation = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: motDePasse, email_confirm: true }),
        });
        if (!resCreation.ok) {
          const detail = await resCreation.text();
          return json({ error: "creation_compte_echouee", detail }, 400);
        }
        const nouveau = await resCreation.json();
        userId = nouveau.id;
      }

      const resAcces = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces`, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify({ user_id: userId, resto, unite, superviseur: false }),
      });
      if (!resAcces.ok) {
        const detail = await resAcces.text();
        return json({ error: "droit_non_enregistre", detail }, 500);
      }
      return json({ ok: true, email, resto, unite });
    }

    // ---- Changement du mot de passe d'un compte existant ----
    // Un mot de passe une fois enregistré ne peut jamais être relu (même par nous) : on ne
    // peut que le remplacer par un nouveau, ce que fait cette action.
    if (action === "changerMotDePasse") {
      const { user_id, motDePasse } = corps;
      if (!user_id || !motDePasse) return json({ error: "champs_manquants" }, 400);
      if (motDePasse.length < 6) return json({ error: "mot_de_passe_trop_court" }, 400);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user_id}`, {
        method: "PUT",
        headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password: motDePasse }),
      });
      if (!res.ok) {
        const detail = await res.text();
        return json({ error: "changement_echoue", detail }, 500);
      }
      return json({ ok: true });
    }

    // ---- Retrait d'un accès précis ----
    if (action === "supprimer") {
      const { id } = corps;
      if (!id) return json({ error: "champs_manquants" }, 400);
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
      });
      if (!res.ok) return json({ error: "suppression_echouee" }, 500);
      return json({ ok: true });
    }

    return json({ error: "action_inconnue" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "erreur_serveur", detail: String((e as Error)?.message || e) }, 500);
  }
});
