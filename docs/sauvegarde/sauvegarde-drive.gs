/**
 * Indie App — sauvegarde quotidienne de la base vers Google Drive
 * -----------------------------------------------------------------------------
 * Ce script tourne dans le compte Google d'Océane. Chaque nuit, il lit toutes les
 * tables de la base Supabase et dépose UN fichier .zip daté dans un dossier du
 * Drive. Il ne modifie JAMAIS la base : il ne fait que lire.
 *
 * Réglage unique à faire une fois : Paramètres du projet → Propriétés du script →
 * ajouter la propriété CLE_SERVICE avec la clé « service_role » de Supabase.
 * La clé n'est donc pas écrite dans ce code : si le script est un jour partagé,
 * elle ne part pas avec.
 */

var URL_SUPABASE = 'https://aqsryrxwojlvmymcoyqp.supabase.co';
var NOM_DOSSIER = 'Sauvegardes Indie App';
var JOURS_CONSERVES = 30;          // au-delà, on ne garde que le 1er de chaque mois
var EMAIL_ALERTE = 'oceane@indiegroup.fr';
var PAGE = 1000;                   // lignes lues par requête

// Les tables à sauvegarder, et la colonne qui sert à les lire dans un ordre stable.
// « minimum » : en dessous de ce nombre de lignes, on considère que la lecture a
// échoué et on refuse d'écrire une sauvegarde vide (voir plus bas).
var TABLES = [
  { nom: 'rh_salaries',     ordre: 'id',                              minimum: 100 },
  { nom: 'rh_acces',        ordre: 'id',                              minimum: 1   },
  { nom: 'rh_extras',       ordre: 'id',                              minimum: 0   },
  { nom: 'rh_primes',       ordre: 'id',                              minimum: 0   },
  { nom: 'rh_repos_hebdo',  ordre: 'id',                              minimum: 0   },
  { nom: 'rh_previsionnel', ordre: 'id',                              minimum: 0   },
  { nom: 'kv',              ordre: 'key',                             minimum: 10  },
  { nom: 'kv_history',      ordre: 'id',                              minimum: 0   },
  { nom: 'pointages',       ordre: 'resto,sem,salarie_id,jour',       minimum: 0   }
];

/** Lancé à la main depuis l'éditeur, et chaque nuit par le déclencheur. */
function sauvegarderMaintenant() {
  var debut = new Date();
  try {
    var cle = PropertiesService.getScriptProperties().getProperty('CLE_SERVICE');
    if (!cle) throw new Error("La propriété CLE_SERVICE n'est pas réglée (Paramètres du projet → Propriétés du script).");

    var blobs = [];
    var resume = [];
    var totalLignes = 0;

    for (var i = 0; i < TABLES.length; i++) {
      var t = TABLES[i];
      var lignes = lireTable(cle, t.nom, t.ordre);
      // Garde-fou : une table essentielle qui revient vide, c'est une lecture ratée,
      // pas une base vidée. On s'arrête AVANT d'écrire quoi que ce soit, pour ne
      // surtout pas remplacer une bonne sauvegarde par une mauvaise.
      if (lignes.length < t.minimum) {
        throw new Error('Table ' + t.nom + ' : ' + lignes.length + ' ligne(s) lue(s), au moins '
          + t.minimum + ' attendue(s). Sauvegarde interrompue, rien n\'a été écrit ni supprimé.');
      }
      blobs.push(Utilities.newBlob(JSON.stringify(lignes, null, 1), 'application/json', t.nom + '.json'));
      resume.push(t.nom + ' : ' + lignes.length + ' lignes');
      totalLignes += lignes.length;
    }

    var jour = Utilities.formatDate(debut, 'Europe/Paris', 'yyyy-MM-dd');
    var heure = Utilities.formatDate(debut, 'Europe/Paris', "dd/MM/yyyy 'à' HH:mm");
    blobs.push(Utilities.newBlob(
      'Sauvegarde Indie App du ' + heure + '\n'
      + 'Base : ' + URL_SUPABASE + '\n\n'
      + resume.join('\n') + '\n\nTotal : ' + totalLignes + ' lignes.\n\n'
      + 'Pour restaurer : voir docs/sauvegarde/RESTAURER.md dans le dépôt de l\'application.\n',
      'text/plain', 'resume.txt'));

    var dossier = dossierSauvegardes();
    var nomFichier = 'indie-app-' + jour + '.zip';
    // Une seule sauvegarde par jour : si on relance, l'ancienne du même jour part.
    var memeJour = dossier.getFilesByName(nomFichier);
    while (memeJour.hasNext()) memeJour.next().setTrashed(true);
    var fichier = dossier.createFile(Utilities.zip(blobs, nomFichier));

    menageAncienneSauvegarde(dossier);

    Logger.log('Sauvegarde OK : ' + nomFichier + ' (' + Math.round(fichier.getSize() / 1024) + ' Ko, '
      + totalLignes + ' lignes, ' + Math.round((new Date() - debut) / 1000) + ' s)');
  } catch (e) {
    MailApp.sendEmail(EMAIL_ALERTE,
      '⚠️ Indie App — la sauvegarde de cette nuit a échoué',
      "La sauvegarde automatique de la base Indie App n'a pas pu se faire.\n\n"
      + 'Message : ' + e.message + '\n\n'
      + "Les sauvegardes précédentes sont intactes : rien n'a été supprimé.\n"
      + "Tu peux relancer à la main : ouvre le script, choisis « sauvegarderMaintenant » et clique sur Exécuter.\n"
      + "Si l'erreur revient demain, montre ce message à Claude.\n");
    throw e;
  }
}

/** Lit une table entière, page par page. */
function lireTable(cle, table, ordre) {
  var tout = [];
  var depart = 0;
  var ordres = ordre.split(',').map(function (c) { return c + '.asc'; }).join(',');
  while (true) {
    var url = URL_SUPABASE + '/rest/v1/' + table
      + '?select=*&order=' + encodeURIComponent(ordres)
      + '&limit=' + PAGE + '&offset=' + depart;
    var reponse = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { apikey: cle, Authorization: 'Bearer ' + cle, Accept: 'application/json' },
      muteHttpExceptions: true
    });
    if (reponse.getResponseCode() !== 200) {
      throw new Error('Lecture de ' + table + ' refusée (code ' + reponse.getResponseCode() + ') : '
        + reponse.getContentText().slice(0, 300));
    }
    var page = JSON.parse(reponse.getContentText());
    tout = tout.concat(page);
    if (page.length < PAGE) return tout;
    depart += PAGE;
    if (depart > 200000) throw new Error('Table ' + table + ' anormalement longue, lecture arrêtée.');
  }
}

/** Le dossier du Drive, créé la première fois. */
function dossierSauvegardes() {
  var trouves = DriveApp.getFoldersByName(NOM_DOSSIER);
  return trouves.hasNext() ? trouves.next() : DriveApp.createFolder(NOM_DOSSIER);
}

/**
 * On garde les 30 derniers jours, plus le 1er de chaque mois pour toujours.
 * Ainsi on peut remonter à hier comme à il y a six mois, sans encombrer le Drive.
 */
function menageAncienneSauvegarde(dossier) {
  var limite = new Date();
  limite.setDate(limite.getDate() - JOURS_CONSERVES);
  var fichiers = dossier.getFiles();
  while (fichiers.hasNext()) {
    var f = fichiers.next();
    var m = f.getName().match(/^indie-app-(\d{4})-(\d{2})-(\d{2})\.zip$/);
    if (!m) continue;                       // pas un de nos fichiers : on n'y touche pas
    if (m[3] === '01') continue;            // le 1er du mois : gardé pour toujours
    var date = new Date(+m[1], +m[2] - 1, +m[3]);
    if (date < limite) f.setTrashed(true);  // corbeille, pas suppression définitive
  }
}

/** À lancer UNE FOIS pour programmer la sauvegarde de chaque nuit, vers 4 h. */
function programmerLaSauvegarde() {
  var deja = ScriptApp.getProjectTriggers();
  for (var i = 0; i < deja.length; i++) {
    if (deja[i].getHandlerFunction() === 'sauvegarderMaintenant') ScriptApp.deleteTrigger(deja[i]);
  }
  ScriptApp.newTrigger('sauvegarderMaintenant').timeBased().atHour(4).everyDays(1).create();
  Logger.log('C\'est programmé : la sauvegarde se fera chaque nuit vers 4 h.');
}
