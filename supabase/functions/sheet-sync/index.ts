// VERSION 4 (diagnostic étendu) — pour vérifier après collage que c'est bien CE code-ci
// qui est actif : cherche "VERSION 4" avec Ctrl+F, il doit apparaître ici.
//
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
// Gère aussi (mêmes principes) deux autres Google Sheet d'Océane, complètement séparés de
// celui de l'onboarding : "Extra" (action "upsertExtra") et "Prime" (action "upsertPrime",
// module réservé au superviseur) — le compte de service doit être partagé en édition sur
// LES TROIS Sheets.
//
// Variables d'environnement à définir (Supabase → Edge Functions → sheet-sync → Secrets) :
//   GOOGLE_SA_EMAIL         l'adresse du compte de service Google (créé dans Google Cloud)
//   GOOGLE_SA_PRIVATE_KEY   sa clé privée
//   SHEET_ID                l'identifiant du Google Sheet "onboarding" (dans son URL, après /d/)
//   SHEET_TAB                le nom exact de l'onglet (ex: "Form_Responses1")
//   SHEET_ID_EXTRA           l'identifiant du Google Sheet "Extra"
//   SHEET_TAB_EXTRA          le nom exact de son onglet (défaut : "Réponses au formulaire 1")
//   SHEET_ID_PRIME           l'identifiant du Google Sheet "Prime"
//   SHEET_TAB_PRIME          le nom exact de son onglet (défaut : "Feuille 1")
//   FORM_WEBHOOK_SECRET     un mot de passe inventé par vous, collé aussi dans le script Apps Script
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

// .trim() partout : un espace ou un retour à la ligne collé par erreur dans un secret
// (très facile en copiant-collant depuis un fichier .json ou une barre d'adresse) rend
// l'identifiant invalide sans qu'aucun message d'erreur ne le dise clairement.
const GOOGLE_SA_EMAIL = (Deno.env.get("GOOGLE_SA_EMAIL") ?? "").trim();
const GOOGLE_SA_PRIVATE_KEY = (Deno.env.get("GOOGLE_SA_PRIVATE_KEY") ?? "").trim().replace(/\\n/g, "\n");
const SHEET_ID = (Deno.env.get("SHEET_ID") ?? "").trim();
const SHEET_TAB = (Deno.env.get("SHEET_TAB") ?? "").trim();
// Google Sheet "Extra" d'Océane (complètement différent de celui de l'onboarding ci-dessus) :
// reçoit aujourd'hui les extras via un Google Form ("Réponses au formulaire 1"). Le repos
// hebdo non pris y est ajouté avec la même nomenclature qu'elle utilise déjà à la main
// (voir action "exporterReposHebdo" plus bas). Le compte de service (GOOGLE_SA_EMAIL) doit
// être partagé en édition sur CE Sheet-là aussi, en plus de celui de l'onboarding.
const SHEET_ID_EXTRA = (Deno.env.get("SHEET_ID_EXTRA") ?? "").trim();
const SHEET_TAB_EXTRA = (Deno.env.get("SHEET_TAB_EXTRA") ?? "Réponses au formulaire 1").trim();
// Google Sheet "Prime" d'Océane (encore différent des deux ci-dessus) : remplace le fichier
// Excel qu'elle tenait à la main pour noter les primes/régularisations avant chaque paie.
// Le compte de service doit être partagé en édition sur ce Sheet-là aussi.
const SHEET_ID_PRIME = (Deno.env.get("SHEET_ID_PRIME") ?? "").trim();
const SHEET_TAB_PRIME = (Deno.env.get("SHEET_TAB_PRIME") ?? "Feuille 1").trim();
// Google Sheet "Notes de frais" d'Océane (encore différent des trois ci-dessus) : reçoit les
// réponses du Form de notes de frais du staff. Le compte de service doit être partagé en
// édition sur ce Sheet-là aussi.
const SHEET_ID_NOTES_FRAIS = (Deno.env.get("SHEET_ID_NOTES_FRAIS") ?? "").trim();
const SHEET_TAB_NOTES_FRAIS = (Deno.env.get("SHEET_TAB_NOTES_FRAIS") ?? "Form_Responses1").trim();
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

function decodeJwt(token: string): { sub?: string; email?: string } | null {
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

// Distance de Levenshtein (tolérance aux fautes de frappe) : sert à reconnaître, à
// l'onboarding réel, une fiche "provisoire" déjà remplie par le directeur malgré une
// petite faute de frappe sur le nom/prénom.
function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
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
  // "debut"/"fin" + "contrat" (pas juste l'intitulé exact) : tolère les variantes
  // d'intitulé de colonne ("Date Debut de Contrat", "Date de Début de Contrat"...).
  { cle: "date_debut", test: (h) => h.includes("debut") && h.includes("contrat") },
  { cle: "date_fin", test: (h) => h.includes("fin") && h.includes("contrat") && !h.includes("essai") && !h.includes("prolongation") },
  { cle: "periode_essai_jours", test: (h) => h.includes("periode essai") && !h.includes("fin") && !h.includes("date") },
  { cle: "date_fin_periode_essai", test: (h) => h.includes("periode essai") && (h.includes("fin") || h.includes("date")) },
  { cle: "type_contrat", test: (h) => h.includes("type de contrat") },
  { cle: "heures_contrat", test: (h) => h.includes("heure") && h.includes("contrat") },
  { cle: "heures_sup", test: (h) => h.includes("heure") && h.includes("sup") },
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
  // Tolère les espaces parasites autour des "/" (fréquents en saisie manuelle dans le
  // Sheet, ex: "02/01/ 1987") : sans ce trim, la date passe telle quelle à Postgres qui
  // la rejette avec "invalid input syntax for type date".
  const m = valeur.trim().match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return valeur;
}

// Pour l'import en masse ("importerTout") : une date illisible ou composite (ex: "26/03/2026
// ET 26/05/2026", saisie manuelle libre dans le Sheet) est ignorée (null) plutôt que de faire
// échouer tout le lot inséré en une seule requête groupée.
function versDateISOouNull(valeur: string | null): string | null {
  if (!valeur) return null;
  const iso = versDateISO(valeur);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

// Idem pour un champ numérique (ex: "39H", "42 heures") : garde uniquement les chiffres,
// ignore (null) si rien d'exploitable n'en ressort plutôt que de planter l'insertion.
function versNombreOuNull(valeur: string | null): number | null {
  if (!valeur) return null;
  const nettoye = valeur.replace(/[^0-9.,]/g, "").replace(",", ".");
  const n = parseFloat(nettoye);
  return Number.isFinite(n) ? n : null;
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

// Constantes reprises telles quelles du fichier Excel historique d'Océane (taux net ->
// brut, puis brut -> coût total employeur pour une prime exceptionnelle / un extra) —
// mêmes valeurs que côté appli (calculExtra dans App.jsx). Ne pas modifier sans revalider
// avec la compta / PayFit.
const EXTRA_NET_VERS_BRUT = 1.2667;
const EXTRA_BRUT_VERS_COUT_TOTAL = 1.4444;

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

// Pour "importerTout" (opération globale, à réserver au superviseur) : le jeton est
// vérifié auprès de Supabase Auth lui-même (signature + expiration contrôlées côté
// serveur), pas juste décodé localement comme pour les autres actions ci-dessus.
async function utilisateurAuthentifie(authHeader: string): Promise<{ id: string } | null> {
  if (!authHeader) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey: SERVICE_ROLE_KEY },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.id ? { id: data.id } : null;
}
async function verifierSuperviseur(userId: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rh_acces?user_id=eq.${userId}&superviseur=is.true&select=id&limit=1`, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
  });
  if (!res.ok) return false;
  const lignes = await res.json();
  return Array.isArray(lignes) && lignes.length > 0;
}

// Lit tout le Sheet en un seul appel (en-têtes + données), sans limite de lignes (colonnes
// A à BZ) : un plafond fixe (l'ancienne version limitait à 3000 lignes) est dangereux dès que
// le Sheet dépasse cette taille, car "nombre de lignes lues + 1" est ensuite utilisé comme
// prochaine ligne libre — s'il manque des lignes à la lecture, une nouvelle écriture peut
// tomber PAR-DESSUS une ligne existante non lue et la corrompre partiellement (colonnes non
// écrasées mélangées à des données neuves). "sheetId"/"tab" paramétrables (défaut : le Sheet
// onboarding) pour pouvoir lire le Sheet "Extra" (SHEET_ID_EXTRA) avec la même fonction.
async function lireFeuille(jeton: string, sheetId: string = SHEET_ID, tab: string = SHEET_TAB): Promise<string[][]> {
  const plage = encodeURIComponent(`'${tab}'!A:BZ`);
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${plage}`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!res.ok) {
    const detailValues = await res.text();
    // Diagnostic supplémentaire : le compte voit-il le fichier du tout (même sans
    // préciser d'onglet) ? Si oui, la liste des vrais noms d'onglets apparaît ci-dessous,
    // ce qui permet de voir tout de suite si SHEET_TAB ne correspond à aucun d'eux.
    let diagMeta = "";
    try {
      const metaRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties.title,sheets.properties.title`,
        { headers: { Authorization: `Bearer ${jeton}` } },
      );
      diagMeta = metaRes.ok
        ? `metadata OK: ${await metaRes.text()}`
        : `metadata ECHEC (${metaRes.status}): ${await metaRes.text()}`;
    } catch (e) {
      diagMeta = "metadata ECHEC (exception): " + String(e);
    }
    throw new Error(
      `sheet_lecture_echec (SHEET_ID="${sheetId}", SHEET_TAB="${tab}", compte="${GOOGLE_SA_EMAIL}"): ` +
        detailValues + " || " + diagMeta,
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

async function ecrireCellules(jeton: string, data: { range: string; values: string[][] }[], sheetId: string = SHEET_ID) {
  if (data.length === 0) return;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
  if (!res.ok) throw new Error("sheet_ecriture_echec: " + (await res.text()));
}

// ---------- Helpers pour "archiverSaison" : écrit dans un ONGLET dédié (pas SHEET_TAB) ----------
async function listerOnglets(jeton: string): Promise<string[]> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}?fields=sheets.properties.title`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!res.ok) throw new Error("sheet_metadata_echec: " + (await res.text()));
  const j = await res.json();
  return (j.sheets || []).map((s: { properties: { title: string } }) => s.properties.title);
}

async function assurerOnglet(jeton: string, titre: string) {
  const onglets = await listerOnglets(jeton);
  if (onglets.includes(titre)) return;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: titre } } }] }),
  });
  if (!res.ok) throw new Error("sheet_creation_onglet_echec: " + (await res.text()));
}

// Écrase entièrement le contenu d'un onglet avec une nouvelle grille : à chaque archivage
// de la même saison, l'onglet repart d'une grille propre (pas d'accumulation de doublons).
async function ecrireGrilleComplete(jeton: string, titre: string, grille: string[][]) {
  const clearRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(`'${titre}'`)}:clear`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!clearRes.ok) throw new Error("sheet_nettoyage_onglet_echec: " + (await clearRes.text()));
  if (grille.length === 0) return;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(`'${titre}'!A1`)}?valueInputOption=USER_ENTERED`,
    { method: "PUT", headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify({ values: grille }) },
  );
  if (!res.ok) throw new Error("sheet_ecriture_onglet_echec: " + (await res.text()));
}

// Ajoute des lignes à la SUITE d'un onglet existant, sans jamais toucher aux lignes déjà
// là (contrairement à "ecrireGrilleComplete" qui écrase tout) : exactement le comportement
// d'une nouvelle réponse de Google Form. "sheetId"/"tab" sont paramétrables pour pouvoir
// écrire dans un Google Sheet complètement différent de celui de l'onboarding (SHEET_ID).
async function ajouterLignesFormulaire(jeton: string, sheetId: string, tab: string, lignes: (string | number)[][]) {
  if (lignes.length === 0) return;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`'${tab}'!A1`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    { method: "POST", headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" }, body: JSON.stringify({ values: lignes }) },
  );
  if (!res.ok) throw new Error("sheet_ajout_lignes_echec: " + (await res.text()));
}

// Identifiant interne (gid, un nombre) d'un onglet, requis par les requêtes de MISE EN FORME
// (repeatCell) — différent de son nom. Une ligne appelée par l'appli via l'API n'hérite
// JAMAIS automatiquement du format des colonnes (contrairement à une vraie réponse de Google
// Form, que Google Sheets met en forme tout seul) : il faut donc le faire explicitement.
async function idOnglet(jeton: string, sheetId: string, tab: string): Promise<number> {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`, {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  if (!res.ok) throw new Error("sheet_metadata_echec: " + (await res.text()));
  const j = await res.json();
  const onglet = (j.sheets || []).find((s: { properties: { title: string; sheetId: number } }) => s.properties.title === tab);
  if (!onglet) throw new Error(`onglet_introuvable: "${tab}"`);
  return onglet.properties.sheetId;
}

// Met en forme une ligne nouvellement créée par l'appli dans le Sheet "onboarding" : toutes
// ses colonnes centrées horizontalement, et sa colonne NOM en police 14 (demande d'Océane,
// pour que les fiches créées par l'appli aient exactement le même rendu que celles arrivées
// par une vraie réponse au Form).
async function formaterLigneOnboarding(jeton: string, ligne: number, colNom: number | undefined, nbColonnes: number) {
  const gid = await idOnglet(jeton, SHEET_ID, SHEET_TAB);
  const requetes: unknown[] = [
    {
      repeatCell: {
        range: { sheetId: gid, startRowIndex: ligne - 1, endRowIndex: ligne, startColumnIndex: 0, endColumnIndex: Math.max(nbColonnes, 1) },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
        fields: "userEnteredFormat.horizontalAlignment",
      },
    },
  ];
  if (colNom !== undefined) {
    requetes.push({
      repeatCell: {
        range: { sheetId: gid, startRowIndex: ligne - 1, endRowIndex: ligne, startColumnIndex: colNom, endColumnIndex: colNom + 1 },
        cell: { userEnteredFormat: { horizontalAlignment: "CENTER", textFormat: { fontSize: 14 } } },
        fields: "userEnteredFormat.horizontalAlignment,userEnteredFormat.textFormat.fontSize",
      },
    });
  }
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: requetes }),
  });
  if (!res.ok) throw new Error("sheet_formatage_echec: " + (await res.text()));
}

// Force le texte de la cellule NOM en MAJUSCULE (demande d'Océane : "le nom de famille en
// majuscule", distinct de la mise en forme visuelle ci-dessus qui ne touche jamais au texte).
// Une fiche créée par l'appli est déjà en majuscule en amont (nom.toUpperCase() avant
// l'écriture) ; une vraie réponse au Form, elle, garde EXACTEMENT ce que la personne a tapé
// (souvent pas en majuscule), d'où ce forçage explicite.
async function forcerNomMajuscule(jeton: string, sheetId: string, tab: string, ligne: number, colNom: number, valeurActuelle: string) {
  const maj = (valeurActuelle || "").toUpperCase();
  if (!valeurActuelle || valeurActuelle === maj) return;
  await ecrireCellules(jeton, [{ range: `'${tab}'!${indexVersLettre(colNom)}${ligne}`, values: [[maj]] }], sheetId);
}

// Met en forme la DERNIÈRE ligne du Sheet "onboarding" — appelée juste après qu'une vraie
// réponse au Form vient d'y être ajoutée. Une réponse de Google Form s'ajoute TOUJOURS tout en
// bas du Sheet, jamais ailleurs : pas besoin de la retrouver par nom/prénom. L'ancienne version
// cherchait la ligne par texte (nom+prénom+établissement), ce qui pouvait échouer silencieusement
// (accent, espace, casse différente de ce que la personne a tapé) et laissait alors la ligne sans
// AUCUNE mise en forme, comme observé sur deux onboardings récents (Calais, Vincent) : ni centrage,
// ni police 14, ni majuscule. Appelée en l'attendant (pas en arrière-plan) : ces 2 petits appels à
// l'API Sheets sont rapides, et il vaut mieux garantir que la mise en forme s'applique vraiment
// plutôt que de la laisser filer sans confirmation. Best-effort : un échec (droits insuffisants...)
// reste silencieux et ne bloque jamais l'onboarding.
async function formaterDerniereLigne() {
  try {
    const jeton = await jetonAcces();
    const grille = await lireFeuille(jeton);
    if (grille.length < 2) return;
    const colIndex = colonneIndex(grille[0]);
    const ligne = grille.length;
    if (colIndex["nom"] !== undefined) {
      await forcerNomMajuscule(jeton, SHEET_ID, SHEET_TAB, ligne, colIndex["nom"], grille[ligne - 1][colIndex["nom"]]);
    }
    await formaterLigneOnboarding(jeton, ligne, colIndex["nom"], grille[0].length);
  } catch (e) {
    console.error("formaterDerniereLigne echouee:", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  try {
    if (!GOOGLE_SA_EMAIL || !GOOGLE_SA_PRIVATE_KEY || !SHEET_ID || !SHEET_TAB) {
      return json({ error: "configuration_sheet_manquante" }, 500);
    }
    const corps = await req.json();
    const { action } = corps;

    // ---- Archive de fin de saison : copie TOUTES les fiches salariés d'une saison donnée
    // dans un onglet dédié du Sheet ("Archive <saison>"), tous établissements confondus.
    // N'efface RIEN en base : les fiches restent consultables dans l'appli via l'onglet de
    // saison correspondant. Réservé au superviseur. ----
    if (action === "archiverSaison") {
      const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
      if (!appelant) return json({ error: "non_authentifie" }, 401);
      if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);

      const { saison } = corps;
      if (!saison) return json({ error: "champs_manquants" }, 400);

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rh_salaries?saison=eq.${encodeURIComponent(saison)}&order=resto.asc,nom.asc`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
      );
      if (!res.ok) return json({ error: "lecture_echouee", detail: await res.text() }, 500);
      const salaries = await res.json();
      if (salaries.length === 0) return json({ ok: true, archives: 0 });

      const colonnes = [
        "resto", "unite", "saison", "nom", "prenom", "poste", "telephone", "email",
        "date_debut", "date_fin", "salaire_net", "heures_contrat", "loge", "staff_party",
        "civilite", "date_naissance", "lieu_naissance", "nationalite", "adresse", "code_postal", "ville",
        "secu", "mutuelle", "affiliation_mutuelle", "iban", "bic", "salaire_brut", "vehicule",
        "promesse_embauche", "periode_essai_jours", "date_fin_periode_essai", "type_contrat",
        "heures_semaine", "heures_sup", "niveau", "echelon", "code_pcs", "due", "statut_payfit",
        "contact_urgence",
      ];
      const grille: string[][] = [colonnes];
      for (const s of salaries) {
        grille.push(colonnes.map((c) => {
          const v = (s as Record<string, unknown>)[c];
          if (v === null || v === undefined) return "";
          if (c === "mutuelle" || c === "staff_party") return v ? "Oui" : "Non";
          return String(v);
        }));
      }

      const titreOnglet = `Archive ${saison}`.slice(0, 100);
      const jeton = await jetonAcces();
      await assurerOnglet(jeton, titreOnglet);
      await ecrireGrilleComplete(jeton, titreOnglet, grille);

      return json({ ok: true, archives: salaries.length, onglet: titreOnglet });
    }

    // ---- Export du suivi "Repos hebdo non pris" d'un établissement/unité/mois vers le
    // Google Sheet "Extra" d'Océane (SHEET_ID_EXTRA), en AJOUTANT une ligne par salarié
    // dans l'onglet "Réponses au formulaire 1" — avec exactement la même nomenclature
    // qu'elle utilise déjà à la main pour ce cas-là (colonne "Adresse e-mail" détournée en
    // "RH NON PRIS <MOIS>", établissement d'origine = établissement d'exécution puisque ce
    // n'est pas un vrai prêt de personnel, date = dernier jour du mois). "Nombre d'heures"
    // et "Taux horaire net" portent ici le nombre de repos non pris et le taux journalier
    // (mêmes formules net->brut->coût total que pour un extra classique). Réservé au
    // superviseur ; n'écrit qu'une ligne par salarié ayant au moins 1 repos non pris.
    if (action === "exporterReposHebdo") {
      const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
      if (!appelant) return json({ error: "non_authentifie" }, 401);
      if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);
      if (!SHEET_ID_EXTRA) return json({ error: "sheet_extra_non_configure" }, 500);

      const { resto, unite, mois } = corps; // mois = 'AAAA-MM'
      if (!resto || !unite || !mois) return json({ error: "champs_manquants" }, 400);

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/rh_repos_hebdo?resto=eq.${encodeURIComponent(resto)}&unite=eq.${encodeURIComponent(unite)}&mois=eq.${encodeURIComponent(mois)}&order=nom.asc`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
      );
      if (!res.ok) return json({ error: "lecture_echouee", detail: await res.text() }, 500);
      const lignes: Record<string, unknown>[] = await res.json();

      const [anneeStr, moisStr] = mois.split("-");
      const moisIdx = Number(moisStr); // 1..12
      const MOIS_NOMS_MAJ = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
      const nomMois = MOIS_NOMS_MAJ[moisIdx - 1] || moisStr;
      // Dernier jour du mois (astuce : le "jour 0" du mois suivant = dernier jour de celui-ci).
      const dernierJour = new Date(Number(anneeStr), moisIdx, 0);
      const dateStr = `${String(dernierJour.getDate()).padStart(2, "0")}/${String(moisIdx).padStart(2, "0")}/${anneeStr}`;

      const aEnvoyer = (lignes as { nom: string; prenom: string | null; salaire_net: number | null; repos_non_pris: number }[])
        .filter((l) => Number(l.repos_non_pris) > 0);

      // Valeurs numériques envoyées comme de vrais nombres JSON (pas des chaînes) : Google
      // Sheets les aligne alors à droite comme les autres montants de la colonne, au lieu
      // de les traiter comme du texte aligné à gauche.
      const arrondi = (n: number) => Math.round(n);
      const grille: (string | number)[][] = aEnvoyer.map((l) => {
        const prenomMaj = (l.prenom || "").toUpperCase();
        const netJour = typeof l.salaire_net === "number" ? l.salaire_net / 30 : 0;
        const jours = Number(l.repos_non_pris) || 0;
        const tauxBrut = netJour * EXTRA_NET_VERS_BRUT;
        const primeNet = jours * netJour;
        const primeBrute = jours * tauxBrut;
        const primeCoutTotal = tauxBrut * EXTRA_BRUT_VERS_COUT_TOTAL * jours;
        const cle = `${l.nom}|${prenomMaj}`;
        return [
          new Date().toISOString(), `RH NON PRIS ${nomMois}`, resto, dateStr,
          l.nom, prenomMaj, resto,
          jours, arrondi(netJour), "NON",
          arrondi(tauxBrut), arrondi(primeNet), arrondi(primeBrute), arrondi(primeCoutTotal),
          "", nomMois, anneeStr, "", cle, resto,
        ];
      });

      const jeton = await jetonAcces();
      await ajouterLignesFormulaire(jeton, SHEET_ID_EXTRA, SHEET_TAB_EXTRA, grille);

      return json({ ok: true, exportes: grille.length });
    }

    // ---- Synchro automatique d'un extra vers le Sheet "Extra" (SHEET_ID_EXTRA), onglet
    // "Réponses au formulaire 1" — appelée par l'appli à chaque étape de la vie d'un extra
    // (création, saisie des heures/taux, validation) pour que la ligne correspondante s'y
    // mette à jour toute seule, sans jamais reposer sur l'orthographe tapée à la main par un
    // directeur (nom/prénom viennent de la fiche RH choisie dans l'appli).
    //
    // La ligne cible n'est PLUS retrouvée par recherche (nom+prénom+date+établissement) :
    // deux extras différents pour la même personne à la même date se ressemblaient trop et
    // finissaient fusionnés sur une seule ligne, ce qu'Océane ne veut surtout pas (un extra
    // = une ligne, toujours, même si c'est deux fois la même personne). L'appli fournit donc
    // "ligneCible" : absent -> nouvelle ligne ajoutée à la fin (appel de création, une seule
    // fois par extra) ; fourni -> on écrit directement dessus, sans recherche (tous les
    // appels suivants pour ce même extra : heures/taux, validation), la ligne ayant été
    // mémorisée par l'appli (rh_extras.sheet_ligne) dès la création.
    //
    // La colonne "Payfit" n'est JAMAIS touchée ici : c'est Océane qui la coche à la main une
    // fois traité. Colonnes fixes (ordre connu de ce Sheet, comme pour "exporterReposHebdo") :
    // 0 Horodateur, 1 Email, 2 Étab. destination, 3 DATE, 4 NOM, 5 PRENOM, 6 Étab. origine,
    // 7 Heures, 8 Taux net, 9 sur heures origine, 10 Taux brut, 11 Prime net, 12 Prime brute,
    // 13 Prime coût total, 14 Payfit, 15 MOIS, 16 Année, 17 OK ONBOARDING, 18 CLE_NOM, 19 CLE_ETAB.
    if (action === "upsertExtra") {
      const { resto, unite, restoOrigine, date, champs, ligneCible: ligneFournie } = corps;
      const salarieNom = String(corps.salarieNom || "").toUpperCase();
      const salariePrenom = String(corps.salariePrenom || "").toUpperCase();
      if (!resto || !restoOrigine || !salarieNom || !salariePrenom || !date) return json({ error: "champs_manquants" }, 400);

      const enTete = req.headers.get("Authorization") || "";
      const charge = decodeJwt(enTete.replace(/^Bearer\s+/i, ""));
      if (!charge?.sub || !unite || !(await autorise(charge.sub, resto, unite))) return json({ error: "acces_refuse" }, 403);
      if (!SHEET_ID_EXTRA) return json({ error: "sheet_extra_non_configure" }, 500);

      const [a, m, j] = date.split("-");
      const dateStr = `${j}/${m}/${a}`;
      const MOIS_NOMS_MAJ = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
      const nomMois = MOIS_NOMS_MAJ[Number(m) - 1] || m;

      const jeton = await jetonAcces();

      let ligneCible: number;
      const nouvelleLigne = !ligneFournie;
      if (nouvelleLigne) {
        const grille = await lireFeuille(jeton, SHEET_ID_EXTRA, SHEET_TAB_EXTRA);
        ligneCible = grille.length + 1;
      } else {
        ligneCible = Number(ligneFournie);
      }

      const c = champs || {};
      // Valeurs monétaires envoyées sans décimale (convention d'Océane, comme pour
      // "exporterReposHebdo") ; le nombre d'heures, lui, garde ses éventuelles décimales
      // (7,5h par exemple est une vraie valeur, pas un arrondi à corriger).
      const arrondi = (n: number) => Math.round(n || 0);
      const cellules: { colonne: number; valeur: string }[] = [];
      if (nouvelleLigne) {
        cellules.push(
          { colonne: 0, valeur: new Date().toISOString() },
          { colonne: 1, valeur: charge.email || "" },
          { colonne: 2, valeur: resto },
          { colonne: 3, valeur: dateStr },
          { colonne: 4, valeur: salarieNom },
          { colonne: 5, valeur: salariePrenom },
          { colonne: 6, valeur: restoOrigine },
          { colonne: 15, valeur: nomMois },
          { colonne: 16, valeur: a },
          { colonne: 18, valeur: `${salarieNom}|${salariePrenom}` },
          { colonne: 19, valeur: resto },
        );
      }
      if (c.heuresEstimees !== undefined) cellules.push({ colonne: 7, valeur: String(c.heuresEstimees ?? "") });
      if (c.tauxHoraireNet !== undefined) cellules.push({ colonne: 8, valeur: String(arrondi(c.tauxHoraireNet)) });
      if (c.surHeuresOrigine !== undefined) cellules.push({ colonne: 9, valeur: c.surHeuresOrigine ? "OUI" : "NON" });
      if (c.tauxBrut !== undefined) cellules.push({ colonne: 10, valeur: String(arrondi(c.tauxBrut)) });
      if (c.primeNet !== undefined) cellules.push({ colonne: 11, valeur: String(arrondi(c.primeNet)) });
      if (c.primeBrute !== undefined) cellules.push({ colonne: 12, valeur: String(arrondi(c.primeBrute)) });
      if (c.primeCoutTotal !== undefined) cellules.push({ colonne: 13, valeur: String(arrondi(c.primeCoutTotal)) });

      const data = cellules.map(({ colonne, valeur }) => ({
        range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(colonne)}${ligneCible}`, values: [[valeur]],
      }));
      await ecrireCellules(jeton, data, SHEET_ID_EXTRA);

      return json({ ok: true, ligne: ligneCible, creee: nouvelleLigne });
    }

    // ---- Une vraie réponse vient d'être soumise au Google Form "Extra" (via un script Apps
    // Script à poser sur CE Sheet, symétrique à "formSubmit" pour l'onboarding) : contrairement
    // à une création via l'appli (upsertExtra, ci-dessus), une réponse brute au Form n'est ni en
    // majuscule (NOM/PRENOM), ni calculée (Taux Brut / Prime Net / Prime Brute / Prime Coût
    // Total), ni datée en Mois/Année — rien de tout ça n'existe côté Google Forms, l'appli seule
    // le calculait jusqu'ici. On relit donc la DERNIÈRE ligne du Sheet juste après son ajout
    // (une réponse au Form s'ajoute toujours tout en bas, comme pour l'onboarding) et on la
    // complète. Aucun paramètre nécessaire dans le corps de la requête à part le secret : tout
    // se relit directement depuis la ligne elle-même. Best-effort, comme "formaterDerniereLigne" :
    // un échec reste silencieux plutôt que de faire échouer le webhook Apps Script.
    if (action === "extraFormSubmit") {
      if (!FORM_WEBHOOK_SECRET || corps.secret !== FORM_WEBHOOK_SECRET) return json({ error: "secret_invalide" }, 401);
      if (!SHEET_ID_EXTRA) return json({ error: "sheet_extra_non_configure" }, 500);
      try {
        const jeton = await jetonAcces();
        const grille = await lireFeuille(jeton, SHEET_ID_EXTRA, SHEET_TAB_EXTRA);
        if (grille.length < 2) return json({ ok: true });
        const ligne = grille.length;
        const r = grille[ligne - 1];

        // Mêmes colonnes fixes que "upsertExtra" ci-dessus : 3 DATE, 4 NOM, 5 PRENOM, 7 Heures,
        // 8 Taux net, 9 sur heures origine, 10 Taux brut, 11 Prime net, 12 Prime brute,
        // 13 Prime coût total, 15 MOIS, 16 Année.
        const nom = (r[4] || "").toUpperCase();
        const prenom = (r[5] || "").toUpperCase();
        const heures = Number(String(r[7] || "").replace(",", ".")) || 0;
        const tauxNet = Number(String(r[8] || "").replace(",", ".")) || 0;
        const surHeuresOrigine = normaliser(r[9] || "").startsWith("oui");
        const dateStr = r[3] || "";

        // Mêmes formules que calculExtra (App.jsx) / EXTRA_NET_VERS_BRUT / EXTRA_BRUT_VERS_COUT_TOTAL.
        const tauxBrut = surHeuresOrigine ? 0 : tauxNet * EXTRA_NET_VERS_BRUT;
        const primeNet = surHeuresOrigine ? 0 : heures * tauxNet;
        const primeBrute = surHeuresOrigine ? 0 : heures * tauxBrut;
        const primeCoutTotal = surHeuresOrigine ? 0 : tauxBrut * EXTRA_BRUT_VERS_COUT_TOTAL * heures;
        const arrondi = (n: number) => Math.round(n || 0);

        const MOIS_NOMS_MAJ = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
        const mDate = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const nomMois = mDate ? (MOIS_NOMS_MAJ[Number(mDate[2]) - 1] || "") : "";
        const annee = mDate ? mDate[3] : "";

        const cellules: { colonne: number; valeur: string }[] = [
          { colonne: 4, valeur: nom },
          { colonne: 5, valeur: prenom },
        ];
        if (!surHeuresOrigine) {
          cellules.push(
            { colonne: 10, valeur: String(arrondi(tauxBrut)) },
            { colonne: 11, valeur: String(arrondi(primeNet)) },
            { colonne: 12, valeur: String(arrondi(primeBrute)) },
            { colonne: 13, valeur: String(arrondi(primeCoutTotal)) },
          );
        }
        if (nomMois) cellules.push({ colonne: 15, valeur: nomMois });
        if (annee) cellules.push({ colonne: 16, valeur: annee });

        const data = cellules.map(({ colonne, valeur }) => ({
          range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(colonne)}${ligne}`, values: [[valeur]],
        }));
        await ecrireCellules(jeton, data, SHEET_ID_EXTRA);
      } catch (e) {
        console.error("extraFormSubmit echouee:", e);
      }
      return json({ ok: true });
    }

    // ---- Rattrapage pour le Sheet "Extra" : relit TOUT le Sheet et corrige toutes les
    // lignes qui en ont besoin (majuscule NOM/PRENOM, Taux Brut/Prime Net/Prime Brute/Prime
    // Coût Total, Mois/Année) — pas seulement la dernière, contrairement à "extraFormSubmit"
    // qui suppose qu'un déclencheur Apps Script a tourné à chaque réponse. Le déclencheur
    // "Lors de l'envoi du formulaire" s'est révélé peu fiable (mauvais projet, jamais
    // déclenché, autorisation manquante...) : deux façons d'appeler cette action, toutes deux
    // acceptées ici — (1) le bouton "Corriger le Sheet Extra" dans l'appli (superviseur
    // authentifié) et (2) un déclencheur Apps Script BASÉ SUR L'HEURE (toutes les X minutes,
    // avec le même secret que formSubmit/extraFormSubmit) pour une correction automatique,
    // sans dépendre de la capture fiable d'un événement précis — un déclencheur temporel est
    // nettement plus robuste qu'un déclencheur "à l'envoi du formulaire". Ne touche jamais une
    // ligne déjà correcte (comparaison avant écriture), et jamais les lignes "sur heures
    // origine" (Taux Brut etc. volontairement vides, comme upsertExtra/extraFormSubmit).
    if (action === "extraCompleterTout") {
      const viaSecret = !!FORM_WEBHOOK_SECRET && corps.secret === FORM_WEBHOOK_SECRET;
      if (!viaSecret) {
        const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
        if (!appelant) return json({ error: "non_authentifie" }, 401);
        if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);
      }
      if (!SHEET_ID_EXTRA) return json({ error: "sheet_extra_non_configure" }, 500);

      const jeton = await jetonAcces();
      const grille = await lireFeuille(jeton, SHEET_ID_EXTRA, SHEET_TAB_EXTRA);
      if (grille.length < 2) return json({ ok: true, corrigees: 0 });

      const arrondi = (n: number) => Math.round(n || 0);
      const MOIS_NOMS_MAJ = ["JANVIER","FEVRIER","MARS","AVRIL","MAI","JUIN","JUILLET","AOUT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DECEMBRE"];
      const data: { range: string; values: string[][] }[] = [];
      let corrigees = 0;

      for (let i = 1; i < grille.length; i++) {
        const r = grille[i];
        const ligneNo = i + 1;
        const nomBrut = r[4] || "";
        if (!nomBrut.trim()) continue; // ligne vide

        let touchee = false;
        const nomMaj = nomBrut.toUpperCase();
        if (nomMaj !== nomBrut) { data.push({ range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(4)}${ligneNo}`, values: [[nomMaj]] }); touchee = true; }
        const prenomBrut = r[5] || "";
        const prenomMaj = prenomBrut.toUpperCase();
        if (prenomMaj !== prenomBrut) { data.push({ range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(5)}${ligneNo}`, values: [[prenomMaj]] }); touchee = true; }

        // On recalcule TOUJOURS ces 4 colonnes (jamais de "si déjà rempli, on saute") :
        // un ancien passage bugué a pu y laisser une valeur figée/fausse, qui ne serait
        // alors plus jamais corrigée. On compare avant écriture pour ne pas re-déclencher
        // inutilement une écriture identique (touchee reste basé sur une vraie différence).
        const surHeuresOrigine = normaliser(r[9] || "").startsWith("oui");
        const colTauxBrut = 10, colPrimeNet = 11, colPrimeBrute = 12, colPrimeCoutTotal = 13;
        if (surHeuresOrigine) {
          // Extra fait sur ses propres heures d'origine : ces 4 colonnes doivent rester vides.
          for (const c of [colTauxBrut, colPrimeNet, colPrimeBrute, colPrimeCoutTotal]) {
            if ((r[c] || "").trim() !== "") {
              data.push({ range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(c)}${ligneNo}`, values: [[""]] });
              touchee = true;
            }
          }
        } else {
          const heures = Number(String(r[7] || "").replace(",", ".")) || 0;
          const tauxNet = Number(String(r[8] || "").replace(",", ".")) || 0;
          if (heures > 0 && tauxNet > 0) {
            const tauxBrut = tauxNet * EXTRA_NET_VERS_BRUT;
            const primeNet = heures * tauxNet;
            const primeBrute = heures * tauxBrut;
            const primeCoutTotal = tauxBrut * EXTRA_BRUT_VERS_COUT_TOTAL * heures;
            const valeurs: [number, number][] = [
              [colTauxBrut, arrondi(tauxBrut)],
              [colPrimeNet, arrondi(primeNet)],
              [colPrimeBrute, arrondi(primeBrute)],
              [colPrimeCoutTotal, arrondi(primeCoutTotal)],
            ];
            for (const [c, v] of valeurs) {
              if ((r[c] || "").trim() !== String(v)) {
                data.push({ range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(c)}${ligneNo}`, values: [[String(v)]] });
                touchee = true;
              }
            }
          }
        }

        const dateStr = r[3] || "";
        const mDate = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mDate) {
          const nomMois = MOIS_NOMS_MAJ[Number(mDate[2]) - 1] || "";
          const annee = mDate[3];
          if (nomMois && (r[15] || "") !== nomMois) { data.push({ range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(15)}${ligneNo}`, values: [[nomMois]] }); touchee = true; }
          if (annee && (r[16] || "") !== annee) { data.push({ range: `'${SHEET_TAB_EXTRA}'!${indexVersLettre(16)}${ligneNo}`, values: [[annee]] }); touchee = true; }
        }

        if (touchee) corrigees++;
      }

      if (data.length > 0) await ecrireCellules(jeton, data, SHEET_ID_EXTRA);
      return json({ ok: true, corrigees });
    }

    // ---- Synchro automatique d'une prime vers le Sheet "Prime" (SHEET_ID_PRIME) — appelée
    // par l'appli à chaque création/modification d'une prime, module réservé au superviseur.
    // Même principe que "upsertExtra" ci-dessus (leçon retenue de sa collision de lignes) :
    // "ligneCible" absent -> nouvelle ligne ajoutée à la fin (création) ; fourni -> écriture
    // directe dessus, sans recherche (modifications suivantes de cette même prime), la ligne
    // ayant été mémorisée par l'appli (rh_primes.sheet_ligne) dès la création.
    // Colonnes fixes (même ordre que le fichier Excel historique d'Océane, moins la colonne
    // "Étab. origine" qu'elle a supprimée de son Sheet — colonnes décalées d'un cran depuis) :
    // 0 Date, 1 Raison, 2 Étab. concerné, 3 Nom, 4 Prénom, 5 Nbr de prime,
    // 6 Prime unitaire net, 7 Prime unitaire brut, 8 Prime totale net, 9 Prime totale brute,
    // 10 Prime coût total, 11 Mois salaire, 12 Année.
    // Colonne 13 ("silae OK ?") n'est JAMAIS écrite ici, même principe que "Payfit" pour les
    // Extras : c'est Océane qui la coche à la main une fois le traitement en paie fait.
    if (action === "upsertPrime") {
      const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
      if (!appelant) return json({ error: "non_authentifie" }, 401);
      if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);
      if (!SHEET_ID_PRIME) return json({ error: "sheet_prime_non_configure" }, 500);

      const { champs, ligneCible: ligneFournie } = corps;
      const c = champs || {};
      if (!c.date_prime || !c.raison || !c.nom_salarie || !c.prenom_salarie) return json({ error: "champs_manquants" }, 400);

      const jeton = await jetonAcces();

      let ligneCible: number;
      const nouvelleLigne = !ligneFournie;
      if (nouvelleLigne) {
        const grille = await lireFeuille(jeton, SHEET_ID_PRIME, SHEET_TAB_PRIME);
        ligneCible = grille.length + 1;
      } else {
        ligneCible = Number(ligneFournie);
      }

      const [a, m, j] = String(c.date_prime).split("-");
      const dateStr = `${j}/${m}/${a}`;
      const val = (v: unknown) => (v === null || v === undefined ? "" : String(v));
      const cellules: { colonne: number; valeur: string }[] = [
        { colonne: 0, valeur: dateStr },
        { colonne: 1, valeur: val(c.raison) },
        { colonne: 2, valeur: val(c.etablissement_prime) },
        { colonne: 3, valeur: val(c.nom_salarie) },
        { colonne: 4, valeur: val(c.prenom_salarie) },
        { colonne: 5, valeur: val(c.nombre) },
        { colonne: 6, valeur: val(c.prime_unitaire_net) },
        { colonne: 7, valeur: val(c.prime_unitaire_brut) },
        { colonne: 8, valeur: val(c.prime_totale_net) },
        { colonne: 9, valeur: val(c.prime_totale_brute) },
        { colonne: 10, valeur: val(c.cout_total) },
        { colonne: 11, valeur: val(c.mois_salaire) },
        { colonne: 12, valeur: val(c.annee) },
      ];

      const data = cellules.map(({ colonne, valeur }) => ({
        range: `'${SHEET_TAB_PRIME}'!${indexVersLettre(colonne)}${ligneCible}`, values: [[valeur]],
      }));
      await ecrireCellules(jeton, data, SHEET_ID_PRIME);

      return json({ ok: true, ligne: ligneCible, creee: nouvelleLigne });
    }

    // ---- Rattrapage de mise en forme pour le Sheet "onboarding" : "formaterDerniereLigne"
    // ne met en forme QUE la ligne qui vient d'arriver (juste après une vraie réponse au
    // Form) — les lignes plus anciennes, jamais formatées à l'époque (avant que ce mécanisme
    // n'existe, ou pendant l'incident de synchro du 28/09), restent telles quelles pour
    // toujours. Cette action relit tout le Sheet, force le NOM en majuscule sur chaque ligne
    // qui en a besoin, puis applique le centrage + la police 14 (colonne NOM) à TOUTES les
    // lignes de données en une seule requête de mise en forme groupée (plus rapide qu'un
    // appel par ligne). Réservé au superviseur, déclenché à la main depuis l'appli (pas de
    // secret Apps Script ici : contrairement à "extraCompleterTout", pas besoin d'un
    // déclencheur automatique, c'est un rattrapage ponctuel sur les lignes déjà anciennes).
    if (action === "onboardingCompleterTout") {
      const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
      if (!appelant) return json({ error: "non_authentifie" }, 401);
      if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);

      const jeton = await jetonAcces();
      const grille = await lireFeuille(jeton);
      if (grille.length < 2) return json({ ok: true, corrigees: 0 });
      const colIndex = colonneIndex(grille[0]);
      const colNom = colIndex["nom"];

      const data: { range: string; values: string[][] }[] = [];
      let corrigees = 0;
      if (colNom !== undefined) {
        for (let i = 1; i < grille.length; i++) {
          const nomBrut = grille[i][colNom] || "";
          if (!nomBrut.trim()) continue;
          const nomMaj = nomBrut.toUpperCase();
          if (nomMaj !== nomBrut) {
            data.push({ range: `'${SHEET_TAB}'!${indexVersLettre(colNom)}${i + 1}`, values: [[nomMaj]] });
            corrigees++;
          }
        }
      }
      if (data.length > 0) await ecrireCellules(jeton, data);

      const gid = await idOnglet(jeton, SHEET_ID, SHEET_TAB);
      const nbColonnes = grille[0].length;
      const requetes: unknown[] = [
        {
          repeatCell: {
            range: { sheetId: gid, startRowIndex: 1, endRowIndex: grille.length, startColumnIndex: 0, endColumnIndex: Math.max(nbColonnes, 1) },
            cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
            fields: "userEnteredFormat.horizontalAlignment",
          },
        },
      ];
      if (colNom !== undefined) {
        requetes.push({
          repeatCell: {
            range: { sheetId: gid, startRowIndex: 1, endRowIndex: grille.length, startColumnIndex: colNom, endColumnIndex: colNom + 1 },
            cell: { userEnteredFormat: { horizontalAlignment: "CENTER", textFormat: { fontSize: 14 } } },
            fields: "userEnteredFormat.horizontalAlignment,userEnteredFormat.textFormat.fontSize",
          },
        });
      }
      const fmtRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests: requetes }),
      });
      if (!fmtRes.ok) return json({ error: "sheet_formatage_echec", detail: await fmtRes.text(), majuscules: corrigees }, 500);

      return json({ ok: true, corrigees });
    }

    // ---- Rattrapage de mise en forme pour le Sheet "Notes de frais" (SHEET_ID_NOTES_FRAIS) :
    // même principe qu'"onboardingCompleterTout" ci-dessus (NOM forcé en majuscule + centrage
    // de toute la ligne), mais accepte AUSSI le secret Apps Script comme "extraCompleterTout"
    // (déclencheur horaire possible) puisque ce Sheet reçoit des réponses en continu via son
    // propre Form, contrairement à l'onboarding où ce rattrapage est un geste ponctuel. Les
    // colonnes NOM/PRENOM sont retrouvées PAR LEUR TEXTE (colonneIndex), pas par position fixe.
    if (action === "notesFraisCompleterTout") {
      const viaSecret = !!FORM_WEBHOOK_SECRET && corps.secret === FORM_WEBHOOK_SECRET;
      if (!viaSecret) {
        const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
        if (!appelant) return json({ error: "non_authentifie" }, 401);
        if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);
      }
      if (!SHEET_ID_NOTES_FRAIS) return json({ error: "sheet_notes_frais_non_configure" }, 500);

      const jeton = await jetonAcces();
      const grille = await lireFeuille(jeton, SHEET_ID_NOTES_FRAIS, SHEET_TAB_NOTES_FRAIS);
      if (grille.length < 2) return json({ ok: true, corrigees: 0 });
      const colIndex = colonneIndex(grille[0]);
      const colNom = colIndex["nom"];

      const data: { range: string; values: string[][] }[] = [];
      let corrigees = 0;
      if (colNom !== undefined) {
        for (let i = 1; i < grille.length; i++) {
          const nomBrut = grille[i][colNom] || "";
          if (!nomBrut.trim()) continue;
          const nomMaj = nomBrut.toUpperCase();
          if (nomMaj !== nomBrut) {
            data.push({ range: `'${SHEET_TAB_NOTES_FRAIS}'!${indexVersLettre(colNom)}${i + 1}`, values: [[nomMaj]] });
            corrigees++;
          }
        }
      }
      if (data.length > 0) await ecrireCellules(jeton, data, SHEET_ID_NOTES_FRAIS);

      const gid = await idOnglet(jeton, SHEET_ID_NOTES_FRAIS, SHEET_TAB_NOTES_FRAIS);
      const nbColonnes = grille[0].length;
      const requetes: unknown[] = [
        {
          repeatCell: {
            range: { sheetId: gid, startRowIndex: 1, endRowIndex: grille.length, startColumnIndex: 0, endColumnIndex: Math.max(nbColonnes, 1) },
            cell: { userEnteredFormat: { horizontalAlignment: "CENTER" } },
            fields: "userEnteredFormat.horizontalAlignment",
          },
        },
      ];
      if (colNom !== undefined) {
        requetes.push({
          repeatCell: {
            range: { sheetId: gid, startRowIndex: 1, endRowIndex: grille.length, startColumnIndex: colNom, endColumnIndex: colNom + 1 },
            cell: { userEnteredFormat: { horizontalAlignment: "CENTER", textFormat: { fontSize: 14 } } },
            fields: "userEnteredFormat.horizontalAlignment,userEnteredFormat.textFormat.fontSize",
          },
        });
      }
      const fmtRes2 = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID_NOTES_FRAIS}:batchUpdate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${jeton}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests: requetes }),
      });
      if (!fmtRes2.ok) return json({ error: "sheet_formatage_echec", detail: await fmtRes2.text(), majuscules: corrigees }, 500);

      return json({ ok: true, corrigees });
    }

    // ---- Rattrapage en un clic : relit tout le Sheet et crée en base les salariés qui
    // s'y trouvent déjà mais que l'app n'a jamais reçus (onboardés avant que la synchro
    // automatique ne soit en place). Réservé au superviseur. Les fiches déjà existantes en
    // base ne sont jamais touchées (ignore-duplicates) : on ne risque donc jamais d'écraser
    // une modification faite depuis dans l'app. ----
    if (action === "importerTout") {
      const appelant = await utilisateurAuthentifie(req.headers.get("Authorization") || "");
      if (!appelant) return json({ error: "non_authentifie" }, 401);
      if (!(await verifierSuperviseur(appelant.id))) return json({ error: "acces_refuse" }, 403);

      // Facultatif : si l'appelant précise un établissement, seules ses lignes sont
      // importées (évite de mélanger l'import avec les autres établissements du Sheet).
      const { resto: restoDemande } = corps;

      const jeton = await jetonAcces();
      const grille = await lireFeuille(jeton);
      if (grille.length < 2) return json({ ok: true, importes: 0, ignores: 0 });
      const entetes = grille[0];

      function valeurPourLigne(nv: Record<string, string>, cle: string): string | null {
        for (const titre in nv) {
          const champ = CHAMPS_SHEET.find((c) => c.cle === cle);
          if (champ && champ.test(normaliser(titre))) return nv[titre] || null;
        }
        return null;
      }

      const aInserer: Record<string, unknown>[] = [];
      let ignores = 0;
      for (let i = 1; i < grille.length; i++) {
        const nv: Record<string, string> = {};
        entetes.forEach((h, j) => { nv[h] = grille[i][j] ?? ""; });

        const resto = valeurPourLigne(nv, "resto");
        const unite = valeurPourLigne(nv, "unite");
        const nom = valeurPourLigne(nv, "nom");
        const prenom = valeurPourLigne(nv, "prenom");
        if (!resto || !unite || !nom || !prenom) { ignores++; continue; }
        if (restoDemande && normaliser(resto) !== normaliser(restoDemande)) continue; // pas ignoré : hors périmètre demandé, ne compte pas
        // rh_salaries n'accepte que SALLE/CUISINE (contrainte en base) : une ligne avec une
        // autre valeur (ex: "Bureau" pour le siège) ferait échouer tout le lot groupé.
        const uniteMaj = unite.trim().toUpperCase();
        if (uniteMaj !== "SALLE" && uniteMaj !== "CUISINE") { ignores++; continue; }

        // Toutes les lignes envoyées à Postgrest en une seule requête groupée doivent avoir
        // EXACTEMENT les mêmes clés (sinon erreur "All object keys must match") : chaque
        // champ est donc toujours présent, avec null si absent du Sheet pour cette personne.
        // salarie_id garde la casse d'origine (identité stable pour les fiches déjà
        // importées) ; seul le nom affiché/enregistré est mis en majuscules.
        const ligne: Record<string, unknown> = { resto, unite: uniteMaj, salarie_id: `${nom}_${prenom}`.replace(/\s+/g, "_"), nom: nom.toUpperCase(), prenom };
        ["civilite", "lieu_naissance", "nationalite", "adresse", "code_postal", "ville", "secu", "telephone", "email", "poste", "iban", "bic", "contact_urgence", "type_contrat", "niveau", "echelon"].forEach((cle) => {
          const v = valeurPourLigne(nv, cle);
          ligne[cle] = v || null;
        });
        // Dates : une valeur illisible ou composite (saisie manuelle libre dans le registre
        // d'embauche, ex: "26/03/2026 ET 26/05/2026") est ignorée (null) plutôt que de faire
        // échouer tout le lot.
        ["date_naissance", "date_debut", "date_fin", "date_fin_periode_essai"].forEach((cle) => {
          ligne[cle] = versDateISOouNull(valeurPourLigne(nv, cle));
        });
        // Nombres (heures, salaire) : idem, on garde ce qui est exploitable ("39H" -> 39),
        // sinon null plutôt qu'une erreur d'insertion.
        ["heures_contrat", "heures_sup", "salaire_net"].forEach((cle) => {
          ligne[cle] = versNombreOuNull(valeurPourLigne(nv, cle));
        });
        const mutuelleVal = valeurPourLigne(nv, "mutuelle");
        ligne.mutuelle = mutuelleVal ? normaliser(mutuelleVal).startsWith("oui") : null;

        // Saison de CETTE ligne déduite de l'année de sa date de début de contrat (ex:
        // "2026"), jamais de la date du jour : le registre garde indéfiniment les lignes des
        // saisons passées, donc un même rattrapage peut aussi bien importer un onboarding tout
        // juste soumis qu'un vieux dossier resté dans le Sheet depuis une saison précédente.
        // Sans date de début exploitable, on retombe sur l'année en cours (faute de mieux).
        const dateDebutLigne = ligne.date_debut as string | null;
        ligne.saison = dateDebutLigne && /^\d{4}-/.test(dateDebutLigne) ? dateDebutLigne.slice(0, 4) : String(new Date().getFullYear());

        aInserer.push(ligne);
      }

      if (aInserer.length === 0) return json({ ok: true, importes: 0, completes: 0, ignores });

      // Beaucoup de ces salariés existent déjà en base : créés automatiquement à leur vraie
      // soumission du Google Form, qui ne capture QUE les champs de base (pas les dates de
      // contrat, heures, type de contrat, niveau, échelon — ajoutés ensuite à la main dans le
      // registre). On complète donc aussi les fiches déjà là, mais UNIQUEMENT les champs
      // encore vides (jamais un champ qu'un directeur aurait déjà renseigné/modifié).
      //
      // La clé de correspondance est resto+salarie_id+DATE DE DÉBUT DE CONTRAT — pas la
      // saison. Un même salarié peut légitimement avoir une fiche par saison (dates de
      // contrat différentes d'une année sur l'autre : voir Kherraz/Heller 2025 vs 2026 plus
      // haut), MAIS une fiche déjà archivée à la main (saison "Archives", "Vieux dossiers"...
      // un libellé LIBRE, pas forcément une année) reste bien LE MÊME contrat que celui du
      // Sheet, avec la même date de début — comparer par saison la traitait à tort comme
      // "jamais vue" et recréait un doublon exact à chaque réimport (constaté sur 5 fiches
      // Cuisine de CHERRY déjà dans "Archives" : Di Maggio, Feray, Goux, Lepori, Roumly).
      // Comparer par date de début reconnaît le même contrat quel que soit le nom donné à sa
      // saison, tout en distinguant bien deux contrats différents (même sans date exploitable,
      // les deux clés valent "" et se traitent alors comme avant — au pire une fiche à
      // fusionner à la main, jamais un doublon silencieux).
      const CHAMPS_COMPLETABLES = ["date_debut", "date_fin", "date_fin_periode_essai", "heures_contrat", "heures_sup", "salaire_net", "type_contrat", "niveau", "echelon"];
      const existants: Record<string, Record<string, unknown>> = {};
      {
        const filtreResto = restoDemande ? `&resto=eq.${encodeURIComponent(restoDemande)}` : "";
        const champsExist = ["id", "resto", "salarie_id", "saison", ...CHAMPS_COMPLETABLES].join(",");
        const existRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?select=${champsExist}${filtreResto}`, {
          headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
        });
        if (existRes.ok) {
          const lignesExist = await existRes.json();
          for (const l of lignesExist) {
            existants[`${l.resto}::${l.salarie_id}::${l.date_debut || ""}`] = l;
          }
        }
      }

      // Fiches "provisoire" (créées à l'avance par un directeur, salaire/dates déjà connus,
      // en attente du vrai onboarding — voir "formSubmit" plus bas pour le même principe sur
      // une vraie réponse au Form). Une ligne du Sheet qui n'a pas de correspondance exacte
      // ci-dessus doit d'abord être comparée à ces fiches (même établissement+unité, nom/prénom
      // proches) : si elle correspond, on COMPLÈTE cette fiche au lieu d'en créer une nouvelle à
      // côté. Cette étape manquait à ce rattrapage en masse (contrairement à "formSubmit") —
      // c'est ce qui a créé les doublons Richelme/Roux lors du rattrapage post-incident.
      const TOUS_CHAMPS_IMPORTABLES = [
        "civilite", "lieu_naissance", "nationalite", "adresse", "code_postal", "ville", "secu",
        "telephone", "email", "poste", "iban", "bic", "contact_urgence", "type_contrat", "niveau",
        "echelon", "date_naissance", "date_debut", "date_fin", "date_fin_periode_essai",
        "heures_contrat", "heures_sup", "salaire_net", "mutuelle",
      ];
      let provisoires: { id: number; resto: string; unite: string; nom: string; prenom: string; [c: string]: unknown }[] = [];
      {
        const filtreResto = restoDemande ? `&resto=eq.${encodeURIComponent(restoDemande)}` : "";
        const champsProv = ["id", "resto", "unite", "nom", "prenom", ...TOUS_CHAMPS_IMPORTABLES].join(",");
        const provRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?provisoire=is.true&select=${champsProv}${filtreResto}`, {
          headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
        });
        if (provRes.ok) provisoires = await provRes.json();
      }

      const aInsererFinal: Record<string, unknown>[] = [];
      const patchs: { id: unknown; patch: Record<string, unknown> }[] = [];
      const patchsProvisoire: { id: unknown; patch: Record<string, unknown> }[] = [];
      for (const ligne of aInserer) {
        const cleF = `${ligne.resto}::${ligne.salarie_id}::${ligne.date_debut || ""}`;
        const existant = existants[cleF];
        if (existant) {
          const patch: Record<string, unknown> = {};
          for (const c of CHAMPS_COMPLETABLES) {
            if (existant[c] == null && (ligne as Record<string, unknown>)[c] != null) patch[c] = (ligne as Record<string, unknown>)[c];
          }
          if (Object.keys(patch).length > 0) patchs.push({ id: existant.id, patch });
          continue;
        }

        const nomN = normaliser(String(ligne.nom || ""));
        const prenomN = normaliser(String(ligne.prenom || ""));
        const scores = provisoires
          .filter((p) => p.resto === ligne.resto && p.unite === ligne.unite)
          .map((p) => ({ p, score: lev(nomN, normaliser(p.nom)) + lev(prenomN, normaliser(p.prenom)) }))
          .filter((s) => s.score <= 3) // tolère 1-2 fautes de frappe réparties sur nom+prénom
          .sort((a, b) => a.score - b.score);
        // N'agit que si un seul candidat est nettement le meilleur (même règle que "formSubmit").
        if (scores.length === 1 || (scores.length > 1 && scores[0].score < scores[1].score)) {
          const cible = scores[0].p;
          const patch: Record<string, unknown> = { nom: ligne.nom, prenom: ligne.prenom, provisoire: false };
          for (const c of TOUS_CHAMPS_IMPORTABLES) {
            if (cible[c] == null && (ligne as Record<string, unknown>)[c] != null) patch[c] = (ligne as Record<string, unknown>)[c];
          }
          patchsProvisoire.push({ id: cible.id, patch });
          provisoires = provisoires.filter((p) => p !== cible); // ne réutilise pas la même provisoire pour 2 lignes du Sheet
          continue;
        }

        aInsererFinal.push(ligne);
      }

      let importes = 0;
      if (aInsererFinal.length > 0) {
        const insRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?on_conflict=resto,salarie_id,saison`, {
          method: "POST",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates,return=representation",
          },
          body: JSON.stringify(aInsererFinal),
        });
        if (!insRes.ok) {
          const detail = await insRes.text();
          return json({ error: "import_echoue", detail }, 500);
        }
        importes = (await insRes.json()).length;
      }

      let completes = 0;
      for (const { id, patch } of [...patchs, ...patchsProvisoire]) {
        const majRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?id=eq.${id}`, {
          method: "PATCH",
          headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(patch),
        });
        if (majRes.ok) completes++;
      }

      return json({ ok: true, importes, completes, ignores: ignores + (aInsererFinal.length - importes) });
    }

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

      const uniteMaj = unite.trim().toUpperCase();
      // Champs capturés par le vrai Form uniquement (jamais salaire/dates/tél de contrat,
      // que le directeur seul connaît et remplit dans sa fiche "provisoire").
      const champsFormulaire: Record<string, unknown> = {};
      ["civilite", "date_naissance", "lieu_naissance", "nationalite", "adresse", "code_postal", "ville", "secu", "telephone", "email", "poste", "iban", "bic", "contact_urgence"].forEach((cle) => {
        const v = valeurPour(cle);
        if (v !== null) champsFormulaire[cle] = cle === "date_naissance" ? versDateISO(v) : v;
      });
      const mutuelleVal = valeurPour("mutuelle");
      if (mutuelleVal !== null) champsFormulaire.mutuelle = normaliser(mutuelleVal).startsWith("oui");

      // ---- Cherche une fiche "provisoire" (déjà remplie par le directeur, pas encore
      // confirmée) qui ressemble à cette personne, pour compléter CETTE fiche au lieu
      // d'en créer une nouvelle — le directeur ne ressaisit jamais salaire/dates/tél. ----
      const provRes = await fetch(
        `${SUPABASE_URL}/rest/v1/rh_salaries?resto=eq.${encodeURIComponent(resto)}&unite=eq.${uniteMaj}&provisoire=is.true&select=id,nom,prenom`,
        { headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` } },
      );
      let correspondance: { id: number } | null = null;
      if (provRes.ok) {
        const candidats: { id: number; nom: string; prenom: string }[] = await provRes.json();
        const nomN = normaliser(nom), prenomN = normaliser(prenom);
        const scores = candidats
          .map((c) => ({ c, score: lev(nomN, normaliser(c.nom)) + lev(prenomN, normaliser(c.prenom)) }))
          .filter((s) => s.score <= 3) // tolère 1-2 fautes de frappe réparties sur nom+prénom
          .sort((a, b) => a.score - b.score);
        // N'agit que si un seul candidat est nettement le meilleur (évite de fusionner
        // avec la mauvaise personne en cas d'ambiguïté) : sinon on crée une fiche à part.
        if (scores.length === 1 || (scores.length > 1 && scores[0].score < scores[1].score)) {
          correspondance = { id: scores[0].c.id };
        }
      }

      if (correspondance) {
        const patch = { ...champsFormulaire, nom: nom.toUpperCase(), prenom, provisoire: false };
        const majRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?id=eq.${correspondance.id}`, {
          method: "PATCH",
          headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(patch),
        });
        if (!majRes.ok) {
          const detail = await majRes.text();
          console.error("formSubmit fusion_echouee:", majRes.status, detail);
          return json({ error: "fusion_echouee", detail }, 500);
        }
        // Attendu (pas en arrière-plan) : voir le commentaire de formaterDerniereLigne plus
        // haut — le passage en arrière-plan (tenté un temps, pour ne jamais retarder la
        // création du dossier Drive par le script Apps Script d'Océane) a laissé la mise en
        // forme ne jamais s'appliquer sur deux onboardings réels de suite. Ce sont 2 petits
        // appels API rapides : le risque de retarder Apps Script au point de casser son étape
        // Drive est bien moindre que celui, confirmé, de ne jamais mettre en forme la ligne.
        await formaterDerniereLigne();
        return json({ ok: true, fusionne: true });
      }

      // Aucune fiche provisoire correspondante : nouvelle fiche, comme avant.
      // salarie_id garde la casse d'origine (identité stable pour les fiches déjà
      // importées) ; seul le nom affiché/enregistré est mis en majuscules.
      const ligne: Record<string, unknown> = { resto, unite: uniteMaj, salarie_id: `${nom}_${prenom}`.replace(/\s+/g, "_"), nom: nom.toUpperCase(), prenom, ...champsFormulaire };

      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/rh_salaries?on_conflict=resto,salarie_id,saison`, {
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

      // Attendu (voir commentaire équivalent plus haut).
      await formaterDerniereLigne();
      return json({ ok: true });
    }

    // ---- L'appli crée ou modifie une fiche : répercuter dans le Sheet ----
    // "ligneCible" (mémorisée dans rh_salaries.sheet_ligne dès la première synchro réussie)
    // évite de re-rechercher la ligne par nom+prénom+établissement à CHAQUE modification :
    // cette recherche pouvait échouer silencieusement (accent, espace parasite...) et créait
    // alors une nouvelle ligne quasi vide à chaque édition suivante de la même fiche. Absente
    // (fiche jamais encore synchronisée avec ce mécanisme) -> on cherche comme avant.
    if (action === "upsertRow") {
      const { resto, nom, prenom, unite, champs, ligneCible: ligneFournie } = corps;
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

      let ligneCible: number;
      let nouvelleLigne = false;
      if (ligneFournie) {
        ligneCible = Number(ligneFournie);
      } else {
        const restoCol = colIndex["resto"];
        ligneCible = -1;
        for (let i = 1; i < grille.length; i++) {
          const r = grille[i];
          const memeNom = normaliser(r[colIndex["nom"]]) === normaliser(nom);
          const memePrenom = normaliser(r[colIndex["prenom"]]) === normaliser(prenom);
          const memeResto = restoCol === undefined || normaliser(r[restoCol] || "") === normaliser(resto);
          if (memeNom && memePrenom && memeResto) { ligneCible = i + 1; break; } // +1 : la grille est 0-indexée, les lignes Sheet démarrent à 1
        }
        if (ligneCible === -1) { ligneCible = grille.length + 1; nouvelleLigne = true; } // nouvelle ligne, juste après la dernière
      }

      const data: { range: string; values: string[][] }[] = [];
      Object.keys(champs).forEach((cle) => {
        if (!(cle in colIndex)) return; // pas de colonne connue pour ce champ : on n'écrit rien
        const lettre = indexVersLettre(colIndex[cle]);
        data.push({ range: `'${SHEET_TAB}'!${lettre}${ligneCible}`, values: [[versDateSheet(cle, champs[cle])]] });
      });
      // Toujours renseigner nom/prénom/établissement sur une ligne nouvellement créée.
      if (nouvelleLigne) {
        [["nom", nom], ["prenom", prenom], ["resto", resto]].forEach(([cle, val]) => {
          if (cle in colIndex && !(cle in champs)) {
            data.push({ range: `'${SHEET_TAB}'!${indexVersLettre(colIndex[cle as string])}${ligneCible}`, values: [[String(val)]] });
          }
        });
      }
      await ecrireCellules(jeton, data);
      // Mise en forme (colonnes centrées, NOM en police 14) uniquement sur une ligne
      // NOUVELLEMENT créée par l'appli : une vraie réponse au Form est déjà mise en forme
      // par Google Sheets lui-même, et une ligne déjà existante garde le format qu'Océane
      // lui a donné (on ne l'écrase jamais). N'empêche jamais la sauvegarde de la fiche en
      // cas d'échec (ex: droits insuffisants du compte de service sur la mise en forme).
      if (nouvelleLigne) {
        try {
          await formaterLigneOnboarding(jeton, ligneCible, colIndex["nom"], entetes.length);
        } catch (e) {
          console.error("upsertRow formatage_echoue:", e);
        }
      }
      return json({ ok: true, ligne: ligneCible });
    }

    return json({ error: "action_inconnue" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "erreur_serveur", detail: String((e as Error)?.message || e) }, 500);
  }
});
