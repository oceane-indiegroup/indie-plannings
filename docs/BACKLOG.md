# Indie App — Carnet de route

Chaque ligne indique la conversation qui la porte. Cocher `[x]` quand c'est fait.
Les cases marquées **(Océane)** sont des actions à faire par Océane elle-même.

---

## 🚨 Priorités du moment

1. [ ] 🧹 Réparer les ~80 fiches dont l'email/poste a été mélangé avec celui d'une autre personne — *Qualité des données*
2. [ ] 🔄 Ralentir le déclencheur Apps Script `synchroniserOnboardingDepuisSheet` (~1 min → 30-60 min) **(Océane)** — *Synchro Sheets*
3. [ ] 🔧 Redéployer `sheet-sync` dans Supabase pour activer le bouton « Vérifier les lignes Sheet mélangées » **(Océane)** — *Technique & infra*

## ⛔ Points bloquants

- Tant que le déclencheur (priorité 2) tourne chaque minute, les fiches en double supprimées dans l'appli réapparaissent → bloque le nettoyage (priorité 1).
- Tant que `sheet-sync` n'est pas redéployé (priorité 3), le bouton de diagnostic « lignes Sheet mélangées » renvoie une erreur.

---

## 🧭 Pilotage général
- [ ] Créer les 9 conversations et les ranger dans le dossier « Indie App » **(Océane)**
- [ ] Ajouter les liens des conversations dans `CLAUDE.md` (carte des conversations)
- [ ] Valider le principe de l'écran « Mes tâches » (voir proposition plus bas)

## 🔧 Technique & infra
- [ ] Redéployer `sheet-sync` (voir priorité 3) **(Océane)**
- [ ] Vérifier que le SQL de la contrainte unique `rh_salaries (resto, salarie_id, saison, date_debut)` est bien en place (il a été exécuté le 28/10)
- [ ] Faire le ménage : fichier `packagelock.json` en double de `package-lock.json`
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
Risques repérés au point de démarrage (28/10), du plus urgent au moins urgent :
- [ ] Repos hebdo : cliquer deux fois sur « Exporter vers le Sheet Extra » ajoute deux fois les mêmes lignes (risque de double paiement) → retenir ce qui a déjà été exporté
- [ ] Extras et Primes : supprimer dans l'appli ne retire pas la ligne du Sheet (la ligne peut quand même partir en paie) → au minimum, marquer la ligne « SUPPRIMÉ » dans le Sheet
- [ ] Extras et Primes : le numéro de ligne Sheet mémorisé devient faux si on trie / supprime des lignes dans le Sheet → l'appli peut alors écrire sur la ligne de quelqu'un d'autre (même mécanisme que le mélange onboarding) → vérifier nom + date avant d'écrire
- [ ] Extras : si la copie vers le Sheet échoue à la création, l'extra n'y arrive jamais (pas de nouvel essai, contrairement aux Primes)
- [ ] Repos hebdo : la case « repos non pris » enregistre à chaque frappe → enregistrer à la sortie de la case
- [ ] Extras : impossible de corriger un extra une fois « heures validées »
- [ ] Mes tâches : faire remonter extras « à valider », mois sans repos hebdo exporté, échecs de copie vers les Sheets
- [ ] À confirmer avec Océane : taux journalier repos hebdo = salaire net ÷ 30 ; repères de taux extras (15 € / 15 € / 18 €)

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
