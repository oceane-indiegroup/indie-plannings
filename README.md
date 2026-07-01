# Indie Group — Plannings & émargement

Application web de gestion des plannings et de l'émargement pour les restaurants
du groupe. Version **production** : données partagées et durables via **Supabase**,
connexion manager sécurisée par **authentification réelle**.

- **Managers** (connectés) : génèrent/modifient les plannings, gèrent les effectifs,
  suivent les pointages, impriment les feuilles d'émargement.
- **Salariés** (sans compte) : voient leur planning du jour, confirment leur présence,
  signent leur semaine.

---

## 🧭 Vue d'ensemble (5 étapes)

1. Créer un projet **Supabase** (la base de données) — gratuit.
2. Exécuter le script `supabase/schema.sql` (crée la table + les règles de sécurité).
3. Créer les **comptes managers** et désactiver l'inscription libre.
4. Renseigner **2 clés** (URL + clé publique) dans les variables d'environnement.
5. Déployer sur **Vercel** (le site) — gratuit.

Aucune ligne de code à écrire. Comptez ~30–45 minutes la première fois.

---

## 1. Créer le projet Supabase

1. Allez sur https://supabase.com → **Start your project** → connectez-vous.
2. **New project** :
   - Name : `indie-plannings`
   - Database Password : générez-en un fort et **conservez-le**.
   - **Region : choisissez une région en Europe** (ex. *Frankfurt* / *Paris*) —
     important pour héberger les données RH en Europe (RGPD).
3. Attendez ~2 min que le projet se crée.

## 2. Créer la base de données

1. Dans Supabase, menu de gauche → **SQL Editor** → **New query**.
2. Ouvrez le fichier **`supabase/schema.sql`** de ce projet, copiez tout son contenu,
   collez-le dans l'éditeur, puis cliquez **Run**.
3. Vous devez voir *Success*. (Cela crée la table `kv` et les règles d'accès.)

## 3. Créer les comptes managers + verrouiller les inscriptions

1. Menu **Authentication → Users → Add user** :
   - E-mail + mot de passe de chaque manager (ex. `victor@indiegroup.fr`).
   - Cochez **Auto Confirm User** pour qu'il puisse se connecter tout de suite.
   - Répétez pour chaque manager.
2. Menu **Authentication → Providers → Email** :
   - **Décochez « Enable sign-ups »** (ou « Allow new users to sign up »).
   - ⚠️ Étape importante : sans ça, n'importe qui pourrait se créer un compte manager.

## 4. Récupérer les 2 clés

Menu **Project Settings → API** (ou **Data API**), notez :

| Variable | Où la trouver |
|---|---|
| `VITE_SUPABASE_URL` | **Project URL** (ex. `https://abcd1234.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Clé **anon / public** (`anon` `public`) |

> La clé `anon` est **publique** par nature (elle vit dans le navigateur) : c'est normal.
> La sécurité repose sur les règles d'accès (RLS) définies à l'étape 2, pas sur le secret de cette clé.
> ⚠️ N'utilisez **jamais** la clé `service_role` dans ce projet.

## 5. Déployer sur Vercel

1. Mettez ce dossier dans un dépôt Git à vous (GitHub/GitLab).
   > Le fichier `.gitignore` exclut déjà `node_modules`, `dist` et `.env` — parfait.
2. Sur https://vercel.com → **Add New → Project** → importez le dépôt.
3. Vercel détecte **Vite** automatiquement (Build: `npm run build`, Output: `dist`).
4. Dans **Environment Variables**, ajoutez les 2 clés de l'étape 4 :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy**. Vous obtenez une adresse type `https://indie-plannings.vercel.app`.

C'est en ligne. Partagez l'adresse à vos équipes.

---

## 🖥️ Tester en local (optionnel)

Prérequis : **Node.js 18+** (https://nodejs.org).

```bash
npm install
cp .env.example .env      # puis renseignez vos 2 clés dans .env
npm run dev               # ouvre http://localhost:5173
```

Build de production locale : `npm run build` puis `npm run preview`.

---

## 🔐 Sécurité — ce qui est en place

- **Managers** : vraie authentification (e-mail + mot de passe). Eux seuls peuvent
  écrire les plannings, gérer les effectifs et valider les semaines.
- **Salariés** : accès anonyme **restreint** par la base — ils ne peuvent que **lire**
  les plannings publiés et **écrire leurs pointages**. Ils ne peuvent pas modifier
  un planning ni un effectif.
- Données hébergeables **en Europe** (choix de région Supabase).

## ⚠️ Limites connues (et évolutions possibles)

1. **Pointages concurrents.** Les pointages d'une semaine sont stockés en un seul bloc
   par restaurant. Si deux salariés confirment leur présence exactement au même instant,
   la dernière écriture peut écraser l'autre. Rare en pratique, mais pour une robustesse
   totale il faudrait passer les pointages en table dédiée (une ligne par salarié/jour).
2. **Lecture des pointages entre salariés.** Un salarié peut techniquement lire les
   confirmations des autres (peu sensible ici). Restreignable avec des comptes salariés.

Ces deux points se traitent dans une V2 « tables dédiées + comptes salariés » si le besoin
se confirme — dites-le et on la prépare.

---

## 🗂️ Structure du projet

```
indie-plannings/
├── index.html            # point d'entrée HTML
├── package.json          # dépendances & scripts
├── vite.config.js        # config de build
├── .env.example          # modèle des variables d'environnement
├── supabase/
│   └── schema.sql        # table kv + règles de sécurité (à exécuter dans Supabase)
└── src/
    ├── main.jsx          # montage React
    ├── supabaseClient.js # connexion Supabase (lit les 2 clés)
    └── App.jsx           # toute l'application
```
