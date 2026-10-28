# Indie App — mémoire partagée du projet

Ce fichier est lu par TOUTES les conversations Claude qui travaillent sur ce projet.
Le mettre à jour quand la carte des conversations ou les règles changent.

## Qui est l'utilisatrice

Océane (oceane@indiegroup.fr), Indie Group (~13 restaurants/établissements). Elle n'est
PAS développeuse : tout expliquer simplement, en français, étape par étape (où cliquer,
quoi copier-coller). Pas de jargon sans explication.

## Carte des conversations (dossier « Indie App » de la barre latérale)

| Emoji | Conversation | Périmètre |
|---|---|---|
| 🧭 | Pilotage général | Avancement, priorités, arbitrages entre chantiers, sujets qui touchent plusieurs segments, écran « Mes tâches ». |
| 🔧 | Technique & infra | Supabase (base, sécurité/RLS, accès), mise en ligne Vercel, fonctions serveur (`sheet-sync`, `rh-admin`), santé du code. |
| 🔄 | Synchro Google Sheets & Forms | Form onboarding → appli, appli → Sheets (Onboarding, Extra, Prime, Notes de frais), scripts Apps Script et leurs déclencheurs. |
| 🧹 | Qualité des données | Doublons, emails/postes mélangés, fiches qui réapparaissent, outils de diagnostic et de nettoyage. |
| 📋 | Registre embauche & documents RH | Fiches salariés, colonnes, contrats, saisons/archives, génération de documents RH. |
| 📅 | Planning & émargement | Plannings managers, shifts, feuilles d'émargement, signatures. |
| 💶 | Paie : extras, primes, repos hebdo | Les modules Extras, Primes, Repos hebdo non pris et leurs Sheets. |
| 👤 | Espace salarié | « Qui suis-je ? », vue salarié, Notes de frais, Arrivées Saint-Barth. |
| 🎨 | Design & ergonomie | Aspect visuel, lisibilité mobile, confort d'usage des écrans. |

Liens vers les conversations : à compléter ici par Océane une fois créées.

## Règle d'AIGUILLAGE

- Si une question relève d'un autre segment : ne pas la traiter. Dire en une phrase quelle
  conversation est la bonne (avec son lien s'il est connu) et donner un message prêt à
  coller là-bas.
- Une question rapide peut avoir sa réponse sur place.
- Si Océane insiste, on la traite ici.
- Sujet transverse ou arbitrage → 🧭 Pilotage général.
- Aucune conversation ne colle → proposer d'en créer une, avec son prompt de démarrage.

## Règle de PRUDENCE

- Une seule conversation modifie le code à la fois.
- Avant de toucher un fichier partagé (surtout `App.jsx`, `supabase/functions/*`,
  `schema.sql`), vérifier qu'aucune autre conversation n'est en train de coder
  (demander à Océane en cas de doute) et récupérer la dernière version (`git pull`).
- Après chaque modification : vérifier que ça compile, enregistrer (commit) et envoyer
  (push) tout de suite, pour que les autres conversations repartent de la bonne version.

## Carnet de route

`docs/BACKLOG.md` : tâches rangées par segment, priorités et points bloquants en tête.
Chaque conversation coche ses lignes au fur et à mesure et en ajoute si besoin.

## Écran « Mes tâches » (règle produit)

Chaque nouvelle fonctionnalité doit se demander : « qu'est-ce qu'elle doit faire remonter
dans l'écran Mes tâches d'Océane ? » (voir la section Pilotage du BACKLOG).

## Repères techniques

- Appli React/Vite, presque tout dans `App.jsx` (~6 600 lignes). Base Supabase.
  Fonctions serveur : `supabase/functions/sheet-sync/index.ts` et `supabase/functions/rh-admin/index.ts`.
- Mise en ligne : Vercel publie automatiquement la branche `main` sur
  indie-plannings-seven.vercel.app.
- Les fonctions serveur ne se mettent PAS à jour toutes seules : Océane doit les
  redéployer dans Supabase (copier-coller du code dans Edge Functions).
- Règle permanente : à chaque modification de `sheet-sync/index.ts` ou
  `rh-admin/index.ts`, coller le fichier COMPLET dans le chat, en un seul bloc
  (jamais un extrait), pour qu'Océane puisse le copier-coller dans Supabase.
- Toute modification de base de données (SQL) doit être donnée à Océane à exécuter dans
  Supabase → SQL Editor, puis confirmée par elle : un SQL jamais exécuté a déjà causé
  une panne silencieuse (erreur 42P10 sur l'import).
- Vérifier que `App.jsx` compile :
  `npx esbuild App.jsx --bundle --jsx=automatic --external:react --external:react-dom --external:xlsx --external:html2pdf.js --external:@fontsource/* --external:@supabase/* --outfile=/tmp/check.js`
- Vérifier `sheet-sync` :
  `npx esbuild supabase/functions/sheet-sync/index.ts --bundle --platform=neutral --target=es2022 --outfile=/tmp/check-sync.js --external:*`
- Les conversations cloud n'ont pas accès au site ni à Supabase en direct : pour vérifier
  en vrai, demander à Océane des captures d'écran.
- Leçons apprises :
  - jamais d'enregistrement à chaque frappe sur un champ date (enregistrer à la sortie du champ) ;
  - pas de rapprochement « approximatif » des noms dans un import en masse ;
  - un déclencheur Apps Script trop fréquent réimporte ce qu'on vient de supprimer.
