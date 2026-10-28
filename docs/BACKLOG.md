# Indie App — Carnet de route

Chaque ligne indique la conversation qui la porte. Cocher `[x]` quand c'est fait.
Les cases marquées **(Océane)** sont des actions à faire par Océane elle-même.

---

## 🚨 Priorités du moment

1. [ ] 🧹 Réparer les ~80 fiches dont l'email/poste a été mélangé avec celui d'une autre personne — *Qualité des données*
2. [ ] 🔄 Ralentir le déclencheur Apps Script `synchroniserOnboardingDepuisSheet` (~1 min → 30-60 min) **(Océane)** — *Synchro Sheets*
3. [x] 🔧 Redéployer `sheet-sync` dans Supabase **(Océane)** — *Technique & infra* — fait le 28/10 (version 75), contrôlée identique à `main` au caractère près.

## ⛔ Points bloquants

- Tant que le déclencheur (priorité 2) tourne chaque minute, les fiches en double supprimées dans l'appli réapparaissent → bloque le nettoyage (priorité 1).

---

## 🧭 Pilotage général
- [ ] Créer les 9 conversations et les ranger dans le dossier « Indie App » **(Océane)**
- [ ] Ajouter les liens des conversations dans `CLAUDE.md` (carte des conversations) — 🔧 Technique ajouté le 28/10, les autres restent à faire
- [ ] Valider le principe de l'écran « Mes tâches » (voir proposition plus bas)

## 🔧 Technique & infra
- [x] Redéployer `sheet-sync` (voir priorité 3) **(Océane)** — 28/10
- [ ] Redéployer `rh-admin` **(Océane)** : la version en ligne date du 24/09 et n'a pas la correction du 02/10 (les fiches « provisoire » introuvables dans la recherche Extras/Primes, cas José Menis)
- [ ] Sécurité Supabase (faible priorité) : activer « Leaked password protection » (Authentication → Policies) **(Océane)** ; fixer le `search_path` des 6 fonctions `*_touch` (SQL à fournir)
- [x] Contrainte unique `rh_salaries (resto, salarie_id, saison, date_debut)` bien en place dans la base (vérifié deux fois le 28/10 via le connecteur Supabase : c'est la seule contrainte unique de la table, en plus de l'identifiant)
- [x] Ménage : suppression de `packagelock.json`, vieille copie incomplète de `package-lock.json` (28/10)
- [ ] Étudier un découpage progressif d'`App.jsx` (6 600 lignes) pour réduire les risques — à arbitrer en Pilotage

## 🔄 Synchro Google Sheets & Forms
- [ ] Ralentir le déclencheur `synchroniserOnboardingDepuisSheet` (voir priorité 2) **(Océane)**
- [ ] Vérifier le comportement de l'import automatique (`ecraser:true`) maintenant que le rapprochement des noms est exact
- [ ] Vérifier sur un vrai onboarding que la fusion fiche provisoire ↔ Form fonctionne de bout en bout (poste, email, sheet_ligne)

## 🧹 Qualité des données
- [ ] Lancer « 🔍 Vérifier les lignes Sheet mélangées » et traiter la liste
- [ ] Lancer « 🔍 Vérifier les emails en double » et traiter la liste
- [ ] Décider d'une méthode de réparation pour les fiches touchées (correction à la main, ou outil qui vide la mauvaise ligne + réimport propre)
- [ ] Supprimer les fiches en double une fois le déclencheur ralenti
- [x] Import en masse : rapprochement des noms exact uniquement (28/10)
- [x] Outil « emails en double » (28/10)
- [x] Outil « lignes Sheet mélangées » (28/10)

## 📋 Registre embauche & documents RH
- [ ] Tester sur la vraie appli la saisie des dates (plus de « 0202 » dans le Sheet)
- [x] Colonne « Date de fin de période d'essai » (28/10)
- [x] Erreur visible quand la copie vers le Sheet échoue (28/10)
- [x] Le bouton Resynchroniser / Confirmer recopie aussi le poste (27/10)

## 📅 Planning & émargement
- [ ] Retirer le diagnostic temporaire « clé de stockage sous chaque salarié » s'il est encore affiché (ajouté le 30/09)

## 💶 Paie : extras, primes, repos hebdo
- [ ] (rien en attente connu — à compléter par la conversation dédiée)

## 👤 Espace salarié
- [ ] Tester « Qui suis-je ? » avec nom + prénom + email sur plusieurs salariés réels
- [x] « Qui suis-je ? » retrouve les salariés du Registre RH (28/10)
- [x] « Qui suis-je ? » demande l'email (28/10)

## 🎨 Design & ergonomie
- [ ] Faire un tour des écrans sur téléphone et lister ce qui gêne

---

## 💡 Proposition : écran « Mes tâches » (porté par 🧭 Pilotage)

Un écran unique, réservé au superviseur, qui rassemble tout ce qui attend une action d'Océane.

**Calculé automatiquement depuis les données**
- Fiches encore « PAS ONBOARDING » depuis plus de X jours
- Fiches avec email en double ou ligne Sheet mélangée
- Contrats qui se terminent dans les 15 prochains jours / fins de période d'essai proches
- Extras à valider, primes du mois non saisies, repos hebdo non pris du mois non exportés
- Arrivées Saint-Barth des 7 prochains jours
- Échecs de synchronisation avec les Sheets

**Ajouté à la main**
- Une petite liste libre (texte + date limite + case à cocher).

**Règle** : chaque nouvelle fonctionnalité se demande ce qu'elle doit faire remonter ici.

Statut : proposition, rien n'est construit.
