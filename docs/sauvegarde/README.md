# Sauvegarde quotidienne

La base Supabase n'a **aucune sauvegarde automatique** sur la formule gratuite.
`sauvegarde-drive.gs` est un script Google Apps Script, hébergé dans le compte Google
d'Océane, qui lit toutes les tables chaque nuit et dépose un `.zip` daté dans le Drive.

- Il ne fait que **lire** la base, jamais écrire.
- Il refuse d'écrire une sauvegarde si une table essentielle revient vide (lecture ratée),
  et dans ce cas il ne supprime rien non plus : les sauvegardes précédentes restent.
- Il envoie un e-mail à Océane **uniquement en cas d'échec**.
- La clé d'accès est dans les Propriétés du script (`CLE_SERVICE`), pas dans le code.

Pour remettre des données en place : voir `RESTAURER.md`.
