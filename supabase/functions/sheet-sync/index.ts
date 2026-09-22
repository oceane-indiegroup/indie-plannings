// Fonction Edge Supabase : garde le Google Sheet "onboarding" d'Océane synchronisé avec
// l'appli, dans les deux sens :
//   - action "upsertRow"   : appelée par l'appli après chaque création/modification d'une
//                            fiche RH -> crée ou met à jour la ligne correspondante dans le Sheet.
//   - action "formSubmit"  : appelée par un petit script Google Apps Script (déclenché à
//                            chaque réponse du vrai Google Form) -> crée la fiche dans l'appli.
//
// La clé du compte de service Google ne quitte jamais ce serveur. Les colonnes du Sheet
// sont retrouvées par LEUR TEXTE (pas par lettre de colonne) pour ne rien écrire dans la
// mauvaise case même si Océane réorganise ses colonnes plus tard. Cette fonction ne
// touche jamais à Google Drive : la création des dossiers/documents des salariés reste
// entièrement gérée par le système Apps Script existant d'Océane.
//
// Variables d'environnement à définir (Supabase → Edge Functions → sheet-sync → Secrets) :
//   GOOGLE_SA_EMAIL         l'adresse du compte de service Google (créé dans Google Cloud)
//   GOOGLE_SA_PRIVATE_KEY   sa clé privée
//   SHEET_ID                l'identifiant du Google Sheet "onboarding" (dans son URL, après /d/)
//   SHEET_TAB                le nom exact de l'onglet (ex: "Form_Responses1")
//   FORM_WEBHOOK_SECRET     un mot de passe inventé par vous, collé aussi dans le script Apps Script
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

// .trim() partout : un espace ou un retour à la ligne collé par erreur dans un secret
// (très facile en copiant-collant depuis un fichier .json ou une barre d'adresse) rend
// l'identifiant invalide sans qu'aucun message d'erreur ne le dise clairement.
const GOOGLE_SA_EMAIL = (Deno.env.get("GOOGLE_SA_EMAIL") ?? "").trim();
const GOOGLE_SA_PRIVATE_KEY = (Deno.env.get("GOOGLE_SA_PRIVATE_KEY") ?? "").trim().replace(/\\n/g, "\n");
const SHEET_ID = (Deno.env.get("SHEET_ID") ?? "").trim();
const SHEET_TAB = (Deno.env.get("SHEET_TAB") ?? "").trim();
const FORM_WEBHOOK_SECRET = (Deno.env.get("FORM_WEBHOOK_SECRET") ?? "").trim();
const SUPABASE_URL = (Deno.env.get("SUPABASE_URL") ?? "").trim();
const SERVICE_ROLE_KEY = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

function decodeJwt(token: string): { sub?: string } | null {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

function normaliser(s: string): string {
  return (s || "")
    .toString()
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Chaque entrée décrit comment reconnaître, dans le texte d'un en-tête de colonne du
// Sheet (normalisé), la colonne qui correspond à un champ de l'appli — et inversement,
// pour "formSubmit", comment reconnaître le titre de question du Form.
const CHAMPS_SHEET: { cle: string; test: (h: string) => boolean }[] = [
  { cle: "resto", test: (h) => h.includes("etablissement dans lequel") },
  { cle: "unite", test: (h) => h.includes("unite de travail") },
  { cle: "civilite", test: (h) => h === "civilite" },
  { cle: "nom", test: (h) => h === "nom" },
  { cle: "prenom", test: (h) => h === "prenom" },
  { cle: "poste", test: (h) => h.includes("nom du poste") },
  { cle: "date_naissance", test: (h) => h.includes("date de naissance") },
  { cle: "lieu_naissance", test: (h) => h.includes("lieu") && h.includes("naissance") },
  { cle: "nationalite", test: (h) => h.startsWith("nationalite") },
  { cle: "adresse", test: (h) => h.includes("adresse postale") },
  { cle: "code_postal", test: (h) => h.includes("code postal") },
  { cle: "ville", test: (h) => h === "ville" },
  { cle: "secu", test: (h) => h.includes("numero de securite sociale") },
  { cle: "telephone", test: (h) => h.includes("numero de telephone") },
  { cle: "email", test: (h) => h === "adresse mail" },
  { cle: "mutuelle", test: (h) => h.includes("je veux la mutuelle") },
  { cle: "affiliation_mutuelle", test: (h) => h.includes("affiliation mutuelle") },
  { cle: "iban", test: (h) => h.includes("iban") },
  { cle: "bic", test: (h) => h.includes("bic") },
  { cle: "salaire_net", test: (h) => h === "salaire net" },
  { cle: "salaire_brut", test: (h) => h.includes("salaire brut") },
  { cle: "loge", test: (h) => h === "logement" },
  { cle: "vehicule", test: (h) => h === "vehicule" },
  { cle: "promesse_embauche", test: (h) => h.includes("promesse") },
  { cle: "date_debut", test: (h) => h === "date de debut de contrat" },
  { cle: "date_fin", test: (h) => h === "date de fin de contrat" },
  { cle: "periode_essai_jours", test: (h) => h.includes("periode essai") && !h.includes("fin") && !h.includes("date") },
  { cle: "date_fin_periode_essai", test: (h) => h.includes("periode essai") && (h.includes("fin") || h.includes("date")) },
  { cle: "type_contrat", test: (h) => h.includes("type de contrat") },
  { cle: "niveau", test: (h) => h === "niveau" },
  { cle: "echelon", test: (h) => h === "echelon" },
  { cle: "code_pcs", test: (h) => h.includes("code pcs") },
  { cle: "due", test: (h) => h === "due" },
  { cle: "date_prolongation_fin", test: (h) => h.includes("prolongation") },
  { cle: "statut_payfit", test: (h) => h.includes("statut payfit") },
  { cle: "contact_urgence", test: (h) => h.includes("contacter") && h.includes("urgence") },
];

function indexVersLettre(i: number): string {
  let s = "";
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// Google Forms renvoie les dates au format français JJ/MM/AAAA dans namedValues ;
// Postgres attend AAAA-MM-JJ pour une colonne "date". Sans conversion, un jour > 12
// (ex: 16/08/1995) est rejeté par Postgres qui l'interprète comme un mois invalide.
function versDateISO(valeur: string): string {
  const m = valeur.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return valeur;
}

function versDateSheet(cle: string, valeur: unknown): string {
  const dateCles = ["date_naissance", "date_debut", "date_fin", "date_fin_periode_essai", "date_prolongation_fin"];
  if (dateCles.includes(cle) && typeof valeur === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
    const [a, m, j] = valeur.split("-");
    return `${j}/${m}/${a}`;
  }
  if (cle === "mutuelle") return valeur ? "Oui" : "Non (j'ai ma propre mutuelle)";
  if (valeur === null || valeur === undefined) return "";
  return String(valeur);
}

// ---------- Auth Google (compte de service → jeton d'accès Sheets) ----------
let jetonCache: { jeton: string; exp: number } | null = null;
async function jetonAcces(): Promise<string> {
  const maintenant = Math.floor(Date.now() / 1000);
  if (jetonCache && jetonCache.exp > maintenant + 60) return jetonCache.jeton;
  const enc = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const entete = enc({ alg: "RS256", typ: "JWT" });
  const revendication = enc({
    iss: GOOGLE_SA_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: maintenant,
    exp: maintenant + 3600,
  });
  const nonSigne = `${entete}.${revendication}`;
  const corpsPem = GOOGLE_SA_PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
  const octetsCle = Uint8Array.from(atob(corpsPem), (c) => c.charCodeAt(0));
  const cle = await crypto.subtle.importKey("pkcs8", octetsCle, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cle, new TextEncoder().encode(nonSigne));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${nonSigne}.${signature}` }),
  });
  const donnees = await res.json();
  if (!res.ok) throw new Error("google_auth_echec: " + JSON.stringify(donnees));
  jetonCache = { jeton: donnees.access_token, exp: maintenant + donnees.expires_in };
  return donnees.access_token;
}

async function autorise(userId: string, resto: string, unite: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces?user_id=eq.${userId}&select=resto,unite,superviseur`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return false;
  const lignes = await res.json();
  if (lignes.some((l: { superviseur: boolean }) => l.superviseur)) return true;
  return lignes.some((l: { resto: string; unite: string }) => l.resto === resto && (l.unite === unite || l.unite === "TOUS"));
}

// Lit tout le Sheet en un seul appel (en-têtes + données), jusqu'à 3000 lignes / colonne BZ.
async function lireFeuille(jeton: string): Promise<string[][]> {
  const plage = encodeURIComponent(`'${SHEET_TAB}'!A1:BZ3000`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${plage}`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!res.ok) {
    throw new Error(
      `sheet_lecture_echec (SHEET_ID="${SHEET_ID}", SHEET_TAB="${SHEET_TAB}", compte="${GOOGLE_SA_EMAIL}"): ` +
        (await res.text()),
    );
  }
  const j = await res.json();
  return j.values || [];
}

function colonneIndex(entetes: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  entetes.forEach((h, i) => {
    const hn = normaliser(h);
    for (const champ of CHAMPS_SHEET) {
      if (!(champ.cle in map) && champ.test(hn)) map[champ.cle] = i;
    }
  });
  return map;
}

async function ecrireCellules(jeton: string, data: { range: string; values: string[][] }[]) {
  if (data.length === 0) return;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
  if (!res.ok) throw new Error("sheet_ecriture_echec: " + (await res.text()));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !SHEET_ID || !SHEET_TAB) {
      return json({ error: "configuration_sheet_manquante" }, 500);
    }
    const corps = await req.json();
    const { action } = corps;

    // ---- Un vrai Google Form a été soumis (via le script Apps Script) ----
    if (action === "formSubmit") {
      if (!FORM_WEBHOOK_SECRET || corps.secret !== FORM_WEBHOOK_SECRET) return json({ error: "secret_invalide" }, 401);
      const nv: Record<string, string> = corps.namedValues || {};
      function valeurPour(cle: string): string | null {
        for (const titre in nv) {
          const champ = CHAMPS_SHEET.find((c) => c.cle === cle);
          if (champ && champ.test(normaliser(titre))) return nv[titre];
        }
        return null;
      }
      const resto = valeurPour("resto");
      const unite = valeurPour("unite");
      const nom = valeurPour("nom");
      const prenom = valeurPour("prenom");
      if (!resto || !unite || !nom || !prenom) return json({ error: "champs_manquants" }, 400);

      const ligne: Record<string, unknown> = { resto, unite: unite.trim().toUpperCase(), salarie_id: `${nom}_${prenom}`.replace(/\s+/g, "_"), nom, prenom };
      ["civilite", "date_naissance", "lieu_naissance", "nationalite", "adresse", "code_postal", "ville", "secu", "telephone", "email", "poste", "iban", "bic", "contact_urgence"].forEach((cle) => {
        const v = valeurPour(cle);
        if (v !== null) ligne[cle] = cle === "date_naissance" ? versDateISO(v) : v;
      });
      const mutuelleVal = valeurPour("mutuelle");
      if (mutuelleVal !== null) ligne.mutuelle = normaliser(mutuelleVal).startsWith("oui");

      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?on_conflict=resto,salarie_id`, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(ligne),
      });
      if (!insRes.ok) {
        const detail = await insRes.text();
        console.error("formSubmit insertion_echouee:", insRes.status, detail, JSON.stringify(ligne));
        return json({ error: "insertion_echouee", detail }, 500);
      }

      // Le dossier Drive du salarié est déjà créé par le système Apps Script existant
      // d'Océane (déclenché sur le même envoi de formulaire) : on ne le recrée pas ici,
      // pour ne jamais produire un dossier en double avec un nom légèrement différent.

      return json({ ok: true });
    }

    // ---- L'appli crée ou modifie une fiche : répercuter dans le Sheet ----
    if (action === "upsertRow") {
      const { resto, nom, prenom, unite, champs } = corps;
      if (!resto || !nom || !prenom || !champs) return json({ error: "champs_manquants" }, 400);

      const enTete = req.headers.get("Authorization") || "";
      const charge = decodeJwt(enTete.replace(/^Bearer\s+/i, ""));
      if (charge?.sub) {
        // Appel authentifié (directeur/superviseur) : vérifie son droit sur cet établissement,
        // avec la même règle que les policies RLS de rh_salaries. "unite" vient toujours de la
        // ligne réelle en base (pas de "champs", qui peut ne contenir qu'un seul champ modifié) :
        // sinon un simple changement de date passerait sans aucune vérification de droit.
        if (!unite || !(await autorise(charge.sub, resto, unite))) return json({ error: "acces_refuse" }, 403);
      }
      // Sans jeton "sub" (clé anonyme) : soumission publique d'onboarding, déjà acceptée
      // au même titre que l'insertion en base (policy anon_onboarding_insert).

      const jeton = await jetonAcces();
      const grille = await lireFeuille(jeton);
      if (grille.length === 0) return json({ error: "sheet_vide" }, 500);
      const entetes = grille[0];
      const colIndex = colonneIndex(entetes);
      if (!("nom" in colIndex) || !("prenom" in colIndex)) return json({ error: "colonnes_nom_prenom_introuvables" }, 500);

      const restoCol = colIndex["resto"];
      let ligneCible = -1;
      for (let i = 1; i < grille.length; i++) {
        const r = grille[i];
        const memeNom = normaliser(r[colIndex["nom"]]) === normaliser(nom);
        const memePrenom = normaliser(r[colIndex["prenom"]]) === normaliser(prenom);
        const memeResto = restoCol === undefined || normaliser(r[restoCol] || "") === normaliser(resto);
        if (memeNom && memePrenom && memeResto) { ligneCible = i + 1; break; } // +1 : la grille est 0-indexée, les lignes Sheet démarrent à 1
      }
      if (ligneCible === -1) ligneCible = grille.length + 1; // nouvelle ligne, juste après la dernière

      const data: { range: string; values: string[][] }[] = [];
      Object.keys(champs).forEach((cle) => {
        if (!(cle in colIndex)) return; // pas de colonne connue pour ce champ : on n'écrit rien
        const lettre = indexVersLettre(colIndex[cle]);
        data.push({ range: `'${SHEET_TAB}'!${lettre}${ligneCible}`, values: [[versDateSheet(cle, champs[cle])]] });
      });
      // Toujours renseigner nom/prénom/établissement sur une ligne nouvellement créée.
      if (grille.length + 1 === ligneCible) {
        [["nom", nom], ["prenom", prenom], ["resto", resto]].forEach(([cle, val]) => {
          if (cle in colIndex && !(cle in champs)) {
            data.push({ range: `'${SHEET_TAB}'!${indexVersLettre(colIndex[cle as string])}${ligneCible}`, values: [[String(val)]] });
          }
        });
      }
      await ecrireCellules(jeton, data);
      return json({ ok: true, ligne: ligneCible });
    }

    return json({ error: "action_inconnue" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "erreur_serveur", detail: String((e as Error)?.message || e) }, 500);
  }
});
