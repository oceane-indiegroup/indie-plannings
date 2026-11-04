# Restaurer les données depuis une sauvegarde

Les sauvegardes sont dans le Drive, dossier **« Sauvegardes Indie App »**, un fichier
`.zip` par jour. On garde les 30 derniers jours, plus le 1er de chaque mois pour toujours.

Chaque `.zip` contient un fichier `.json` par table (`rh_salaries.json`, `kv.json`…)
et un `resume.txt` avec la date et le nombre de lignes de chaque table.

## Avant toute chose

**Ne restaure jamais dans la précipitation.** Une restauration remplace les données
actuelles. Si tu as un doute, ouvre d'abord la sauvegarde et regarde `resume.txt` :
il dit le jour et le nombre de lignes. Prends la dernière sauvegarde *antérieure* au
problème, pas forcément celle d'hier.

## Cas 1 — une seule fiche à récupérer (le plus fréquent)

Par exemple : une fiche salarié supprimée ou écrasée par erreur.

1. Télécharge le `.zip` du bon jour, ouvre-le, ouvre `rh_salaries.json`.
2. Cherche la personne (Ctrl+F sur son nom) et copie **un seul bloc** `{ … }`, accolades comprises.
3. Dans Supabase → SQL Editor, colle ceci en remplaçant la partie entre les repères :

```sql
insert into rh_salaries
select * from jsonb_populate_recordset(null::rh_salaries, $json$
[ COLLER ICI LE BLOC { … } ]
$json$::jsonb);
```

Si la fiche existe encore et qu'il s'agit de l'écraser, remplace `insert into` par la
version complète du cas 2, ou supprime d'abord la ligne existante.

## Cas 2 — une table entière à remettre dans l'état d'un jour donné

À ne faire que si la table est vraiment abîmée. Tout se passe dans Supabase → SQL Editor.
Le `begin; … commit;` fait que soit tout passe, soit rien ne bouge.

```sql
begin;

-- 1) Filet de sécurité : on garde l'état actuel sous un autre nom, au cas où.
create table rh_salaries_avant_restauration as select * from rh_salaries;

-- 2) On vide et on remet le contenu de la sauvegarde.
delete from rh_salaries;
insert into rh_salaries
select * from jsonb_populate_recordset(null::rh_salaries, $json$
COLLER ICI TOUT LE CONTENU DE rh_salaries.json
$json$::jsonb);

commit;
```

Remplace `rh_salaries` par le nom de la table voulue (aux trois endroits).
Vérifie ensuite dans l'appli que tout est revenu, puis seulement après, si tout va bien,
tu peux supprimer la table de secours :
`drop table rh_salaries_avant_restauration;`

Pour une grosse table (`pointages`, `kv_history`), le fichier peut être trop lourd à
coller d'un coup dans l'éditeur SQL. Dans ce cas, demande de l'aide : on le découpe.

## Ce que la sauvegarde ne contient PAS

- **Les comptes de connexion** (adresses e-mail et mots de passe des directeurs et
  managers). Ils vivent dans Supabase → Authentication. En cas de perte, les comptes se
  recréent depuis l'écran « Accès RH » de l'appli ; la table `rh_acces`, elle, est bien
  sauvegardée, donc on sait qui avait accès à quoi.
- **Le code de l'application** : il est sur GitHub, c'est sa propre sauvegarde.
- **Les Google Sheets et Forms** : ils sont déjà dans le Drive.
- **Le stockage de documents** (`rh-documents`) : il est vide aujourd'hui. Le jour où on
  y mettra des contrats signés, il faudra l'ajouter à la sauvegarde.
