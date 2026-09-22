// Fonction Edge Supabase : dépose/lit/supprime les documents RH comme de vrais fichiers
// dans le Google Drive de Océane, dossier "REGISTRE DU PERSONNEL".
//
// Chemin construit dans le Drive : REGISTRE DU PERSONNEL / <resto> / <année> / <SALLE|CUISINE> / <NOM_Prénom>
//
// La clé du compte de service Google ne quitte jamais ce serveur. Le navigateur n'appelle
// que cette fonction (via supabase.functions.invoke), jamais l'API Google directement.
//
// Variables d'environnement à définir (Supabase → Edge Functions → drive-docs → Secrets) :
//   GOOGLE_SA_EMAIL         l'adresse du compte de service (ex: xxx@yyy.iam.gserviceaccount.com)
//   GOOGLE_SA_PRIVATE_KEY   la clé privée du compte de service (bloc "-----BEGIN PRIVATE KEY-----...")
//   DRIVE_ROOT_FOLDER_ID    l'identifiant du dossier "REGISTRE DU PERSONNEL" (dans son URL Drive)
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement par Supabase.

const GOOGLE_SA_EMAIL = Deno.env.get("GOOGLE_SA_EMAIL") ?? "";
const GOOGLE_SA_PRIVATE_KEY = (Deno.env.get("GOOGLE_SA_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const DRIVE_ROOT_FOLDER_ID = Deno.env.get("DRIVE_ROOT_FOLDER_ID") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, ...extraHeaders, "Content-Type": "application/json" },
  });
}

function decodeJwt(token: string): { sub?: string; role?: string } | null {
  try {
    const partie = token.split(".")[1];
    const b64 = partie.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

function nomDossier(nom: string, prenom: string) {
  const p = String(prenom || "").trim();
  return `${String(nom || "").trim().toUpperCase()}_${p.charAt(0).toUpperCase()}${p.slice(1).toLowerCase()}`;
}

// ---------- Auth Google (compte de service → jeton d'accès Drive) ----------
let jetonCache: { jeton: string; exp: number } | null = null;

async function jetonAcces(): Promise<string> {
  const maintenant = Math.floor(Date.now() / 1000);
  if (jetonCache && jetonCache.exp > maintenant + 60) return jetonCache.jeton;

  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const entete = enc({ alg: "RS256", typ: "JWT" });
  const revendication = enc({
    iss: GOOGLE_SA_EMAIL,
    scope: "https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    iat: maintenant,
    exp: maintenant + 3600,
  });
  const nonSigne = `${entete}.${revendication}`;

  const corpsPem = GOOGLE_SA_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const octetsCle = Uint8Array.from(atob(corpsPem), (c) => c.charCodeAt(0));
  const cle = await crypto.subtle.importKey(
    "pkcs8",
    octetsCle,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuf = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cle,
    new TextEncoder().encode(nonSigne),
  );
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const assertion = `${nonSigne}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const donnees = await res.json();
  if (!res.ok) throw new Error("google_auth_echec: " + JSON.stringify(donnees));
  jetonCache = { jeton: donnees.access_token, exp: maintenant + donnees.expires_in };
  return donnees.access_token;
}

// ---------- Appels API Google Drive ----------
async function chercherDossier(jeton: string, parentId: string, nom: string): Promise<string | null> {
  const requete = `name='${nom.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(requete)}&fields=files(id,name)&spaces=drive`,
    { headers: { Authorization: `Bearer ${jeton}` } },
  );
  if (!res.ok) throw new Error("drive_recherche_echec: " + (await res.text()));
  const j = await res.json();
  return j.files && j.files[0] ? j.files[0].id : null;
}

async function creerDossier(jeton: string, parentId: string, nom: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: nom, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  if (!res.ok) throw new Error("drive_creation_echec: " + (await res.text()));
  return (await res.json()).id;
}

async function resoudreChemin(
  jeton: string,
  params: { resto: string; annee: number | string; unite: string; nom: string; prenom: string },
  creer: boolean,
): Promise<string | null> {
  let id = DRIVE_ROOT_FOLDER_ID;
  const segments = [params.resto, String(params.annee), params.unite, nomDossier(params.nom, params.prenom)];
  for (const segment of segments) {
    const trouve = await chercherDossier(jeton, id, segment);
    if (trouve) { id = trouve; continue; }
    if (!creer) return null;
    id = await creerDossier(jeton, id, segment);
  }
  return id;
}

async function listerFichiers(jeton: string, dossierId: string) {
  const requete = `'${dossierId}' in parents and trashed=false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(requete)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name&spaces=drive`,
    { headers: { Authorization: `Bearer ${jeton}` } },
  );
  if (!res.ok) throw new Error("drive_liste_echec: " + (await res.text()));
  return (await res.json()).files || [];
}

async function televerser(jeton: string, dossierId: string, nomFichier: string, type: string, base64: string) {
  const frontiere = "ig-" + crypto.randomUUID();
  const meta = JSON.stringify({ name: nomFichier, parents: [dossierId] });
  const octets = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const enc = new TextEncoder();
  const debut = enc.encode(
    `--${frontiere}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
      `--${frontiere}\r\nContent-Type: ${type || "application/octet-stream"}\r\n\r\n`,
  );
  const fin = enc.encode(`\r\n--${frontiere}--`);
  const corps = new Uint8Array(debut.length + octets.length + fin.length);
  corps.set(debut, 0);
  corps.set(octets, debut.length);
  corps.set(fin, debut.length + octets.length);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jeton}`, "Content-Type": `multipart/related; boundary=${frontiere}` },
      body: corps,
    },
  );
  if (!res.ok) throw new Error("drive_upload_echec: " + (await res.text()));
  return res.json();
}

// ---------- Autorisation (miroir des règles RLS sur rh_acces) ----------
async function autorise(userId: string, resto: string, unite: string): Promise<boolean> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rh_acces?user_id=eq.${userId}&select=resto,unite,superviseur`,
    { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
  );
  if (!res.ok) return false;
  const lignes = await res.json();
  if (lignes.some((l: { superviseur: boolean }) => l.superviseur)) return true;
  return lignes.some((l: { resto: string; unite: string }) => l.resto === resto && (l.unite === unite || l.unite === "TOUS"));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !DRIVE_ROOT_FOLDER_ID) {
      return json({ error: "configuration_google_manquante" }, 500);
    }

    const enTete = req.headers.get("Authorization") || "";
    const jetonAppelant = enTete.replace(/^Bearer\s+/i, "");
    const charge = decodeJwt(jetonAppelant);
    const userId = charge?.sub || null;

    const corps = await req.json();
    const { action } = corps;

    // Action publique (sans connexion) : appelée juste après l'envoi du formulaire
    // d'onboarding, crée le dossier de l'année en cours pour le nouveau salarié.
    if (action === "ensureFolderPublic") {
      const { resto, unite, annee, nom, prenom } = corps;
      if (!resto || !unite || !annee || !nom || !prenom) return json({ error: "champs_manquants" }, 400);
      if (!["SALLE", "CUISINE"].includes(unite)) return json({ error: "unite_invalide" }, 400);
      const jeton = await jetonAcces();
      const id = await resoudreChemin(jeton, { resto, annee, unite, nom, prenom }, true);
      return json({ dossierId: id });
    }

    if (!userId) return json({ error: "non_authentifie" }, 401);

    const { resto, unite, annee, nom, prenom } = corps;
    if (!resto || !unite || !annee || !nom || !prenom) return json({ error: "champs_manquants" }, 400);
    if (!(await autorise(userId, resto, unite))) return json({ error: "acces_refuse" }, 403);

    const jeton = await jetonAcces();

    if (action === "list") {
      const dossierId = await resoudreChemin(jeton, { resto, annee, unite, nom, prenom }, false);
      const fichiers = dossierId ? await listerFichiers(jeton, dossierId) : [];
      return json({ fichiers });
    }

    if (action === "upload") {
      const dossierId = await resoudreChemin(jeton, { resto, annee, unite, nom, prenom }, true);
      const fichier = await televerser(jeton, dossierId!, corps.nomFichier, corps.type, corps.base64);
      return json({ fichier });
    }

    if (action === "download" || action === "supprimer") {
      const dossierId = await resoudreChemin(jeton, { resto, annee, unite, nom, prenom }, false);
      if (!dossierId) return json({ error: "dossier_introuvable" }, 404);

      const metaRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${corps.fileId}?fields=id,parents,name,mimeType`,
        { headers: { Authorization: `Bearer ${jeton}` } },
      );
      if (!metaRes.ok) return json({ error: "fichier_introuvable" }, 404);
      const meta = await metaRes.json();
      if (!meta.parents || !meta.parents.includes(dossierId)) return json({ error: "acces_refuse" }, 403);

      if (action === "supprimer") {
        const del = await fetch(`https://www.googleapis.com/drive/v3/files/${corps.fileId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${jeton}` },
        });
        if (!del.ok && del.status !== 404) return json({ error: "suppression_echouee" }, 500);
        return json({ ok: true });
      }

      const fichierRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${corps.fileId}?alt=media`,
        { headers: { Authorization: `Bearer ${jeton}` } },
      );
      if (!fichierRes.ok || !fichierRes.body) return json({ error: "telechargement_echoue" }, 500);
      return new Response(fichierRes.body, {
        headers: {
          ...CORS,
          "Content-Type": meta.mimeType || "application/octet-stream",
          "Content-Disposition": `inline; filename="${meta.name.replace(/"/g, "")}"`,
        },
      });
    }

    return json({ error: "action_inconnue" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "erreur_serveur", detail: String((e as Error)?.message || e) }, 500);
  }
});
