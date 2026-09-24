import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "./supabaseClient";
// Photo de fond de l'écran d'accueil : chargée en chemin public (pas un import), pour que le
// build ne casse jamais si le fichier est absent ou pas encore uploadé — au pire, pas de photo.
const fondAccueil = "/22.jpeg";
// N'utiliser QUE les fonctions d'écriture de xlsx (aoa_to_sheet, book_new, write) sur des
// données internes à l'appli — jamais XLSX.read()/readFile() sur un fichier externe : les
// failles connues de ce paquet concernent la lecture de fichiers xlsx non fiables.
import * as XLSX from "xlsx";
// Génération de PDF côté navigateur (pour joindre la promesse d'embauche à un email) —
// voir genererPromessePDFBase64 plus bas pour la mise en garde sur le positionnement du
// conteneur de rendu (un conteneur déplacé hors écran donne un canvas de hauteur 0).
import html2pdf from "html2pdf.js";
// Police "Inter" auto-hébergée (empaquetée au build, servie depuis l'appli elle-même) —
// utilisée pour que la génération de PDF (genererPDFBase64) ait TOUJOURS cette police
// disponible instantanément, sans dépendre du chargement réseau de Google Fonts au moment
// précis de la génération (source d'un bug d'espacement/police déjà rencontré deux fois).
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

const EMPLOYEES = [{"n":"HASMI","p":"Yacine","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ABOU","p":"Ismail","r":"PABLO","po":"Plongeur","u":"CUISINE","h":35},{"n":"FERRAND","p":"Anthony","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":44},{"n":"DORSO","p":"Marie-Cécile","r":"INDIE BEACH","po":"Directeur","u":"SALLE","h":35},{"n":"DUFOUR","p":"Alexandre","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"FROMMHERZ","p":"Tristan","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"RIET","p":"Antoine","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":39},{"n":"ID HADDOUCH","p":"Réda","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":35},{"n":"RIBE","p":"Oceane","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"GUILLET","p":"Valentin","r":"PABLO","po":"Runner","u":"SALLE","h":35},{"n":"THOMAS","p":"Lou","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CARDONA DE MARINIS","p":"Camille","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BERNARD","p":"Camille","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BALLUET","p":"Arthur","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":35},{"n":"LOPIS","p":"Adrien","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":35},{"n":"HORVILLE","p":"Brice","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ANDRE","p":"Lisa","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Vestiaire","u":"SALLE","h":39},{"n":"IBANEZ","p":"Guilhem","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"LEBARILLIER","p":"Juliette","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":35},{"n":"SANTINI","p":"Yael","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"INZOUDINE","p":"Chaher","r":"CAFE FLORA","po":"Commis de Cuisine","u":"CUISINE","h":35},{"n":"LAROMIGUIÈRE","p":"Pierre-Alexandre","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":35},{"n":"ROBIN","p":"Lou","r":"CAFE FLORA","po":"COMMIS DE SALLE","u":"SALLE","h":35},{"n":"ROY","p":"Maiwen","r":"CAFE FLORA","po":"Runner","u":"SALLE","h":35},{"n":"BILLARD","p":"Thibault","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"BRAULT","p":"Nicolas","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"MANGER MONTALS","p":"Humberto","r":"CAFE DE L ORMEAU","po":"chef de cuisine","u":"CUISINE","h":42},{"n":"DE PADOVA","p":"Marcio","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LANCON","p":"Romain","r":"INDIE GROUP BUREAU","po":"Directeur","u":"SALLE","h":35},{"n":"BILLERY","p":"Éléonore","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"GARCIA","p":"Florian","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BEAUFRERE","p":"Herman","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"INNELLA","p":"Camila","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"CANTERA MORALES","p":"Magaly","r":"INDIE BEACH","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"AIRO","p":"Andrea","r":"INDIE BEACH","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"ANGLES","p":"Louis","r":"INDIE BEACH","po":"Chef Plagiste","u":"SALLE","h":42},{"n":"BELL","p":"Nathan","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":42},{"n":"BONNEVIE","p":"Cynthia","r":"INDIE BEACH","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"DUPON","p":"Romain","r":"INDIE BEACH","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"DAOUPHARS","p":"Mathieu","r":"INDIE BEACH","po":"Chef de Bar","u":"SALLE","h":42},{"n":"MSAHAZI","p":"Ousseine","r":"CAFE DE L ORMEAU","po":"Commis de Cuisine","u":"CUISINE","h":39},{"n":"SOULAIMANA","p":"Said","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"COMBEAU","p":"Vincent","r":"INDIE BEACH","po":"Chef de Bar","u":"SALLE","h":42},{"n":"DIAFAT","p":"Selim","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BOUAZZA","p":"Sâra","r":"PABLO","po":"Hotesse","u":"SALLE","h":42},{"n":"HANTZ","p":"Loane","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":35},{"n":"DOUX","p":"Clemence","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":42},{"n":"GRANET","p":"Romain","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"MACCHINI","p":"David","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":42},{"n":"BENICHOU","p":"Marine","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BIGORGNE","p":"Adrien","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":35},{"n":"GUELI","p":"Estefanía","r":"PABLO","po":"Patissier","u":"CUISINE","h":42},{"n":"KOSCIAREK","p":"Nicolas","r":"INDIE BEACH","po":"Manager","u":"SALLE","h":42},{"n":"PANES","p":"Stanislas","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"PORRE","p":"Lorin","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"CUARTERO","p":"Emmanuel","r":"PABLO","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"ANTUNES","p":"Léna","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"BOGLIETTI","p":"Mercedes","r":"CAFE FLORA","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"DUFOUR","p":"Nicolas","r":"CAFE FLORA","po":"Chef de Cuisine","u":"CUISINE","h":44},{"n":"GONZALEZ CARO","p":"Francisco","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"LILLOUX","p":"Matuanui","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":44},{"n":"SARKADI","p":"Zoltánné","r":"CAFE FLORA","po":"Plongeur","u":"CUISINE","h":44},{"n":"TERNES","p":"Camilla","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CARNEIRO","p":"Mélinda","r":"PABLO","po":"Directeur","u":"SALLE","h":35},{"n":"NEVES","p":"Jessica","r":"PABLO","po":"Manager","u":"SALLE","h":42},{"n":"FAZIO","p":"Luca","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ROUX","p":"Ange","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"THERY","p":"Elias","r":"INDIE BEACH","po":"Officier","u":"SALLE","h":42},{"n":"DUPERTHUY","p":"Jean","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"ATHOUMANI","p":"Azali","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"RIVET","p":"Maurine","r":"PLAYAMIGOS","po":"Directeur","u":"SALLE","h":42},{"n":"SOULAT","p":"Geoffrey","r":"PLAYAMIGOS","po":"Chef Plagiste","u":"SALLE","h":42},{"n":"DENIS","p":"Adrian","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"MONNIER","p":"Sebastien","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LEVY","p":"Corinne","r":"CAFE FLORA","po":"Directeur","u":"SALLE","h":44},{"n":"VALEMBOIS","p":"Ange","r":"PABLO","po":"Chef de Bar","u":"SALLE","h":42},{"n":"LE TOUX","p":"Aéla","r":"INDIE BEACH","po":"CONSEILLERE EN VENTE","u":"SALLE","h":35},{"n":"NIBEAUDEAU","p":"Solenne","r":"INDIE BEACH","po":"autres","u":"SALLE","h":35},{"n":"BENAT","p":"Alexia","r":"INDIE BEACH","po":"Caissière","u":"SALLE","h":42},{"n":"JEAN PIERRE","p":"Maëlle","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LEAL OSORIO","p":"Jesus Enrique","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LAURENT","p":"Margaux","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":42},{"n":"ABOUBACAR","p":"Kassim Mrenda","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"CALTAGIRONE","p":"Clement","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MARTINEZ VASQUEZ","p":"Francisco Leonel","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"VILLEDIEU","p":"Romane","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"CELIA","p":"Federico","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DUARTE","p":"Dwayne Lloyd","r":"PABLO","po":"Officier","u":"SALLE","h":42},{"n":"KOKA","p":"Victoria","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DENIS","p":"Alexis","r":"PABLO","po":"Barman","u":"SALLE","h":42},{"n":"DUFOUR","p":"Maxence","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"BELHADJ","p":"Adil","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"VILLARINI","p":"Julien","r":"CAFE FLORA","po":"pizzaiolo","u":"CUISINE","h":44},{"n":"KOGLER","p":"Theo","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LLOBERES","p":"Manon","r":"PABLO","po":"Barman","u":"SALLE","h":42},{"n":"ROUSSEL","p":"Fabien","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LANNOY","p":"Aurélien","r":"PLAYAMIGOS","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"ATTOUMANI","p":"Dilane","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":39},{"n":"SALAS","p":"Mickaël","r":"PLAYAMIGOS","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"BARRAGAN","p":"Paola","r":"PLAYAMIGOS","po":"Chef de Bar","u":"SALLE","h":42},{"n":"MALLEK","p":"Hadj","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"RADJABOU","p":"Soule","r":"PLAYAMIGOS","po":"Plongeur","u":"CUISINE","h":42},{"n":"FERRAH","p":"Claire","r":"PLAYAMIGOS","po":"Manager","u":"SALLE","h":42},{"n":"POLO","p":"Jean-Baptiste","r":"CAFE DE L ORMEAU","po":"Manager","u":"SALLE","h":42},{"n":"BAROUDI","p":"Mehdi Charles","r":"INDIE BEACH","po":"autres","u":"SALLE","h":42},{"n":"BENHADJ","p":"Kamil","r":"INDIE BEACH","po":"Agent Entretien","u":"SALLE","h":39},{"n":"LEGENDRE","p":"Sacha","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LOUSSOUARN","p":"Ahès","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":42},{"n":"RASZKOWSKI","p":"Noah","r":"PABLO","po":"Runner","u":"SALLE","h":42},{"n":"LASCHUCK","p":"Ahirton","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"GOMEZ","p":"Cristian","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MOLANO RIOS","p":"Leslie Tatiana","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":42},{"n":"LE BORGNE","p":"Maxime","r":"PABLO","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"SAID","p":"Faielledine Ben","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"BIANCHI","p":"Augusto","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"SANTONI","p":"Agathe","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DUMAS PELLECHIA","p":"Quentin","r":"PABLO","po":"Public Relation","u":"SALLE","h":24},{"n":"GNEBEHI","p":"Maellie","r":"PABLO","po":"Hotesse","u":"SALLE","h":42},{"n":"TRAMBAUD","p":"Maxence","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"GIRARD","p":"Alexis","r":"CAFE FLORA","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"CORBET","p":"Kathleen","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CHARLOT","p":"Alexandre","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"MOREL","p":"Sébastien","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BOCABEILLE","p":"Ilona","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"AMODIO","p":"Francesco Paolo","r":"CHERRY","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"RICCARDI","p":"Vito","r":"CHERRY","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"CARRILLO RAMIREZ","p":"Victor Hugo","r":"LA SAUVAGEONNE","po":"Chef de Cuisine","u":"CUISINE","h":35},{"n":"GALIONE","p":"Giusepe","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"GALIONE","p":"Gennaro","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BENECKO","p":"Alin","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DUJARDIN","p":"Maxime","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"MULLER","p":"Cyril","r":"LA SAUVAGEONNE","po":"Chef de Cuisine","u":"CUISINE","h":44},{"n":"SARRAT","p":"Paola","r":"CHERRY","po":"Directeur","u":"SALLE","h":42},{"n":"STRACH","p":"Sarah","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"ALI MOUSSA","p":"Anziz Habib","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":42},{"n":"GOUX","p":"Fabien","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LE PORZE","p":"Nathan","r":"CHERRY","po":"Chef de Bar","u":"SALLE","h":42},{"n":"BLANC","p":"Thomas","r":"LA SAUVAGEONNE","po":"Manager","u":"SALLE","h":44},{"n":"VERNAT","p":"Guillaume","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":39},{"n":"DERRARIDJ","p":"Fabien","r":"CAFE FLORA","po":"pizzaiolo","u":"CUISINE","h":44},{"n":"HIRET","p":"Salomé","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":35},{"n":"MORELLO","p":"Lenny","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":42},{"n":"SOTO MUNOZ","p":"Lliuvashka","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"PESTY","p":"Heloise","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"MALO","p":"Julien","r":"CAFE DE L ORMEAU","po":"Chef de Bar","u":"SALLE","h":39},{"n":"BRANDO RUBIANO","p":"Maria Camila","r":"PLAYAMIGOS","po":"Patissier","u":"CUISINE","h":42},{"n":"HELLER","p":"Emma","r":"CHERRY","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"MANENT","p":"Maëna","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"GUEMBOU","p":"Gwenaëlle","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"KAYA","p":"Axel","r":"LA SAUVAGEONNE","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"TANG","p":"Chhunhay","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"VIRET","p":"Kevin","r":"INDIE BEACH","po":"Manager","u":"SALLE","h":42},{"n":"BOULAY","p":"Ariane","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"FERNANDEZ GOMEZ","p":"Agustin","r":"INDIE BEACH","po":"Commis de cuisine","u":"CUISINE","h":42},{"n":"SEIBANE","p":"Silvana","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BOEUF","p":"Etienne","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DESMEDT","p":"Guillaume","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"FABRE","p":"Mathis","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"IBRAHIMA","p":"Zidani","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":39},{"n":"MOUIGNI","p":"Kassim","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"ANESSI","p":"Abel","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"LAMY","p":"Hugo","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"ORIGET","p":"Anais","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":44},{"n":"ROUDERGUES","p":"Cezanne","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":39},{"n":"PROCHASSON","p":"Maelle","r":"LA SAUVAGEONNE","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"SOMNARD","p":"Thomas","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LESELLIER","p":"Marine","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":42},{"n":"BOMSEL","p":"Charles-Elie","r":"LA SAUVAGEONNE","po":"Sommelier","u":"SALLE","h":35},{"n":"CHIQUET","p":"Manon","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":42},{"n":"BENOIT","p":"Joffrey","r":"PLAYAMIGOS","po":"Commis de Bar","u":"SALLE","h":35},{"n":"DE VINCENTI MENNA","p":"Franco","r":"INDIE BEACH","po":"Demi chef de partie","u":"CUISINE","h":42},{"n":"AVILEZ SANTANA","p":"Oscar","r":"INDIE GROUP BUREAU","po":"CHEF EXECUTIF","u":"CUISINE","h":35},{"n":"DHIB","p":"Kheira","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"MOUZON","p":"Justin","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":42},{"n":"COLLINET","p":"Sarah Marie","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CAILLOL","p":"Margot","r":"CHERRY","po":"Barman","u":"SALLE","h":42},{"n":"LUFTMAN","p":"Louis","r":"INDIE GROUP BUREAU","po":"RESPONSABLE MARKETING","u":"SALLE","h":39},{"n":"BAKAR","p":"Yanisse","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BARNA","p":"Yan","r":"INDIE BEACH","po":"Demi Chef de Partie","u":"CUISINE","h":42},{"n":"TCHOUPE","p":"Lenny","r":"INDIE BEACH","po":"autres","u":"CUISINE","h":42},{"n":"VILLAMOR","p":"Victor","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"KHERRAZ","p":"Mohamed","r":"CHERRY","po":"Runner","u":"SALLE","h":39},{"n":"LELUAN","p":"Leïla","r":"LA SAUVAGEONNE","po":"Patissier","u":"CUISINE","h":44},{"n":"MAILLARD","p":"Jules","r":"INDIE BEACH","po":"Commis de Bar","u":"SALLE","h":42},{"n":"LE TRIONNAIRE","p":"Leo","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":39},{"n":"GOBIN","p":"Mathis","r":"INDIE BEACH","po":"Sommelier","u":"SALLE","h":42},{"n":"NGUYEN","p":"Lou","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"DO ROSARIO","p":"Franco","r":"INDIE BEACH","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"COURIAUD","p":"Yanis","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CARVIN","p":"Sofiane","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"RAMIREZ PLATA","p":"Franyuly Maritza","r":"PABLO","po":"Patissier","u":"CUISINE","h":42},{"n":"FRANCO MENDES","p":"Tiago","r":"INDIE BEACH","po":"Commis de Bar","u":"SALLE","h":39},{"n":"MIQUEL","p":"Ornella","r":"CAFE FLORA","po":"Commis de Salle","u":"SALLE","h":35},{"n":"RENAUX","p":"Tom","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CELESTINE","p":"Adrien","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":35},{"n":"PERADEL","p":"Nathan","r":"CAFE DE L ORMEAU","po":"Sommelier","u":"SALLE","h":35},{"n":"BOURGOIS","p":"Gael","r":"INDIE BEACH","po":"Directeur","u":"SALLE","h":42},{"n":"BALBI SABARROS","p":"Noelia","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":42},{"n":"DABOVE LÓPEZ","p":"Gaston","r":"INDIE BEACH","po":"Chef de Cuisine","u":"CUISINE","h":44},{"n":"GRANDVOINET","p":"Gilles","r":"CAFE DE L ORMEAU","po":"Chef de Cuisine","u":"CUISINE","h":35},{"n":"RALLO","p":"Alexandre","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"ELSENSOHN","p":"Jade","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":42},{"n":"BAL","p":"Sébastien","r":"PLAYAMIGOS","po":"Officier","u":"SALLE","h":35},{"n":"TERMELLIL","p":"Tarek","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":44},{"n":"BIRD","p":"Kelly","r":"INDIE BEACH","po":"Conseillère de vente","u":"SALLE","h":35},{"n":"KHENOUCHE","p":"Ademe","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"PEZZULLI","p":"Gianni","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":42},{"n":"BONEVIE","p":"Cynthia","r":"INDIE BEACH","po":"Chef Hotesse","u":"SALLE","h":44},{"n":"TITEUX","p":"Dylan","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"HARDUIN","p":"Romane","r":"PLAYAMIGOS","po":"Hotesse","u":"SALLE","h":42},{"n":"NEVES","p":"Marie","r":"INDIE BEACH","po":"Caissière","u":"SALLE","h":44},{"n":"ACHIKIAN","p":"Justine","r":"PLAYAMIGOS","po":"Manager","u":"SALLE","h":44},{"n":"ICHAMBE","p":"Marie","r":"CAFE DE L ORMEAU","po":"Manager","u":"SALLE","h":44},{"n":"RIVIERE","p":"Aurelien","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":39},{"n":"JULIEN","p":"Lucas","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"BOUZNAD","p":"Hamza","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"DE VASCONCELOS","p":"Margot","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":35},{"n":"MARTIN","p":"Thibaut","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"PETRUCHELLI","p":"Philippe","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"POLO","p":"Jean Baptiste","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"DENURA","p":"Frédéric","r":"PLAYAMIGOS","po":"Chef de Bar","u":"SALLE","h":44},{"n":"PASQUINI","p":"Noah","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LAQUET","p":"Alexis","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"CHICHE","p":"Benjamin","r":"CHERRY","po":"Directeur","u":"SALLE","h":35},{"n":"BORDJIBA","p":"Abdelkarim","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"CAPPODANNO","p":"Lisa","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":39},{"n":"NASSERDINE","p":"Ahamed","r":"LA SAUVAGEONNE","po":"Plongeur","u":"CUISINE","h":39},{"n":"QUENET","p":"Lisa","r":"INDIE GROUP BUREAU","po":"assitante administrative","u":"SALLE","h":44},{"n":"PALOMO DEL RIO","p":"Serge","r":"CHERRY","po":"chef de bar","u":"SALLE","h":42},{"n":"BEY","p":"Hugo","r":"CHERRY","po":"Manager","u":"SALLE","h":42},{"n":"EL KENOUNI BOUSBAA","p":"Soumia","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"MAHAMADOU","p":"Bathily","r":"CHERRY","po":"commis de salle","u":"SALLE","h":42},{"n":"GOSALBES","p":"Lauriane","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ZANCHI","p":"Magali Luz","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CHOUCHANE","p":"Mathis","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":35},{"n":"SELOUANE","p":"Aissa","r":"CHERRY","po":"Runner","u":"SALLE","h":42},{"n":"OLAZ","p":"Johana Nerea Eugenia","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"GODET DES MARAIS","p":"Marine","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"SOUMARE","p":"Yaya","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":35},{"n":"TCHAKO","p":"Aissata","r":"CHERRY","po":"Hotesse","u":"SALLE","h":42},{"n":"GUILLEMIN","p":"Oscar","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ABOUMADI","p":"Mohamed","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"DIALLO","p":"Moussa","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":35},{"n":"RODRÍGUEZ ALARCON","p":"Felipe Andres","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MORENO LOPEZ","p":"Ricardo Israel","r":"CHERRY","po":"Commis de Cuisine","u":"CUISINE","h":35},{"n":"MAUREIRA CHANDÍA","p":"Sebastián Nickolas","r":"CHERRY","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"AZZARA","p":"Sofia","r":"CHERRY","po":"cheffe hotesse","u":"SALLE","h":42},{"n":"MISSONSA","p":"Rohann","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"LASSALLE","p":"Benoit","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"COLIN","p":"Jeremie","r":"CHERRY","po":"Chef de Bar","u":"SALLE","h":42},{"n":"COURTHIEU","p":"Gregoire","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"OUAKKA","p":"Ihsan","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BERTIN","p":"Julie","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":39},{"n":"GARAVAGLIA","p":"Alessandro","r":"PABLO SAINT BARTH","po":"Sommelier","u":"SALLE","h":42},{"n":"HEBRARD","p":"Florian","r":"PABLO SAINT BARTH","po":"Manager","u":"SALLE","h":42},{"n":"REYES","p":"Prince-Zyrose","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MARCEL","p":"Julien","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BRISBOUT","p":"Thomas","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"CUXAC","p":"Daniel","r":"PABLO SAINT BARTH","po":"Chef de Bar","u":"SALLE","h":42},{"n":"CESPITES","p":"Benjamin","r":"PABLO SAINT BARTH","po":"Chef de partie","u":"CUISINE","h":42},{"n":"MOLINIER","p":"Alexandre","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BEAL","p":"Faustine","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"PANIZZA STAIANO","p":"Facundo Alejo","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DAVIS","p":"Carmen Luisa","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":42},{"n":"MATHIEU","p":"Paul","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"TROIANO PALUMBO","p":"Naomi","r":"PABLO SAINT BARTH","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"KAPELA","p":"Adonis","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"VINCENT","p":"Margot","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":42},{"n":"SUD","p":"Gabin","r":"PABLO SAINT BARTH","po":"Runner","u":"SALLE","h":35},{"n":"OPALA","p":"Romain","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BADACHE","p":"Sophian","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"REY","p":"Benjamin","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef de Bar","u":"SALLE","h":42},{"n":"IDRISSI","p":"Khalid","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CARVAJAL MOLANO","p":"Elides","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"BOCHARD","p":"Marsile","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CRAPOULET","p":"Marine","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LEGER","p":"Ella","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"BASTERRICA","p":"Camila Aylen","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BERNAT","p":"Emma","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BONAVENTURE","p":"Margaux","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"FERNANDEZ","p":"Noah","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Runner","u":"SALLE","h":39},{"n":"LANGLOIS","p":"Arthur","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Commis de Salle","u":"SALLE","h":39},{"n":"ZOFFOLI","p":"Carla","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Commis de Salle","u":"SALLE","h":39},{"n":"BARBERO DE LUCAS","p":"Manuel","r":"PABLO SAINT BARTH","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"LEPORI","p":"Gianluca","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CESAIRE","p":"Joris","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BELLEVUE","p":"Bervirson","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BERNARDINI","p":"Theo","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"COQUILLAS","p":"Randy","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"PAMBOU","p":"Kimberley","r":"CHERRY","po":"Hotesse","u":"SALLE","h":42},{"n":"HENRY","p":"Ricardo","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"REGNAULD","p":"Pacome","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":44},{"n":"NADHOIM","p":"Youssouf","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"JUAN ALBERTO","p":"Rincón Paez","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"FORTILLIEN PEDRO","p":"Maria","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"SAHOUI","p":"Julian","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"SAID","p":"Ibrahim","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":39},{"n":"DESESSARD","p":"Alexis","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"DEVIANNE","p":"Raphael","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BRANDO","p":"Maria Camila","r":"PLAYAMIGOS","po":"Patissier","u":"CUISINE","h":44},{"n":"SCHWARTZ","p":"Adryan","r":"CAFE DE L ORMEAU","po":"Commis de Cuisine","u":"CUISINE","h":39},{"n":"GAËL","p":"Martin","r":"INDIE GROUP BUREAU","po":"autres","u":"SALLE","h":35},{"n":"LEBARRILIER","p":"Juliette","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":39},{"n":"CARRIER","p":"Jules","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":35},{"n":"SANTAMARIA","p":"Nolan","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"ALEM","p":"Elyes","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":39},{"n":"HERRERO","p":"Allison","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MEROLLE","p":"Sophie","r":"CAT CLUB","po":"Chef de Rang","u":"SALLE","h":42},{"n":"TELMAT","p":"Marine","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BEGUIN","p":"Antoine","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"QUD","p":"Gabin","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"ST PAUL","p":"Guilhem","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"REYTINAT-HARDOUIN","p":"Alice","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BARTHELEMY","p":"Anaïs","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"NYANG","p":"Ebrima","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"NKOLO","p":"Theodore","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CHARLES","p":"Alexis","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":42},{"n":"LABUNETS","p":"Anatolii","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Runner","u":"SALLE","h":35},{"n":"SELLAM","p":"Alexis","r":"CAT CLUB","po":"Officier","u":"SALLE","h":42},{"n":"SORRESSO","p":"Davide","r":"PABLO SAINT BARTH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"POLANCO","p":"Roberto","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"COMBE","p":"Baptiste","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"ADAM","p":"Paul","r":"CAT CLUB","po":"Commis de Bar","u":"SALLE","h":35},{"n":"LEGOUVERNEUR","p":"Tommy","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"ROMAIN","p":"Panabieres","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"SAFFIOTI","p":"Gianni","r":"CAT CLUB","po":"Chef de Rang","u":"SALLE","h":35},{"n":"VAN MOE","p":"Andrea","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"POLANCO PALMA","p":"Celina","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"LAFRANCE","p":"Guillaume","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"GARCIA MENDOZA","p":"Miguel Angel","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"DOERN","p":"Léa","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"ARAUJO","p":"Audrey","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":39},{"n":"ARANDELOVIC","p":"Sasa","r":"CHERRY","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"PROST","p":"Matthieu","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"NUSSBAUM","p":"Samuel","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"GESMUNDO","p":"Francesca","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"DURST","p":"Lilou","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"THOMAS","p":"Sarah","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Sommelier","u":"SALLE","h":39},{"n":"BISSOLY","p":"Jordan","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"WANN","p":"Zenab","r":"CHERRY","po":"Sommelier","u":"SALLE","h":42},{"n":"BEGUIN","p":"Naïs","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"RAKOTOSAONA","p":"Fitia","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"ROMANO","p":"Mattia","r":"CHERRY","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"FOGTMAN","p":"Ayrton","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":44},{"n":"DABOVE LÓPEZ","p":"Gastón","r":"INDIE GROUP BUREAU","po":"Chef de Cuisine","u":"CUISINE","h":35},{"n":"ZAGHDOUD","p":"Mourad","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"NDIAYE","p":"Hamidou","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":39},{"n":"SOMAN","p":"Saha","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"GODARD","p":"Andy","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BENEDETTI","p":"Aurelia","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LOUGASSI","p":"Mano","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":44},{"n":"MOREL","p":"Sebastien","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":44},{"n":"ROTA","p":"Anthony","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"FRANGEUL","p":"Lea","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"FRIH","p":"Majid","r":"INDIE BEACH","po":"Officier","u":"SALLE","h":44},{"n":"FLESCHEN","p":"Zoé","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"GAITAN","p":"Santiago","r":"CAFE FLORA","po":"Cuisinier","u":"CUISINE","h":42},{"n":"MENDEZ","p":"Yojan Alexander","r":"CHERRY","po":"Patissier","u":"CUISINE","h":42},{"n":"GAUCHAT","p":"Claudia","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"COSTANZA","p":"Paul","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"ROSSO UGO","p":"Sacha","r":"PLAYAMIGOS","po":"Commis de Bar","u":"SALLE","h":39},{"n":"LUNT","p":"Malachi","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":44},{"n":"DERVIEAU CAPELLE","p":"Margot","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":39},{"n":"BERNARD","p":"Angelys","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":44},{"n":"AUGUSTE","p":"Lukas","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"LAMBERTI","p":"Tom Pablo César","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"COMPAIN","p":"Ludovic","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":39},{"n":"GHIRINGHELLI","p":"Joaquin","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"PETKOVIC","p":"Milosav","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"CORNILLON","p":"Victor","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"LAMBERTON","p":"Robinson","r":"PLAYAMIGOS","po":"Officier","u":"SALLE","h":39},{"n":"MUTEL","p":"Hugo","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"HOUCINI","p":"Yanis","r":"INDIE GROUP BUREAU","po":"CONTROLE DE GESTION","u":"BUREAU","h":42},{"n":"EVRAD","p":"Clara","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"KERANGUYADER","p":"Thomas","r":"CAFE FLORA","po":"Manager","u":"SALLE","h":42},{"n":"LOMBARDI","p":"Cloe","r":"CAFE FLORA","po":"Manager","u":"SALLE","h":42},{"n":"LEBARRILLIER","p":"Juliette","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":44},{"n":"RIVIERE","p":"Jules","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"PERES","p":"Guillaume","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"TROIN","p":"Agathe","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":39},{"n":"SANCHEZ-PASTOR AYLLON","p":"Victoria Qianlu","r":"CHERRY","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BOULASSEL","p":"Abdelfettah","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"REVERTE","p":"Jordan","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":44},{"n":"ORLA","p":"Lily-Rose","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":44},{"n":"GOMEZ MONTES","p":"Maria Del Pilar","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"GHARSALLAH","p":"Adem","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":42},{"n":"AMON","p":"Eloge Ferdinand","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"REDER","p":"Jean Charles","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"ROSANO","p":"Emma","r":"CHERRY","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"MENNEA","p":"Salvatore","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":44},{"n":"SERRE","p":"Candice","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BARBIER","p":"Anna","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LA RANA","p":"Andrea","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"LAGACHE","p":"Marine","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":44},{"n":"AHMED","p":"Harouna","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":39},{"n":"MICHALLAT","p":"Julie","r":"INDIE BEACH","po":"Agent d'entretien","u":"SALLE","h":39},{"n":"VESELOVSKYI","p":"Vitalii","r":"INDIE GROUP BUREAU","po":"intendant","u":"SALLE","h":35},{"n":"PALUSSIÈRE","p":"Alexis","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"TREMOULET PAJOT","p":"Malou","r":"PLAYAMIGOS","po":"Hotesse","u":"SALLE","h":35},{"n":"ESTEVE","p":"Guillaume","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":35},{"n":"TAGANZA","p":"Yassine","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":42},{"n":"CURTIL","p":"Paul","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"GARAVAGLIA","p":"Gloria","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":35},{"n":"MACAULEY","p":"Tara","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"MAURETTE","p":"Oscar","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LAVEDER","p":"Laurette","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"POLLIER","p":"Bastien","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":35},{"n":"FALCOZ","p":"Costin","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"BIOLLEY","p":"Lola","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"HAMIDOU","p":"Chiraz","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":39},{"n":"JULIAN DELALANDE","p":"Axel","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"LAMRI","p":"Ahmed","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LO","p":"Maeva Gueda","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CARBONE","p":"Sonny","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":39},{"n":"VENEGAS MARISCAL","p":"Rodolfo Ignacio","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"ARCHERAY LEBLOND","p":"Clara","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"PICARD","p":"Laure","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"BODIN","p":"Victor","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"MARCON","p":"Mathis","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"FRANCO MENDES","p":"Ricardo","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":35},{"n":"GARCIA","p":"Remi","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"PLAYOUST","p":"Gabin","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"CANTERA","p":"Magaly","r":"INDIE BEACH","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"DELORME","p":"Elisa","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CHAILLOU","p":"Marianne","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":42},{"n":"ANTONA","p":"Jean Dominique","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"DRODE","p":"Axel","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LE VERGE—SERANDOUR","p":"Ewenn","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BELASCO","p":"Pierre","r":"CHERRY","po":"Sommelier","u":"SALLE","h":44},{"n":"FERAY","p":"Gregory","r":"CHERRY","po":"Patissier","u":"CUISINE","h":44},{"n":"DEDIEU","p":"Loan","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"GUITTON","p":"Mathilde","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":39},{"n":"DUMAS","p":"Edouard","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"JARDSON GESMAR","p":"Junior Frederico","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BEEDASSY","p":"Mathea","r":"LA SAUVAGEONNE","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"ORIGET","p":"Anaïs","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":42},{"n":"SAQUET","p":"Fanny","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BAUDINO","p":"Eliza","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":42},{"n":"DUBOYS DE LABARRE","p":"Andreas","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"BORDERES","p":"Célia","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"LEGRIER","p":"Aurore","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":44},{"n":"TOSTO","p":"Alexandre","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ROUMLY","p":"Charif","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":39},{"n":"ARNAL","p":"Noe","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":42},{"n":"SMAILI","p":"Eva","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":42},{"n":"VERDIER","p":"Sadio","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"DESBIENS","p":"Lhone","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":35},{"n":"DI MAGGIO","p":"Yaron","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BERTUCCI","p":"Mickaël","r":"CHERRY","po":"Runner","u":"SALLE","h":39},{"n":"ANDRADE","p":"Adriana","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DAGUIER","p":"Rebecca","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"GODET","p":"Melina","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"DI CARMINE","p":"Julia","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"HATTON","p":"Lucy","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"ROUAG","p":"Morad","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"TADDEI","p":"Maxime","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"BLANCKAERT","p":"John","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":42},{"n":"DELFOSSE","p":"Oriane","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":35},{"n":"DJAI","p":"Manola","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":39},{"n":"CHARTIER","p":"Jean","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":42},{"n":"COLLINET","p":"Sarah","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"RIJO SOARES","p":"Aloice","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"WEHRLEN","p":"Romane","r":"INDIE BEACH","po":"autres","u":"SALLE","h":35},{"n":"BORNEUF","p":"Rose","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":42},{"n":"ABOUBACAR","p":"Kassim","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":44},{"n":"GOMES","p":"Angelique","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":44},{"n":"ALAIN","p":"Dubois","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"ID HADDOUCH","p":"Reda","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":39},{"n":"COSTA","p":"Noa","r":"CAFE FLORA","po":"Commis de Salle","u":"SALLE","h":35},{"n":"ALCAMO","p":"Marie","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":44},{"n":"PETIT","p":"Fiona","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"GALIBERT","p":"Rudy","r":"LA SAUVAGEONNE","po":"Directeur","u":"SALLE","h":35},{"n":"MEIGNAN","p":"Pablo","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":35},{"n":"PRES","p":"Sofiia","r":"PABLO","po":"Agent d'entretien sanitaire","u":"SALLE","h":35},{"n":"DESIGAUX","p":"Clemence","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MAURETTE","p":"Lucas","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":35},{"n":"ALDA","p":"Manon","r":"CAT CLUB","po":"Hotesse","u":"SALLE","h":35},{"n":"BOURDIN","p":"Corentin","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Barman","u":"SALLE","h":35},{"n":"BOUCHAREYCHAS","p":"Romain","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"BUCCI","p":"Chiara","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DEROUGEMONT","p":"Maxime","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MULLER","p":"Mathilde","r":"PABLO","po":"autres","u":"SALLE","h":35},{"n":"DESACHY","p":"Marion","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"GINOUX","p":"Andrea","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"LAJOUS","p":"Karine","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"POINSOT","p":"Eddy","r":"CHERRY","po":"Barman","u":"SALLE","h":35},{"n":"GOMEZ GAMEZ","p":"Eduard","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MARIOTTI","p":"Carla-Marie","r":"CAT CLUB","po":"Hotesse","u":"SALLE","h":35},{"n":"NADAUD","p":"Lisa","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"LOPEZ CRUZ","p":"Vanessa Carolina","r":"CAFE DE L ORMEAU","po":"Cuisinier","u":"CUISINE","h":35},{"n":"MANDIN","p":"Nathanael","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"NGUYEN","p":"Kim Lorelei","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"AGOSTINHO","p":"Mikael","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"CHAWKI","p":"Walid","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"CRISTI","p":"Giovanni","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"DESBRUGERES","p":"Paul","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"COUCHOT","p":"Olivier","r":"CHERRY","po":"Barman","u":"SALLE","h":35},{"n":"FORTILIEN PEDRO","p":"Maria Altagracia","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"GIGANTE","p":"Diane","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"RAUFASTE","p":"Lola","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"JOSEPH","p":"Anton","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"BELINGO","p":"Donatien","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"HOUNET","p":"Gabriel","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"KALAYCI","p":"Timucin","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"LEBASTARD","p":"Noe-Baltazar","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"REINERTZ","p":"Mélody","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"SAINTINI","p":"Kevin","r":"LA SAUVAGEONNE","po":"Cuisinier","u":"CUISINE","h":35},{"n":"CHENNIT","p":"Adam","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MICHEL","p":"Denis","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":35},{"n":"GÜELI","p":"Estefania","r":"PABLO","po":"Patissier","u":"CUISINE","h":35},{"n":"COLLART","p":"Ines","r":"PABLO SAINT BARTH","po":"Hotesse","u":"SALLE","h":35},{"n":"LOMBARD","p":"Daniel","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":35},{"n":"WARDI","p":"Inès","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":35},{"n":"AYAD","p":"Sabrina","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BARBAS","p":"Charlize","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"TOMAS","p":"Lola","r":"CAT CLUB","po":"autres","u":"SALLE","h":35}];

// Correspondance salarié -> PayFit (colonne "Identifiant (ne pas modifier)" + "Matricule"),
// construite à partir des fichiers d'import fournis par le manager. Clé = idSalarie(e),
// valeur = [identifiant, matricule]. Un salarié absent d'ici (nouveau, pas encore
// synchronisé côté PayFit, ou homonyme ambigu comme "Eddy POINSOT"/"Alexis CHARLES" qui a
// deux identifiants PayFit différents) sera signalé par l'export pour saisie manuelle.
const PAYFIT_IDS = {"BENECKO_Alin":["69ddf8f996c38711f2319d79",""],"BILLERY_Éléonore":["69b96dd04f1bd92493b0fb3f","00080"],"CHARLES_Alexis":["6a47e143b0bb95dbf583c557",""],"DUJARDIN_Maxime":["69ddfb467730d969e7caa064",""],"GARCIA_Florian":["69b96dcf6cd98826b8c07e70","00073"],"IBRAHIMA_Zidani":["6a15cbe6e1f96ebc1e9ffa8a",""],"LASCHUCK_Ahirton":["69cd1e33344268b7c10b7928",""],"LEAL_OSORIO_Jesus_Enrique":["69cd188940524c383bb031f8",""],"MALO_Julien":["6a01da5dceba57ae8e2df32c",""],"MANGER_MONTALS_Humberto":["69b96dd170200820c2e3e615","00075"],"MSAHAZI_Ousseine":["69c402f594c4c492a667ccef",""],"PERADEL_Nathan":["6a26f4f763522a6eb19701e3",""],"PESTY_Heloise":["69f4bcbe456f4d84484346aa",""],"POLO_Jean-Baptiste":["69ce24a3d066277d69faedca",""],"POLO_Jean_Baptiste":["69ce24a3d066277d69faedca",""],"SOTO_MUNOZ_Lliuvashka":["69f070ea34749ad27aa480bb",""],"VERNAT_Guillaume":["69ddfd66276b617b879dcc79",""],"VILLEDIEU_Romane":["69cd1274fd240200e99dc7db",""],"ALI_MOUSSA_Anziz_Habib":["69f9f722c8d9c25bc1e1d10d",""],"AMODIO_Francesco_Paolo":["69f0aaa47915b3c7e9b2ef47",""],"BARBAS_Charlize":["6a3acaa681f1036696eef3d5",""],"CAILLOL_Margot":["69fb4f58f87cb34f5bff5e4f",""],"COLLINET_Sarah_Marie":["69fb4cbfe79fd721cad85eb2",""],"GALIONE_Giusepe":["6a01df044560f9ec876798b5",""],"HELLER_Emma":["69fb4af2c8d3fe0d0f111ab6",""],"KHERRAZ_Mohamed":["69fb558ce79fd721cad85ebc",""],"LE_PORZE_Nathan":["69fc40a256ccd19564739dba",""],"LEGENDRE_Sacha":["6a1d552f57deece9d155cf50",""],"PERES_Guillaume":["69fb52f24d804c5fb4e3eb6a",""],"RICCARDI_Vito":["69e5e54c752bf002c8d577f2",""],"SANCHEZ-PASTOR_AYLLON_Victoria_Qianlu":["6a1045c2ccc367d1fbd4d4e8",""],"SANTONI_Agathe":["6a1d591ebd8b9f07acfe7195",""],"SARRAT_Paola":["69f9f3dbf0d888dc648da53e",""],"TAGANZA_Yassine":["69fb5751e79fd721cad85ebe",""],"ARANDELOVIC_Sasa":["69c13e3794f947cdcc9c49ee","00090"],"MAHAMADOU_Bathily":["69c13e1ef6505ab1d03c03b8","00007"],"BEGUIN_Naïs":["69c13e371c6f2bc960592dd9","00094"],"BISSOLY_Jordan":["69c13e33728e4baf2624bb21","00085"],"CHICHE_Benjamin":["69c13e1f94f947cdcc9c49ec","00001"],"COLIN_Jeremie":["69c13e33728e4baf2624bb1f","00010"],"COUCHOT_Olivier":["6a4fc3e6b7370f7011261c35",""],"LAVEDER_Laurette":["69e8d95c1fd97f922aa75fd2",""],"PAMBOU_Kimberley":["69c13e345dedacd51c89fad1","00086"],"POINSOT_Eddy":["6a4e04500f1caeaa9e510f34",""],"RAKOTOSAONA_Fitia":["69c13e37e6032e3165cb7681","00097"],"ROMANO_Mattia":["69c13e374d13a29eb26f1079","00096"],"ROSANO_Emma":["69e8d604bed25bc8b1883e8f",""],"SOMAN_Saha":["69c2631df3baaacfbe39c065",""],"SOUMARE_Yaya":["69c13e1e885e7ea80a4e1488","00070"],"THOMAS_Sarah":["69c18ab20ea22fa6b1af8e1b",""],"AIRO_Andrea":["69c2a8a3aad38037c1e78ca3",""],"ANGLES_Louis":["69c2b408aad38037c1e78ca5",""],"ATHOUMANI_Azali":["69f2f1e6645d4b5f5c9d7e5f",""],"BAKAR_Yanisse":["69f0868e52275daea5c2aac3",""],"BALBI_SABARROS_Noelia":["6a2003e4e42c557c874adb36",""],"BARNA_Yan":["69fafee974e9fd91cacb6af0",""],"BELL_Nathan":["69c2b6062e4a4ca7d0faa5dd",""],"BENAT_Alexia":["69dcb4e9485f68696e8b45f8",""],"BENHADJ_Kamil":["69f08a23787fab7a88bba3da",""],"BERNARD_Camille":["69f07eae8f81955dd9e8ea8f",""],"BIANCHI_Augusto":["69dce29718207ba172840afa",""],"BONNEVIE_Cynthia":["69e760c45a9d0dc821cffe0f",""],"BOURGOIS_Gael":["69e5e4bec382f66debb700a8","00029"],"BRAULT_Nicolas":["6a219339670d3d09e009243f",""],"CALTAGIRONE_Clement":["69dcf94a0ff431172ebdb11a",""],"CANTERA_MORALES_Magaly":["69c2b0e97eb1a6cbf2ed00a3",""],"CARDONA_DE_MARINIS_Camille":["69dcdfc6327fd5278b7c09d4",""],"CARRIER_Jules":["6a31755fa83520ef6cc480a7",""],"CELIA_Federico":["69dceeec5ba4233f4a3aca85",""],"COMBEAU_Vincent":["69dcba5ed66455c514ebd424",""],"DAOUPHARS_Mathieu":["69cceadd84af2040c254b5e1",""],"DE_PADOVA_Marcio":["69dcf3b715fb83517c95ca73",""],"DENIS_Adrian":["69dcb0cfca2a18163e8f241e",""],"DIAFAT_Selim":["69dcf6d063a558f2ea24308d",""],"DORSO_Marie-Cécile":["69c274fdc50b52d2e63912ec","00002"],"DOUX_Clemence":["69dcbc9690c3b810058622ab",""],"DUBOYS_DE_LABARRE_Andreas":["6a461d008e4a8486c86bca2b",""],"DUFOUR_Alexandre":["69dca485f00063ef68f62b01",""],"DUPERTHUY_Jean":["69dcf16263a558f2ea243081",""],"DUPON_Romain":["69ca479bdc229c07e2500004",""],"ESTEVE_Guillaume":["6a326703d135a9b454ac2886",""],"FERNANDEZ_GOMEZ_Agustin":["69faf3f0ee0c0f55b5b7cf8b",""],"FOGTMAN_Ayrton":["6a317b122bc3257e6efd4942",""],"FRANCO_MENDES_Tiago":["6a2196bd803dbde9c4891d72",""],"FRANCO_MENDES_Ricardo":["6a454cfbef404bb879537a97",""],"FROMMHERZ_Tristan":["69dca1c40b8557695082a57e",""],"GARAVAGLIA_Gloria":["6a32644cba050b69d8bd13d0",""],"GOBIN_Mathis":["6a2185753a612dd78a34c8de",""],"GOMES_Angelique":["6a32608d02446fe84977a07c",""],"GOMEZ_Cristian":["69f4afedd8248ed77dfc7195",""],"GRANET_Romain":["69dcac5e8bc0e04e01054a29",""],"HORVILLE_Brice":["69f085288c3a48756ce6ad05",""],"JEAN_PIERRE_Maëlle":["69dcdc55fd65dfcee6438758",""],"KOSCIAREK_Nicolas":["69dc9d6f5e165ff5ff4e0542",""],"LAFRANCE_Guillaume":["6a219f6e3fbbf8387394c536",""],"LAURENT_Margaux":["69dce5e2a21942035527750d",""],"LE_TOUX_Aéla":["69e627ce7d69770b510b9f6b",""],"LE_TRIONNAIRE_Leo":["6a218c8065c01d77ff774ace",""],"LEGER_Ella":["6a3cd7ab927ccacc00691629",""],"LESELLIER_Marine":["69f080fd7cd1a96d7b549380",""],"MAILLARD_Jules":["6a21899663c7f3ac995b6bf7",""],"MANENT_Maëna":["69de39c480b9a9a243bdfaf7",""],"MARTINEZ_VASQUEZ_Francisco_Leonel":["69dce8fc15fb83517c95ca63",""],"MAURETTE_Lucas":["6a3eacc87065694052ed73b2",""],"MOLANO_RIOS_Leslie_Tatiana":["69f20f3fc171d45b6d2ee0d4",""],"MOUIGNI_Kassim":["69f092eb5e0c66bf8e93dcb5",""],"NIBEAUDEAU_Solenne":["69e5f5cefdda543d227b8c3e",""],"PANES_Stanislas":["69dcb23c588136f092095176",""],"PORRE_Lorin":["69dcaa1d669fa0d6ecec65e6",""],"RALLO_Alexandre":["6a267f28e7915e3b61cf4dea",""],"RENAUX_Tom":["6a219b49803dbde9c4891d78",""],"RIBE_Oceane":["69dca65b80f883d1a91d1c21",""],"ROUX_Ange":["69dcaf40452ff1b882298572",""],"SAID_Faielledine_Ben":["69f0835586fd327d5a0735e7",""],"SEIBANE_Silvana":["69faf9bb9691a103a283a6f2",""],"SOULAIMANA_Said":["69dced0515fb83517c95ca69",""],"TCHOUPE_Lenny":["69de3ef83fe03cd459e792a4",""],"TELMAT_Marine":["6a31725c2bc3257e6efd493e",""],"THERY_Elias":["69e778fe0dd2d9caf229c94e",""],"VILLAMOR_Victor":["69de37bfe455e8d35ae183c7",""],"VIRET_Kevin":["69f303a835ebf4bfddc8fc4b",""],"NASSERDINE_Ahamed":["69faef625e78c9363305e8f4",""],"ANDRE_Lisa":["6a3e4881f34e0a719f364a5b",""],"ARNAL_Noe":["6a05a9fdb81eb5a78be145fd",""],"BASTERRICA_Camila_Aylen":["69f9ea649b25888e71033a77",""],"BEEDASSY_Mathea":["69fcd818584065644e8186fd",""],"BERNAT_Emma":["69fb0e4402ab77ed4922f443",""],"BLANC_Thomas":["6a058f949a637a82ea031703",""],"BOEUF_Etienne":["69fb1344543aa93764ea7c9c",""],"COMBE_Baptiste":["69fb3794b59ad97ea6da97e0",""],"DE_VINCENTI_MENNA_Franco":["6a4f53b592c7e308cc7fdad7",""],"DESMEDT_Guillaume":["6a058af82ea2f600e02941cf",""],"FABRE_Mathis":["69fb1156543aa93764ea7c9a",""],"FERRAND_Anthony":["6a22df5cf82c8c248496d457",""],"GALIBERT_Rudy":["69d679f089e480f6d4bed419","00010"],"HASMI_Yacine":["6a219d147dece8adf93acdfc",""],"IBANEZ_Guilhem":["6a3501c4f8b1c0ddc58df8cc",""],"IDRISSI_Khalid":["6a05ad0a2ea2f600e029436f",""],"INNELLA_Camila":["69faf1ba3305a7468c3457fa",""],"JARDSON_GESMAR_Junior_Frederico":["69fcd591b78bfffcaf80ab17",""],"KAYA_Axel":["69f204a9c5aae073daacf561",""],"LANGLOIS_Arthur":["69fcd9fc584065644e8186ff",""],"LE_VERGE—SERANDOUR_Ewenn":["69f9ebf627fe56360944e8cd",""],"LEBARILLIER_Juliette":["6a3eb94aeb4c6331ea1af549",""],"ORIGET_Anais":["69fcdb7b3dd60f0e880f9e4b",""],"ORIGET_Anaïs":["69fcdb7b3dd60f0e880f9e4b",""],"PETIT_Fiona":["6a3c0e0d182be8cbda8fcc62",""],"REY_Benjamin":["69d679c889e480f6d4bed40a","00054"],"SANTINI_Yael":["6a34f6540e10774034de4da8",""],"ABOU_Ismail":["6a4e03512e59cd77d54c6e11",""],"BIGORGNE_Adrien":["6a3a35d58e38e4680a047884",""],"BOUAZZA_Sâra":["69fb06ee4c03d0b2d424c93e",""],"CARNEIRO_Mélinda":["69d60fde6183229051839155",""],"COURIAUD_Yanis":["69cf7994a45bb5ed933b2d84",""],"CUARTERO_Emmanuel":["69cbe080fb80ae03e49fe964",""],"DENIS_Alexis":["69cbf3109d8597729b0e6645",""],"DUFOUR_Maxence":["69cbfb8fec52f309a24cbfaa",""],"DUMAS_PELLECHIA_Quentin":["69d651dccf0ca8f097c9874c",""],"ELSENSOHN_Jade":["69f33a9cf2c73307e34c14bb",""],"FAZIO_Luca":["69cbdd74a56429f5c1d3efd0",""],"GNEBEHI_Maellie":["69cd0f6e7456ec9ffd5ecb5e",""],"GUELI_Estefanía":["69cb99bf6e8ce0e7f044b0f2","00003"],"GÜELI_Estefania":["69cb99bf6e8ce0e7f044b0f2","00003"],"GUILLET_Valentin":["6a1f19a6666714aca097e574",""],"HANTZ_Loane":["6a22f27c8db4ee7b00b5155b",""],"KOGLER_Theo":["69d67a0c89e480f6d4bed440","00031"],"KOKA_Victoria":["69cbde42a889af796cca0d49",""],"LANCON_Romain":["69d64ba422f4bb1c7ce568c9",""],"LE_BORGNE_Maxime":["69cce048e99ff5587b4fb134",""],"LLOBERES_Manon":["69cbfdbbec52f309a24cbfac",""],"LOUSSOUARN_Ahès":["69cbf9b64ca72c6e6b819483",""],"MEROLLE_Sophie":["6a28136d4149e24c87c8f9af",""],"MONNIER_Sebastien":["69cbee4b88ecb0bc735f5ae6",""],"NEVES_Jessica":["69cc01c8ae583d3d96c23897",""],"PEZZULLI_Gianni":["69fb094c329eac6b8395fd14",""],"RASZKOWSKI_Noah":["69cbfec77caca61878ab2313",""],"SOMNARD_Thomas":["69d63476b54f66e38c62224e",""],"TANG_Chhunhay":["69dcb5058bc0e04e01054a4b",""],"TRAMBAUD_Maxence":["69cd0a9a7456ec9ffd5ecb54",""],"VALEMBOIS_Ange":["69cfc27f352962ef4a856990","00041"],"BAL_Sébastien":["69f077cda44f82607d13372c",""],"BALLUET_Arthur":["6a4550201d7edc1d4e4048ac",""],"BENOIT_Joffrey":["69e9fae673580c69666366bc",""],"BRANDO_RUBIANO_Maria_Camila":["69de0de5bf971ddd694e83c4",""],"CELESTINE_Adrien":["69fcdd9d7ea9e0ad9bd8d9b8",""],"CHARLOT_Alexandre":["69e9f25bc9429fa210148855",""],"CHIQUET_Manon":["69f1db421d013865f6f16a31",""],"FERRAH_Claire":["69ce2c02ecf0e3f23000ea54",""],"HARDUIN_Romane":["69f1decf7699f10b6be1027d",""],"ID_HADDOUCH_Réda":["6a3eb6718123160944c2df0b",""],"ID_HADDOUCH_Reda":["6a3eb6718123160944c2df0b",""],"LAMY_Hugo":["69e9ec08d387da8032e9f57d",""],"LANNOY_Aurélien":["69c2d60e636888b8086f462e",""],"LOPIS_Adrien":["6a454ea7ef4796c81dbacb3c",""],"MACCHINI_David":["6a1d53c4c1cc415beb5154b2",""],"MALLEK_Hadj":["69c3be36f6ace19a6b46817b",""],"MOREL_Sébastien":["69de0c4810de02a059e89a34",""],"MOREL_Sebastien":["69de0c4810de02a059e89a34",""],"MOUZON_Justin":["69ea027a28f461d47ec0ee03",""],"RADJABOU_Soule":["69c3fc6e9610163e8e646321",""],"RIET_Antoine":["6a2842584bf828c1b1054ec8",""],"RIVET_Maurine":["69c2c9c509bb2972ae72aee1",""],"ROUSSEL_Fabien":["69c2d323213731a3d13bb46c",""],"SALAS_Mickaël":["69c2d879994d4af05350dbff",""],"SOULAT_Geoffrey":["69c2d17ce78bdf02867270a7",""],"THOMAS_Lou":["6a28443ddb73a3f32b038e2b",""],"TITEUX_Dylan":["6a01dbe97b7e87c2eeee62a9",""],"MENDEZ_Yojan_Alexander":["69c26913e1b760aa383d5947",""],"MORENO_LOPEZ_Ricardo_Israel":["69c13e1de6032e3165cb767d","00068"],"OLAZ_Johana_Nerea_Eugenia":["69c13e1b02493cfe810a4a88","00072"],"CARRILLO_RAMIREZ_Victor_Hugo":["69c2bafc4bd1ca56e2075e26","00054"],"DUARTE_Dwayne_Lloyd":["69cbf53efb80ae03e49fe975",""],"RAMIREZ_PLATA_Franyuly_Maritza":["69d65c35e9d20709aafd563f",""]};

// ---------- Constantes métier ----------
// Accès manager par CODE simple. Le code est vérifié dans l'app, puis l'app se connecte
// à UN compte Supabase partagé (identifiants ci-dessous) : la base reste ainsi protégée
// en écriture (seuls les utilisateurs connectés peuvent écrire). Le manager ne tape que le code.
// -> Créez ce compte dans Supabase (Authentication → Users) avec EXACTEMENT cet e-mail et ce mot de passe.
const CODE_MANAGER = "1942";                       // code tapé par le manager (modifiable ici)
const CODE_SUPERVISEUR = "1608";                   // code superviseur (accès étendu, à réserver à Océane) — modifiable ici
const MANAGER_EMAIL = "manager@indiegroup.fr";     // compte partagé (à créer dans Supabase)
const MANAGER_SECRET = "IndieGroup-Manager-2026";  // mot de passe du compte partagé (>= 6 caractères)
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MOIS_NOMS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const STATUTS = {
  TRAVAIL: "Travail",
  OFF: "OFF",
  CP: "CP",
  DEMI_CP: "demi-CP",
  AM: "AM",
  SANS_SOLDE: "CSS",
  REPOS: "Repos",
  FIN: "Fin",
};

// Liste des restaurants triée par effectif
const RESTAURANTS = Array.from(new Set(EMPLOYEES.map((e) => e.r))).sort((a, b) => {
  const ca = EMPLOYEES.filter((e) => e.r === a).length;
  const cb = EMPLOYEES.filter((e) => e.r === b).length;
  return cb - ca;
});

// ---------- Utilitaires dates ----------
function lundiDeLaSemaine(d) {
  const date = new Date(d);
  const jour = (date.getDay() + 6) % 7; // 0 = lundi
  date.setDate(date.getDate() - jour);
  date.setHours(0, 0, 0, 0);
  return date;
}
function ajouterJours(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function fmtDate(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtJour(d) {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
}
// "AAAA-MM-JJ" en heure LOCALE : contrairement à toISOString() (qui convertit en UTC), ne
// décale jamais la date d'un jour selon le fuseau du navigateur — minuit heure de Paris
// (UTC+1/+2) correspond encore à la veille en UTC, donc toISOString() y donnait la mauvaise
// date pour toute date/heure construite en heure locale (ce qui a longtemps faussé les clés
// de semaine et les comparaisons à "aujourd'hui" pour les établissements en France).
function dateISOLocale(d) {
  const a = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${a}-${m}-${j}`;
}
function cleSemaine(d) {
  // ATTENTION : reste volontairement sur toISOString() (pas dateISOLocale) même si ça décale
  // la date d'un jour pour les établissements en France. C'est cette clé, telle quelle, qui a
  // servi pendant des années à nommer les plannings déjà enregistrés (kPlanning/kValidation en
  // dépendent) : la "corriger" changerait la clé de recherche et rendrait tout l'historique
  // déjà saisi introuvable (déjà arrivé une fois, ne pas reproduire). Le bug de fuseau horaire
  // reste réel ici, mais toucher à cette fonction précise casse la compatibilité avec les
  // données existantes — un futur correctif devra migrer les clés, pas juste changer le calcul.
  const l = lundiDeLaSemaine(d);
  return l.toISOString().slice(0, 10);
}
function idSalarie(e) {
  return (e.n + "_" + e.p).replace(/\s+/g, "_");
}
// Normalise un texte pour comparaison tolérante : minuscules, sans accents, sans espaces superflus.
function normTxt(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
// Cherche un salarié par prénom + nom + restaurant (tolérant).
function trouverSalarie(prenom, nom, resto, extra = [], exclure = new Set()) {
  const p = normTxt(prenom), n = normTxt(nom), r = normTxt(resto);
  const tous = EMPLOYEES.concat(extra);
  return tous.find((e) =>
    normTxt(e.p) === p && normTxt(e.n) === n && normTxt(e.r) === r && !exclure.has(idSalarie(e))
  ) || null;
}
// Distance de Levenshtein (tolérance aux fautes de frappe).
function lev(a, b) {
  const m = a.length, k = b.length;
  if (!m) return k; if (!k) return m;
  let prev = Array.from({ length: k + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= k; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[k];
}
// Propose les salariés proches de la saisie, UNIQUEMENT dans le restaurant choisi.
// Ne suggère rien tant que la saisie est trop courte (évite de lister tout le monde).
function suggererSalaries(prenom, nom, resto, extra = [], exclure = new Set()) {
  const p = normTxt(prenom), n = normTxt(nom);
  if (!resto || (p.length < 2 && n.length < 2)) return [];
  const team = EMPLOYEES.concat(extra).filter((e) => normTxt(e.r) === normTxt(resto) && !exclure.has(idSalarie(e)));
  const scored = team.map((e) => {
    const ep = normTxt(e.p), en = normTxt(e.n);
    // Score par champ : 0 si vide (n'handicape pas), sinon meilleure de
    // sous-chaîne (0), préfixe, ou distance d'édition.
    function scoreChamp(saisie, cible) {
      if (!saisie) return null; // champ non renseigné => ignoré
      if (cible.includes(saisie)) return 0;
      if (cible.startsWith(saisie)) return 0;
      return lev(saisie, cible);
    }
    const sp = scoreChamp(p, ep);
    const sn = scoreChamp(n, en);
    // On combine : si les deux renseignés, on additionne ; si un seul, on prend celui-là.
    let score;
    if (sp !== null && sn !== null) score = sp + sn;
    else if (sp !== null) score = sp;
    else if (sn !== null) score = sn;
    else score = 99;
    return { e, score };
  });
  // On garde les plus proches, avec un seuil pour ne pas afficher n'importe qui.
  return scored
    .filter((s) => s.score <= 4)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map((s) => s.e);
}

// ---------- Génération automatique du planning ----------
// Répartit les heures contractuelles sur 5 jours (2 jours de repos),
// en respectant des amplitudes de service de restauration.
// Deux services types : 9h-17h ou 11h-19h, 1h de pause => 7h travaillées.
const HEURES_DEBUT = ["09:00", "11:00"]; // débuts alternés (matin / fin de matinée)
const PAUSE_JOUR = 1; // 1h de pause par jour travaillé

// Convertit "HH:MM" + durée travaillée (h) + pause (h) en heure de fin "HH:MM".
function finDepuis(debut, dureeTravail, pause) {
  const [dh, dm] = debut.split(":").map(Number);
  const totalMin = dh * 60 + dm + Math.round((dureeTravail + pause) * 60);
  const fh = Math.floor(totalMin / 60) % 24;
  const fm = totalMin % 60;
  return String(fh).padStart(2, "0") + ":" + String(fm).padStart(2, "0");
}

// Répartit un total d'heures contractuelles sur N jours, journées aussi régulières
// que possible, arrondies au quart d'heure, la somme tombant exactement sur le contrat.
function repartirHeures(contrat, jours) {
  let totalMin = Math.round(contrat * 60);
  const base = Math.floor(totalMin / jours / 15) * 15;
  const arr = new Array(jours).fill(base);
  let reste = totalMin - base * jours;
  let i = 0;
  while (reste >= 15) { arr[i % jours] += 15; reste -= 15; i++; }
  if (reste > 0) arr[0] += reste;
  return arr.map((m) => m / 60); // en heures décimales
}

function genererPlanningAuto(emp, cleSem) {
  // 6 jours de travail + 1 repos. Les durées sont calculées pour que le TOTAL de la
  // semaine égale les heures de contrat du salarié ; le manager peut tout ajuster ensuite.
  const contrat = emp.h || 35;
  const indexRepos = [6]; // dimanche par défaut
  const joursTravail = [0, 1, 2, 3, 4, 5];
  const durees = repartirHeures(contrat, joursTravail.length); // durées de travail (hors pause)

  const planning = {};
  let k = 0;
  for (let j = 0; j < 7; j++) {
    if (indexRepos.includes(j)) {
      planning[j] = { statut: STATUTS.OFF, debut: "", fin: "", pause: 0 };
      continue;
    }
    const debut = HEURES_DEBUT[k % HEURES_DEBUT.length];
    const dureeTravail = durees[k];
    const fin = finDepuis(debut, dureeTravail, PAUSE_JOUR);
    planning[j] = { statut: STATUTS.TRAVAIL, debut, fin, pause: PAUSE_JOUR };
    k++;
  }
  return planning;
}

// Durée d'un créneau simple début/fin (en heures décimales), gère le service de nuit.
function dureeCreneau(debut, fin) {
  if (!debut || !fin) return 0;
  const [dh, dm] = debut.split(":").map(Number);
  const [fh, fm] = fin.split(":").map(Number);
  let mins = fh * 60 + fm - (dh * 60 + dm);
  if (mins < 0) mins += 24 * 60; // service de nuit
  return Math.max(0, mins / 60);
}
// Calcule la durée travaillée (en heures décimales) d'un jour.
// Gère les coupures : un second créneau optionnel (debut2/fin2) le même jour.
function dureeJour(p) {
  if (!p || (p.statut !== STATUTS.TRAVAIL && p.statut !== STATUTS.DEMI_CP) || !p.debut || !p.fin) return 0;
  let h = dureeCreneau(p.debut, p.fin);
  if (p.coupure && p.debut2 && p.fin2) h += dureeCreneau(p.debut2, p.fin2);
  h -= (p.pause || 0);
  return Math.max(0, h);
}
function totalHebdo(planning) {
  let t = 0;
  for (let j = 0; j < 7; j++) t += dureeJour(planning[j]);
  return t;
}
function fmtHeures(h) {
  const H = Math.floor(h);
  const M = Math.round((h - H) * 60);
  return M === 0 ? `${H}h` : `${H}h${String(M).padStart(2, "0")}`;
}

// Échappe le texte pour insertion HTML sûre.
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
// Charge un script externe une seule fois (pour jsPDF, côté navigateur).
function chargerScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Échec du chargement de " + src));
    document.head.appendChild(s);
  });
}
// Nom de fichier sûr : Emargement_RESTO_AAAA-MM-JJ.pdf
function nomFichierEmargement(resto, lundi) {
  const slug = normTxt(resto).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Emargement_${slug}_${dateISOLocale(lundi)}.pdf`;
}

// Construit le document HTML complet, auto-imprimable.
function construireDocument(titre, corpsHTML, styles) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${esc(titre)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; color:#15303B; margin:24px; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  h1 { font-family:'Inter',system-ui,sans-serif; font-size:22px; text-align:center; margin:0 0 2px; }
  .sub { text-align:center; font-size:13px; margin-bottom:18px; }
  ${styles}
  @media print { body { margin:10mm; } .noprint { display:none; } }
</style></head><body>${corpsHTML}
<div class="noprint" style="text-align:center;margin-top:20px">
  <button onclick="window.print()" style="padding:10px 18px;font-size:14px;border:none;border-radius:8px;background:#E5604D;color:#fff;font-weight:600;cursor:pointer">Imprimer / Enregistrer en PDF</button>
</div>
<script>window.onload=function(){setTimeout(function(){window.print();},500);};</script>
</body></html>`;
}

// Génère un vrai fichier PDF (en base64) à partir d'un contenu HTML + styles — la même
// source que celle utilisée à l'impression (imprimerDocument), pour joindre le document
// généré directement à un email au lieu d'obliger à l'imprimer/enregistrer à la main puis
// le joindre soi-même. Rendu dans un conteneur temporaire ajouté au DOM.
//
// ATTENTION, piège vérifié à la main (deux tentatives cassées avant de trouver celle-ci) :
// le conteneur doit rester en position "normale" (statique) dans la page pour que html2canvas
// mesure correctement sa hauteur — le déplacer hors écran (position:fixed/absolute, avec ou
// sans opacity:0) donne un canvas de hauteur 0, donc un PDF vide. Pour le garder invisible
// sans casser la mesure, on le met dans une enveloppe "height:0; overflow:hidden" : le
// conteneur lui-même reste en flux normal (donc mesuré normalement), seul son rendu visuel
// est masqué par l'enveloppe.
// Police + couleur de base utilisées par tous les documents imprimés (construireDocument) —
// dupliquées ici (au lieu d'être partagées) car construireDocument s'exécute dans une AUTRE
// fenêtre/document (celle ouverte par window.open) ; ici, le rendu se fait dans LA page de
// l'appli. La police "Inter" est importée en haut du fichier (@fontsource/inter, empaquetée
// au build) plutôt que chargée depuis Google Fonts à la volée : deux tentatives avec un
// <link> chargé dynamiquement ont donné un PDF joint à l'email dans une police de repli aux
// proportions différentes (interlignage/espacement tassés, texte ne remplissant pas la page
// comme l'impression) — la police empaquetée est disponible immédiatement, sans réseau.
let polirePDFChargee = false;
async function chargerPolicePDF() {
  if (polirePDFChargee) return;
  try {
    await Promise.all([
      document.fonts.load("400 14px Inter"),
      document.fonts.load("600 14px Inter"),
      document.fonts.load("700 14px Inter"),
    ]);
    await document.fonts.ready;
  } catch { /* au pire, repli sur une police système — pas bloquant */ }
  polirePDFChargee = true;
}

// html2pdf.js ignore TOUJOURS la largeur du conteneur qu'on lui donne : en interne (voir son
// code source, Worker.prototype.toContainer), il clone le contenu dans SON PROPRE conteneur,
// forcé à la largeur imprimable de la page (ici 190mm), quoi qu'on mette sur l'élément d'origine.
// Or ce conteneur est ensuite capturé en pixels (96px = 1 pouce, la convention CSS standard)
// puis réinjecté dans le PDF à sa taille physique réelle (190mm) SANS AUCUN redimensionnement —
// alors que le PDF obtenu par "Imprimer > Enregistrer en PDF" du navigateur (imprimerDocument)
// n'applique PAS cette conversion : Chrome y transpose directement chaque valeur en px de la
// feuille de style en points PDF (1px → 1pt), qui sont 96/72 = 1,33 fois plus grands qu'un px
// physique. Résultat vérifié : à styles identiques, le texte du PDF joint à l'email ressort
// visiblement plus petit/tassé que celui de l'impression, sans remplir la page correctement.
// On corrige en agrandissant toutes les valeurs en px de la feuille de style (polices, marges,
// interlignage compris) de ce même facteur 96/72 avant de les donner à html2canvas — pour un
// rendu final à l'identique de l'impression, vérifié à la main avant de livrer ce correctif.
const ECHELLE_PDF = 96 / 72;
function stylesEchellePDF(styles) {
  return styles.replace(/(\d+(?:\.\d+)?)px/g, (_, n) => `${parseFloat(n) * ECHELLE_PDF}px`);
}

async function genererPDFBase64(corpsHTML, styles) {
  await chargerPolicePDF();
  const enveloppe = document.createElement("div");
  enveloppe.style.height = "0";
  enveloppe.style.overflow = "hidden";
  const conteneur = document.createElement("div");
  conteneur.style.width = "190mm"; // largeur imprimable d'une page A4 (210mm - 2x10mm de marge)
  conteneur.style.background = "#fff";
  conteneur.style.fontFamily = "'Inter', system-ui, sans-serif";
  conteneur.style.color = "#15303B";
  conteneur.innerHTML = `<style>${stylesEchellePDF(styles)}</style><div style="padding:${24 * ECHELLE_PDF}px">${corpsHTML}</div>`;
  enveloppe.appendChild(conteneur);
  document.body.appendChild(enveloppe);
  try {
    const blob = await html2pdf().set({
      margin: 10,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    }).from(conteneur).outputPdf("blob");
    return await new Promise((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onloadend = () => resolve(String(lecteur.result).split(",")[1]);
      lecteur.onerror = reject;
      lecteur.readAsDataURL(blob);
    });
  } finally {
    document.body.removeChild(enveloppe);
  }
}

// Tente l'ouverture dans une nouvelle fenêtre ; si elle est bloquée (sandbox),
// retombe sur le téléchargement d'un fichier .html que l'utilisateur ouvre puis imprime en PDF.
function imprimerDocument(titre, corpsHTML, styles, nomFichier) {
  const html = construireDocument(titre, corpsHTML, styles);
  // 1) Essai fenêtre d'impression directe.
  try {
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      return true;
    }
  } catch (e) { /* on bascule sur le téléchargement */ }
  // 2) Repli : téléchargement d'un fichier HTML auto-imprimable (non bloqué par la sandbox).
  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (nomFichier || slugKey(titre) || "document") + ".html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "download";
  } catch (e) {
    return false;
  }
}
// Rendu HTML d'une cellule jour (planning ou émargement).
function celluleHTML(p, { signe } = {}) {
  if (!p || p.statut === STATUTS.OFF || p.statut === STATUTS.REPOS) return '<b>OFF</b>';
  if (p.statut === STATUTS.CP) return '<b>CP</b>';
  if (p.statut === STATUTS.AM) return '<b>AM</b>';
  if (p.statut === STATUTS.SANS_SOLDE) return '<b>CSS</b>';
  if (p.statut === STATUTS.FIN) return '';
  let s = `<div class="hrs">${esc(p.debut)} – ${esc(p.fin)}</div>`;
  if (p.coupure && p.debut2 && p.fin2) s += `<div class="hrs">${esc(p.debut2)} – ${esc(p.fin2)}</div>`;
  if (p.statut === STATUTS.DEMI_CP) s += `<div class="pz">½ CP ${p.demi === "am" ? "(matin off)" : "(aprèm off)"}</div>`;
  else if (p.pause) s += `<div class="pz">${esc(p.pause)}h pause</div>`;
  if (signe !== undefined) s += signe ? '<div class="sig signed">✓ confirmé</div>' : '<div class="sig">signature ____</div>';
  return s;
}

// ---------- Persistance (Supabase — partagée entre tous les postes) ----------
// Table "kv" : clé texte -> valeur JSON. Managers connectés = accès complet ;
// salariés (anonymes) = lecture des plannings + écriture de leurs pointages.
// Les règles d'accès sont définies côté base (voir supabase/schema.sql).
const Store = {
  async get(key) {
    const { data, error } = await supabase
      .from("kv").select("value").eq("key", key).maybeSingle();
    if (error) { console.error("Store.get:", key, error.message); return null; }
    return data ? data.value : null;
  },
  async set(key, value) {
    const { error } = await supabase
      .from("kv").upsert({ key, value }, { onConflict: "key" });
    if (error) console.error("Store.set:", key, error.message);
  },
  // Récupère toutes les entrées dont la clé commence par un préfixe donné (ex: "extras:"),
  // pour reconstituer un historique complet sans avoir à connaître à l'avance les mois existants.
  async listByPrefix(prefix) {
    const { data, error } = await supabase
      .from("kv").select("key, value").like("key", `${prefix}%`);
    if (error) { console.error("Store.listByPrefix:", prefix, error.message); return []; }
    return data || [];
  },
  // Anciennes versions d'une clé (voir trigger kv_snapshot en base), la plus récente d'abord.
  async history(key, limite = 20) {
    const { data, error } = await supabase
      .from("kv_history").select("value, saved_at").eq("key", key).order("saved_at", { ascending: false }).limit(limite);
    if (error) { console.error("Store.history:", key, error.message); return []; }
    return data || [];
  },
};

// ---------- RH : fiches salariés (table dédiée, cloisonnée par établissement + unité) ----------
// ---------- Synchro vers le Google Sheet "onboarding" existant ----------
// Ne bloque jamais l'appli : appelée en tâche de fond après chaque écriture réussie dans
// rh_salaries, elle répercute les mêmes champs dans le Sheet qu'Océane continue de tenir
// à jour elle-même. Passe par la fonction Supabase "sheet-sync" (clé Google côté serveur).
const RhSheetSync = {
  async upsert({ resto, unite, nom, prenom, champs }) {
    if (!resto || !nom || !prenom) return;
    const { error } = await supabase.functions.invoke("sheet-sync", {
      body: { action: "upsertRow", resto, unite, nom, prenom, champs },
    });
    if (error) console.error("RhSheetSync.upsert:", error.message);
  },
  // Rattrapage en un clic : crée en base les salariés déjà présents dans le Sheet mais
  // jamais reçus par l'app (onboardés avant la mise en place de la synchro automatique).
  // Ne touche jamais aux fiches déjà existantes. Réservé au superviseur. resto optionnel :
  // s'il est précisé, seul cet établissement est importé (évite de mélanger avec les autres).
  async importerTout(resto) {
    const { data, error } = await supabase.functions.invoke("sheet-sync", { body: { action: "importerTout", resto } });
    if (error) {
      let detail = error.message;
      try { const j = await error.context.json(); detail = j.detail ? `${j.error} : ${j.detail}` : j.error; } catch {}
      return { ok: false, erreur: detail };
    }
    if (data?.error) return { ok: false, erreur: data.error };
    return data;
  },
  // Archive de fin de saison : copie toutes les fiches d'une saison donnée dans un onglet
  // dédié du Google Sheet. N'efface rien en base. Réservé au superviseur.
  async archiverSaison(saison) {
    const { data, error } = await supabase.functions.invoke("sheet-sync", { body: { action: "archiverSaison", saison } });
    if (error) {
      let detail = error.message;
      try { const j = await error.context.json(); detail = j.detail ? `${j.error} : ${j.detail}` : j.error; } catch {}
      return { ok: false, erreur: detail };
    }
    if (data?.error) return { ok: false, erreur: data.error };
    return data;
  },
  // Exporte le suivi "Repos hebdo non pris" d'un établissement/unité/mois vers un onglet
  // dédié du Google Sheet, pour un réimport ailleurs (paie...). Réservé au superviseur.
  async exporterReposHebdo(resto, unite, mois) {
    const { data, error } = await supabase.functions.invoke("sheet-sync", { body: { action: "exporterReposHebdo", resto, unite, mois } });
    if (error) {
      let detail = error.message;
      try { const j = await error.context.json(); detail = j.detail ? `${j.error} : ${j.detail}` : j.error; } catch {}
      return { ok: false, erreur: detail };
    }
    if (data?.error) return { ok: false, erreur: data.error };
    return data;
  },
  // Synchronise un extra (création, saisie heures/taux, ou validation) vers le Sheet "Extra".
  // "ligneCible" absent -> nouvelle ligne ajoutée à la fin (appel de création) ; fourni (le
  // numéro mémorisé dans rh_extras.sheet_ligne dès la création) -> écrit directement dessus,
  // sans jamais rechercher/fusionner avec une autre ligne (deux extras de la même personne à
  // la même date restent deux lignes distinctes). N'empêche jamais l'appli de fonctionner
  // (l'appelant continue même en cas d'échec), mais renvoie le détail de l'erreur pour que
  // l'appelant puisse quand même prévenir la personne.
  async upsertExtra({ resto, unite, restoOrigine, salarieNom, salariePrenom, date, champs, ligneCible }) {
    const { data, error } = await supabase.functions.invoke("sheet-sync", {
      body: { action: "upsertExtra", resto, unite, restoOrigine, salarieNom, salariePrenom, date, champs, ligneCible },
    });
    if (error) {
      let detail = error.message;
      try { const j = await error.context.json(); detail = j.detail ? `${j.error} : ${j.detail}` : j.error; } catch {}
      console.error("RhSheetSync.upsertExtra:", detail);
      return { ok: false, erreur: detail };
    }
    if (data?.error) { console.error("RhSheetSync.upsertExtra:", data.error); return { ok: false, erreur: data.error }; }
    return { ok: true, ...data };
  },
};

// ---------- Gestion des accès RH (créer/retirer un compte directeur/chef) ----------
// Passe par la fonction Supabase "rh-admin" : le superviseur crée/gère les comptes
// directement dans l'appli, sans jamais avoir besoin d'ouvrir Supabase.
async function appelerRhAdmin(action, corps) {
  const { data, error } = await supabase.functions.invoke("rh-admin", { body: { action, ...corps } });
  if (error) {
    let detail = error.message;
    try { const j = await error.context.json(); detail = j.detail ? `${j.error} : ${j.detail}` : j.error; } catch {}
    return { ok: false, erreur: detail };
  }
  if (data?.error) return { ok: false, erreur: data.error };
  return data;
}
const RhAdmin = {
  lister: () => appelerRhAdmin("lister"),
  creer: ({ email, motDePasse, resto, unite }) => appelerRhAdmin("creer", { email, motDePasse, resto, unite }),
  supprimer: (id) => appelerRhAdmin("supprimer", { id }),
  changerMotDePasse: ({ user_id, motDePasse }) => appelerRhAdmin("changerMotDePasse", { user_id, motDePasse }),
  // Envoi d'un email (ex : promesse d'embauche, en pièce jointe PDF) via l'adresse d'envoi
  // configurée côté Supabase. Réservé au superviseur (gate déjà en place côté fonction
  // "rh-admin"). pdfBase64/nomFichier optionnels : sans eux, envoie un simple email texte.
  envoyerEmail: ({ to, sujet, texte, pdfBase64, nomFichier }) => appelerRhAdmin("envoyerEmail", { to, sujet, texte, pdfBase64, nomFichier }),
  // Recherche de salariés tous établissements confondus (ex : pour un extra emprunté
  // ailleurs) — ouvert à tout compte RH, pas seulement au superviseur.
  async rechercherSalaries(q) {
    const r = await appelerRhAdmin("rechercherSalaries", { q });
    return r.ok ? r.resultats : [];
  },
};

const RhSalaries = {
  async list(resto, unite) {
    let q = supabase.from("rh_salaries").select("*").eq("resto", resto);
    if (unite) q = q.eq("unite", unite);
    const { data, error } = await q.order("nom", { ascending: true });
    if (error) { console.error("RhSalaries.list:", error.message); return []; }
    return data || [];
  },
  async creer(row) {
    const { data, error } = await supabase.from("rh_salaries").insert(row).select().single();
    if (error) { console.error("RhSalaries.creer:", error.message); return null; }
    RhSheetSync.upsert({ resto: data.resto, unite: data.unite, nom: data.nom, prenom: data.prenom, champs: data });
    return data;
  },
  async maj(id, patch) {
    const { data, error } = await supabase.from("rh_salaries").update(patch).eq("id", id).select().single();
    if (error) { console.error("RhSalaries.maj:", error.message); return null; }
    RhSheetSync.upsert({ resto: data.resto, unite: data.unite, nom: data.nom, prenom: data.prenom, champs: patch });
    return data;
  },
  // Effectif réel par établissement (saison la plus récente de chaque établissement),
  // pour l'écran de choix d'établissement de l'Espace RH — distinct du roster Planning.
  async compterParResto() {
    const { data, error } = await supabase.from("rh_salaries").select("resto, saison");
    if (error) { console.error("RhSalaries.compterParResto:", error.message); return {}; }
    const parResto = {};
    (data || []).forEach((r) => { (parResto[r.resto] ||= []).push(r.saison); });
    const counts = {};
    Object.keys(parResto).forEach((resto) => {
      const saisons = parResto[resto];
      const derniere = [...saisons].sort().slice(-1)[0];
      counts[resto] = saisons.filter((s) => s === derniere).length;
    });
    return counts;
  },
  async supprimer(id) {
    const { error } = await supabase.from("rh_salaries").delete().eq("id", id);
    if (error) { console.error("RhSalaries.supprimer:", error.message); return false; }
    return true;
  },
  async supprimerPlusieurs(ids) {
    const { error } = await supabase.from("rh_salaries").delete().in("id", ids);
    if (error) { console.error("RhSalaries.supprimerPlusieurs:", error.message); return false; }
    return true;
  },
  // Retire des fiches de la vue courante du directeur sans rien supprimer : bascule leur
  // saison vers celle choisie ("Archives" par défaut, ou n'importe quel nom de saison —
  // "2025", "2026"... — choisi à la volée), consultable via l'onglet de saison correspondant.
  // Un à un (pas en un seul lot) : si une fiche entre en conflit avec une autre déjà
  // présente dans la saison cible (même salarié déjà archivé là-bas — contrainte
  // resto+salarie_id+saison), elle seule échoue, sans bloquer le déplacement des autres.
  async archiverPlusieurs(ids, saisonCible = "Archives") {
    const echecs = [];
    for (const id of ids) {
      const { error } = await supabase.from("rh_salaries").update({ saison: saisonCible }).eq("id", id);
      if (error) { console.error("RhSalaries.archiverPlusieurs:", id, error.message); echecs.push({ id, erreur: error.message }); }
    }
    return { ok: echecs.length === 0, echecs };
  },
};

// ---------- Repos hebdomadaire non pris (suivi mensuel + calcul du montant à payer) ----------
const RhReposHebdo = {
  async list(resto, unite, mois) {
    const { data, error } = await supabase.from("rh_repos_hebdo").select("*")
      .eq("resto", resto).eq("unite", unite).eq("mois", mois).order("nom", { ascending: true });
    if (error) { console.error("RhReposHebdo.list:", error.message); return []; }
    return data || [];
  },
  // Ajoute au mois choisi tous les salariés réellement sous contrat ce mois-là (pas les
  // fiches "provisoire", pas encore vraiment onboardées), sans jamais toucher aux lignes
  // déjà présentes (leur "repos non pris" déjà saisi n'est donc jamais écrasé).
  async genererMois(resto, unite, mois) {
    const debut = `${mois}-01`;
    const finDate = new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0);
    const fin = dateISOLocale(finDate);
    const { data: salaries, error } = await supabase.from("rh_salaries").select("id, nom, prenom, salaire_net")
      .eq("resto", resto).eq("unite", unite).eq("provisoire", false)
      .not("date_debut", "is", null).lte("date_debut", fin)
      .or(`date_fin.is.null,date_fin.gte.${debut}`);
    if (error) { console.error("RhReposHebdo.genererMois (lecture):", error.message); return false; }
    if (!salaries || salaries.length === 0) return true;
    const lignes = salaries.map((s) => ({
      resto, unite, mois, salarie_id: s.id, nom: s.nom, prenom: s.prenom, salaire_net: s.salaire_net,
    }));
    const { error: err2 } = await supabase.from("rh_repos_hebdo").upsert(lignes, {
      onConflict: "resto,unite,mois,salarie_id", ignoreDuplicates: true,
    });
    if (err2) { console.error("RhReposHebdo.genererMois (écriture):", err2.message); return false; }
    return true;
  },
  async maj(id, patch) {
    const { data, error } = await supabase.from("rh_repos_hebdo").update(patch).eq("id", id).select().single();
    if (error) { console.error("RhReposHebdo.maj:", error.message); return null; }
    return data;
  },
  async supprimer(id) {
    const { error } = await supabase.from("rh_repos_hebdo").delete().eq("id", id);
    if (error) { console.error("RhReposHebdo.supprimer:", error.message); return false; }
    return true;
  },
};

// ---------- Extras (prêt de main-d'œuvre entre établissements) — Espace RH ----------
const RhExtras = {
  // "resto"/"unite" = établissement DESTINATAIRE (celui qui gère la ligne).
  async list(resto, unite, mois) {
    const debut = `${mois}-01`;
    const finDate = new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0);
    const fin = dateISOLocale(finDate);
    const { data, error } = await supabase.from("rh_extras").select("*")
      .eq("resto", resto).eq("unite", unite).gte("date", debut).lte("date", fin).order("date", { ascending: false });
    if (error) { console.error("RhExtras.list:", error.message); return []; }
    return data || [];
  },
  // Historique complet d'UN établissement + une unité (tous mois confondus) : chaque
  // établissement — et, au sein d'un établissement, chaque unité (Salle/Cuisine) — a son
  // propre historique, jamais mélangé avec celui d'un autre établissement.
  async listParEtablissement(resto, unite) {
    const { data, error } = await supabase.from("rh_extras").select("*")
      .eq("resto", resto).eq("unite", unite).order("date", { ascending: false });
    if (error) { console.error("RhExtras.listParEtablissement:", error.message); return []; }
    return data || [];
  },
  async creer(row) {
    const { data, error } = await supabase.from("rh_extras").insert(row).select().single();
    if (error) { console.error("RhExtras.creer:", error.message); return null; }
    return data;
  },
  async maj(id, patch) {
    const { data, error } = await supabase.from("rh_extras").update(patch).eq("id", id).select().single();
    if (error) { console.error("RhExtras.maj:", error.message); return null; }
    return data;
  },
  async supprimer(id) {
    const { error } = await supabase.from("rh_extras").delete().eq("id", id);
    if (error) { console.error("RhExtras.supprimer:", error.message); return false; }
    return true;
  },
};

// ---------- Pointages (table dédiée, une ligne par salarié/jour) ----------
// Robustesse V2 : chaque confirmation n'écrit qu'UNE ligne, donc deux salariés
// qui pointent en même temps ne s'écrasent plus. La forme rendue en mémoire est
// identique à l'ancienne ({ idSalarie: { 0..6: {...}, semaine: {...} } }) pour
// que le reste de l'application reste inchangé. jour = -1 => signature semaine.
const SEM_SLOT = -1;
const Pointages = {
  async load(resto, sem) {
    const { data, error } = await supabase
      .from("pointages").select("salarie_id, jour, data").eq("resto", resto).eq("sem", sem);
    if (error) { console.error("Pointages.load:", error.message); return {}; }
    const out = {};
    for (const row of data || []) {
      const o = out[row.salarie_id] || (out[row.salarie_id] = {});
      if (row.jour === SEM_SLOT) o.semaine = row.data;
      else o[row.jour] = row.data;
    }
    return out;
  },
  async setJour(resto, sem, salarie_id, jour, data) {
    const { error } = await supabase
      .from("pointages").upsert({ resto, sem, salarie_id, jour, data }, { onConflict: "resto,sem,salarie_id,jour" });
    if (error) console.error("Pointages.setJour:", error.message);
  },
  async setSemaine(resto, sem, salarie_id, data) {
    const { error } = await supabase
      .from("pointages").upsert({ resto, sem, salarie_id, jour: SEM_SLOT, data }, { onConflict: "resto,sem,salarie_id,jour" });
    if (error) console.error("Pointages.setSemaine:", error.message);
  },
};

// Assainit un fragment de clé : les clés de storage interdisent espaces, slashs et guillemets.
// On remplace tout caractère non alphanumérique par "-" (les accents sont d'abord retirés).
function slugKey(s) {
  return (s || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
}

// Clés de stockage (toutes assainies pour rester valides quel que soit le nom du resto)
const kPlanning = (resto, sem) => `planning:${slugKey(resto)}:${sem}`;
const kPointages = (resto, sem) => `pointages:${slugKey(resto)}:${sem}`;
// Effectif géré par le manager, au niveau du restaurant (indépendant de la semaine) :
// - ajouts : salariés créés dans l'app (début de contrat)
// - departs : { idSalarie: cleSemaineEffet } -> masqué à partir de cette semaine incluse
const kRoster = (resto) => `roster:${slugKey(resto)}`;
// Modèle de planning enregistré pour le restaurant : { idSalarie: { 0..6 } }
const kModele = (resto) => `modele:${slugKey(resto)}`;
// Shifts prêts à l'emploi (ex : "matin" 09:00-17:00) propres à l'établissement, proposés en
// raccourci quand on édite le créneau d'un jour : [{ id, nom, debut, fin, pause }, ...].
const kShifts = (resto) => `shifts:${slugKey(resto)}`;
// Correspondance PayFit (identifiant + matricule) tenue à jour par le superviseur, en plus
// de PAYFIT_IDS codé en dur. Une clé PAR ÉTABLISSEMENT : chaque resto a son propre fichier
// PayFit, on évite ainsi tout mélange entre établissements (homonymes, etc.).
// { idSalarie: [identifiant, matricule] }.
const kPayfitMapping = (resto) => `payfit_mapping:${slugKey(resto)}`;
// Établissements ajoutés dans l'app (au-delà de ceux du fichier) : [nom, ...]
const kEtablissements = "etablissements";
// Validation du planning d'une semaine (booléen) : publie le planning aux salariés.
const kValidation = (resto, sem) => `validation:${slugKey(resto)}:${sem}`;
// Fiche juridique de chaque établissement (raison sociale, SIRET...) : nécessaire pour
// générer les contrats de prêt. Clé unique, valeur = { [resto]: {...} }.
const kEtablissementsJuridique = "etablissements_juridique";
function cleMois(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; }

// ---------- Icônes (SVG inline, pas de dépendance) ----------
const Icon = {
  Calendar: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>),
  Clock: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>),
  User: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>),
  Shield: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>),
  Print: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/></svg>),
  Wand: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M15 4V2M15 10V8M12.5 6.5h-2M19.5 6.5h-2M4 20l10-10M17 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/></svg>),
  Back: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M15 18l-6-6 6-6"/></svg>),
  Search: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>),
  Check: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M20 6L9 17l-5-5"/></svg>),
  Chevron: (p) => (<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M9 18l6-6-6-6"/></svg>),
};

// ---------- Styles ----------
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; }
.ig-app {
  --sand: #F3ECE0;
  --sand-2: #E8DDC9;
  --ink: #15303B;
  --ink-soft: #3C5763;
  --coral: #E5604D;
  --coral-d: #C84A38;
  --sea: #2E7D86;
  --line: #D8CBB4;
  --white: #FFFDF8;
  --ok: #2E7D86;
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--ink);
  background: var(--sand);
  min-height: 100vh;
}
.ig-display { font-family: 'Inter', system-ui, sans-serif; }
.ig-wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
.ig-wrap-rh { max-width: none; }

.ig-topbar {
  background: var(--ink); color: var(--sand);
  padding: 14px 0; position: sticky; top: 0; z-index: 30;
  border-bottom: 3px solid var(--coral);
}
.ig-topbar .ig-wrap { display: flex; align-items: center; gap: 16px; }
.ig-brand { font-family:'Inter',system-ui,sans-serif; font-weight:700; font-size: 20px; letter-spacing: .5px; display:flex; align-items:center; gap:10px; }
.ig-brand small { font-family:'Inter'; font-weight:500; font-size:11px; opacity:.7; letter-spacing:2px; text-transform:uppercase; display:block; }
.ig-tag { margin-left:auto; display:flex; align-items:center; gap:10px; font-size:13px; }
.ig-pill { background: rgba(243,236,224,.12); padding:6px 12px; border-radius:999px; display:flex; align-items:center; gap:7px; }

.ig-btn { font-family:'Inter'; font-weight:600; font-size:14px; border:none; border-radius:11px; padding:11px 18px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition: all .15s; }
.ig-btn-primary { background: var(--coral); color:#fff; }
.ig-btn-primary:hover { background: var(--coral-d); }
.ig-btn-ghost { background: transparent; color: var(--ink); border:1.5px solid var(--line); }
.ig-btn-ghost:hover { border-color: var(--ink); }
.ig-btn-ink { background: var(--ink); color: var(--sand); }
.ig-btn-ink:hover { background:#0d2129; }
.ig-btn:disabled { opacity:.45; cursor:not-allowed; }
.ig-btn-sm { padding:7px 12px; font-size:13px; border-radius:9px; }
.ig-btn-icon { padding:6px 8px; font-size:15px; border-radius:8px; gap:0; line-height:1; }

/* Accueil */
.ig-hero { padding: 56px 0 30px; }
.ig-eyebrow { font-size:12px; letter-spacing:3px; text-transform:uppercase; color:var(--coral-d); font-weight:700; margin-bottom:14px; }
.ig-hero h1 { font-family:'Inter',system-ui,sans-serif; font-weight:600; font-size: clamp(34px,5vw,52px); line-height:1.04; margin:0 0 16px; letter-spacing:-.5px; }
.ig-hero p { font-size:17px; color:var(--ink-soft); max-width:560px; margin:0; line-height:1.55; }

.ig-roles { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin:34px 0; }
.ig-role { background:var(--white); border:1.5px solid var(--line); border-radius:18px; padding:26px; cursor:pointer; transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease; text-align:left; will-change: transform; backface-visibility: hidden; transform: translateZ(0); }
.ig-role:hover { transform: translateY(-3px) translateZ(0); border-color:var(--coral); box-shadow:0 14px 34px -18px rgba(21,48,59,.4); }
.ig-role h3, .ig-role p { transform: translateZ(0); -webkit-font-smoothing: antialiased; }
.ig-role .ig-ic { width:46px; height:46px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
.ig-role h3 { font-family:'Inter', system-ui, sans-serif; font-size:21px; margin:0 0 6px; font-weight:700; letter-spacing:-.2px; }
.ig-role p { color:var(--ink-soft); font-size:14px; margin:0; line-height:1.5; }
.ig-hero-bg { position:relative; border-radius:28px; overflow:hidden; background-size:cover; background-position:center 30%; isolation:isolate; }
.ig-hero-bg::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(10,8,10,.5) 0%, rgba(10,8,10,.72) 55%, rgba(10,8,10,.92) 100%); z-index:-1; }
.ig-hero-bg .ig-role { background:rgba(255,255,255,.95); backdrop-filter:blur(6px); }
.ig-hero-bg.ig-fullbleed { width:100vw; position:relative; left:50%; right:50%; margin-left:-50vw; margin-right:-50vw; border-radius:0; min-height:calc(100vh - 64px); display:flex; flex-direction:column; align-items:center; justify-content:center; }
@media (max-width:640px) { .ig-hero-bg { border-radius:20px; } .ig-hero-bg.ig-fullbleed { border-radius:0; min-height:calc(100svh - 64px); } }

.ig-card { background:var(--white); border:1.5px solid var(--line); border-radius:16px; }
.ig-section-title { font-family:'Inter',system-ui,sans-serif; font-size:26px; font-weight:600; margin:0 0 4px; }
.ig-muted { color:var(--ink-soft); font-size:14px; }

/* Sélecteur resto */
.ig-resto-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px; margin-top:20px; }
.ig-resto { background:var(--white); border:1.5px solid var(--line); border-radius:13px; padding:16px 18px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; transition:all .15s; text-align:left; }
.ig-resto:hover { border-color:var(--coral); background:#fff; }
.ig-resto .nm { font-weight:600; font-size:15px; }
.ig-resto .ct { font-size:12px; color:var(--ink-soft); }

/* Recherche salarié */
.ig-search { position:relative; margin-top:18px; max-width:440px; }
.ig-search input { width:100%; padding:13px 14px 13px 42px; border:1.5px solid var(--line); border-radius:12px; font-size:15px; font-family:'Inter'; background:var(--white); color:var(--ink); }
.ig-search input:focus { outline:none; border-color:var(--sea); }
.ig-search svg { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--ink-soft); }
.ig-emp-list { margin-top:14px; display:flex; flex-direction:column; gap:8px; max-height:420px; overflow:auto; }
.ig-emp-row { background:var(--white); border:1.5px solid var(--line); border-radius:11px; padding:12px 15px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all .12s; }
.ig-emp-row:hover { border-color:var(--coral); }
.ig-emp-row .nm { font-weight:600; }
.ig-emp-row .meta { font-size:12.5px; color:var(--ink-soft); }
.ig-badge { font-size:11px; font-weight:700; padding:3px 9px; border-radius:999px; background:var(--sand-2); color:var(--ink-soft); letter-spacing:.3px; }
.ig-badge.h42 { background:#FBE2DC; color:var(--coral-d); }
.ig-badge.h35 { background:#D6E9EB; color:var(--sea); }

/* Barre semaine */
.ig-weekbar { display:flex; align-items:center; gap:12px; margin:18px 0; }
.ig-weekbar .lbl { font-family:'Inter',system-ui,sans-serif; font-size:18px; font-weight:600; }

/* Planning grille */
.ig-planning { width:100%; border-collapse:separate; border-spacing:0; margin-top:8px; }
.ig-planning th { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--ink-soft); font-weight:700; padding:10px 8px; text-align:center; border-bottom:2px solid var(--line); }
.ig-planning th.who { text-align:left; padding-left:14px; min-width:160px; }
.ig-planning td { padding:8px; border-bottom:1px solid var(--line); text-align:center; vertical-align:middle; }
.ig-planning td.who { text-align:left; padding-left:14px; }
.ig-planning td.who .nm { font-weight:600; font-size:14px; }
.ig-planning td.who .po { font-size:11.5px; color:var(--ink-soft); }
.ig-cell { border-radius:9px; padding:6px 4px; font-size:12.5px; font-weight:600; min-height:38px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
.ig-cell.work { background:#EAF3F3; color:var(--sea); }
.ig-cell.off { background:var(--sand-2); color:var(--ink-soft); font-weight:700; }
.ig-cell.cp { background:#DCEAF5; color:#3A6EA5; font-weight:700; }
.ig-cell.demicp { background:#EAF0F5; color:#3A6EA5; }
.ig-cell.fin { background:#D9D9D9; min-height:38px; }
.ig-cell.am { background:#FCE5D6; color:#C2702A; font-weight:700; }
.ig-cell.sanssolde { background:#ECE4F3; color:#6B5B95; font-weight:700; }
.ig-cell .pz { font-size:10px; opacity:.7; font-weight:500; }
.ig-tot { font-family:'Inter',system-ui,sans-serif; font-weight:700; font-size:15px; }
.ig-tot small { font-family:'Inter'; font-size:11px; color:var(--ink-soft); font-weight:500; display:block; }

/* Pointage salarié */
.ig-clock-card { text-align:center; padding:30px; }
.ig-bigclock { font-family:'Inter',system-ui,sans-serif; font-size:54px; font-weight:600; letter-spacing:1px; }
.ig-clock-date { color:var(--ink-soft); font-size:15px; margin-bottom:24px; }
.ig-clock-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.ig-clock-btn { font-size:15px; padding:15px 26px; border-radius:13px; font-weight:700; border:none; cursor:pointer; min-width:140px; }
.ig-status-line { margin-top:22px; padding:14px; background:var(--sand); border-radius:12px; font-size:14px; }
.ig-stamp { display:inline-flex; align-items:center; gap:6px; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:5px 13px; margin:4px; font-size:13px; font-weight:600; }

/* Edition manager modal */
.ig-overlay { position:fixed; inset:0; background:rgba(21,48,59,.45); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
.ig-modal { background:var(--white); border-radius:18px; padding:24px; max-width:440px; width:100%; max-height:90vh; overflow-y:auto; }
.ig-modal h3 { font-family:'Inter',system-ui,sans-serif; font-size:22px; margin:0 0 4px; }
.ig-field { margin:14px 0; }
.ig-field label { display:block; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--ink-soft); margin-bottom:6px; }
.ig-field input, .ig-field select { width:100%; padding:11px 12px; border:1.5px solid var(--line); border-radius:10px; font-size:15px; font-family:'Inter'; background:#fff; color:var(--ink); }
.ig-field input:focus, .ig-field select:focus { outline:none; border-color:var(--sea); }
.ig-times { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.ig-editbtn { background:none; border:none; cursor:pointer; color:var(--ink-soft); font-size:11px; text-decoration:underline; padding:2px; }
.ig-editbtn:hover { color:var(--coral-d); }
.ig-cell-edit { cursor:pointer; }
.ig-cell-edit:hover { outline:2px solid var(--coral); outline-offset:1px; }

/* Émargement imprimable */
.ig-emarge { background:#fff; border:2px solid var(--ink); }
.ig-emarge-head { text-align:center; padding:14px; border-bottom:2px solid var(--ink); }
.ig-emarge-head h2 { font-family:'Inter',system-ui,sans-serif; font-size:24px; margin:0; letter-spacing:1px; }
.ig-emarge-head .sem { font-size:13px; margin-top:4px; }
.ig-emt { width:100%; border-collapse:collapse; font-size:11px; }
.ig-emt th, .ig-emt td { border:1px solid var(--ink); padding:4px 5px; }
.ig-emt th { background:var(--sand-2); font-weight:700; text-transform:uppercase; font-size:9.5px; letter-spacing:.4px; }
.ig-emt .who { text-align:left; min-width:90px; }
.ig-emt .daycell { height:52px; vertical-align:top; font-size:10px; position:relative; }
.ig-emt .hrs { font-weight:700; }
.ig-emt .pz { color:#555; font-size:9px; }
.ig-emt .sig { color:#aaa; font-size:8px; font-style:italic; }
.ig-emt .signed { color:var(--sea); font-weight:700; font-style:normal; }

@media print {
  .ig-noprint { display:none !important; }
  .ig-app { background:#fff; }
  .ig-emarge { border:2px solid #000; }
  .ig-print-only { display:block !important; }
  body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
}
.ig-print-only { display:none; }
.ig-extra-row { padding:14px 0; border-top:1px solid var(--sand-2); }
.ig-extra-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.ig-extra-saisie { display:flex; align-items:flex-end; gap:14px; flex-wrap:wrap; background:var(--sand-2); border-radius:14px; padding:14px; margin-top:10px; }
.ig-extra-champ { display:flex; flex-direction:column; gap:6px; }
.ig-extra-champ label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--ink-soft); }
.ig-extra-champ input[type=number] { width:110px; font-size:22px; font-weight:800; text-align:center; padding:12px 8px; border:2px solid var(--line); border-radius:12px; font-family:'Inter'; color:var(--ink); background:#fff; }
.ig-extra-champ input[type=number]:focus { outline:none; border-color:var(--sea); }
.ig-extra-champ input[type=number]:disabled { opacity:.4; }
.ig-extra-check { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:400; padding-bottom:13px; }
.ig-extra-check input { width:20px; height:20px; }
.ig-cell { border:1px solid transparent; border-radius:6px; padding:5px 7px; font-family:'Inter'; font-size:13px; background:transparent; color:var(--ink); }
.ig-cell:hover { border-color:var(--line); background:#fff; }
.ig-cell:focus { outline:none; border-color:var(--sea); background:#fff; }
@media (max-width:760px) {
  .ig-roles { grid-template-columns:1fr; }
  .ig-planning { font-size:11px; }
  .ig-planning th.who, .ig-planning td.who { min-width:110px; }
}
@media (max-width:640px) {
  .ig-extra-saisie { flex-direction:column; align-items:stretch; }
  .ig-extra-champ input[type=number] { width:100%; }
  .ig-extra-saisie .ig-btn { width:100%; justify-content:center; }
}
`;

// ---------- Barre de navigation semaine ----------
// Calendrier mensuel : choisir une date pour sauter directement à sa semaine.
function MonthCalendar({ semDate, onPick, onClose }) {
  const lundiSel = lundiDeLaSemaine(semDate);
  const [moisRef, setMoisRef] = useState(() => {
    const d = new Date(semDate); d.setDate(1); d.setHours(0,0,0,0); return d;
  });

  const annee = moisRef.getFullYear();
  const mois = moisRef.getMonth();
  const nomMois = moisRef.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  // Première case = lundi de la semaine contenant le 1er du mois.
  const premier = new Date(annee, mois, 1);
  const debutGrille = lundiDeLaSemaine(premier);
  const cases = [];
  for (let i = 0; i < 42; i++) cases.push(ajouterJours(debutGrille, i));

  function memeSemaine(d) {
    return cleSemaine(d) === cleSemaine(semDate);
  }
  function changerMois(delta) {
    setMoisRef(new Date(annee, mois + delta, 1));
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" style={{maxWidth:360}} onClick={(e)=>e.stopPropagation()}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>changerMois(-1)}>‹</button>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:18,fontWeight:600,textTransform:'capitalize'}}>{nomMois}</div>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>changerMois(1)}>›</button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
          {JOURS_COURT.map((j)=>(<div key={j} style={{textAlign:'center',fontSize:10,fontWeight:700,color:'var(--ink-soft)',textTransform:'uppercase'}}>{j}</div>))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
          {cases.map((d,i)=>{
            const horsMois = d.getMonth() !== mois;
            const sel = memeSemaine(d);
            return (
              <button key={i} onClick={()=>{ onPick(new Date(d)); onClose(); }}
                style={{padding:'9px 0',borderRadius:8,fontSize:13,fontWeight:sel?700:500,cursor:'pointer',border:'none',
                  background: sel ? 'var(--sea)' : 'transparent',
                  color: sel ? '#fff' : (horsMois ? 'var(--line)' : 'var(--ink)')}}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
        <div className="ig-muted" style={{fontSize:12,marginTop:12,textAlign:'center'}}>Cliquez un jour pour ouvrir la semaine correspondante.</div>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{width:'100%',marginTop:10}} onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}

function WeekNav({ semDate, setSemDate }) {
  const [calOuvert, setCalOuvert] = useState(false);
  const lundi = lundiDeLaSemaine(semDate);
  const dimanche = ajouterJours(lundi, 6);
  return (
    <div className="ig-weekbar ig-noprint">
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={() => setSemDate(ajouterJours(lundi, -7))}>‹ Précédente</button>
      <span className="lbl">Semaine du {fmtDate(lundi)} au {fmtDate(dimanche)}</span>
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={() => setSemDate(ajouterJours(lundi, 7))}>Suivante ›</button>
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={() => setCalOuvert(true)}><Icon.Calendar width={15} height={15}/> Choisir une date</button>
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={() => setSemDate(new Date())}>Cette semaine</button>
      {calOuvert && <MonthCalendar semDate={semDate} onPick={setSemDate} onClose={()=>setCalOuvert(false)} />}
    </div>
  );
}

// ---------- Cellule de planning ----------
function PlanningCell({ p, editable, onClick }) {
  if (!p || p.statut === STATUTS.OFF || p.statut === STATUTS.REPOS) {
    return (
      <div className={"ig-cell off" + (editable ? " ig-cell-edit" : "")} onClick={onClick}>OFF</div>
    );
  }
  if (p.statut === STATUTS.CP) {
    return <div className={"ig-cell cp" + (editable ? " ig-cell-edit" : "")} onClick={onClick}>CP</div>;
  }
  if (p.statut === STATUTS.AM) {
    return <div className={"ig-cell am" + (editable ? " ig-cell-edit" : "")} onClick={onClick}>AM</div>;
  }
  if (p.statut === STATUTS.SANS_SOLDE) {
    return <div className={"ig-cell sanssolde" + (editable ? " ig-cell-edit" : "")} onClick={onClick}>CSS</div>;
  }
  if (p.statut === STATUTS.DEMI_CP) {
    return (
      <div className={"ig-cell demicp" + (editable ? " ig-cell-edit" : "")} onClick={onClick}>
        <span>{p.debut}–{p.fin}</span>
        <span className="pz">½ CP {p.demi === "am" ? "(matin off)" : "(aprèm off)"}</span>
      </div>
    );
  }
  if (p.statut === STATUTS.FIN) {
    return <div className={"ig-cell fin" + (editable ? " ig-cell-edit" : "")} onClick={onClick}></div>;
  }
  return (
    <div className={"ig-cell work" + (editable ? " ig-cell-edit" : "")} onClick={onClick}>
      <span>{p.debut}–{p.fin}</span>
      {p.coupure && p.debut2 && p.fin2 ? <span>{p.debut2}–{p.fin2}</span> : null}
      {p.pause ? <span className="pz">{p.pause}h pause</span> : null}
    </div>
  );
}

// ---------- Modal d'édition d'un créneau (manager) ----------
function EditModal({ jour, jourLabel, emp, p, shifts, onSave, onClose }) {
  const [statut, setStatut] = useState(p.statut || STATUTS.TRAVAIL);
  const [debut, setDebut] = useState(p.debut || "09:00");
  const [fin, setFin] = useState(p.fin || "17:00");
  const [pause, setPause] = useState(p.pause ?? 1);
  const [demi, setDemi] = useState(p.demi || "am"); // 'am' = matin off, 'pm' = après-midi off
  const [coupure, setCoupure] = useState(!!p.coupure); // service fractionné (deux créneaux)
  const [debut2, setDebut2] = useState(p.debut2 || "18:00");
  const [fin2, setFin2] = useState(p.fin2 || "22:00");

  // À la bascule vers demi-CP, propose des horaires de demi-journée cohérents.
  function changerStatut(val) {
    setStatut(val);
    if (val === STATUTS.DEMI_CP) {
      setPause(0);
      setCoupure(false); // pas de coupure sur une demi-journée
      if (demi === "am") { setDebut("13:00"); setFin("17:00"); }
      else { setDebut("09:00"); setFin("13:00"); }
    }
  }
  function changerDemi(val) {
    setDemi(val);
    if (val === "am") { setDebut("13:00"); setFin("17:00"); }
    else { setDebut("09:00"); setFin("13:00"); }
  }
  // Aperçu du total d'heures pour ce jour (hors pause), tient compte de la coupure.
  const apercu = dureeJour({ statut, debut, fin, pause, coupure, debut2, fin2 });

  // Applique un shift prêt à l'emploi (ex : "matin" 09:00-17:00) : remplit directement les
  // horaires, en repassant en statut Travail et sans coupure (un shift = un seul créneau).
  function appliquerShift(s) {
    setStatut(STATUTS.TRAVAIL);
    setCoupure(false);
    setDebut(s.debut);
    setFin(s.fin);
    setPause(s.pause);
  }

  const montreHoraires = statut === STATUTS.TRAVAIL || statut === STATUTS.DEMI_CP;
  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{emp.p} {emp.n}</h3>
        <div className="ig-muted">{jourLabel} · {emp.po}</div>
        <div className="ig-field">
          <label>Statut du jour</label>
          <select value={statut} onChange={(e) => changerStatut(e.target.value)}>
            <option value={STATUTS.TRAVAIL}>Travail</option>
            <option value={STATUTS.OFF}>OFF (repos)</option>
            <option value={STATUTS.CP}>CP (congé payé)</option>
            <option value={STATUTS.DEMI_CP}>Demi-CP (demi-journée)</option>
            <option value={STATUTS.AM}>AM (arrêt maladie)</option>
            <option value={STATUTS.SANS_SOLDE}>Congé sans solde (CSS)</option>
          </select>
        </div>
        {montreHoraires && shifts && shifts.length > 0 && (
          <div className="ig-field">
            <label>Shifts prêts à l'emploi</label>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {shifts.map((s) => (
                <button key={s.id} type="button" className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>appliquerShift(s)} title={`${s.debut}–${s.fin} · ${s.pause}h pause`}>⚡ {s.nom}</button>
              ))}
            </div>
          </div>
        )}
        {statut === STATUTS.DEMI_CP && (
          <div className="ig-field">
            <label>Demi-journée de congé</label>
            <select value={demi} onChange={(e) => changerDemi(e.target.value)}>
              <option value="am">Matin en congé (travaille l'après-midi)</option>
              <option value="pm">Après-midi en congé (travaille le matin)</option>
            </select>
          </div>
        )}
        {montreHoraires && (
          <>
            <div className="ig-field">
              <label>{statut === STATUTS.DEMI_CP ? "Horaires de la demi-journée travaillée" : (coupure ? "Premier créneau" : "Horaires")}</label>
              <div className="ig-times">
                <div>
                  <input type="time" value={debut} onChange={(e) => setDebut(e.target.value)} />
                  <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Début</div>
                </div>
                <div>
                  <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
                  <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Fin</div>
                </div>
                <div>
                  <input type="number" min="0" max="4" step="0.5" value={pause} onChange={(e) => setPause(parseFloat(e.target.value) || 0)} />
                  <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Pause (h)</div>
                </div>
              </div>
            </div>
            {statut === STATUTS.TRAVAIL && (
              <div className="ig-field" style={{marginBottom: coupure ? 8 : 14}}>
                <label style={{display:'flex',alignItems:'center',gap:8,textTransform:'none',letterSpacing:0,fontSize:14,cursor:'pointer'}}>
                  <input type="checkbox" checked={coupure} onChange={(e)=>setCoupure(e.target.checked)} style={{width:'auto'}} />
                  Coupure : deux créneaux dans la journée
                </label>
              </div>
            )}
            {statut === STATUTS.TRAVAIL && coupure && (
              <div className="ig-field">
                <label>Second créneau (après la coupure)</label>
                <div className="ig-times">
                  <div>
                    <input type="time" value={debut2} onChange={(e) => setDebut2(e.target.value)} />
                    <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Reprise</div>
                  </div>
                  <div>
                    <input type="time" value={fin2} onChange={(e) => setFin2(e.target.value)} />
                    <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Fin</div>
                  </div>
                  <div></div>
                </div>
              </div>
            )}
            <div className="ig-muted" style={{fontSize:13,marginTop:2}}>Total travaillé ce jour : <b>{fmtHeures(apercu)}</b></div>
          </>
        )}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={() => onSave({ statut, debut, fin, pause, demi, coupure, debut2, fin2 })}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Export PayFit (congés / absences) ----------
// Reconstruit la structure exacte du modèle d'import PayFit fourni par le manager :
// 33 colonnes (A à AG), 2 lignes d'en-tête groupées par type d'absence. Seules les
// colonnes CP (E-H) et Congé sans solde (M-R) sont renseignées (portée demandée) ; les
// autres (RTT, Repos, Télétravail, École) restent présentes mais vides, comme le modèle.
const PAYFIT_ENTETES_GROUPES = [
  ["", 4], ["Ajout de congés payés", 4], ["Ajout de RTT", 4],
  ["Ajout de congés sans solde / Absences Injustifiées", 6], ["Ajout de repos", 7],
  ["Ajout de télétravail", 4], ["Ajout de jours d'école", 4],
];
const PAYFIT_ENTETES_COLONNES = [
  "Identifiant (ne pas modifier)", "Analytiques", "Matricule", "Collaborateur",
  "Début CP (date)", "Début CP (choix)", "Fin CP (date)", "Fin CP (choix - ne pas remplir pour un CP d'une journée ou moins)",
  "Début RTT (date)", "Début RTT (choix)", "Fin RTT (date)", "Fin RTT (choix - ne pas remplir pour un RTT d'une journée ou moins)",
  "Type d'absence", "Absence injustifiée", "Début CSS/Absence In. (date)", "Début CSS/Absence In. (choix)", "Fin CSS/Absence In. (date)", "Fin CSS/Absence In. (choix - ne pas remplir pour une absence d'une journée ou moins)",
  "Nature de l'évènement", "Début Repos ( date )", "Début Repos ( choix )", "Fin Repos ( date )", "Fin Repos ( choix - ne pas remplir pour un repos d'une journée ou moins)", "Solde à débiter", "Heures à décompter",
  "Début Télé. (date)", "Début Télé. (choix)", "Fin Télé. (date)", "Fin Télé. (choix - ne pas remplir pour un télétravail d'une journée ou moins)",
  "Début école (date)", "Début école (choix)", "Fin école (date)", "Fin école (choix)",
];
function fmtDatePayFit(d) {
  const jj = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${jj}/${mm}/${d.getFullYear()}`;
}
// Construit et déclenche le téléchargement du fichier d'import PayFit pour une liste
// d'absences [{ emp, date (Date), type: 'CP'|'CSS', choix }]. "mapping" (idSalarie ->
// [identifiant, matricule]) : PAYFIT_IDS par défaut, mais l'appelant peut passer la
// correspondance tenue à jour dans l'appli (Store "payfit_mapping"), qui prime dessus.
// Retourne les noms des salariés sans identifiant PayFit connu (à compléter à la main).
function exporterCongesPayFit(lignesAbsences, nomFichier, mapping) {
  const table = mapping || PAYFIT_IDS;
  const aoa = [];
  const ligne1 = [];
  PAYFIT_ENTETES_GROUPES.forEach(([label, n]) => { ligne1.push(label); for (let i = 1; i < n; i++) ligne1.push(""); });
  aoa.push(ligne1);
  aoa.push(PAYFIT_ENTETES_COLONNES);

  const manquants = new Set();
  lignesAbsences.forEach(({ emp, date, type, choix }) => {
    const row = new Array(33).fill("");
    const id = idSalarie(emp);
    const pf = table[id];
    row[0] = pf ? pf[0] : "";
    row[2] = pf ? pf[1] : "";
    row[3] = `${emp.p} ${emp.n}`;
    if (!pf) manquants.add(`${emp.p} ${emp.n}`);
    // PayFit exige une date de fin même pour une seule journée (contrairement à ce que
    // dit l'étiquette du modèle "ne pas remplir pour...") : on remplit donc Fin = Début.
    const dateStr = fmtDatePayFit(date);
    if (type === "CP") {
      row[4] = dateStr; row[5] = choix;   // Début CP (date) / (choix)
      row[6] = dateStr; row[7] = choix;   // Fin CP (date) / (choix)
    } else if (type === "CSS") {
      row[12] = "Congé sans solde"; row[13] = "Non"; // Type d'absence / Absence injustifiée
      row[14] = dateStr; row[15] = "Journée entière"; // Début CSS (date) / (choix)
      row[16] = dateStr; row[17] = "Journée entière"; // Fin CSS (date) / (choix)
    }
    aoa.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!merges"] = [];
  let col = 0;
  PAYFIT_ENTETES_GROUPES.forEach(([, n]) => {
    if (n > 1) ws["!merges"].push({ s: { r: 0, c: col }, e: { r: 0, c: col + n - 1 } });
    col += n;
  });
  ws["!cols"] = PAYFIT_ENTETES_COLONNES.map((_, i) => ({ wch: i === 0 ? 26 : 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Page 1");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomFichier;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return [...manquants];
}

// ============================================================================
//  Extras (prêt de main-d'œuvre entre établissements)
// ============================================================================
// Reprend le circuit papier existant : un directeur qui a besoin d'un extra pour une
// soirée choisit un salarié d'un AUTRE établissement du groupe ; l'appli génère aussitôt
// (avant le service, comme l'exige le Code du travail) le contrat de prêt de main-d'œuvre
// et l'avenant du salarié. Une fois la soirée passée, le directeur saisit les heures
// réellement faites : les mêmes champs que l'ancien formulaire Google (établissement,
// date, nom/prénom, établissement d'origine, heures, taux net, "sur heures d'origine ?").

function fmtEuro(n) {
  return (Number(n) || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

// Constantes reprises telles quelles du fichier Excel historique (taux net -> brut, puis
// brut -> coût total employeur pour une prime exceptionnelle). Ne pas modifier sans
// revalider avec la compta / PayFit.
const EXTRA_NET_VERS_BRUT = 1.2667;
const EXTRA_BRUT_VERS_COUT_TOTAL = 1.4444;
function calculExtra(heures, tauxNet, surHeuresOrigine) {
  const h = Number(heures) || 0, t = Number(tauxNet) || 0;
  if (surHeuresOrigine) return { tauxBrut: 0, primeNet: 0, primeBrute: 0, primeCoutTotal: 0 };
  const tauxBrut = t * EXTRA_NET_VERS_BRUT;
  return { tauxBrut, primeNet: h * t, primeBrute: h * tauxBrut, primeCoutTotal: tauxBrut * EXTRA_BRUT_VERS_COUT_TOTAL * h };
}

// Fiches juridiques connues des établissements du groupe (raison sociale, SIRET, adresse...),
// fournies par la direction — pré-remplies pour que les managers n'aient jamais à les ressaisir.
// Une fiche enregistrée manuellement (Store, ex: nouvel établissement) reste prioritaire.
const ETABLISSEMENTS_JURIDIQUE_DEFAUT = {
  "INDIE BEACH": { raisonSociale: "SAS INDIE BEACH", adresse: "Plage de Pampelonne", cp: "83350", ville: "RAMATUELLE", capital: "7 600 €", rcs: "Fréjus 451 201 875", siret: "45120187500023", ape: "5610A" },
  "CAFE DE L ORMEAU": { raisonSociale: "SAS CAFE DE L'ORMEAU", adresse: "4 Place de l'Ormeau", cp: "83350", ville: "RAMATUELLE", capital: "10 000 €", rcs: "Fréjus 904 440 971", siret: "90444097100029", ape: "5630Z" },
  "CAT CLUB": { raisonSociale: "SAS CLUB 5 - CAT CLUB", adresse: "168 Rue Park City", cp: "73120", ville: "COURCHEVEL 1850", capital: "10 000 €", rcs: "Fréjus 933 084 667", siret: "93308466700023", ape: "5630Z" },
  "CHERRY": { raisonSociale: "SAS CHERRY", adresse: "22 Rue du Portalet", cp: "83990", ville: "SAINT TROPEZ", capital: "2 310 000 €", rcs: "Fréjus 952 030 427", siret: "95203042700027", ape: "5610A" },
  "CHERRY PARIS": { raisonSociale: "SAS CHERRY PARIS", adresse: "1 Rue du Sabot", cp: "75006", ville: "PARIS", capital: "10 000 €", rcs: "Fréjus 924 949 563", siret: "92494956300036", ape: "5510Z" },
  "JCP LA SAUVAGEONNE MEGEVE": { raisonSociale: "SAS JCP LA SAUVAGEONNE", adresse: "170 Route Edmond de Rothschild", cp: "74120", ville: "MEGEVE", capital: "8 000 €", rcs: "Annecy 843 540 634", siret: "84354063400014", ape: "5610A" },
  "LA SAUVAGEONNE": { raisonSociale: "SAS LA SAUVAGEONNE", adresse: "Route de Bonne Terasse", cp: "83350", ville: "RAMATUELLE", capital: "2 500 €", rcs: "Fréjus 899 054 480", siret: "89905448000020", ape: "5610A" },
  "PABLO": { raisonSociale: "SAS PABLO", adresse: "5 Place Carnot", cp: "83990", ville: "SAINT TROPEZ", capital: "2 000 €", rcs: "Fréjus 793 263 146", siret: "79326314600037", ape: "5610A" },
  "PLAYAMIGOS": { raisonSociale: "SARL SOLIFER - PLAYAMIGOS", adresse: "Plage de Pampelonne", cp: "83350", ville: "RAMATUELLE", capital: "10 000 €", rcs: "Fréjus 844 621 284", siret: "84462128400018", ape: "5610A" },
  "INDIE GROUP BUREAU": { raisonSociale: "SAS INDIE GROUP", adresse: "104 Rue du Tibouren", cp: "83350", ville: "RAMATUELLE", capital: "921 800 €", rcs: "Fréjus 898 682 307", siret: "89868230700035", ape: "7010Z" },
  "PABLO SAINT BARTH": { raisonSociale: "SAS 2H-PABLO", adresse: "15 Rue du bord de mer", cp: "97133", ville: "GUSTAVIA", capital: "1 000 €", rcs: "Basse Terre 897 849 915", siret: "89784991500037", ape: "5610A" },
  "CAFE FLORA": { raisonSociale: "SARL LAKICLAC - CAFE FLORA", adresse: "Toison d'Or, chemin des tamaris", cp: "83350", ville: "RAMATUELLE", capital: "1 000 €", rcs: "Fréjus 898 332 242", siret: "89833224200020", ape: "5610A" },
};
const EtablissementsJuridique = {
  async load() { return { ...ETABLISSEMENTS_JURIDIQUE_DEFAUT, ...((await Store.get(kEtablissementsJuridique)) || {}) }; },
  async save(tous) { await Store.set(kEtablissementsJuridique, tous); },
};

// Style commun aux documents juridiques imprimés (contrat + avenant).
const STYLE_CONTRAT = `
  h1 { font-size:16px; letter-spacing:.5px; }
  .sub { display:none; }
  p, li { font-size:12.5px; line-height:1.55; text-align:justify; margin:0 0 8px; }
  h2 { font-size:13px; margin:18px 0 6px; }
  .parties { display:flex; gap:24px; margin:14px 0; }
  .partie { flex:1; font-size:12.5px; line-height:1.5; }
  .partie b { display:block; margin-bottom:2px; }
  .signatures { display:flex; gap:18px; margin-top:46px; }
  .signatures div { flex:1; font-size:12px; text-align:center; }
  .signatures div .ligne { margin-top:56px; border-top:1px solid #15303B; padding-top:4px; }
  .manque { color:#B23A2E; font-weight:700; }
`;

function valEtab(j, champ) { return (j && j[champ]) ? esc(j[champ]) : `<span class="manque">[${champ} à compléter]</span>`; }

// Construit le corps HTML du contrat de prêt de main-d'œuvre (entre les deux sociétés),
// conforme aux articles L.8241-1 et suivants du Code du travail (prêt à but non lucratif).
function construireContratPretHTML({ origineJ, destJ, salarie, poste, date, dateGeneration }) {
  const dateFr = fmtDate(new Date(date + "T00:00:00"));
  const genFr = fmtDate(dateGeneration);
  return `
    <h1>CONTRAT DE PRÊT DE MAIN-D'ŒUVRE</h1>
    <p style="text-align:center">Entre les soussignées :</p>
    <div class="parties">
      <div class="partie"><b>La société prêteuse (établissement d'origine du salarié)</b>
        ${valEtab(origineJ,'raisonSociale')}<br>${valEtab(origineJ,'adresse')}<br>${valEtab(origineJ,'cp')} ${valEtab(origineJ,'ville')}<br>
        Au capital de ${valEtab(origineJ,'capital')}<br>RCS ${valEtab(origineJ,'rcs')}<br>SIRET : ${valEtab(origineJ,'siret')}<br>APE ${valEtab(origineJ,'ape')}<br>
        ci-après « l'Entreprise prêteuse »</div>
      <div class="partie"><b>La société utilisatrice (établissement d'accueil pour la soirée)</b>
        ${valEtab(destJ,'raisonSociale')}<br>${valEtab(destJ,'adresse')}<br>${valEtab(destJ,'cp')} ${valEtab(destJ,'ville')}<br>
        Au capital de ${valEtab(destJ,'capital')}<br>RCS ${valEtab(destJ,'rcs')}<br>SIRET : ${valEtab(destJ,'siret')}<br>APE ${valEtab(destJ,'ape')}<br>
        ci-après « l'Entreprise utilisatrice »</div>
    </div>
    <p><b>IL A ÉTÉ CONVENU CE QUI SUIT :</b></p>
    <h2>Article 1 – Cadre juridique</h2>
    <p>Le présent contrat est conclu conformément aux articles L.8241-1 et suivants du Code du travail, dans le cadre d'un prêt de main-d'œuvre à but non lucratif. L'Entreprise prêteuse met temporairement à disposition de l'Entreprise utilisatrice un de ses salariés, sans facturation de marge bénéficiaire.</p>
    <h2>Article 2 – Salarié concerné</h2>
    <p>Le salarié mis à disposition est : <b>${esc(salarie.p)} ${esc(salarie.n)}</b>.<br>
    Le salarié a donné son accord préalable à la présente mise à disposition.</p>
    <h2>Article 3 – Objet de la mise à disposition</h2>
    <p>La mise à disposition a pour objet de permettre au salarié d'exécuter une mission temporaire au sein de l'Entreprise utilisatrice afin de répondre à un besoin ponctuel d'activité. Le salarié exercera les fonctions suivantes : <b>${esc(poste)}</b>.</p>
    <h2>Article 4 – Durée de la mission</h2>
    <p>La mise à disposition est consentie pour la soirée du <b>${dateFr}</b>.<br>Date de début : ${dateFr} — Date de fin : ${dateFr}.<br>Toute prolongation devra faire l'objet d'un avenant écrit signé par l'ensemble des parties.</p>
    <h2>Article 5 – Conditions d'exécution du travail</h2>
    <p>Pendant la durée de la mise à disposition, le salarié demeure lié par son contrat de travail à l'Entreprise prêteuse. L'Entreprise utilisatrice est responsable des conditions d'exécution du travail, notamment en matière d'horaires, de sécurité, d'hygiène et de discipline. L'Entreprise prêteuse conserve l'autorité relative à la gestion administrative du contrat de travail (paie, congés, sanctions disciplinaires, rupture éventuelle du contrat).</p>
    <h2>Article 6 – Rémunération et charges sociales</h2>
    <p>L'Entreprise prêteuse demeure seule responsable du versement de la rémunération du salarié ainsi que du paiement des cotisations sociales afférentes. L'Entreprise utilisatrice remboursera à l'Entreprise prêteuse, sur présentation de justificatifs, le coût strictement supporté (salaire brut, charges sociales patronales, frais professionnels directement liés à la mission). Aucune marge, commission ou bénéfice ne sera appliqué.</p>
    <h2>Article 7 – Temps de travail</h2>
    <p>Le salarié effectuera un horaire de travail conforme aux usages et à la réglementation applicable au sein de l'Entreprise utilisatrice. Les heures effectuées seront validées par l'Entreprise utilisatrice et transmises à l'Entreprise prêteuse.</p>
    <h2>Article 8 – Responsabilité et assurances</h2>
    <p>L'Entreprise utilisatrice est responsable des conditions d'accueil et d'exécution de la mission, notamment en matière de santé et de sécurité au travail. Tout accident du travail devra être signalé sans délai à l'Entreprise prêteuse.</p>
    <h2>Article 9 – Confidentialité</h2>
    <p>Le salarié s'engage à respecter une obligation stricte de confidentialité concernant toutes les informations dont il pourrait avoir connaissance dans le cadre de sa mission au sein de l'Entreprise utilisatrice.</p>
    <h2>Article 10 – Résiliation anticipée</h2>
    <p>Le présent contrat pourra être résilié de manière anticipée d'un commun accord entre les parties, en cas de manquement grave de l'une des parties, ou en cas de force majeure. Toute résiliation anticipée devra être notifiée par écrit.</p>
    <h2>Article 11 – Droit applicable et litiges</h2>
    <p>Le présent contrat est soumis au droit français. Tout litige relatif à son interprétation ou à son exécution relèvera de la compétence des tribunaux territorialement compétents.</p>
    <p>Fait le ${genFr}, en trois exemplaires originaux.</p>
    <div class="signatures">
      <div>LE SALARIÉ<div class="ligne">${esc(salarie.p)} ${esc(salarie.n)}</div></div>
      <div>Pour l'Entreprise utilisatrice<div class="ligne">${valEtab(destJ,'raisonSociale')}</div></div>
      <div>Pour la société prêteuse<div class="ligne">${valEtab(origineJ,'raisonSociale')}</div></div>
    </div>`;
}

// Génère et enregistre (dans l'enregistrement extra lui-même) le contrat de prêt,
// horodaté au moment de la création de l'extra — donc avant la soirée, comme l'exige la loi.
// Pas de contrat quand l'extra se fait au sein du même établissement (pas de prêt entre sociétés).
function genererDocumentsExtra(extra, etabsJ) {
  if (extra.restoOrigine === extra.resto) return {};
  const origineJ = etabsJ[extra.restoOrigine] || null;
  const destJ = etabsJ[extra.resto] || null;
  const dateGeneration = new Date();
  const salarie = { n: extra.salarieNom, p: extra.salariePrenom };
  const contratHTML = construireContratPretHTML({ origineJ, destJ, salarie, poste: extra.poste, date: extra.date, dateGeneration });
  return { contratHTML, contratGenereAt: dateGeneration.toISOString() };
}

// Lieu de signature figurant sur les promesses d'embauche : celui du siège du groupe,
// indépendant de l'établissement concerné par l'offre (modifiable ici si besoin).
const LIEU_SIGNATURE_PROMESSE = "Ramatuelle";

// Style dédié à la promesse d'embauche, calqué sur la mise en page exacte du modèle fourni
// par Océane : logo centré en haut, bloc société aligné à gauche (raison sociale en style
// manuscrit, comme le "cherry" du modèle), titre centré souligné, date alignée à droite,
// puis le corps de la lettre. Délibérément distinct de STYLE_CONTRAT (paragraphes justifiés,
// sections numérotées) qui ne convenait pas à ce format.
const STYLE_PROMESSE = `
  h1 { font-size:16px; letter-spacing:.5px; text-decoration:underline; margin:30px 0 26px; }
  .logo { text-align:center; margin-bottom:30px; }
  .logo img { max-height:90px; }
  .raison-sociale { font-family:'Brush Script MT','Segoe Script',cursive; font-style:italic; font-size:22px; margin-bottom:10px; }
  .entete { text-align:left; font-size:12px; line-height:1.6; margin-bottom:28px; }
  .entete b { font-weight:700; }
  .date-lieu { text-align:right; font-size:13px; margin-bottom:18px; }
  p { font-size:13px; line-height:1.7; text-align:left; margin:0 0 14px; }
  .manque { color:#B23A2E; font-weight:700; }
  .signature { margin-top:34px; text-align:right; }
  .signature img { display:inline-block; max-height:110px; margin-top:6px; }
`;

// Construit le corps HTML d'une promesse d'embauche, sur le modèle du document fourni par
// Océane (PROMESSE_EMBAUCHE___CHERRY_PARIS.docx) : logo, en-tête société, civilité + identité
// du salarié, poste/établissement/date de début/type de contrat, rémunération, formule de
// politesse, puis la signature/tampon de l'établissement (si renseignées dans sa fiche
// juridique). Les champs manquants sont signalés en rouge plutôt que laissés silencieusement
// vides, comme pour le contrat de prêt de main-d'œuvre.
function construirePromesseEmbaucheHTML({ etabJ, salarie }) {
  const dateFr = fmtDate(new Date());
  const dateDebutFr = salarie.date_debut ? fmtDate(new Date(salarie.date_debut + "T00:00:00")) : '<span class="manque">[date de début à compléter]</span>';
  const typeContrat = (salarie.type_contrat || "").trim();
  const typeContratTxt = typeContrat
    ? (/^cdi$/i.test(typeContrat) ? "contrat à durée indéterminée" : /^cdd$/i.test(typeContrat) ? "contrat à durée déterminée" : typeContrat)
    : '<span class="manque">[type de contrat à compléter]</span>';
  const civilite = (salarie.civilite || "").trim();
  const salaire = (salarie.salaire_net !== null && salarie.salaire_net !== undefined && salarie.salaire_net !== "")
    ? `${esc(String(salarie.salaire_net))} € net par mois` : '<span class="manque">[salaire à compléter]</span>';
  const siren = etabJ && etabJ.siret ? etabJ.siret.replace(/\s+/g, "").slice(0, 9) : "";
  return `
    ${etabJ && etabJ.logo ? `<div class="logo"><img src="${etabJ.logo}" alt="Logo" /></div>` : ""}
    <div class="entete">
      <div class="raison-sociale">${valEtab(etabJ,'raisonSociale')}</div>
      ${valEtab(etabJ,'adresse')}<br>
      ${valEtab(etabJ,'cp')} ${valEtab(etabJ,'ville')}<br>
      Au capital de ${valEtab(etabJ,'capital')}<br>
      RCS ${valEtab(etabJ,'rcs')}<br>
      SIREN : ${siren ? esc(siren) : '<span class="manque">[SIREN à compléter]</span>'}<br>
      Code NAF : ${valEtab(etabJ,'ape')}
    </div>
    <h1 style="text-align:center">PROMESSE D'EMBAUCHE</h1>
    <div class="date-lieu">À ${esc(LIEU_SIGNATURE_PROMESSE)}, le ${dateFr}</div>
    <p>${civilite ? esc(civilite) + " " : ""}${esc((salarie.nom || "").toUpperCase())} ${esc(salarie.prenom || "")}</p>
    <p>Nous avons le plaisir de vous confirmer par la présente notre volonté de vous intégrer au sein de notre équipe en qualité de <b>${esc(salarie.poste || "")}</b> de <b>${esc(salarie.resto || "")}</b>, à compter du <b>${dateDebutFr}</b> en ${typeContratTxt}.</p>
    <p>La rémunération mensuelle associée à ce poste sera de <b>${salaire}</b>.</p>
    <p>Dans l'attente de vous accueillir officiellement au sein de notre structure, nous vous prions d'agréer, ${civilite || "Madame, Monsieur"}, l'expression de nos salutations distinguées.</p>
    <div class="signature">
      Signature de l'entreprise
      ${etabJ && etabJ.tampon ? `<br><img src="${etabJ.tampon}" alt="Signature" />` : '<div class="manque" style="margin-top:8px">[aucune signature/tampon enregistrée pour cet établissement]</div>'}
    </div>
  `;
}

// ---------- Import d'un planning existant depuis Excel ----------
// Lit un classeur au format "PLANNING N / PLANNING CUISINE N" (une feuille par petit
// groupe de salariés, tous pour la même semaine en général) : ligne 1 = semaine (dates),
// puis par salarié 2 lignes (NOM, PRENOM) x 7 jours de 3 colonnes (début / "h" / pause-ou-OFF).
// N'utilise XLSX.read() QUE sur un fichier que le superviseur choisit lui-même dans son
// propre navigateur — jamais sur un contenu externe non fiable.
function feuilleEnGrille(ws) {
  if (!ws["!ref"]) return [];
  const range = XLSX.utils.decode_range(ws["!ref"]);
  const grille = [];
  for (let r = range.s.r; r <= range.e.r; r++) {
    const ligne = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r, c })];
      ligne.push(cell ? cell.v : undefined);
    }
    grille.push(ligne);
  }
  (ws["!merges"] || []).forEach((m) => {
    const val = grille[m.s.r][m.s.c];
    for (let r = m.s.r; r <= m.e.r; r++) for (let c = m.s.c; c <= m.e.c; c++) grille[r][c] = val;
  });
  return grille;
}
// ---------- Mise à jour de la correspondance PayFit (identifiant + matricule) ----------
// Le manager peut réexporter, chaque mois, le modèle d'import vierge de PayFit (une ligne
// par salarié : Identifiant, Matricule, Collaborateur = "Prénom NOM"). On le relit ici pour
// tenir PAYFIT_IDS à jour sans repasser par du code — les nouveaux embauchés PayFit
// apparaissent, les identifiants changés sont corrigés.
// Ne cherche que PARMI LES SALARIÉS DU RESTAURANT choisi (fiche de base + ajouts) : évite
// tout mélange entre établissements (deux homonymes dans deux restos différents, etc.).
function matcherCollaborateurPayFit(nomComplet, resto, ajouts) {
  const cible = normTxt(nomComplet);
  const bassin = EMPLOYEES.concat(ajouts || []).filter((e) => normTxt(e.r) === normTxt(resto));
  const exact = bassin.find((e) => normTxt(e.p + " " + e.n) === cible || normTxt(e.n + " " + e.p) === cible);
  if (exact) return exact;
  const tokensSaisie = new Set(cible.split(" ").filter(Boolean));
  const candidats = bassin.filter((e) => {
    const nomTokens = normTxt(e.n).split(" ").filter(Boolean);
    const tousTokens = new Set(normTxt(e.p + " " + e.n).split(" ").filter(Boolean));
    const nomOk = nomTokens.length > 0 && nomTokens.every((t) => tokensSaisie.has(t));
    const saisieSousEnsemble = [...tokensSaisie].every((t) => tousTokens.has(t));
    return nomOk && saisieSousEnsemble && tokensSaisie.size >= nomTokens.length;
  });
  return candidats.length === 1 ? candidats[0] : null;
}
// Lit un ou plusieurs fichiers "import_conges_absences" PayFit (mêmes fichiers vierges que
// ceux déjà fournis), pour UN SEUL établissement à la fois. Repère la ligne d'en-têtes
// ("Collaborateur"/"Identifiant"/"Matricule") sur chaque feuille, quelle que soit sa position.
async function analyserMappingPayFit(files, resto, ajouts) {
  const trouves = {}; // idSalarie -> [identifiant, matricule]
  const nonReconnus = new Set();
  for (const file of files) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    for (const nomFeuille of wb.SheetNames) {
      const grille = feuilleEnGrille(wb.Sheets[nomFeuille]);
      let ligneEntete = -1, colId = -1, colMat = -1, colNom = -1;
      for (let r = 0; r < Math.min(grille.length, 6); r++) {
        const ligne = grille[r] || [];
        const idx = ligne.findIndex((v) => String(v || "").trim() === "Collaborateur");
        if (idx >= 0) {
          ligneEntete = r; colNom = idx;
          colId = ligne.findIndex((v) => String(v || "").includes("Identifiant"));
          colMat = ligne.findIndex((v) => String(v || "").trim() === "Matricule");
          break;
        }
      }
      if (ligneEntete < 0) continue; // pas une feuille de ce format, on l'ignore
      for (let r = ligneEntete + 1; r < grille.length; r++) {
        const ligne = grille[r] || [];
        const collaborateur = ligne[colNom];
        if (!collaborateur) continue;
        const emp = matcherCollaborateurPayFit(String(collaborateur), resto, ajouts);
        if (!emp) { nonReconnus.add(String(collaborateur)); continue; }
        trouves[idSalarie(emp)] = [colId >= 0 ? String(ligne[colId] || "") : "", colMat >= 0 ? String(ligne[colMat] || "") : ""];
      }
    }
  }
  return { trouves, nonReconnus: [...nonReconnus] };
}

// ---------- Feuille d'émargement (format du modèle papier) ----------
function EmargementSheet({ resto, semDate, planning, pointages, team, onToggleSignature, onToggleJour }) {
  const lundi = lundiDeLaSemaine(semDate);
  const dimanche = ajouterJours(lundi, 6);
  const withPlanning = team.filter((e) => planning[idSalarie(e)]);
  const list = withPlanning.length ? withPlanning : team;

  const [pdfEtat, setPdfEtat] = useState(""); // "" | message d'erreur

  function pointageJour(e, i) {
    const pt = pointages[idSalarie(e)];
    if (!pt) return null;
    return pt[i] || null;
  }

  // Génère le PDF via la fenêtre d'impression du navigateur (« Enregistrer au format PDF »).
  // Aucune librairie externe : fiable dans l'aperçu sandboxé, contrairement à jsPDF.
  function telechargerPDF() {
    const entetes = JOURS.map((j, i) => `<th>${j}<br><span style="font-weight:400">${fmtJour(ajouterJours(lundi, i))}</span></th>`).join("");
    const lignes = list.map((e) => {
      const pl = planning[idSalarie(e)];
      const tot = pl ? totalHebdo(pl) : 0;
      const jours = JOURS.map((j, i) => {
        const p = pl ? pl[i] : null;
        const pt = pointageJour(e, i);
        const signe = p && (p.statut === STATUTS.TRAVAIL || p.statut === STATUTS.DEMI_CP)
          ? !!(pt && pt.confirme) : undefined;
        return `<td class="daycell">${celluleHTML(p, { signe })}</td>`;
      }).join("");
      const ptAll = pointages[idSalarie(e)];
      const signee = ptAll && ptAll.semaine && ptAll.semaine.signee;
      const totCell = `${pl ? fmtHeures(tot) : "—"}${signee ? '<div class="sig signed">✓ semaine validée</div>' : '<div class="sig">signature ____</div>'}`;
      return `<tr><td class="who"><b>${esc(e.n)}</b><br>${esc(e.p)}</td>${jours}<td class="daycell" style="text-align:center;font-weight:700">${totCell}</td></tr>`;
    }).join("");
    const corps = `
      <h1>ÉMARGEMENT — ${esc(resto)}</h1>
      <div class="sub">Semaine du ${fmtDate(lundi)} au ${fmtDate(dimanche)}</div>
      <table>
        <thead><tr><th class="who">Nom / Prénom</th>${entetes}<th>Total hebdo</th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>`;
    const styles = `
      table { width:100%; border-collapse:collapse; font-size:10px; }
      th,td { border:1px solid #15303B; padding:4px 5px; text-align:center; vertical-align:top; }
      th { background:#E8DDC9; font-size:9px; text-transform:uppercase; letter-spacing:.4px; }
      td.who { text-align:left; min-width:90px; }
      .daycell { height:50px; }
      .hrs { font-weight:700; } .pz { font-size:9px; color:#555; }
      .sig { color:#aaa; font-size:8px; font-style:italic; }
      .sig.signed { color:#2E7D86; font-weight:700; font-style:normal; }`;
    const ok = imprimerDocument(`Emargement ${resto}`, corps, styles, `Emargement_${slugKey(resto)}_${dateISOLocale(lundi)}`);
    if (ok === false) setPdfEtat("Impossible de générer le document. Réessayez.");
    else if (ok === "download") setPdfEtat("Le fichier a été téléchargé. Ouvrez-le, puis choisissez « Enregistrer au format PDF » à l'impression.");
    else setPdfEtat("");
  }

  return (
    <div>
      <div className="ig-noprint" style={{marginBottom:12,display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <button className="ig-btn ig-btn-ink" onClick={telechargerPDF}><Icon.Print/> Télécharger en PDF</button>
        <span className="ig-muted">Une fenêtre d'impression s'ouvre : choisissez « Enregistrer au format PDF » comme destination. Glissez ensuite le fichier dans le dossier Drive du restaurant.</span>
      </div>
      {pdfEtat && <div className="ig-status-line ig-noprint" style={{marginBottom:12,color:'var(--coral-d)'}}>{pdfEtat}</div>}
      <div className="ig-emarge">
        <div className="ig-emarge-head">
          <h2>ÉMARGEMENT — {resto}</h2>
          <div className="sem">SEMAINE DU {fmtDate(lundi)} AU {fmtDate(dimanche)}</div>
        </div>
        <table className="ig-emt">
          <thead>
            <tr>
              <th className="who">Nom / Prénom</th>
              {JOURS.map((j,i)=>(<th key={j}>{j}<br/><span style={{fontWeight:400}}>{fmtJour(ajouterJours(lundi,i))}</span></th>))}
              <th>Total<br/>hebdo</th>
            </tr>
          </thead>
          <tbody>
            {list.map((e)=>{
              const pl = planning[idSalarie(e)];
              const tot = pl ? totalHebdo(pl) : 0;
              return (
                <tr key={idSalarie(e)}>
                  <td className="who">
                    <b>{e.n}</b><br/>{e.p}
                  </td>
                  {JOURS.map((j,i)=>{
                    const p = pl ? pl[i] : null;
                    const pt = pointageJour(e,i);
                    if (!p || p.statut===STATUTS.OFF) return <td key={i} className="daycell"><b>OFF</b></td>;
                    if (p.statut===STATUTS.CP) return <td key={i} className="daycell"><b>CP</b></td>;
                    if (p.statut===STATUTS.AM) return <td key={i} className="daycell"><b>AM</b></td>;
                    if (p.statut===STATUTS.SANS_SOLDE) return <td key={i} className="daycell"><b>CSS</b></td>;
                    if (p.statut===STATUTS.FIN) return <td key={i} className="daycell" style={{background:'#D9D9D9'}}></td>;
                    return (
                      <td key={i} className="daycell">
                        <div className="hrs">{p.debut} – {p.fin}</div>
                        {p.statut===STATUTS.DEMI_CP ? <div className="pz">½ CP {p.demi==="am"?"(matin off)":"(aprèm off)"}</div> : (p.pause?<div className="pz">{p.pause}h pause</div>:null)}
                        {pt && pt.confirme ? (
                          <div className="sig signed">✓ confirmé</div>
                        ) : (
                          <div className="sig">signature ____</div>
                        )}
                        {onToggleJour && (
                          <button
                            className="ig-noprint ig-btn ig-btn-ghost ig-btn-sm"
                            style={{marginTop:4,fontSize:10,padding:'1px 6px'}}
                            onClick={() => onToggleJour(e, i, p)}
                            title={pt && pt.confirme ? "Annuler la confirmation de ce jour" : "Confirmer ce jour à la place du salarié"}
                          >
                            {pt && pt.confirme ? "Annuler" : "Confirmer"}
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="daycell" style={{textAlign:'center',fontWeight:700,fontSize:13}}>
                    {pl?fmtHeures(tot):'—'}
                    {(() => {
                      const ptAll = pointages[idSalarie(e)];
                      const signee = ptAll && ptAll.semaine && ptAll.semaine.signee;
                      return (
                        <>
                          {signee
                            ? <div className="sig signed" style={{marginTop:6}}>✓ semaine validée</div>
                            : <div className="sig" style={{marginTop:6}}>signature ____</div>}
                          {onToggleSignature && (
                            <button
                              className="ig-noprint ig-btn ig-btn-ghost ig-btn-sm"
                              style={{marginTop:6,fontSize:11,padding:'2px 8px'}}
                              onClick={() => onToggleSignature(e)}
                              title={signee ? "Annuler la validation de cette semaine" : "Valider cette semaine à la place du salarié (ex : oubli, salarié parti avant dimanche)"}
                            >
                              {signee ? "Dévalider" : "Valider pour lui"}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Modal Gestion d'un salarié (manager) ----------
function GestionModal({ emp, semDate, depart, peutSupprimerDef, onMarquer, onSupprimer, onSupprimerDef, onAnnulerDepart, onModifier, onClose }) {
  const [mode, setMode] = useState(null); // 'cp' | 'am' | 'suppr' | 'supprdef' | 'modifier'
  const [jours, setJours] = useState([]); // index 0..6 sélectionnés
  const [dateFin, setDateFin] = useState(""); // date de fin de contrat saisie
  const [mPrenom, setMPrenom] = useState(emp.p);
  const [mNom, setMNom] = useState(emp.n);
  const [mPoste, setMPoste] = useState(emp.po);
  const [mUnite, setMUnite] = useState(emp.u);
  const [mHeures, setMHeures] = useState(emp.h);
  const [mDebut, setMDebut] = useState(emp._debut || "");
  const [mErr, setMErr] = useState(false);
  const lundi = lundiDeLaSemaine(semDate);

  function toggleJour(i) {
    setJours((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{emp.p} {emp.n}</h3>
        <div className="ig-muted">{emp.po} · {emp.h}h · {emp.r}</div>

        {depart && (
          <div className="ig-status-line" style={{marginTop:14}}>
            Fin de contrat enregistrée au {fmtDate(new Date(depart))}.{peutSupprimerDef ? " Cette date est dépassée." : ""}
            <button className="ig-editbtn" style={{marginLeft:8}} onClick={onAnnulerDepart}>annuler la fin de contrat</button>
          </div>
        )}

        {!mode && (
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:18}}>
            <button className="ig-btn ig-btn-ghost" onClick={()=>setMode('modifier')} style={{justifyContent:'flex-start'}}>✏️ Modifier ses informations (nom, poste, heures…)</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>{ setMode('cp'); setJours([]); }} style={{justifyContent:'flex-start'}}>🌴 Marquer des jours en CP (congé payé)</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>{ setMode('am'); setJours([]); }} style={{justifyContent:'flex-start'}}>🏥 Marquer des jours en AM (arrêt maladie)</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>{ setMode('css'); setJours([]); }} style={{justifyContent:'flex-start'}}>💼 Marquer des jours en congé sans solde</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>setMode('suppr')} style={{justifyContent:'flex-start',color:'var(--coral-d)',borderColor:'#f0c9c2'}}>✕ Fin de contrat (retirer le salarié)</button>
            {peutSupprimerDef && (
              <button className="ig-btn ig-btn-ghost" onClick={()=>setMode('supprdef')} style={{justifyContent:'flex-start',color:'#fff',background:'var(--coral-d)',borderColor:'var(--coral-d)'}}>🗑 Supprimer définitivement (contrat terminé)</button>
            )}
            <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onClose} style={{marginTop:6}}>Fermer</button>
          </div>
        )}

        {(mode === 'cp' || mode === 'am' || mode === 'css') && (
          <div style={{marginTop:16}}>
            <div className="ig-field">
              <label>Jours concernés — semaine du {fmtDate(lundi)}</label>
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:5,marginTop:4}}>
                {JOURS.map((j,i)=>(
                  <button key={i} onClick={()=>toggleJour(i)}
                    style={{padding:'8px 2px',borderRadius:8,fontSize:11,fontWeight:700,cursor:'pointer',
                      border:'1.5px solid '+(jours.includes(i)?'var(--sea)':'var(--line)'),
                      background:jours.includes(i)?(mode==='cp'?'#DCEAF5':(mode==='am'?'#FCE5D6':'#ECE4F3')):'#fff',
                      color:jours.includes(i)?(mode==='cp'?'#3A6EA5':(mode==='am'?'#C2702A':'#6B5B95')):'var(--ink-soft)'}}>
                    {JOURS_COURT[i]}<br/><span style={{fontWeight:400,opacity:.7}}>{fmtJour(ajouterJours(lundi,i))}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={()=>setMode(null)}>Retour</button>
              <button className="ig-btn ig-btn-primary" style={{flex:1}} disabled={jours.length===0}
                onClick={()=>onMarquer(jours, mode==='cp'?STATUTS.CP:(mode==='am'?STATUTS.AM:STATUTS.SANS_SOLDE))}>
                Marquer en {mode==='cp'?'CP':(mode==='am'?'AM':'congé sans solde')}
              </button>
            </div>
          </div>
        )}

        {mode === 'modifier' && (
          <div style={{marginTop:16}}>
            <div className="ig-field">
              <label>Prénom</label>
              <input value={mPrenom} autoFocus onChange={(e)=>{ setMPrenom(e.target.value); setMErr(false); }} placeholder="Prénom" />
            </div>
            <div className="ig-field">
              <label>Nom</label>
              <input value={mNom} onChange={(e)=>{ setMNom(e.target.value); setMErr(false); }} placeholder="Nom" />
            </div>
            <div className="ig-field">
              <label>Poste</label>
              <input value={mPoste} onChange={(e)=>setMPoste(e.target.value)} placeholder="Ex : Chef de Rang" />
            </div>
            <div className="ig-times">
              <div className="ig-field" style={{margin:0}}>
                <label>Unité</label>
                <select value={mUnite} onChange={(e)=>setMUnite(e.target.value)}>
                  <option value="SALLE">Salle</option>
                  <option value="CUISINE">Cuisine</option>
                </select>
              </div>
              <div className="ig-field" style={{margin:0}}>
                <label>Heures / semaine</label>
                <select value={mHeures} onChange={(e)=>setMHeures(Number(e.target.value))}>
                  {[20,24,30,35,39,42,44].map((h)=>(<option key={h} value={h}>{h}h</option>))}
                </select>
              </div>
            </div>
            <div className="ig-field">
              <label>Date de début de contrat (optionnel)</label>
              <input type="date" value={mDebut} onChange={(e)=>setMDebut(e.target.value)} />
              <div className="ig-muted" style={{fontSize:12,marginTop:4}}>Si renseignée, le salarié n'apparaît sur le planning qu'à partir de cette semaine.</div>
            </div>
            {(mNom.trim().toUpperCase() !== emp.n || mPrenom.trim() !== emp.p) && (
              <div className="ig-status-line" style={{marginTop:10,fontSize:13}}>Le nom/prénom change : ses semaines déjà passées resteront enregistrées sous "{emp.p} {emp.n}" (historique), et le nouveau nom s'appliquera à partir de maintenant.</div>
            )}
            {mErr && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:10,fontWeight:600}}>Prénom et nom sont obligatoires.</div>}
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={()=>setMode(null)}>Retour</button>
              <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={()=>{
                if (!mPrenom.trim() || !mNom.trim()) { setMErr(true); return; }
                onModifier({ prenom: mPrenom, nom: mNom, poste: mPoste, unite: mUnite, heures: Number(mHeures), dateDebut: mDebut || null });
              }}>Enregistrer</button>
            </div>
          </div>
        )}

        {mode === 'suppr' && (
          <div style={{marginTop:16}}>
            <p style={{fontSize:14,lineHeight:1.5}}>Indiquez la date de fin de contrat de <b>{emp.p} {emp.n}</b>. Le salarié reste sur les plannings jusqu'à cette date, puis disparaît des semaines suivantes. Les semaines passées restent intactes pour la RH.</p>
            <div className="ig-field">
              <label>Date de fin de contrat</label>
              <input type="date" value={dateFin} onChange={(e)=>setDateFin(e.target.value)} />
            </div>
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={()=>setMode(null)}>Annuler</button>
              <button className="ig-btn ig-btn-primary" style={{flex:1,background:'var(--coral-d)'}} disabled={!dateFin} onClick={()=>onSupprimer(dateFin)}>Confirmer la fin de contrat</button>
            </div>
          </div>
        )}

        {mode === 'supprdef' && (
          <div style={{marginTop:16}}>
            <p style={{fontSize:14,lineHeight:1.5}}>Supprimer définitivement <b>{emp.p} {emp.n}</b> de l'effectif de {emp.r} ? Son contrat est terminé. Ses plannings et émargements déjà enregistrés sont conservés pour la RH, mais il n'apparaîtra plus dans la liste.</p>
            <div style={{display:'flex',gap:10,marginTop:14}}>
              <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={()=>setMode(null)}>Annuler</button>
              <button className="ig-btn ig-btn-primary" style={{flex:1,background:'var(--coral-d)'}} onClick={onSupprimerDef}>Supprimer définitivement</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Modal Ajout d'un salarié (début de contrat) ----------
function AjoutModal({ resto, onAjouter, onClose }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [poste, setPoste] = useState("");
  const [unite, setUnite] = useState("SALLE");
  const [heures, setHeures] = useState(35);
  const [dateDebut, setDateDebut] = useState("");
  const [err, setErr] = useState(false);

  function valider() {
    if (!prenom.trim() || !nom.trim()) { setErr(true); return; }
    onAjouter({ prenom, nom, poste, unite, heures: Number(heures), dateDebut: dateDebut || null });
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Ajouter un salarié</h3>
        <div className="ig-muted">Début de contrat · {resto}</div>
        <div className="ig-field">
          <label>Prénom</label>
          <input value={prenom} autoFocus onChange={(e)=>{ setPrenom(e.target.value); setErr(false); }} placeholder="Prénom" />
        </div>
        <div className="ig-field">
          <label>Nom</label>
          <input value={nom} onChange={(e)=>{ setNom(e.target.value); setErr(false); }} placeholder="Nom" />
        </div>
        <div className="ig-field">
          <label>Poste</label>
          <input value={poste} onChange={(e)=>setPoste(e.target.value)} placeholder="Ex : Chef de Rang" />
        </div>
        <div className="ig-times">
          <div className="ig-field" style={{margin:0}}>
            <label>Unité</label>
            <select value={unite} onChange={(e)=>setUnite(e.target.value)}>
              <option value="SALLE">Salle</option>
              <option value="CUISINE">Cuisine</option>
            </select>
          </div>
          <div className="ig-field" style={{margin:0}}>
            <label>Heures / semaine</label>
            <select value={heures} onChange={(e)=>setHeures(e.target.value)}>
              <option value={20}>20h</option>
              <option value={24}>24h</option>
              <option value={30}>30h</option>
              <option value={35}>35h</option>
              <option value={39}>39h</option>
              <option value={42}>42h</option>
              <option value={44}>44h</option>
            </select>
          </div>
        </div>
        <div className="ig-field">
          <label>Date de début de contrat (optionnel)</label>
          <input type="date" value={dateDebut} onChange={(e)=>setDateDebut(e.target.value)} />
          <div className="ig-muted" style={{fontSize:12,marginTop:4}}>Si renseignée, le salarié n'apparaîtra sur le planning qu'à partir de cette semaine.</div>
        </div>
        {err && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:10,fontWeight:600}}>Prénom et nom sont obligatoires.</div>}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={valider}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Modal Fiche juridique d'un établissement (requis pour générer les contrats) ----------
function FicheJuridiqueModal({ resto, valeurs, onSave, onClose }) {
  const [f, setF] = useState({ raisonSociale: "", adresse: "", cp: "", ville: "", capital: "", rcs: "", siret: "", ape: "", tampon: "", logo: "", ...(valeurs || {}) });
  const champ = (label, key, placeholder) => (
    <div className="ig-field">
      <label>{label}</label>
      <input value={f[key]} onChange={(e)=>setF({ ...f, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );
  function choisirImage(cle, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setF((cur) => ({ ...cur, [cle]: reader.result }));
    reader.readAsDataURL(file);
  }
  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e)=>e.stopPropagation()}>
        <h3>Fiche juridique — {resto}</h3>
        <div className="ig-muted" style={{marginBottom:10}}>Ces informations apparaissent sur les contrats de prêt de main-d'œuvre et les promesses d'embauche générés pour cet établissement.</div>
        {champ("Raison sociale", "raisonSociale", "Ex : SAS INDIE BEACH")}
        {champ("Adresse", "adresse", "Ex : Plage de Pampelonne")}
        <div className="ig-times">
          {champ("Code postal", "cp", "83350")}
          {champ("Ville", "ville", "RAMATUELLE")}
        </div>
        {champ("Capital social", "capital", "Ex : 7 600 €")}
        {champ("RCS", "rcs", "Ex : Fréjus 451 201 875")}
        <div className="ig-times">
          {champ("SIRET", "siret", "Ex : 45120187500023")}
          {champ("APE", "ape", "Ex : 5610A")}
        </div>
        <div className="ig-field">
          <label>Logo (image)</label>
          <div className="ig-muted" style={{fontSize:12,marginBottom:6}}>Affiché en haut des promesses d'embauche générées pour cet établissement.</div>
          {f.logo && <img src={f.logo} alt="Logo" style={{maxHeight:70,display:'block',marginBottom:8,border:'1px solid var(--line)',borderRadius:8,padding:4}} />}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="file" accept="image/*" onChange={(e)=>choisirImage('logo', e.target.files[0])} />
            {f.logo && <button type="button" className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setF((cur)=>({ ...cur, logo: "" }))}>Retirer</button>}
          </div>
        </div>
        <div className="ig-field">
          <label>Signature / tampon (image)</label>
          <div className="ig-muted" style={{fontSize:12,marginBottom:6}}>Utilisée sur les promesses d'embauche générées pour cet établissement.</div>
          {f.tampon && <img src={f.tampon} alt="Tampon" style={{maxHeight:70,display:'block',marginBottom:8,border:'1px solid var(--line)',borderRadius:8,padding:4}} />}
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="file" accept="image/*" onChange={(e)=>choisirImage('tampon', e.target.files[0])} />
            {f.tampon && <button type="button" className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setF((cur)=>({ ...cur, tampon: "" }))}>Retirer</button>}
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={()=>onSave(f)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}


// ---------- Vue Manager ----------
function ManagerView({ resto, onBack, superviseur }) {
  const [semDate, setSemDate] = useState(new Date());
  const [planning, setPlanning] = useState({}); // { idSalarie: { 0..6 } }
  const [pointages, setPointages] = useState({});
  const [edit, setEdit] = useState(null); // { emp, jour }
  const [vue, setVue] = useState("planning"); // planning | emargement | extra
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState({ ajouts: [], departs: {} });
  const [modele, setModele] = useState(null); // planning modèle enregistré pour le resto
  const [shifts, setShifts] = useState([]); // shifts prêts à l'emploi de l'établissement
  const [gererShifts, setGererShifts] = useState(false); // modale de gestion des shifts ouverte
  const [gestion, setGestion] = useState(null); // salarié en cours de gestion
  const [ajout, setAjout] = useState(false);    // formulaire d'ajout ouvert
  const [flash, setFlash] = useState("");        // message de confirmation éphémère
  const [recherche, setRecherche] = useState(""); // filtre de recherche salarié
  const [filtreUnite, setFiltreUnite] = useState("TOUS"); // TOUS | SALLE | CUISINE
  const [valide, setValide] = useState(false);    // planning de la semaine validé/publié
  const [alerteHier, setAlerteHier] = useState([]); // noms des salariés non confirmés hier
  const [modeSelect, setModeSelect] = useState(false); // mode nettoyage (sélection multiple)
  const [selection, setSelection] = useState(() => new Set()); // ids salariés cochés
  const [confirmLot, setConfirmLot] = useState(false); // confirmation du retrait en lot
  const [confirmForceModele, setConfirmForceModele] = useState(false); // confirmation de l'écrasement forcé par le modèle
  const [moisExport, setMoisExport] = useState(() => { const d = new Date(); return { annee: d.getFullYear(), mois: d.getMonth() + 1 }; }); // mois choisi pour l'export PayFit
  const [histo, setHisto] = useState(null); // { titre, cle, onRestaurer } | null
  const [mappingPayfit, setMappingPayfit] = useState({}); // correspondance PayFit de CET établissement (Store), fusionnée avec PAYFIT_IDS
  const [majMappingEnCours, setMajMappingEnCours] = useState(false);
  const fileMappingRef = useRef(null);
  const sem = cleSemaine(semDate);

  // Correspondance PayFit : propre à l'établissement affiché — rechargée si on change de resto.
  useEffect(() => {
    let on = true;
    Store.get(kPayfitMapping(resto)).then((m) => { if (on) setMappingPayfit(m || {}); });
    return () => { on = false; };
  }, [resto]);
  async function majMappingPayFit(files) {
    setMajMappingEnCours(true);
    try {
      const { trouves, nonReconnus } = await analyserMappingPayFit(files, resto, roster.ajouts || []);
      const nb = Object.keys(trouves).length;
      if (nb === 0) {
        montrerFlash(`Aucune correspondance PayFit trouvée pour l'effectif de ${resto} dans ce ou ces fichiers (vérifiez que ce sont bien les fichiers d'import PayFit avec les colonnes Identifiant/Matricule/Collaborateur, et qu'ils concernent bien cet établissement).`);
        return;
      }
      const next = { ...mappingPayfit, ...trouves };
      await Store.set(kPayfitMapping(resto), next);
      setMappingPayfit(next);
      montrerFlash(`Correspondance PayFit de ${resto} mise à jour : ${nb} salarié${nb > 1 ? 's' : ''}.` + (nonReconnus.length > 0 ? ` ⚠ Non reconnu${nonReconnus.length > 1 ? 's' : ''} (pas dans l'effectif de ${resto} ou nom trop différent) : ${nonReconnus.join(", ")}.` : ""));
    } catch (err) {
      montrerFlash("Impossible de lire ce fichier : " + err.message);
    } finally {
      setMajMappingEnCours(false);
    }
  }

  // Salariés RH (saison en cours de cet établissement) : intégrés automatiquement au
  // planning, bornés par leur date de début/fin de contrat — sans ressaisie manuelle.
  const [rhTeam, setRhTeam] = useState([]);
  useEffect(() => {
    let on = true;
    RhSalaries.list(resto).then((lignes) => {
      if (!on) return;
      if (lignes.length === 0) { setRhTeam([]); return; }
      // La saison synchronisée dans le planning doit être l'année en cours (contrats actifs),
      // jamais "Archives" : "Archives" trie après les années dans l'ordre alphabétique
      // ("A" > "2"), donc prendre "la dernière valeur triée" pouvait synchroniser les fiches
      // archivées au lieu des salariés réellement sous contrat cette année — plus aucun
      // nouveau salarié (ni ses heures de contrat) ne remontait alors dans le planning.
      const anneeCourante = String(new Date().getFullYear());
      const saisonsDispo = [...new Set(lignes.map((l) => l.saison))].sort();
      const saisonsAnnees = saisonsDispo.filter((s) => /^\d{4}$/.test(s));
      const derniere = saisonsDispo.includes(anneeCourante)
        ? anneeCourante
        : (saisonsAnnees.length ? saisonsAnnees[saisonsAnnees.length - 1] : anneeCourante);
      setRhTeam(
        lignes.filter((l) => l.saison === derniere).map((l) => ({
          n: l.nom, p: l.prenom, r: l.resto, po: l.poste || "—", u: l.unite,
          h: l.heures_contrat || l.heures_semaine || 35,
          _rhDebut: l.date_debut, _rhFin: l.date_fin,
        }))
      );
    });
    return () => { on = false; };
  }, [resto]);

  // Équipe effective : salariés du fichier + ajouts manuels + salariés RH (bornés par leur
  // contrat), moins ceux dont le contrat est terminé.
  const team = useMemo(() => {
    const base = EMPLOYEES.filter((e) => e.r === resto);
    const ajouts = roster.ajouts || [];
    // Comparaison de la même personne entre ajout manuel / fiche RH / fichier tolérante à la
    // casse, aux accents (normTxt) ET à la ponctuation (tiret, apostrophe...) : "nicolas
    // BRAULT" / "Nicolas BRAULT", ou "Jean-Baptiste POLO" / "Jean Baptiste POLO", doivent être
    // reconnus comme LA MÊME personne, sinon les deux survivent et se retrouvent en double dans
    // le planning. On ne touche qu'à cette comparaison — jamais à idSalarie() lui-même, qui sert
    // aussi de clé de stockage pour les horaires déjà saisis.
    const idNorm = (e) => normTxt(idSalarie(e)).replace(/[^a-z0-9]+/g, " ").trim();
    const ajoutIds = new Set(ajouts.map((a) => idNorm(a)));
    // Un ajout manuel a priorité sur la fiche RH de même identifiant (permet de corriger
    // ses heures/poste dans Planning sans attendre une mise à jour de la fiche RH).
    const rhActifs = rhTeam.filter((e) => {
      if (ajoutIds.has(idNorm(e))) return false;
      if (e._rhDebut && sem < e._rhDebut) return false; // contrat pas encore commencé cette semaine
      if (e._rhFin && sem > e._rhFin) return false; // contrat terminé avant cette semaine
      return true;
    });
    const rhIds = new Set(rhActifs.map((e) => idNorm(e)));
    // Une fiche "ajoutée" ou RH a priorité sur la fiche du fichier de même identifiant
    // (permet de corriger ses heures / son poste sans créer de doublon).
    const tous = base.filter((e) => !ajoutIds.has(idNorm(e)) && !rhIds.has(idNorm(e))).concat(ajouts).concat(rhActifs);
    const supprimes = new Set(roster.supprimes || []);
    return tous.filter((e) => {
      if (supprimes.has(idSalarie(e))) return false; // salarié du fichier supprimé après fin de contrat
      if (e._debut && sem < e._debut) return false; // ajout manuel : contrat pas encore commencé cette semaine
      const fin = (roster.departs || {})[idSalarie(e)];
      // fin = date de fin de contrat (AAAA-MM-JJ). Visible tant que le lundi de la
      // semaine affichée est <= date de fin ; masqué pour les semaines entièrement après.
      return !fin || sem <= fin;
    });
  }, [resto, roster, sem, rhTeam]);

  // Équipe filtrée par la recherche (nom/prénom) et le filtre d'unité (salle/cuisine).
  const teamFiltre = useMemo(() => {
    const q = normTxt(recherche);
    return team.filter((e) => {
      if (filtreUnite !== "TOUS" && normTxt(e.u) !== normTxt(filtreUnite)) return false;
      if (!q) return true;
      return normTxt(e.p + " " + e.n).includes(q) || normTxt(e.n + " " + e.p).includes(q);
    });
  }, [team, recherche, filtreUnite]);

  useEffect(() => {
    let on = true;
    setLoading(true);
    Promise.all([
      Store.get(kPlanning(resto, sem)),
      Pointages.load(resto, sem),
      Store.get(kRoster(resto)),
      Store.get(kModele(resto)),
      Store.get(kValidation(resto, sem)),
    ]).then(([pl, pt, rs, md, vd]) => {
      if (!on) return;
      setPlanning(pl || {});
      setPointages(pt || {});
      // Le filtrage par date de fin (dans "team", plus bas) se fait par rapport à la SEMAINE
      // affichée ("sem"), pas par rapport à la date du jour : un salarié parti reste donc
      // visible sur les semaines passées où il a réellement travaillé, et disparaît seulement
      // des semaines suivant sa fin de contrat. Il ne faut surtout pas, en plus de ça, le
      // basculer automatiquement dans "supprimes" dès que sa date de fin est dépassée
      // aujourd'hui : "supprimes" masque TOUTES les semaines sans exception (y compris les
      // passées), ce qui faisait disparaître le salarié même de l'historique. La suppression
      // définitive reste un choix explicite (bouton "Supprimer définitivement").
      setRoster(rs || { ajouts: [], departs: {} });
      setModele(md || null);
      setValide(!!vd);
      setLoading(false);
    });
    return () => { on = false; };
  }, [resto, sem]);

  // Shifts prêts à l'emploi : propres à l'établissement, pas à la semaine (pas besoin de
  // recharger à chaque changement de semaine).
  useEffect(() => {
    let on = true;
    Store.get(kShifts(resto)).then((s) => { if (on) setShifts(s || []); });
    return () => { on = false; };
  }, [resto]);

  // Alerte : salariés prévus en travail HIER mais qui n'ont pas confirmé leur présence.
  // Basée sur la vraie date d'hier, indépendamment de la semaine affichée.
  useEffect(() => {
    let on = true;
    const hier = ajouterJours(new Date(), -1);
    const semHier = cleSemaine(hier);
    const jHier = (hier.getDay() + 6) % 7; // 0 = lundi
    Promise.all([Store.get(kPlanning(resto, semHier)), Pointages.load(resto, semHier)]).then(([plH, ptH]) => {
      if (!on) return;
      const planningH = plH || {};
      const pointagesH = ptH || {};
      const base = EMPLOYEES.filter((e) => e.r === resto).concat(roster.ajouts || []);
      const manquants = base.filter((e) => {
        // exclut les contrats déjà terminés à la date d'hier
        const fin = (roster.departs || {})[idSalarie(e)];
        if (fin && semHier > fin) return false;
        const id = idSalarie(e);
        const jour = planningH[id] && planningH[id][jHier];
        const prevuTravail = jour && (jour.statut === STATUTS.TRAVAIL || jour.statut === STATUTS.DEMI_CP);
        if (!prevuTravail) return false;
        const pt = pointagesH[id] && pointagesH[id][jHier];
        return !(pt && pt.confirme); // prévu travail mais pas confirmé
      });
      setAlerteHier(manquants.map((e) => `${e.n} ${e.p}`));
    });
    return () => { on = false; };
  }, [resto, roster]);

  function persistPlanning(next) {
    setPlanning(next);
    Store.set(kPlanning(resto, sem), next);
  }
  function persistRoster(next) {
    setRoster(next);
    Store.set(kRoster(resto), next);
  }
  function validerPlanning() {
    setValide(true);
    Store.set(kValidation(resto, sem), true);
    montrerFlash("Planning validé : les salariés voient désormais leur planning et peuvent pointer. Vos modifications resteront visibles immédiatement.");
  }
  function devaliderPlanning() {
    setValide(false);
    Store.set(kValidation(resto, sem), false);
    montrerFlash("Planning repassé en préparation : les salariés ne le voient plus.");
  }

  // Validation manuelle de la semaine par le manager, à la place du salarié (ex : oubli
  // avant dimanche minuit — le salarié ne peut alors plus valider lui-même sa semaine passée).
  function toggleSignatureManuelle(emp) {
    const id = idSalarie(emp);
    const cur = pointages[id] || {};
    const dejaSignee = !!(cur.semaine && cur.semaine.signee);
    const nextSemaine = dejaSignee ? { signee: false } : { signee: true, parManager: true };
    const next = { ...pointages, [id]: { ...cur, semaine: nextSemaine } };
    setPointages(next);
    Pointages.setSemaine(resto, sem, id, nextSemaine);
    montrerFlash(dejaSignee ? "Validation annulée." : `Semaine validée pour ${emp.p} ${emp.n}.`);
  }

  // Confirmation manuelle d'UN jour par le manager, à la place du salarié (ex : jour
  // oublié sur une semaine déjà passée, que le salarié ne peut plus rattraper lui-même).
  function toggleJourManuel(emp, j, planJour) {
    const id = idSalarie(emp);
    const cur = pointages[id] || {};
    const dejaConfirme = !!(cur[j] && cur[j].confirme);
    const nextJourData = dejaConfirme
      ? { ...cur[j], confirme: null }
      : { confirme: "manager", debut: planJour.debut, fin: planJour.fin, pause: planJour.pause || 0 };
    const next = { ...pointages, [id]: { ...cur, [j]: nextJourData } };
    setPointages(next);
    Pointages.setJour(resto, sem, id, j, nextJourData);
  }

  function genererUn(e) {
    const next = { ...planning, [idSalarie(e)]: genererPlanningAuto(e, sem) };
    persistPlanning(next);
  }

  function montrerFlash(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 3500);
  }

  // Export PayFit : CP, demi-CP et congés sans solde du MOIS choisi (du 1er au dernier
  // jour), pas seulement de la semaine affichée. Un mois chevauche plusieurs semaines
  // enregistrées séparément : on va chercher chacune d'elles, puis on ne garde que les
  // jours dont la date tombe réellement dans le mois demandé.
  const [exportEnCours, setExportEnCours] = useState(false);
  async function exporterPayFitMois(annee, mois) {
    setExportEnCours(true);
    try {
      const premierJour = new Date(annee, mois - 1, 1);
      const dernierJour = new Date(annee, mois, 0);
      const semaines = [];
      for (let l = lundiDeLaSemaine(premierJour); l <= lundiDeLaSemaine(dernierJour); l = ajouterJours(l, 7)) {
        semaines.push({ sem: cleSemaine(l), lundi: l });
      }
      const plannings = await Promise.all(semaines.map((s) => Store.get(kPlanning(resto, s.sem))));
      const lignes = [];
      team.forEach((e) => {
        const id = idSalarie(e);
        semaines.forEach((s, wi) => {
          const pl = plannings[wi] && plannings[wi][id];
          if (!pl) return;
          for (let j = 0; j < 7; j++) {
            const p = pl[j];
            if (!p) continue;
            const date = ajouterJours(s.lundi, j);
            if (date < premierJour || date > dernierJour) continue;
            if (p.statut === STATUTS.CP) {
              lignes.push({ emp: e, date, type: "CP", choix: "Journée entière" });
            } else if (p.statut === STATUTS.DEMI_CP) {
              lignes.push({ emp: e, date, type: "CP", choix: p.demi === "am" ? "Matin" : "Après-midi" });
            } else if (p.statut === STATUTS.SANS_SOLDE) {
              lignes.push({ emp: e, date, type: "CSS" });
            }
          }
        });
      });
      if (lignes.length === 0) {
        montrerFlash(`Aucun CP, demi-CP ou congé sans solde sur ${MOIS_NOMS[mois-1]} ${annee} : rien à exporter.`);
        return;
      }
      lignes.sort((a, b) => a.date - b.date || a.emp.n.localeCompare(b.emp.n));
      const nomFichier = `PayFit_Conges_${slugKey(resto)}_${String(mois).padStart(2,"0")}-${annee}.xlsx`;
      const manquants = exporterCongesPayFit(lignes, nomFichier, { ...PAYFIT_IDS, ...mappingPayfit });
      montrerFlash(manquants.length > 0
        ? `Fichier téléchargé : ${MOIS_NOMS[mois-1]} ${annee}, ${lignes.length} ligne${lignes.length>1?'s':''}. ⚠ Identifiant PayFit introuvable pour : ${manquants.join(", ")} — à compléter à la main avant import.`
        : `Fichier téléchargé : ${MOIS_NOMS[mois-1]} ${annee}, ${lignes.length} ligne${lignes.length>1?'s':''} prête${lignes.length>1?'s':''} pour l'import PayFit.`);
    } finally {
      setExportEnCours(false);
    }
  }

  function imprimerPlanning() {
    const lundi = lundiDeLaSemaine(semDate);
    const entetes = JOURS.map((j, i) => `<th>${JOURS_COURT[i]}<br><span style="font-weight:400">${fmtJour(ajouterJours(lundi, i))}</span></th>`).join("");
    const lignes = team.map((e) => {
      const pl = planning[idSalarie(e)];
      const tot = pl ? totalHebdo(pl) : 0;
      const jours = JOURS.map((j, i) => `<td>${pl ? celluleHTML(pl[i]) : ''}</td>`).join("");
      return `<tr><td class="who"><b>${esc(e.p)} ${esc(e.n)}</b><br><span class="po">${esc(e.po)} · ${esc(e.h)}h</span></td>${jours}<td class="tot">${pl ? fmtHeures(tot) : '—'}<br><span style="font-weight:400;font-size:10px">/ ${esc(e.h)}h</span></td></tr>`;
    }).join("");
    const corps = `
      <h1>Planning — ${esc(resto)}</h1>
      <div class="sub">Semaine du ${fmtDate(lundi)} au ${fmtDate(ajouterJours(lundi, 6))}</div>
      <table>
        <thead><tr><th class="who">Salarié</th>${entetes}<th>Total</th></tr></thead>
        <tbody>${lignes}</tbody>
      </table>`;
    const styles = `
      table { width:100%; border-collapse:collapse; font-size:11px; }
      th,td { border:1px solid #15303B; padding:5px 6px; text-align:center; vertical-align:middle; }
      th { background:#E8DDC9; font-size:9.5px; text-transform:uppercase; letter-spacing:.4px; }
      td.who { text-align:left; min-width:120px; }
      .po { font-size:10px; color:#3C5763; }
      .hrs { font-weight:600; } .pz { font-size:9px; color:#555; }
      .tot { font-weight:700; }`;
    const ok = imprimerDocument(`Planning ${resto}`, corps, styles, `Planning_${slugKey(resto)}_${dateISOLocale(lundi)}`);
    if (ok === false) montrerFlash("Impossible de générer le document. Réessayez.");
    else if (ok === "download") montrerFlash("Le fichier a été téléchargé. Ouvrez-le, puis choisissez « Enregistrer au format PDF » à l'impression.");
  }
  // Enregistre le planning de la semaine affichée comme modèle réutilisable.
  function enregistrerModele() {
    const copie = JSON.parse(JSON.stringify(planning));
    setModele(copie);
    Store.set(kModele(resto), copie);
    montrerFlash("Modèle enregistré. Vous pourrez l'appliquer à une autre semaine.");
  }
  // Applique le modèle : ne remplit que les salariés encore vierges cette semaine.
  function appliquerModele() {
    if (!modele) return;
    const next = { ...planning };
    let ajoutes = 0;
    team.forEach((e) => {
      const id = idSalarie(e);
      if (!next[id] && modele[id]) {           // vierge cette semaine + présent dans le modèle
        next[id] = JSON.parse(JSON.stringify(modele[id]));
        ajoutes++;
      }
    });
    persistPlanning(next);
    montrerFlash(ajoutes > 0
      ? `Modèle appliqué à ${ajoutes} salarié${ajoutes>1?'s':''} sans planning. Les plannings déjà saisis n'ont pas été touchés.`
      : "Tous les salariés avaient déjà un planning : rien n'a été modifié.");
  }
  // Applique le modèle EN FORÇANT : écrase aussi les plannings déjà saisis cette semaine
  // (utile quand "Appliquer le modèle" ne fait rien car la semaine n'est plus vierge).
  function appliquerModeleForce() {
    if (!modele) return;
    const next = { ...planning };
    let appliques = 0;
    team.forEach((e) => {
      const id = idSalarie(e);
      if (modele[id]) {
        next[id] = JSON.parse(JSON.stringify(modele[id]));
        appliques++;
      }
    });
    persistPlanning(next);
    montrerFlash(`Modèle forcé sur ${appliques} salarié${appliques>1?'s':''} : tous les horaires de la semaine ont été remplacés par ceux du modèle.`);
  }
  function saveCell(e, jour, data) {
    const id = idSalarie(e);
    const cur = planning[id] || {};
    const next = { ...planning, [id]: { ...cur, [jour]: data } };
    persistPlanning(next);
    setEdit(null);
  }

  // Marquer plusieurs jours d'un salarié dans un statut (CP / AM) pour la semaine affichée.
  function marquerJours(e, jours, statut) {
    const id = idSalarie(e);
    const cur = { ...(planning[id] || {}) };
    jours.forEach((j) => {
      cur[j] = { statut, debut: "", fin: "", pause: 0 };
    });
    persistPlanning({ ...planning, [id]: cur });
  }

  // Fin de contrat : enregistre la date de fin, grise les jours postérieurs à cette date
  // dans la semaine concernée, puis le salarié disparaît des semaines suivantes.
  function supprimerSalarie(e, dateFin) {
    const id = idSalarie(e);
    const next = { ...roster, departs: { ...(roster.departs || {}), [id]: dateFin } };
    persistRoster(next);

    // Grise les jours après la date de fin, dans la semaine qui contient cette date.
    const dFin = new Date(dateFin + "T00:00:00");
    const jFin = (dFin.getDay() + 6) % 7; // index du jour de fin (0 = lundi)
    const semFin = cleSemaine(dFin);
    const appliquer = (planningSem) => {
      const pl = { ...(planningSem || {}) };
      const cur = { ...(pl[id] || {}) };
      let modif = false;
      for (let j = jFin + 1; j < 7; j++) {
        cur[j] = { statut: STATUTS.FIN, debut: "", fin: "", pause: 0 };
        modif = true;
      }
      if (modif) pl[id] = cur;
      return { pl, modif };
    };

    if (semFin === sem) {
      // semaine de fin = semaine affichée : on met à jour l'état courant
      const { pl } = appliquer(planning);
      persistPlanning(pl);
    } else {
      // autre semaine : on charge, modifie et enregistre directement
      Store.get(kPlanning(resto, semFin)).then((plSem) => {
        const { pl, modif } = appliquer(plSem);
        if (modif) Store.set(kPlanning(resto, semFin), pl);
      });
    }
    setGestion(null);
  }
  // Annule un départ enregistré (réintègre le salarié).
  function annulerDepart(e) {
    const id = idSalarie(e);
    const deps = { ...(roster.departs || {}) };
    delete deps[id];
    persistRoster({ ...roster, departs: deps });
  }
  // Début de contrat : ajoute un salarié au restaurant.
  // IMPORTANT : si ce salarié avait été retiré (présent dans "supprimes" ou "departs"),
  // on l'en enlève — sinon le filtre d'effectif le masquerait aussitôt. Et si c'est une
  // fiche du fichier de base, on la réactive au lieu de créer un doublon.
  function ajouterSalarie(data) {
    const nouveau = { n: data.nom.trim().toUpperCase(), p: data.prenom.trim(), r: resto, po: data.poste.trim() || "—", u: data.unite, h: data.heures, _ajout: true, _debut: data.dateDebut || null };
    const id = idSalarie(nouveau);
    const supprimes = (roster.supprimes || []).filter((x) => x !== id);
    const departs = { ...(roster.departs || {}) };
    delete departs[id];
    // On enregistre TOUJOURS la fiche saisie (heures/poste inclus) ; elle prime sur une
    // éventuelle fiche du fichier de même nom (priorité gérée dans le calcul de "team").
    const ajouts = [...(roster.ajouts || []).filter((a) => idSalarie(a) !== id), nouveau];
    persistRoster({ ...roster, ajouts, supprimes, departs });
    setAjout(false);
    montrerFlash(`${nouveau.p} ${nouveau.n} ajouté à l'effectif de ${resto} (${nouveau.h}h).`);
  }
  // Modifie les informations d'un salarié existant (nom, prénom, poste, unité, heures).
  // Si le nom/prénom change, l'identifiant change aussi : on migre le planning de la
  // semaine affichée et les marqueurs de départ/suppression vers le nouvel identifiant,
  // et on masque l'ancienne fiche du fichier de base pour éviter un doublon. Les semaines
  // déjà passées restent enregistrées sous l'ancien nom (historique RH intact).
  function modifierSalarie(ancienEmp, data) {
    const nouveau = { n: data.nom.trim().toUpperCase(), p: data.prenom.trim(), r: resto, po: data.poste.trim() || "—", u: data.unite, h: data.heures, _ajout: true, _debut: data.dateDebut || null };
    const ancienId = idSalarie(ancienEmp);
    const nouvelId = idSalarie(nouveau);
    const ajouts = [...(roster.ajouts || []).filter((a) => idSalarie(a) !== ancienId && idSalarie(a) !== nouvelId), nouveau];
    const departs = { ...(roster.departs || {}) };
    let supprimes = [...(roster.supprimes || [])];
    if (nouvelId !== ancienId) {
      if (departs[ancienId] != null) { departs[nouvelId] = departs[ancienId]; delete departs[ancienId]; }
      supprimes = supprimes.map((id) => (id === ancienId ? nouvelId : id));
      if (!ancienEmp._ajout && !supprimes.includes(ancienId)) supprimes.push(ancienId);
    }
    persistRoster({ ...roster, ajouts, departs, supprimes });
    if (nouvelId !== ancienId && planning[ancienId]) {
      const next = { ...planning, [nouvelId]: planning[ancienId] };
      delete next[ancienId];
      persistPlanning(next);
    }
    setGestion(null);
    montrerFlash(`${nouveau.p} ${nouveau.n} mis à jour.` + (nouvelId !== ancienId ? " Les semaines déjà passées restent sous l'ancien nom, pour l'historique." : ""));
  }
  // Suppression définitive d'un salarié AJOUTÉ dans l'app : le retire de l'effectif.
  // Ses plannings/pointages des semaines passées ne sont pas effacés (historique conservé).
  function supprimerDefinitivement(e) {
    const id = idSalarie(e);
    const ajouts = (roster.ajouts || []).filter((a) => idSalarie(a) !== id);
    const deps = { ...(roster.departs || {}) };
    delete deps[id]; // plus besoin du marqueur de fin puisqu'il quitte l'effectif
    persistRoster({ ...roster, ajouts, departs: deps });
    setGestion(null);
  }

  // Retrait EN LOT de l'effectif (nettoyage de fin de saison). Les fiches du fichier
  // sont ajoutées aux "supprimés", les salariés créés dans l'app sont retirés des ajouts.
  // L'historique (plannings/pointages des semaines passées) reste intact. 1 seule écriture.
  function retirerEnLot(ids) {
    const set = new Set(ids);
    const ajoutsIds = new Set((roster.ajouts || []).map((a) => idSalarie(a)));
    const nouvAjouts = (roster.ajouts || []).filter((a) => !set.has(idSalarie(a)));
    const nouvSupprimes = [...(roster.supprimes || [])];
    const nouvDeparts = { ...(roster.departs || {}) };
    ids.forEach((id) => {
      delete nouvDeparts[id];
      if (!ajoutsIds.has(id) && !nouvSupprimes.includes(id)) nouvSupprimes.push(id);
    });
    persistRoster({ ...roster, ajouts: nouvAjouts, departs: nouvDeparts, supprimes: nouvSupprimes });
    const n = set.size;
    setSelection(new Set());
    setConfirmLot(false);
    setModeSelect(false);
    montrerFlash(`${n} salarié${n>1?'s':''} retiré${n>1?'s':''} de l'effectif de ${resto}. L'historique des semaines passées est conservé.`);
  }
  function toggleSelection(id) {
    setSelection((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const lundi = lundiDeLaSemaine(semDate);
  const aGenere = Object.keys(planning).length > 0;

  return (
    <div>
      <div className="ig-noprint" style={{display:'flex',alignItems:'center',gap:14,marginBottom:6}}>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onBack}><Icon.Back/> Restaurants</button>
        <div>
          <div className="ig-eyebrow" style={{margin:0}}>Espace manager{superviseur && <span style={{marginLeft:8,padding:'2px 8px',borderRadius:20,background:'var(--ink)',color:'var(--sand)',fontSize:10,letterSpacing:'.5px'}}>SUPERVISEUR</span>}</div>
          <h2 className="ig-section-title">{resto}</h2>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button className={"ig-btn ig-btn-sm "+(vue==='planning'?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setVue('planning')}><Icon.Calendar width={16} height={16}/> Planning</button>
          <button className={"ig-btn ig-btn-sm "+(vue==='emargement'?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setVue('emargement')}><Icon.Check/> Émargement</button>
        </div>
      </div>

      {alerteHier.length > 0 && (
        <div className="ig-noprint" style={{background:'#FCE5D6',border:'1.5px solid #E5A06A',color:'#9A4A1B',borderRadius:12,padding:'12px 16px',marginBottom:14,fontSize:14}}>
          <b>Attention</b> {alerteHier.join(", ")} {alerteHier.length>1?"n'ont":"n'a"} pas signé {alerteHier.length>1?"leur":"sa"} présence d'hier.
        </div>
      )}

      {vue !== "extra" && <WeekNav semDate={semDate} setSemDate={setSemDate} />}

      {vue === "planning" && (
        <>
          <div className="ig-noprint" style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
            <button className="ig-btn ig-btn-ghost" onClick={()=>setAjout(true)}>+ Ajouter un salarié</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>setGererShifts(true)} title="Créer des horaires-types réutilisables (ex : « matin » 09:00-17:00), proposés en raccourci quand on édite le créneau d'un jour">⚡ Gérer les shifts</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>{ setModeSelect((v)=>!v); setSelection(new Set()); setConfirmLot(false); }} style={modeSelect?{borderColor:'var(--coral-d)',color:'var(--coral-d)'}:undefined}>🧹 {modeSelect?"Terminer le nettoyage":"Nettoyer l'effectif"}</button>
            <button className="ig-btn ig-btn-ghost" onClick={enregistrerModele} disabled={Object.keys(planning).length===0} title="Mémoriser les horaires de cette semaine comme modèle">★ Enregistrer comme modèle</button>
            {superviseur && (
              <button className="ig-btn ig-btn-ghost" onClick={()=>setHisto({ titre: `Planning — semaine du ${fmtDate(lundi)}`, cle: kPlanning(resto, sem), onRestaurer: (v) => { persistPlanning(v); montrerFlash("Version du planning restaurée."); } })} title="Voir les versions précédentes de cette semaine et en restaurer une">🕐 Historique du planning</button>
            )}
            {superviseur && (
              <button className="ig-btn ig-btn-ghost" onClick={()=>setHisto({ titre: `Effectif — ${resto}`, cle: kRoster(resto), onRestaurer: (v) => { persistRoster(v); montrerFlash("Version de l'effectif restaurée."); } })} title="Voir les versions précédentes de l'effectif et en restaurer une">🕐 Historique de l'effectif</button>
            )}
            <button className="ig-btn ig-btn-ghost" onClick={appliquerModele} disabled={!modele} title="Reprendre les horaires du modèle pour les salariés sans planning">⤵ Appliquer le modèle</button>
            {superviseur && (
              <button className="ig-btn ig-btn-ghost" onClick={()=>setConfirmForceModele(true)} disabled={!modele} title="Écrase aussi les horaires déjà saisis cette semaine" style={{borderColor:'var(--coral-d)',color:'var(--coral-d)'}}>⚠ Forcer le modèle sur toute la semaine</button>
            )}
            <button className="ig-btn ig-btn-ink" onClick={imprimerPlanning} disabled={Object.keys(planning).length===0}><Icon.Print/> Télécharger le planning en PDF</button>
            {superviseur && (
              <>
                <select value={moisExport.mois} onChange={(e)=>setMoisExport((m)=>({...m, mois:Number(e.target.value)}))} style={{padding:'8px 10px',borderRadius:10,border:'1.5px solid var(--line)'}}>
                  {MOIS_NOMS.map((nom,i)=>(<option key={i} value={i+1}>{nom}</option>))}
                </select>
                <select value={moisExport.annee} onChange={(e)=>setMoisExport((m)=>({...m, annee:Number(e.target.value)}))} style={{padding:'8px 10px',borderRadius:10,border:'1.5px solid var(--line)'}}>
                  {[moisExport.annee-1, moisExport.annee, moisExport.annee+1].filter((a,i,arr)=>arr.indexOf(a)===i).sort((a,b)=>a-b).map((a)=>(<option key={a} value={a}>{a}</option>))}
                </select>
                <button className="ig-btn ig-btn-ghost" onClick={()=>exporterPayFitMois(moisExport.annee, moisExport.mois)} disabled={exportEnCours} title="Export des CP / demi-CP / congés sans solde du mois choisi (1er au dernier jour), au format d'import PayFit">⬇ {exportEnCours ? "Génération…" : "Export PayFit (congés)"}</button>
                <input ref={fileMappingRef} type="file" accept=".xlsx" multiple style={{display:'none'}} onChange={(e)=>{ const fs=[...e.target.files]; if (fs.length) majMappingPayFit(fs); e.target.value=""; }} />
                <button className="ig-btn ig-btn-ghost" onClick={()=>fileMappingRef.current && fileMappingRef.current.click()} disabled={majMappingEnCours} title={`Recharger le(s) modèle(s) d'import PayFit pour l'effectif de ${resto} uniquement (Identifiant/Matricule/Collaborateur)`}>🔄 {majMappingEnCours ? "Analyse…" : `Mettre à jour PayFit — ${resto}`}</button>
              </>
            )}
            {valide ? (
              <button className="ig-btn ig-btn-ghost" onClick={devaliderPlanning} style={{borderColor:'var(--sea)',color:'var(--sea)'}}><Icon.Check/> Planning validé — repasser en préparation</button>
            ) : (
              <button className="ig-btn ig-btn-primary" onClick={validerPlanning} disabled={Object.keys(planning).length===0} style={{background:'var(--sea)'}}><Icon.Check/> Valider le planning</button>
            )}
          </div>
          {confirmForceModele && (
            <div className="ig-noprint ig-card" style={{padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',borderColor:'var(--coral-d)'}}>
              <b style={{color:'var(--coral-d)'}}>Forcer le modèle sur toute la semaine ?</b>
              <span className="ig-muted">Remplace les horaires déjà saisis cette semaine par ceux du modèle, pour tous les salariés présents dans le modèle. Les salariés déjà saisis manuellement seront écrasés.</span>
              <div style={{marginLeft:'auto',display:'flex',gap:8}}>
                <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setConfirmForceModele(false)}>Annuler</button>
                <button className="ig-btn ig-btn-sm" style={{background:'var(--coral-d)',color:'#fff'}} onClick={()=>{ appliquerModeleForce(); setConfirmForceModele(false); }}>Confirmer, tout remplacer</button>
              </div>
            </div>
          )}
          {Object.keys(planning).length>0 && (
            <div className="ig-noprint" style={{marginBottom:14}}>
              <span className="ig-muted">Pour le PDF : une fenêtre d'impression s'ouvre, choisissez « Enregistrer au format PDF » comme destination. Glissez ensuite le fichier dans le dossier Drive du restaurant.</span>
            </div>
          )}
          {flash && <div className="ig-status-line ig-noprint" style={{background:'#EAF3F3',marginBottom:14}}>{flash}</div>}
          <div className="ig-noprint" style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,flexWrap:'wrap'}}>
            <div className="ig-search" style={{margin:0,maxWidth:320,flex:'1 1 240px'}}>
              <Icon.Search />
              <input placeholder="Rechercher un salarié…" value={recherche} onChange={(e)=>setRecherche(e.target.value)} />
            </div>
            <div style={{display:'flex',gap:6}}>
              {[["TOUS","Tous"],["SALLE","Salle"],["CUISINE","Cuisine"]].map(([val,lib])=>(
                <button key={val} className={"ig-btn ig-btn-sm "+(filtreUnite===val?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setFiltreUnite(val)}>{lib}</button>
              ))}
            </div>
            <span className="ig-muted">{(recherche||filtreUnite!=="TOUS") ? `${teamFiltre.length} sur ${team.length}` : `${team.length} salariés`} · cliquez une case pour ajuster un créneau.{modele?'':' Aucun modèle enregistré pour le moment.'}</span>
          </div>
          {modeSelect && (
            <div className="ig-noprint ig-card" style={{padding:'12px 16px',marginBottom:14,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',borderColor:'var(--coral)'}}>
              <b>Mode nettoyage de l'effectif</b>
              <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setSelection(new Set(teamFiltre.map((e)=>idSalarie(e))))}>Tout sélectionner ({teamFiltre.length})</button>
              <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setSelection(new Set())}>Tout désélectionner</button>
              <span className="ig-muted">{selection.size} sélectionné{selection.size>1?'s':''}</span>
              <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                {!confirmLot ? (
                  <button className="ig-btn ig-btn-sm" style={{background:'var(--coral-d)',color:'#fff'}} disabled={selection.size===0} onClick={()=>setConfirmLot(true)}>Retirer de l'effectif</button>
                ) : (
                  <>
                    <span style={{fontSize:13,fontWeight:600,color:'var(--coral-d)'}}>Retirer {selection.size} salarié{selection.size>1?'s':''} ? (historique conservé)</span>
                    <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setConfirmLot(false)}>Annuler</button>
                    <button className="ig-btn ig-btn-sm" style={{background:'var(--coral-d)',color:'#fff'}} onClick={()=>retirerEnLot([...selection])}>Confirmer le retrait</button>
                  </>
                )}
              </div>
            </div>
          )}
          {loading ? <div className="ig-muted" style={{padding:20}}>Chargement…</div> : (
          <div className="ig-card" style={{padding:'6px 10px',overflowX:'auto'}}>
            <div className="ig-print-only" style={{textAlign:'center',padding:'4px 0 12px'}}>
              <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:20,fontWeight:700}}>Planning — {resto}</div>
              <div style={{fontSize:13}}>Semaine du {fmtDate(lundi)} au {fmtDate(ajouterJours(lundi,6))}</div>
            </div>
            <table className="ig-planning">
              <thead>
                <tr>
                  <th className="who">Salarié</th>
                  {JOURS.map((j,i)=>(<th key={j}>{JOURS_COURT[i]}<br/><span style={{fontWeight:500,opacity:.6}}>{fmtJour(ajouterJours(lundi,i))}</span></th>))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {teamFiltre.map((e) => {
                  const pl = planning[idSalarie(e)];
                  const tot = pl ? totalHebdo(pl) : 0;
                  return (
                    <tr key={idSalarie(e)}>
                      <td className="who">
                        <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                          {modeSelect && <input type="checkbox" checked={selection.has(idSalarie(e))} onChange={()=>toggleSelection(idSalarie(e))} style={{width:16,height:16,marginTop:3,cursor:'pointer',flexShrink:0}} />}
                          <div>
                            <div className="nm">{e.p} {e.n}{e._ajout && <span className="ig-badge" style={{marginLeft:6}}>nouveau</span>}</div>
                            <div className="po">{e.po} · <b>{e.h}h</b></div>
                            <div className="ig-noprint" style={{display:'flex',gap:8,marginTop:2}}>
                              {!pl && <button className="ig-editbtn" onClick={()=>genererUn(e)}>générer</button>}
                              <button className="ig-editbtn" onClick={()=>setGestion(e)}>gestion</button>
                            </div>
                          </div>
                        </div>
                      </td>
                      {JOURS.map((j,i)=>(
                        <td key={i}>
                          <PlanningCell p={pl?pl[i]:null} editable onClick={()=>setEdit({emp:e,jour:i})} />
                        </td>
                      ))}
                      <td>
                        <div className="ig-tot" style={{color: tot>e.h+0.1?'var(--coral-d)':'var(--ink)'}}>
                          {fmtHeures(tot)}
                          <small>/ {e.h}h</small>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {teamFiltre.length === 0 && (
                  <tr><td colSpan={9} className="ig-muted" style={{padding:18,textAlign:'center'}}>Aucun salarié{filtreUnite!=="TOUS"?` en ${filtreUnite.toLowerCase()}`:''}{recherche?` ne correspond à « ${recherche} »`:''}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </>
      )}

      {vue === "emargement" && (
        <EmargementSheet resto={resto} semDate={semDate} planning={planning} pointages={pointages} team={team} onToggleSignature={superviseur ? toggleSignatureManuelle : undefined} onToggleJour={superviseur ? toggleJourManuel : undefined} />
      )}

      {edit && (
        <EditModal
          jour={edit.jour}
          jourLabel={JOURS[edit.jour]}
          emp={edit.emp}
          p={(planning[idSalarie(edit.emp)] && planning[idSalarie(edit.emp)][edit.jour]) || {statut:STATUTS.TRAVAIL,debut:"09:00",fin:"17:00",pause:1}}
          shifts={shifts}
          onSave={(data)=>saveCell(edit.emp, edit.jour, data)}
          onClose={()=>setEdit(null)}
        />
      )}

      {gestion && (() => {
        const finGestion = (roster.departs || {})[idSalarie(gestion)];
        const aujourdHui = dateISOLocale(new Date());
        const peutSupprimerDef = !!gestion._ajout && !!finGestion && aujourdHui > finGestion;
        return (
        <GestionModal
          emp={gestion}
          semDate={semDate}
          depart={finGestion}
          peutSupprimerDef={peutSupprimerDef}
          onMarquer={(jours, statut)=>{ marquerJours(gestion, jours, statut); setGestion(null); }}
          onSupprimer={(dateFin)=>supprimerSalarie(gestion, dateFin)}
          onSupprimerDef={()=>supprimerDefinitivement(gestion)}
          onAnnulerDepart={()=>{ annulerDepart(gestion); setGestion(null); }}
          onModifier={(data)=>modifierSalarie(gestion, data)}
          onClose={()=>setGestion(null)}
        />
        );
      })()}

      {ajout && (
        <AjoutModal resto={resto} onAjouter={ajouterSalarie} onClose={()=>setAjout(false)} />
      )}
      {histo && (
        <HistoriqueModal titre={histo.titre} cle={histo.cle} onRestaurer={histo.onRestaurer} onClose={()=>setHisto(null)} />
      )}
      {gererShifts && (
        <GestionShiftsModal
          shifts={shifts}
          onSave={(next)=>{ setShifts(next); Store.set(kShifts(resto), next); }}
          onClose={()=>setGererShifts(false)}
        />
      )}
    </div>
  );
}

// ---------- Modal Historique / restauration d'une ancienne version ----------
function HistoriqueModal({ titre, cle, onRestaurer, onClose }) {
  const [versions, setVersions] = useState(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    let on = true;
    Store.history(cle).then((v) => { if (on) setVersions(v); });
    return () => { on = false; };
  }, [cle]);

  function fmtDateHeure(iso) {
    const d = new Date(iso);
    return `${fmtDate(d)} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  function restaurer(value) {
    setEnCours(true);
    onRestaurer(value);
    onClose();
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e)=>e.stopPropagation()} style={{maxWidth:460}}>
        <h3>Historique</h3>
        <div className="ig-muted" style={{marginBottom:14}}>{titre}<br />Chaque modification précédente est conservée automatiquement. Choisissez une version à restaurer si une modification récente a été perdue par erreur.</div>
        {versions === null ? (
          <div className="ig-muted">Chargement…</div>
        ) : versions.length === 0 ? (
          <div className="ig-muted">Aucun historique pour le moment : il se constitue à partir de la prochaine modification.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:360,overflowY:'auto'}}>
            {versions.map((v, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10}}>
                <span style={{fontSize:13}}>{fmtDateHeure(v.saved_at)}</span>
                <button className="ig-btn ig-btn-sm" style={{background:'var(--sea)',color:'#fff'}} disabled={enCours} onClick={()=>restaurer(v.value)}>Restaurer</button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Modal Gestion des shifts prêts à l'emploi (raccourcis d'horaires) ----------
function GestionShiftsModal({ shifts, onSave, onClose }) {
  const [liste, setListe] = useState(shifts);
  const [nom, setNom] = useState("");
  const [debut, setDebut] = useState("09:00");
  const [fin, setFin] = useState("17:00");
  const [pause, setPause] = useState(1);
  const [erreur, setErreur] = useState("");

  function ajouter() {
    if (!nom.trim()) { setErreur("Donnez un nom au shift (ex : matin)."); return; }
    setErreur("");
    const next = [...liste, { id: Date.now(), nom: nom.trim(), debut, fin, pause }];
    setListe(next);
    onSave(next);
    setNom(""); setDebut("09:00"); setFin("17:00"); setPause(1);
  }
  function supprimer(id) {
    const next = liste.filter((s) => s.id !== id);
    setListe(next);
    onSave(next);
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth:480}}>
        <h3>Gérer les shifts</h3>
        <div className="ig-muted" style={{marginBottom:14}}>Créez des horaires-types réutilisables (ex : « matin » 09:00-17:00), proposés en raccourci quand vous éditez le créneau d'un jour dans le planning.</div>
        {liste.length === 0 ? (
          <div className="ig-muted" style={{marginBottom:14}}>Aucun shift pour le moment.</div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
            {liste.map((s) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',border:'1px solid var(--line)',borderRadius:10}}>
                <b style={{minWidth:80}}>{s.nom}</b>
                <span className="ig-muted" style={{fontSize:13}}>{s.debut}–{s.fin} · {s.pause}h pause</span>
                <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{marginLeft:'auto',color:'var(--coral-d)'}} onClick={()=>supprimer(s.id)}>Supprimer</button>
              </div>
            ))}
          </div>
        )}
        <div className="ig-field">
          <label>Nom du shift</label>
          <input value={nom} onChange={(e)=>setNom(e.target.value)} placeholder="Ex : matin" />
        </div>
        <div className="ig-times">
          <div>
            <input type="time" value={debut} onChange={(e)=>setDebut(e.target.value)} />
            <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Début</div>
          </div>
          <div>
            <input type="time" value={fin} onChange={(e)=>setFin(e.target.value)} />
            <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Fin</div>
          </div>
          <div>
            <input type="number" min="0" max="4" step="0.5" value={pause} onChange={(e)=>setPause(parseFloat(e.target.value)||0)} />
            <div className="ig-muted" style={{fontSize:11,marginTop:4,textAlign:'center'}}>Pause (h)</div>
          </div>
        </div>
        {erreur && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:8,fontWeight:600}}>{erreur}</div>}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Fermer</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={ajouter}>+ Ajouter ce shift</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Vue Salarié : planning perso + pointage ----------
function EmployeeView({ resto, emp, onBack }) {
  const semDate = new Date();
  const [planning, setPlanning] = useState(null);
  const [pointages, setPointages] = useState({});
  const [valide, setValide] = useState(null); // null = en cours de chargement
  const [now, setNow] = useState(new Date());
  const [prec, setPrec] = useState(null); // rattrapage : semaines passées incomplètes (liste)
  const sem = cleSemaine(semDate);
  const id = idSalarie(emp);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Rattrapage : liste des semaines passées (hors semaine en cours) où le salarié n'a pas
  // tout confirmé/signé à temps. Reste accessible depuis son espace à tout moment (pas
  // seulement le lundi), sur une fenêtre limitée aux 8 dernières semaines.
  const NB_SEMAINES_RATTRAPAGE = 8;
  useEffect(() => {
    let on = true;
    const lundiActuel = lundiDeLaSemaine(new Date());
    const semainesAVerifier = Array.from({ length: NB_SEMAINES_RATTRAPAGE }, (_, k) => ajouterJours(lundiActuel, -7 * (k + 1)));
    Promise.all(semainesAVerifier.map((lundiS) => {
      const semS = cleSemaine(lundiS);
      return Promise.all([Store.get(kPlanning(resto, semS)), Pointages.load(resto, semS)])
        .then(([pl, pt]) => ({ lundiS, semS, pl, pt }));
    })).then((resultats) => {
      if (!on) return;
      const liste = [];
      resultats.forEach(({ lundiS, semS, pl, pt }) => {
        const planningS = (pl && pl[id]) || null;
        if (!planningS) return;
        const ptId = (pt && pt[id]) || {};
        const joursTravailles = [];
        for (let j = 0; j < 7; j++) if (planningS[j] && estJourTravaille(planningS[j].statut)) joursTravailles.push(j);
        if (joursTravailles.length === 0) return;
        const signee = !!(ptId.semaine && ptId.semaine.signee);
        if (signee) return;
        const joursConfirmes = joursTravailles.filter((j) => ptId[j] && ptId[j].confirme);
        const tousConfirmes = joursConfirmes.length === joursTravailles.length;
        liste.push({ sem: semS, lundi: lundiS, planning: planningS, pointages: ptId, joursTravailles, tousConfirmes });
      });
      liste.sort((a, b) => b.sem.localeCompare(a.sem));
      setPrec(liste);
    });
    return () => { on = false; };
  }, [resto, id, sem]);

  function confirmerJourPrecedent(semTarget, j) {
    if (!prec) return;
    const w = prec.find((x) => x.sem === semTarget);
    if (!w) return;
    const p = w.planning[j];
    if (!p || !estJourTravaille(p.statut)) return;
    if (w.pointages[j] && w.pointages[j].confirme) return;
    const nextJour = { confirme: "rattrapé", debut: p.debut, fin: p.fin, pause: p.pause || 0 };
    const nextPt = { ...w.pointages, [j]: nextJour };
    const joursConfirmes = w.joursTravailles.filter((jj) => nextPt[jj] && nextPt[jj].confirme);
    const tousConfirmes = joursConfirmes.length === w.joursTravailles.length;
    const nextW = { ...w, pointages: nextPt, tousConfirmes };
    setPrec(prec.map((x) => (x.sem === semTarget ? nextW : x)));
    Pointages.setJour(resto, semTarget, id, j, nextJour);
  }

  function validerSemainePrecedente(semTarget) {
    const w = prec && prec.find((x) => x.sem === semTarget);
    if (!w || !w.tousConfirmes) return;
    setPrec(prec.filter((x) => x.sem !== semTarget));
    Pointages.setSemaine(resto, semTarget, id, { signee: true });
  }

  useEffect(() => {
    let on = true;
    Promise.all([Store.get(kPlanning(resto, sem)), Pointages.load(resto, sem), Store.get(kValidation(resto, sem))]).then(([pl, pt, vd]) => {
      if (!on) return;
      setPlanning(pl && pl[id] ? pl[id] : null);
      setPointages(pt || {});
      setValide(!!vd);
    });
    return () => { on = false; };
  }, [resto, sem, id]);

  // Jour courant (0=lundi). Si la semaine affichée n'est pas la semaine réelle, on prend lundi.
  const lundi = lundiDeLaSemaine(semDate);
  const estSemaineCourante = cleSemaine(now) === sem;
  const jourCourant = estSemaineCourante ? (now.getDay() + 6) % 7 : 0;
  const monPt = (pointages[id] && pointages[id][jourCourant]) || {};
  const planJour = planning ? planning[jourCourant] : null;

  const estJourTravaille = (st) => st === STATUTS.TRAVAIL || st === STATUTS.DEMI_CP;

  // Confirmation unique du jour : valide les horaires prévus au planning, horodatée.
  function confirmerJour() {
    if (!planJour || !estJourTravaille(planJour.statut)) return;
    if (monPt.confirme) return; // déjà confirmé aujourd'hui
    const hhmm = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const cur = pointages[id] || {};
    const nextJour = { confirme: hhmm, debut: planJour.debut, fin: planJour.fin, pause: planJour.pause || 0 };
    const next = { ...pointages, [id]: { ...cur, [jourCourant]: nextJour } };
    setPointages(next);
    Pointages.setJour(resto, sem, id, jourCourant, nextJour);
  }

  // Jours travaillés de la semaine et avancement des confirmations.
  const monPlanning = planning || {};
  const joursTravailles = [];
  for (let j = 0; j < 7; j++) {
    if (monPlanning[j] && estJourTravaille(monPlanning[j].statut)) joursTravailles.push(j);
  }
  const mesPt = pointages[id] || {};
  const joursConfirmes = joursTravailles.filter((j) => mesPt[j] && mesPt[j].confirme);
  const tousConfirmes = joursTravailles.length > 0 && joursConfirmes.length === joursTravailles.length;
  const semaineSignee = !!(mesPt.semaine && mesPt.semaine.signee);

  // Jours travaillés PASSÉS de la semaine en cours non encore confirmés (à rattraper).
  const joursARattraper = estSemaineCourante
    ? joursTravailles.filter((j) => j < jourCourant && !(mesPt[j] && mesPt[j].confirme))
    : [];

  // Confirme un jour passé oublié.
  function confirmerJourPasse(j) {
    const p = monPlanning[j];
    if (!p || !estJourTravaille(p.statut)) return;
    if (mesPt[j] && mesPt[j].confirme) return;
    const cur = pointages[id] || {};
    const nextJour = { confirme: "rattrapé", debut: p.debut, fin: p.fin, pause: p.pause || 0 };
    const next = { ...pointages, [id]: { ...cur, [j]: nextJour } };
    setPointages(next);
    Pointages.setJour(resto, sem, id, j, nextJour);
  }

  // La validation n'est possible qu'à partir du dimanche : soit on est dimanche dans la
  // semaine affichée, soit cette semaine est déjà passée.
  const estDimanche = estSemaineCourante ? ((now.getDay() + 6) % 7 === 6) : (sem < cleSemaine(now));
  const peutValider = tousConfirmes && estDimanche;

  function validerSemaine() {
    if (!peutValider || semaineSignee) return;
    const cur = pointages[id] || {};
    const next = { ...pointages, [id]: { ...cur, semaine: { signee: true } } };
    setPointages(next);
    Pointages.setSemaine(resto, sem, id, { signee: true });
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onBack}><Icon.Back/> Retour</button>
        <div>
          <div className="ig-eyebrow" style={{margin:0}}>Espace salarié · {resto}</div>
          <h2 className="ig-section-title">{emp.p} {emp.n}</h2>
        </div>
      </div>

      {prec && prec.length > 0 && prec.map((w) => (
        <div key={w.sem} className="ig-card" style={{padding:'16px 20px',marginBottom:18,border:'1.5px solid #E5A06A'}}>
          <div style={{fontWeight:700,marginBottom:4,color:'#9A4A1B'}}>Semaine du {fmtDate(w.lundi)} au {fmtDate(ajouterJours(w.lundi,6))} — à valider</div>
          <div className="ig-muted" style={{marginBottom:12}}>
            Cette semaine passée n'a pas été entièrement confirmée/signée. Vous pouvez encore le faire depuis ici.
          </div>
          {w.joursTravailles.filter((j)=>!(w.pointages[j] && w.pointages[j].confirme)).length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
              {w.joursTravailles.filter((j)=>!(w.pointages[j] && w.pointages[j].confirme)).map((j)=>(
                <div key={j} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div style={{fontSize:14}}><b style={{textTransform:'capitalize'}}>{JOURS[j]}</b> <span className="ig-muted">{fmtJour(ajouterJours(w.lundi,j))}</span></div>
                  <button className="ig-btn ig-btn-sm" style={{background:'var(--sea)',color:'#fff'}} onClick={()=>confirmerJourPrecedent(w.sem, j)}>Confirmer ce jour</button>
                </div>
              ))}
            </div>
          )}
          <button className="ig-clock-btn" style={{background: w.tousConfirmes?'var(--coral)':'var(--sand-2)', color: w.tousConfirmes?'#fff':'var(--ink-soft)', minWidth:220, cursor: w.tousConfirmes?'pointer':'not-allowed'}} disabled={!w.tousConfirmes} onClick={()=>validerSemainePrecedente(w.sem)}>
            Je valide cette semaine
          </button>
        </div>
      ))}

      {valide === false ? (
        <div className="ig-card ig-clock-card" style={{marginBottom:22}}>
          <div className="ig-clock-date" style={{textTransform:'capitalize',fontSize:18,marginBottom:18}}>{now.toLocaleDateString("fr-FR",{weekday:'long',day:'numeric',month:'long'})}</div>
          <div style={{fontSize:18,fontWeight:600,fontFamily:"'Inter',system-ui,sans-serif"}}>Horaires en cours de préparation</div>
          <div className="ig-muted" style={{marginTop:8,maxWidth:380,marginLeft:'auto',marginRight:'auto'}}>Votre manager finalise les horaires de la semaine. Revenez un peu plus tard : vous pourrez voir vos horaires et confirmer votre présence dès qu'ils seront validés.</div>
        </div>
      ) : valide === null ? (
        <div className="ig-card ig-clock-card" style={{marginBottom:22}}>
          <div className="ig-muted">Chargement…</div>
        </div>
      ) : (
      <>
      {/* Carte pointage */}
      <div className="ig-card ig-clock-card" style={{marginBottom:22}}>
        <div className="ig-clock-date" style={{textTransform:'capitalize',fontSize:18,marginBottom:24}}>{now.toLocaleDateString("fr-FR",{weekday:'long',day:'numeric',month:'long'})}</div>

        {!estSemaineCourante ? (
          <div className="ig-muted">Le pointage n'est possible que pour la semaine en cours.</div>
        ) : planJour && estJourTravaille(planJour.statut) ? (
          <>
            {monPt.confirme ? (
              <div className="ig-status-line" style={{background:'#EAF3F3'}}>
                <span className="ig-stamp" style={{borderColor:'var(--sea)'}}><Icon.Check width={15} height={15}/> Présence validée</span>
                <div className="ig-muted" style={{marginTop:8}}>À demain !</div>
              </div>
            ) : (
              <div className="ig-clock-actions">
                <button className="ig-clock-btn" style={{background:'var(--sea)',color:'#fff',minWidth:240}} onClick={confirmerJour}>
                  Valider ma présence
                </button>
              </div>
            )}
          </>
        ) : planJour && (planJour.statut===STATUTS.OFF||planJour.statut===STATUTS.CP||planJour.statut===STATUTS.AM||planJour.statut===STATUTS.SANS_SOLDE) ? (
          <div className="ig-muted">Vous n'êtes pas en service aujourd'hui ({planJour.statut}).</div>
        ) : (
          <div className="ig-muted">Aucun service planifié aujourd'hui pour le moment.</div>
        )}
      </div>

      {joursARattraper.length > 0 && (
        <div className="ig-card" style={{padding:'16px 20px',marginTop:18,border:'1.5px solid #E5A06A'}}>
          <div style={{fontWeight:700,marginBottom:4,color:'#9A4A1B'}}>Jours à rattraper</div>
          <div className="ig-muted" style={{marginBottom:12}}>Vous avez oublié de confirmer ces jours travaillés. Vous pouvez le faire maintenant.</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {joursARattraper.map((j)=>{
              const p = monPlanning[j];
              return (
                <div key={j} style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                  <div style={{fontSize:14}}><b style={{textTransform:'capitalize'}}>{JOURS[j]}</b> <span className="ig-muted">{fmtJour(ajouterJours(lundi,j))}</span></div>
                  <button className="ig-btn ig-btn-sm" style={{background:'var(--sea)',color:'#fff'}} onClick={()=>confirmerJourPasse(j)}>Confirmer ce jour</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Validation de la semaine (signature globale) */}
      {planning && joursTravailles.length > 0 && (
        <div className="ig-card" style={{padding:'18px 20px',marginTop:18}}>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:18,fontWeight:600,marginBottom:6}}>Validation de ma semaine</div>
          {semaineSignee ? (
            <div className="ig-status-line" style={{background:'#EAF3F3'}}>
              <span className="ig-stamp" style={{borderColor:'var(--sea)'}}><Icon.Check width={15} height={15}/> Semaine validée et signée</span>
              <div className="ig-muted" style={{marginTop:8}}>Votre signature apparaît sur la feuille d'émargement. Merci !</div>
            </div>
          ) : (
            <>
              <div className="ig-muted" style={{marginBottom:12}}>
                {joursConfirmes.length} jour{joursConfirmes.length>1?'s':''} confirmé{joursConfirmes.length>1?'s':''} sur {joursTravailles.length}.
                {!tousConfirmes
                  ? " Confirmez chaque jour travaillé pour pouvoir valider votre semaine."
                  : !estDimanche
                    ? " La validation de la semaine sera possible à partir de dimanche."
                    : " Vous pouvez signer votre semaine."}
              </div>
              <button className="ig-clock-btn" style={{background: peutValider?'var(--coral)':'var(--sand-2)', color: peutValider?'#fff':'var(--ink-soft)', minWidth:220, cursor: peutValider?'pointer':'not-allowed'}} disabled={!peutValider} onClick={validerSemaine}>
                Je valide ma semaine
              </button>
            </>
          )}
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ---------- Sélecteur de restaurant ----------
// compteurs : optionnel — quand fourni (ex: depuis l'Espace RH), remplace le calcul
// interne (basé sur le roster Planning) par des effectifs fournis par l'appelant.
function RestoPicker({ restaurants, onPick, onAdd, compteurs }) {
  const [form, setForm] = useState(false);
  const [nom, setNom] = useState("");
  const [err, setErr] = useState("");
  const [countsInternes, setCountsInternes] = useState({}); // effectif Planning (fiches + ajouts − retirés)

  useEffect(() => {
    if (compteurs) return; // effectifs déjà fournis par le parent
    let on = true;
    Promise.all(restaurants.map((r) => Store.get(kRoster(r)).then((rs) => [r, rs]))).then((paires) => {
      if (!on) return;
      const res = {};
      paires.forEach(([r, rs]) => {
        const roster = rs || {};
        const ajouts = roster.ajouts || [];
        const ajoutIds = new Set(ajouts.map((a) => idSalarie(a)));
        const supprimes = new Set(roster.supprimes || []);
        const base = EMPLOYEES.filter((e) => e.r === r);
        const tous = base.filter((e) => !ajoutIds.has(idSalarie(e))).concat(ajouts);
        res[r] = tous.filter((e) => !supprimes.has(idSalarie(e))).length;
      });
      setCountsInternes(res);
    });
    return () => { on = false; };
  }, [restaurants, compteurs]);
  const counts = compteurs || countsInternes;

  function valider() {
    const propre = nom.trim();
    if (!propre) { setErr("Indiquez le nom de l'établissement."); return; }
    if (restaurants.some((r) => normTxt(r) === normTxt(propre))) { setErr("Cet établissement existe déjà."); return; }
    onAdd(propre);
    setNom(""); setErr(""); setForm(false);
  }
  return (
    <div>
      <div className="ig-eyebrow">Étape 1</div>
      <h2 className="ig-section-title">Choisissez votre restaurant</h2>
      <p className="ig-muted">{restaurants.length} établissements du groupe.</p>
      <div className="ig-resto-grid">
        {restaurants.map((r) => {
          const ct = <div className="ct">{counts[r] != null ? counts[r] : (compteurs ? 0 : EMPLOYEES.filter((e)=>e.r===r).length)} salariés</div>;
          return (
            <button key={r} className="ig-resto" onClick={() => onPick(r)}>
              <div>
                <div className="nm">{r}</div>
                {ct}
              </div>
              <Icon.Chevron />
            </button>
          );
        })}
        <button className="ig-resto" style={{borderStyle:'dashed',color:'var(--coral-d)',justifyContent:'center'}} onClick={()=>{ setForm(true); setErr(""); }}>
          <div className="nm">+ Nouvel établissement</div>
        </button>
      </div>

      {form && (
        <div className="ig-overlay" onClick={()=>setForm(false)}>
          <div className="ig-modal" onClick={(e)=>e.stopPropagation()}>
            <h3>Nouvel établissement</h3>
            <div className="ig-muted">Il démarrera vide et utilisera le même fonctionnement que les autres (créneaux, génération, émargement…). Vous y ajouterez les salariés ensuite.</div>
            <div className="ig-field" style={{marginTop:14}}>
              <label>Nom de l'établissement</label>
              <input value={nom} autoFocus onChange={(e)=>{ setNom(e.target.value); setErr(""); }} onKeyDown={(e)=>{ if(e.key==='Enter') valider(); }} placeholder="Ex : INDIE BEACH 2" />
            </div>
            {err && <div style={{color:'var(--coral-d)',fontSize:13,marginBottom:8,fontWeight:600}}>{err}</div>}
            <div style={{display:'flex',gap:10,marginTop:8}}>
              <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={()=>setForm(false)}>Annuler</button>
              <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={valider}>Créer l'établissement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Écran "Qui suis-je ?" (identification salarié sans liste de noms) ----------
function EmployeeIdentify({ restaurants, onFound, onBack }) {
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [resto, setResto] = useState("");
  const [suggestions, setSuggestions] = useState(null); // null = pas encore cherché
  const [vide, setVide] = useState(false);
  const [ajoutesResto, setAjoutesResto] = useState([]); // salariés ajoutés actifs du resto choisi
  const [exclusResto, setExclusResto] = useState(new Set()); // ids supprimés / fin de contrat passée

  // Charge les salariés ajoutés du restaurant choisi (hors contrats terminés)
  // et la liste des exclusions (supprimés ou fin de contrat dépassée).
  useEffect(() => {
    if (!resto) { setAjoutesResto([]); setExclusResto(new Set()); return; }
    let on = true;
    Store.get(kRoster(resto)).then((rs) => {
      if (!on) return;
      const r = rs || { ajouts: [], departs: {} };
      const aujourdHui = dateISOLocale(new Date());
      const departs = r.departs || {};
      const actifs = (r.ajouts || []).filter((a) => {
        const fin = departs[idSalarie(a)];
        return !fin || aujourdHui <= fin; // exclut les contrats déjà terminés
      });
      // Exclusions : déjà supprimés + tout salarié dont la fin de contrat est dépassée.
      const exclus = new Set(r.supprimes || []);
      Object.keys(departs).forEach((id) => { if (aujourdHui > departs[id]) exclus.add(id); });
      setAjoutesResto(actifs);
      setExclusResto(exclus);
    });
    return () => { on = false; };
  }, [resto]);

  function valider() {
    setVide(false);
    setSuggestions(null);
    if (!prenom.trim() && !nom.trim()) {
      setVide(true);
      return;
    }
    if (!resto) {
      setVide(true);
      return;
    }
    const e = trouverSalarie(prenom, nom, resto, ajoutesResto, exclusResto);
    if (e) {
      onFound(e);
    } else {
      setSuggestions(suggererSalaries(prenom, nom, resto, ajoutesResto, exclusResto));
    }
  }
  function onKey(ev) { if (ev.key === "Enter") valider(); }
  function resetReco() { setSuggestions(null); setVide(false); }

  return (
    <div className="ig-hero" style={{maxWidth:440}}>
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onBack} style={{marginBottom:20}}><Icon.Back/> Retour</button>
      <div className="ig-ic" style={{background:'var(--coral)',color:'#fff',width:46,height:46,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><Icon.User/></div>
      <h1 className="ig-display" style={{fontFamily:"'Inter', system-ui, sans-serif",fontWeight:700,letterSpacing:'-.4px',fontSize:32,marginBottom:8}}>Qui suis-je ?</h1>
      <p style={{marginBottom:20}}>Indiquez votre prénom, votre nom et votre restaurant pour accéder à votre espace.</p>
      <div className="ig-field">
        <label>Prénom</label>
        <input value={prenom} autoFocus onChange={(e)=>{ setPrenom(e.target.value); resetReco(); }} onKeyDown={onKey} placeholder="Votre prénom" />
      </div>
      <div className="ig-field">
        <label>Nom</label>
        <input value={nom} onChange={(e)=>{ setNom(e.target.value); resetReco(); }} onKeyDown={onKey} placeholder="Votre nom" />
      </div>
      <div className="ig-field">
        <label>Restaurant</label>
        <select value={resto} onChange={(e)=>{ setResto(e.target.value); resetReco(); }}>
          <option value="">— Choisir —</option>
          {restaurants.map((r)=>(<option key={r} value={r}>{r}</option>))}
        </select>
      </div>

      {vide && <div style={{color:'var(--coral-d)',fontSize:13,marginBottom:12,fontWeight:600}}>Renseignez votre nom et votre restaurant.</div>}

      {suggestions && suggestions.length > 0 && (
        <div style={{marginBottom:14}}>
          <div className="ig-muted" style={{marginBottom:8}}>Est-ce l'une de ces personnes ?</div>
          <div className="ig-emp-list">
            {suggestions.map((e)=>(
              <button key={idSalarie(e)} className="ig-emp-row" onClick={()=>onFound(e)}>
                <div>
                  <div className="nm">{e.p} {e.n}</div>
                  <div className="meta">{e.po}</div>
                </div>
                <Icon.Chevron />
              </button>
            ))}
          </div>
        </div>
      )}
      {suggestions && suggestions.length === 0 && (
        <div style={{color:'var(--coral-d)',fontSize:13,marginBottom:12,fontWeight:600}}>Aucune correspondance dans ce restaurant. Vérifiez l'orthographe ou le restaurant choisi.</div>
      )}

      <button className="ig-btn ig-btn-primary" onClick={valider}>Valider</button>
    </div>
  );
}

// ---------- Écran de saisie du code manager ----------
// Le manager tape un code court. En coulisses, l'app se connecte au compte Supabase
// partagé (MANAGER_EMAIL / MANAGER_SECRET) : la base reste verrouillée en écriture.
function CodeGate({ onOk, onCancel }) {
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);

  async function valider() {
    if (busy) return;
    const estSuperviseur = code === CODE_SUPERVISEUR;
    if (!estSuperviseur && code !== CODE_MANAGER) { setErreur("Code incorrect. Réessayez."); setCode(""); return; }
    setErreur("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: MANAGER_EMAIL, password: MANAGER_SECRET });
    setBusy(false);
    if (error) { setErreur("Compte manager non configuré dans Supabase (voir la doc)."); return; }
    onOk(estSuperviseur);
  }
  function onKey(e) { if (e.key === "Enter") valider(); }

  return (
    <div className="ig-hero" style={{maxWidth:420}}>
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onCancel} style={{marginBottom:20}}><Icon.Back/> Retour</button>
      <div className="ig-ic" style={{background:'var(--ink)',color:'var(--sand)',width:46,height:46,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><Icon.Shield/></div>
      <h1 className="ig-display" style={{fontSize:32,marginBottom:8}}>Espace manager</h1>
      <p style={{marginBottom:20}}>Saisissez le code d'accès pour gérer les plannings et l'émargement.</p>
      <div className="ig-field">
        <label>Code d'accès</label>
        <input
          type="password"
          inputMode="numeric"
          value={code}
          autoFocus
          onChange={(e)=>{ setCode(e.target.value); setErreur(""); }}
          onKeyDown={onKey}
          placeholder="••••"
          style={{letterSpacing:'4px',fontSize:18,textAlign:'center',maxWidth:200}}
        />
        {erreur && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:8,fontWeight:600}}>{erreur}</div>}
      </div>
      <button className="ig-btn ig-btn-primary" onClick={valider} disabled={busy} style={{marginTop:6}}>{busy ? "Connexion…" : "Accéder à l'espace manager"}</button>
    </div>
  );
}

// ---------- Connexion Espace RH (compte individuel, séparé du code manager) ----------
function RHLoginForm({ onOk, onCancel }) {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [busy, setBusy] = useState(false);

  async function valider() {
    if (busy) return;
    if (!email.trim() || !motDePasse) { setErreur("Renseignez votre email et votre mot de passe."); return; }
    setErreur("");
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: motDePasse });
    if (error) { setBusy(false); setErreur("Email ou mot de passe incorrect."); return; }
    const { data: acces, error: errAcces } = await supabase.from("rh_acces").select("resto, unite, superviseur").eq("user_id", data.user.id);
    setBusy(false);
    if (errAcces || !acces || acces.length === 0) {
      setErreur("Ce compte n'a pas encore d'accès RH configuré. Contactez Océane.");
      await supabase.auth.signOut();
      return;
    }
    onOk(acces);
  }
  function onKey(e) { if (e.key === "Enter") valider(); }

  return (
    <div className="ig-hero" style={{maxWidth:420}}>
      <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onCancel} style={{marginBottom:20}}><Icon.Back/> Retour</button>
      <div className="ig-ic" style={{background:'var(--ink)',color:'var(--sand)',width:46,height:46,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><Icon.Shield/></div>
      <h1 className="ig-display" style={{fontSize:32,marginBottom:8}}>Espace RH</h1>
      <p style={{marginBottom:20}}>Connectez-vous avec votre compte personnel (différent du code manager).</p>
      <div className="ig-field">
        <label>Email</label>
        <input type="email" value={email} autoFocus onChange={(e)=>{ setEmail(e.target.value); setErreur(""); }} onKeyDown={onKey} placeholder="prenom@indiegroup.fr" />
      </div>
      <div className="ig-field">
        <label>Mot de passe</label>
        <input type="password" value={motDePasse} onChange={(e)=>{ setMotDePasse(e.target.value); setErreur(""); }} onKeyDown={onKey} placeholder="••••••••" />
      </div>
      {erreur && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:8,fontWeight:600}}>{erreur}</div>}
      <button className="ig-btn ig-btn-primary" onClick={valider} disabled={busy} style={{marginTop:6}}>{busy ? "Connexion…" : "Se connecter"}</button>
    </div>
  );
}

// Champs "de base" éditables par un directeur/chef ; les autres (sensibles) sont réservés
// au superviseur — et de toute façon verrouillés en base par rh_salaries_guard côté serveur.
const RH_CHAMPS_BASE = [
  { cle: "heures_contrat", label: "Heure CT", type: "number" },
  { cle: "nom", label: "Nom" },
  { cle: "prenom", label: "Prénom" },
  { cle: "telephone", label: "Téléphone" },
  { cle: "email", label: "Email" },
  { cle: "poste", label: "Poste" },
  { cle: "date_debut", label: "Date de début de contrat", type: "date" },
  { cle: "salaire_net", label: "Salaire net", type: "number" },
  { cle: "date_fin", label: "Date de fin de contrat", type: "date" },
  { cle: "date_prolongation_fin", label: "Date de prolongation de fin de contrat", type: "date" },
  { cle: "loge", label: "Logement" },
  { cle: "vehicule", label: "Véhicule" },
];
const RH_CHAMPS_SENSIBLES = [
  { cle: "staff_party", label: "Staff Party", type: "bool" },
  { cle: "civilite", label: "Civilité" },
  { cle: "date_naissance", label: "Date de naissance", type: "date" },
  { cle: "lieu_naissance", label: "Lieu de naissance" },
  { cle: "nationalite", label: "Nationalité" },
  { cle: "adresse", label: "Adresse" },
  { cle: "code_postal", label: "Code postal" },
  { cle: "ville", label: "Ville" },
  { cle: "secu", label: "Numéro de sécurité sociale" },
  { cle: "mutuelle", label: "Mutuelle de l'établissement", type: "bool" },
];
// Champs importants au quotidien pour un directeur/chef, visibles par tout le monde dans la
// FICHE (contrairement au reste de RH_CHAMPS_SENSIBLES, réservé au superviseur) — mais pas
// ajoutés au tableau du Registre embauche, pour ne pas l'alourdir davantage.
const RH_CHAMPS_MODAL_SUPP = [
  { cle: "type_contrat", label: "Type de contrat (CDI, CDD...)" },
  { cle: "contact_urgence", label: "Contact d'urgence (nom et n°)" },
];
// Champs de RH_CHAMPS_BASE à ne pas répéter dans la fiche pour un directeur/chef (trop
// administratifs pour son usage courant) — n'affecte QUE la fiche modale ci-dessous, jamais
// les colonnes du tableau (RH_CHAMPS_BASE reste inchangé, le tableau continue de les afficher).
const RH_CHAMPS_BASE_MASQUES_DIRECTEUR = new Set(["loge", "vehicule", "date_prolongation_fin"]);

// ---------- Modal fiche salarié RH (création / édition) ----------
function RhSalarieModal({ resto, unite, salarie, superviseur, onSave, onClose }) {
  const [f, setF] = useState(() => {
    const base = {};
    RH_CHAMPS_BASE.forEach((c) => { base[c.cle] = salarie ? salarie[c.cle] : (c.type === "bool" ? false : ""); });
    RH_CHAMPS_MODAL_SUPP.forEach((c) => { base[c.cle] = salarie ? salarie[c.cle] : (c.type === "bool" ? false : ""); });
    if (superviseur) RH_CHAMPS_SENSIBLES.forEach((c) => { base[c.cle] = salarie ? salarie[c.cle] : (c.type === "bool" ? false : ""); });
    return base;
  });
  const [err, setErr] = useState("");

  function champ(c) {
    const valeur = f[c.cle] ?? (c.type === "bool" ? false : "");
    if (c.type === "bool") {
      return (
        <label key={c.cle} style={{display:'flex',alignItems:'center',gap:8,fontSize:14,margin:'14px 0'}}>
          <input type="checkbox" checked={!!valeur} onChange={(e)=>setF({ ...f, [c.cle]: e.target.checked })} />
          {c.label}
        </label>
      );
    }
    return (
      <div className="ig-field" key={c.cle}>
        <label>{c.label}</label>
        <input type={c.type === "date" ? "date" : c.type === "number" ? "number" : "text"} value={valeur} onChange={(e)=>setF({ ...f, [c.cle]: c.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value })} />
      </div>
    );
  }

  function valider() {
    if (!String(f.nom || "").trim() || !String(f.prenom || "").trim()) { setErr("Nom et prénom sont obligatoires."); return; }
    const patch = { ...f };
    Object.keys(patch).forEach((k) => { if (patch[k] === "") patch[k] = null; });
    onSave(patch);
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e)=>e.stopPropagation()} style={{maxWidth:520}}>
        <h3>{salarie ? "Modifier la fiche" : "Nouveau salarié"}</h3>
        <div className="ig-muted" style={{marginBottom:10}}>{resto} · {unite === "SALLE" ? "Salle" : "Cuisine"}</div>
        {(superviseur ? RH_CHAMPS_BASE : RH_CHAMPS_BASE.filter((c) => !RH_CHAMPS_BASE_MASQUES_DIRECTEUR.has(c.cle))).map(champ)}
        {RH_CHAMPS_MODAL_SUPP.map(champ)}
        {superviseur && (
          <>
            <div style={{fontWeight:600,fontSize:13,marginTop:16,marginBottom:4}}>Informations complémentaires (superviseur)</div>
            {RH_CHAMPS_SENSIBLES.map(champ)}
          </>
        )}
        {err && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:10,fontWeight:600}}>{err}</div>}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={valider}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Filtre par colonne façon tableur (menu déroulant : tri + case à cocher par valeur) ----------
const RH_DATE_CHAMPS = new Set(["date_debut", "date_fin", "date_prolongation_fin"]);
function rhValeurBrute(s, cle) {
  if (cle === "staff_party") return s.staff_party ? "Oui" : "Non";
  const v = s[cle];
  return (v === null || v === undefined || v === "") ? "" : String(v);
}
function rhValeurLabel(cle, brute) {
  if (brute === "") return "(Vides)";
  if (RH_DATE_CHAMPS.has(cle)) return fmtDate(new Date(brute + "T00:00:00"));
  return brute;
}

// ---------- Couleur de ligne (façon remplissage de cellule Excel) ----------
const RH_PALETTE_COULEURS = [
  { valeur: "", label: "Aucune couleur" },
  { valeur: "#FBE2DC", label: "Rouge clair" },
  { valeur: "#FCE9C6", label: "Jaune clair" },
  { valeur: "#D9F0DC", label: "Vert clair" },
  { valeur: "#DCEAF5", label: "Bleu clair" },
  { valeur: "#EAE0F3", label: "Violet clair" },
  { valeur: "#E8DDC9", label: "Beige" },
];
function PastilleCouleur({ valeur, taille = 20, onClick, titre }) {
  return (
    <button onClick={onClick} title={titre} type="button"
      style={{width:taille,height:taille,borderRadius:6,border: valeur ? '1.5px solid var(--line)' : '1.5px dashed var(--line)', background: valeur || '#fff', cursor:'pointer', padding:0, flex:'none'}} />
  );
}
function SelecteurCouleurLigne({ valeur, onChoisir }) {
  const [ouvert, setOuvert] = useState(false);
  const [pos, setPos] = useState(null);
  const ancre = useRef(null);
  // Le tableau des salariés défile dans un conteneur à hauteur limitée (overflow:auto) :
  // un menu positionné en "absolute" y serait rogné dès que la ligne n'est pas tout en
  // haut. On le sort donc du tableau (portal) et on le positionne en "fixed" par rapport
  // à l'écran, calculé depuis la position réelle du bouton au moment du clic.
  function ouvrir() {
    if (ancre.current) {
      const r = ancre.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: Math.min(r.left, window.innerWidth - 128) });
    }
    setOuvert(true);
  }
  return (
    <span style={{position:'relative',display:'inline-block'}} ref={ancre}>
      <PastilleCouleur valeur={valeur} titre="Couleur de la ligne" onClick={ouvrir} />
      {ouvert && pos && createPortal(
        <>
          <div style={{position:'fixed',inset:0,zIndex:200}} onClick={()=>setOuvert(false)} />
          <div className="ig-card" style={{position:'fixed',top:pos.top,left:pos.left,zIndex:201,padding:8,display:'flex',gap:6,flexWrap:'wrap',width:120,background:'var(--white)'}} onClick={(e)=>e.stopPropagation()}>
            {RH_PALETTE_COULEURS.map((p) => (
              <PastilleCouleur key={p.valeur || 'aucune'} valeur={p.valeur} titre={p.label} taille={22}
                onClick={()=>{ onChoisir(p.valeur || null); setOuvert(false); }} />
            ))}
          </div>
        </>,
        document.body
      )}
    </span>
  );
}

function MenuFiltreColonne({ options, selection, onValider, onTrier, onFermer }) {
  const [brouillon, setBrouillon] = useState(() => new Set(selection || options.map((o) => o.brute)));
  const [recherche, setRecherche] = useState("");
  const visibles = options.filter((o) => normTxt(o.label).includes(normTxt(recherche)));

  function toggle(brute) {
    const next = new Set(brouillon);
    if (next.has(brute)) next.delete(brute); else next.add(brute);
    setBrouillon(next);
  }

  return (
    <>
      <div style={{position:'fixed',inset:0,zIndex:40}} onClick={onFermer} />
      <div className="ig-card" style={{position:'absolute',top:'100%',left:0,marginTop:4,zIndex:41,width:235,padding:10,fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:13,background:'var(--white)'}} onClick={(e)=>e.stopPropagation()}>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{width:'100%',justifyContent:'flex-start',marginBottom:4}} onClick={()=>{ onTrier('asc'); onFermer(); }}>↑ Trier de A à Z</button>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{width:'100%',justifyContent:'flex-start',marginBottom:8}} onClick={()=>{ onTrier('desc'); onFermer(); }}>↓ Trier de Z à A</button>
        <div style={{borderTop:'1px solid var(--sand-2)',paddingTop:8,marginBottom:8}}>
          <input value={recherche} onChange={(e)=>setRecherche(e.target.value)} placeholder="Rechercher…" style={{width:'100%',padding:'5px 8px',fontSize:12,borderRadius:7,border:'1.5px solid var(--line)',marginBottom:6}} />
          <div style={{fontSize:11,marginBottom:6}}>
            <a href="#" onClick={(e)=>{ e.preventDefault(); setBrouillon(new Set(options.map((o)=>o.brute))); }} style={{color:'var(--sea)',fontWeight:600}}>Tout sélectionner</a>
            {" – "}
            <a href="#" onClick={(e)=>{ e.preventDefault(); setBrouillon(new Set()); }} style={{color:'var(--sea)',fontWeight:600}}>Effacer</a>
          </div>
          <div style={{maxHeight:200,overflowY:'auto',display:'flex',flexDirection:'column',gap:3}}>
            {visibles.map((o) => (
              <label key={o.brute} style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,cursor:'pointer'}}>
                <input type="checkbox" checked={brouillon.has(o.brute)} onChange={()=>toggle(o.brute)} />
                {o.label}
              </label>
            ))}
            {visibles.length === 0 && <div className="ig-muted" style={{fontSize:12}}>Aucune valeur.</div>}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{flex:1}} onClick={onFermer}>Annuler</button>
          <button className="ig-btn ig-btn-primary ig-btn-sm" style={{flex:1}} onClick={()=>{ onValider(brouillon.size === options.length ? null : brouillon); onFermer(); }}>OK</button>
        </div>
      </div>
    </>
  );
}

// ---------- Menu déroulant "Couleur" (même look que MenuFiltreColonne) : trier par
// couleur (celle choisie remonte en premier) + filtrer les couleurs affichées. ----------
function MenuCouleur({ filtreCouleurs, triCouleur, toutesLesCouleurs, onFiltrer, onTrier, onFermer }) {
  const [brouillon, setBrouillon] = useState(() => new Set(filtreCouleurs || toutesLesCouleurs));

  function toggle(v) {
    const next = new Set(brouillon);
    if (next.has(v)) next.delete(v); else next.add(v);
    setBrouillon(next);
  }

  return (
    <>
      <div style={{position:'fixed',inset:0,zIndex:40}} onClick={onFermer} />
      <div className="ig-card" style={{position:'absolute',top:'100%',right:0,marginTop:4,zIndex:41,width:220,padding:10,fontWeight:400,textTransform:'none',letterSpacing:0,fontSize:13,background:'var(--white)'}} onClick={(e)=>e.stopPropagation()}>
        <div className="ig-muted" style={{fontSize:11,marginBottom:6}}>Trier : cette couleur en premier</div>
        <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
          {RH_PALETTE_COULEURS.filter((p) => p.valeur).map((p) => (
            <span key={p.valeur} style={{opacity: triCouleur === p.valeur ? 1 : .4, outline: triCouleur === p.valeur ? '2px solid var(--ink)' : 'none', borderRadius:6}}>
              <PastilleCouleur valeur={p.valeur} titre={p.label} taille={20} onClick={() => onTrier(triCouleur === p.valeur ? null : p.valeur)} />
            </span>
          ))}
          {triCouleur && <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{padding:'2px 8px'}} onClick={()=>onTrier(null)}>✕</button>}
        </div>
        <div style={{borderTop:'1px solid var(--sand-2)',paddingTop:8,marginBottom:8}}>
          <div style={{fontSize:11,marginBottom:6}}>
            <a href="#" onClick={(e)=>{ e.preventDefault(); setBrouillon(new Set(toutesLesCouleurs)); }} style={{color:'var(--sea)',fontWeight:600}}>Tout sélectionner</a>
            {" – "}
            <a href="#" onClick={(e)=>{ e.preventDefault(); setBrouillon(new Set()); }} style={{color:'var(--sea)',fontWeight:600}}>Effacer</a>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {RH_PALETTE_COULEURS.map((p) => (
              <label key={p.valeur || 'aucune'} style={{display:'flex',alignItems:'center',gap:7,fontSize:12.5,cursor:'pointer'}}>
                <input type="checkbox" checked={brouillon.has(p.valeur)} onChange={()=>toggle(p.valeur)} />
                <PastilleCouleur valeur={p.valeur} taille={14} />
                {p.label}
              </label>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" style={{flex:1}} onClick={onFermer}>Annuler</button>
          <button className="ig-btn ig-btn-primary ig-btn-sm" style={{flex:1}} onClick={()=>{ onFiltrer(brouillon.size >= toutesLesCouleurs.length ? null : brouillon); onFermer(); }}>OK</button>
        </div>
      </div>
    </>
  );
}

// ---------- Modal : archiver vers un dossier (saison) existant ou tout nouveau ----------
function ArchiverVersModal({ saisons, onValider, onClose }) {
  const [mode, setMode] = useState(saisons.length > 0 ? "existant" : "nouveau"); // 'existant' | 'nouveau'
  const [choix, setChoix] = useState(saisons[0] || "");
  const [nouveauNom, setNouveauNom] = useState("");
  const [erreur, setErreur] = useState("");

  function valider() {
    const cible = mode === "existant" ? choix : nouveauNom.trim();
    if (!cible) { setErreur(mode === "existant" ? "Choisissez un dossier." : "Donnez un nom au nouveau dossier."); return; }
    onValider(cible);
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth:420}}>
        <h3>Archiver vers…</h3>
        <div className="ig-muted" style={{marginBottom:14}}>Choisissez un dossier (saison) déjà existant, ou créez-en un nouveau.</div>
        {saisons.length > 0 && (
          <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,cursor:'pointer'}}>
            <input type="radio" checked={mode === "existant"} onChange={()=>{ setMode("existant"); setErreur(""); }} />
            Dossier existant
          </label>
        )}
        {mode === "existant" && saisons.length > 0 && (
          <select value={choix} onChange={(e)=>setChoix(e.target.value)} style={{marginBottom:14}}>
            {saisons.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        )}
        <label style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,cursor:'pointer'}}>
          <input type="radio" checked={mode === "nouveau"} onChange={()=>{ setMode("nouveau"); setErreur(""); }} />
          Nouveau dossier
        </label>
        {mode === "nouveau" && (
          <input value={nouveauNom} onChange={(e)=>{ setNouveauNom(e.target.value); setErreur(""); }} placeholder="Ex : 2025" style={{marginBottom:14}} autoFocus />
        )}
        {erreur && <div style={{color:'var(--coral-d)',fontSize:13,marginBottom:10,fontWeight:600}}>{erreur}</div>}
        <div style={{display:'flex',gap:10,marginTop:6}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={valider}>Archiver</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Liste des salariés RH d'un établissement + unité ----------
function ListeSalariesRH({ resto, unite, superviseur }) {
  const [liste, setListe] = useState(null);
  const [ajout, setAjout] = useState(false);
  const [edition, setEdition] = useState(null);
  const [flash, setFlash] = useState("");
  const [erreur, setErreur] = useState("");
  const [filtresValeurs, setFiltresValeurs] = useState({}); // { [cle]: Set des valeurs cochées } — absent = tout affiché
  const [menuOuvert, setMenuOuvert] = useState(null); // clé de la colonne dont le menu est ouvert
  const [triColonne, setTriColonne] = useState(null);
  const [triSens, setTriSens] = useState('asc');
  const [filtreCouleurs, setFiltreCouleurs] = useState(null); // Set des couleurs affichées, null = toutes
  const [triCouleur, setTriCouleur] = useState(null); // couleur à faire remonter en premier dans la liste
  const [menuCouleurOuvert, setMenuCouleurOuvert] = useState(false);
  const [saisonActive, setSaisonActive] = useState(null);
  const [selection, setSelection] = useState(new Set());
  const [archiverModal, setArchiverModal] = useState(false);
  const [promesseBusy, setPromesseBusy] = useState(null); // id de la fiche en cours de génération
  const [emailBusy, setEmailBusy] = useState(null); // id de la fiche dont la promesse est en cours d'envoi par email
  // Position de chaque fiche dans la liste (actif vs fin de contrat), figée au chargement :
  // sert au tri ci-dessous. Sans ça, taper une date de fin de contrat faisait sauter la ligne
  // tout en bas INSTANTANÉMENT (elle change de groupe dès que la case n'est plus vide), ce qui
  // empêchait de finir de saisir/ajuster la date tranquillement. La ligne ne bouge donc
  // maintenant qu'au prochain chargement de la liste, jamais pendant qu'on la modifie.
  const ordreDateFin = useRef(new Map());

  useEffect(() => {
    let on = true;
    setListe(null);
    setSelection(new Set());
    RhSalaries.list(resto, unite).then((l) => {
      if (!on) return;
      setListe(l);
      ordreDateFin.current = new Map(l.map((s) => [s.id, !!s.date_fin]));
      // La saison ouverte par défaut doit être l'année en cours (contrats actifs), jamais
      // "Archives" : "Archives" trie APRÈS les années dans l'ordre alphabétique ("A" > "2"),
      // donc prendre "la dernière valeur triée" ouvrait Archives par défaut — un fourre-tout
      // de contrats terminés de plusieurs années mélangées, illisible pour le travail courant.
      const anneeCourante = String(new Date().getFullYear());
      const saisons = Array.from(new Set(l.map((s) => s.saison))).sort();
      const saisonsAnnees = saisons.filter((s) => /^\d{4}$/.test(s));
      const defaut = saisons.includes(anneeCourante)
        ? anneeCourante
        : (saisonsAnnees.length ? saisonsAnnees[saisonsAnnees.length - 1] : anneeCourante);
      setSaisonActive(defaut);
    });
    return () => { on = false; };
  }, [resto, unite]);

  function montrerFlash(msg) { setFlash(msg); setErreur(""); setTimeout(() => setFlash(""), 5000); }
  function montrerErreur(msg) { setErreur(msg); setTimeout(() => setErreur(""), 8000); }
  function nouvelleSaison() {
    const saisie = prompt("Libellé de la nouvelle saison (ex : 2027) :");
    if (saisie && saisie.trim()) setSaisonActive(saisie.trim());
  }

  async function creer(patch) {
    const nomMaj = (patch.nom || "").toUpperCase();
    const salarieId = idSalarie({ n: nomMaj, p: patch.prenom });
    // provisoire=true : cette fiche est créée à l'avance par le directeur/chef (salaire,
    // dates, tél déjà connus). Quand la personne remplira le vrai Google Form, l'app la
    // reconnaîtra (nom approchant + même établissement) et complétera cette même fiche —
    // au lieu d'en créer une nouvelle — en corrigeant nom/prénom avec ceux du Form.
    const cree = await RhSalaries.creer({ resto, unite, salarie_id: salarieId, saison: saisonActive, provisoire: true, ...patch, nom: nomMaj });
    if (cree) { setListe([...(liste || []), cree]); setAjout(false); montrerFlash("Salarié ajouté (marqué « à confirmer » jusqu'à son onboarding réel)."); }
    else montrerErreur("Impossible d'ajouter ce salarié (peut-être une fiche existe déjà pour ce nom). Vérifiez et réessayez.");
  }
  async function modifier(patch) {
    const majPatch = patch.nom != null ? { ...patch, nom: patch.nom.toUpperCase() } : patch;
    const maj = await RhSalaries.maj(edition.id, majPatch);
    if (maj) { setListe(liste.map((s) => (s.id === maj.id ? maj : s))); setEdition(null); montrerFlash("Fiche mise à jour."); }
    else montrerErreur("La sauvegarde a échoué. Réessayez, ou contactez le support si ça persiste.");
  }
  async function supprimer(s) {
    if (!confirm(`Supprimer définitivement la fiche de ${s.prenom || ""} ${s.nom || ""} ? Cette action est irréversible.`)) return;
    const ok = await RhSalaries.supprimer(s.id);
    if (ok) { setListe(liste.filter((x) => x.id !== s.id)); setSelection((sel) => { const n = new Set(sel); n.delete(s.id); return n; }); montrerFlash("Fiche supprimée."); }
    else montrerErreur("La suppression a échoué. Réessayez.");
  }
  async function genererPromesse(s) {
    if (promesseBusy) return;
    setPromesseBusy(s.id);
    try {
      const etabsJ = await EtablissementsJuridique.load();
      const etabJ = etabsJ[resto] || null;
      if (!etabJ || !etabJ.tampon) {
        montrerErreur(`Aucune signature/tampon enregistrée pour ${resto}. Ajoutez-la d'abord dans "Fiche juridique de ${resto}" (Extras).`);
        return;
      }
      const html = construirePromesseEmbaucheHTML({ etabJ, salarie: s });
      const ok = imprimerDocument(`Promesse d'embauche ${s.prenom || ""} ${s.nom || ""}`, html, STYLE_PROMESSE, `Promesse_embauche_${slugKey(resto)}_${slugKey((s.nom||"")+"_"+(s.prenom||""))}`);
      if (ok === false) montrerErreur("Impossible de générer le document. Réessayez.");
    } finally {
      setPromesseBusy(null);
    }
  }
  // Envoie la promesse d'embauche par email au salarié, à l'adresse renseignée dans le
  // Registre Embauche — génère le même document (contenu + mise en page) que le bouton
  // "Promesse d'embauche" en un vrai PDF, joint directement à l'email (via la fonction
  // Supabase "rh-admin"), sans étape manuelle d'impression/enregistrement.
  async function envoyerPromesseParEmail(s) {
    if (emailBusy) return;
    const email = (s.email || "").trim();
    if (!email) { montrerErreur(`Aucune adresse email enregistrée pour ${s.prenom || ""} ${s.nom || ""}. Complétez-la dans le Registre Embauche.`); return; }
    if (!confirm(`Envoyer la promesse d'embauche de ${s.prenom || ""} ${s.nom || ""} à ${email} ?`)) return;
    setEmailBusy(s.id);
    try {
      const etabsJ = await EtablissementsJuridique.load();
      const etabJ = etabsJ[resto] || null;
      if (!etabJ || !etabJ.tampon) {
        montrerErreur(`Aucune signature/tampon enregistrée pour ${resto}. Ajoutez-la d'abord dans "Fiche juridique de ${resto}" (Extras).`);
        return;
      }
      const corps = construirePromesseEmbaucheHTML({ etabJ, salarie: s });
      const pdfBase64 = await genererPDFBase64(corps, STYLE_PROMESSE);
      const nomFichier = `Promesse_embauche_${slugKey(resto)}_${slugKey((s.nom||"")+"_"+(s.prenom||""))}.pdf`;
      const texte = `Bonjour,\n\nVeuillez trouver ci-joint votre promesse d'embauche pour le poste de ${s.poste || ""} au sein de ${resto}.\n\nCordialement,\n${resto}`;
      const r = await RhAdmin.envoyerEmail({ to: email, sujet: `Promesse d'embauche — ${resto}`, texte, pdfBase64, nomFichier });
      if (r.ok) montrerFlash(`Promesse d'embauche envoyée à ${email} (PDF en pièce jointe).`);
      else montrerErreur(`Échec de l'envoi : ${r.erreur || "erreur inconnue"}`);
    } finally {
      setEmailBusy(null);
    }
  }
  async function supprimerSelection() {
    if (selection.size === 0) return;
    if (!confirm(`Supprimer définitivement ${selection.size} fiche${selection.size>1?'s':''} sélectionnée${selection.size>1?'s':''} ? Cette action est irréversible.`)) return;
    const ids = Array.from(selection);
    const ok = await RhSalaries.supprimerPlusieurs(ids);
    if (ok) { setListe(liste.filter((s) => !selection.has(s.id))); setSelection(new Set()); montrerFlash(`${ids.length} fiche${ids.length>1?'s':''} supprimée${ids.length>1?'s':''}.`); }
    else montrerErreur("La suppression a échoué. Réessayez.");
  }
  // Archive la sélection vers la saison de son choix — dossier déjà existant ou tout
  // nouveau dossier créé à la volée (voir ArchiverVersModal) — au lieu de dépendre
  // uniquement de l'archivage automatique par date de fin dépassée.
  async function archiverSelectionVers(saisonCible) {
    if (selection.size === 0 || !saisonCible) return;
    setArchiverModal(false);
    const ids = Array.from(selection);
    const { ok, echecs } = await RhSalaries.archiverPlusieurs(ids, saisonCible);
    const idsEchecs = new Set(echecs.map((e) => e.id));
    const idsReussis = ids.filter((id) => !idsEchecs.has(id));
    if (idsReussis.length > 0) {
      setListe(liste.map((s) => (idsReussis.includes(s.id) ? { ...s, saison: saisonCible } : s)));
      setSelection(new Set(idsEchecs));
    }
    if (ok) {
      montrerFlash(`${idsReussis.length} fiche${idsReussis.length>1?'s':''} déplacée${idsReussis.length>1?'s':''} vers la saison "${saisonCible}".`);
    } else {
      const noms = echecs.map(({ id }) => { const s = liste.find((x) => x.id === id); return s ? `${s.prenom || ""} ${s.nom || ""}`.trim() : id; });
      montrerErreur(`${idsReussis.length} fiche${idsReussis.length>1?'s':''} déplacée${idsReussis.length>1?'s':''}, mais ${echecs.length} en échec (probablement déjà présent${echecs.length>1?'s':''} dans "${saisonCible}") : ${noms.join(", ")}. Détail technique : ${echecs[0].erreur}`);
    }
  }

  // Édition directe dans le tableau (comme un tableur) : met à jour l'affichage tout de
  // suite, puis enregistre la seule case modifiée.
  function majCellule(id, cle, valeur) {
    setListe(liste.map((s) => (s.id === id ? { ...s, [cle]: valeur } : s)));
  }
  async function sauverCellule(id, cle, valeur) {
    if (cle === 'nom' && typeof valeur === 'string') valeur = valeur.toUpperCase();
    majCellule(id, cle, valeur);
    const maj = await RhSalaries.maj(id, { [cle]: valeur });
    if (!maj) montrerErreur("La sauvegarde a échoué pour cette case. Réessayez.");
  }

  if (liste === null) return <div className="ig-muted">Chargement…</div>;

  const filtresActifs = Object.keys(filtresValeurs).length > 0 || !!filtreCouleurs;

  // Retire les contrats terminés (date de fin passée) de l'onglet de saison courant, sans
  // rien supprimer : ils basculent dans un onglet "Archives" pour ne plus encombrer la vue
  // du directeur, tout en restant consultables si besoin.
  const aujourdHui = dateISOLocale(new Date());
  const termines = liste.filter((s) => s.saison === saisonActive && s.date_fin && s.date_fin < aujourdHui);
  async function archiverTermines() {
    if (termines.length === 0) return;
    if (!confirm(`Archiver ${termines.length} contrat${termines.length>1?'s':''} terminé${termines.length>1?'s':''} ? Ils ne seront plus visibles ici mais resteront consultables dans l'onglet "Saison Archives".`)) return;
    const ids = termines.map((s) => s.id);
    const ok = await RhSalaries.archiverPlusieurs(ids);
    if (ok) {
      setListe(liste.map((s) => (ids.includes(s.id) ? { ...s, saison: "Archives" } : s)));
      setSelection((sel) => { const n = new Set(sel); ids.forEach((id) => n.delete(id)); return n; });
      montrerFlash(`${ids.length} contrat${ids.length>1?'s':''} archivé${ids.length>1?'s':''}.`);
    } else montrerErreur("L'archivage a échoué. Réessayez.");
  }

  // Filtre colonne par colonne, façon tableur : une colonne filtrée ne garde que les
  // lignes dont la valeur fait partie des cases cochées dans son menu. Le filtre par
  // couleur (au-dessus du tableau) s'applique en plus, sur la couleur de toute la ligne.
  function passeFiltres(s) {
    if (filtreCouleurs && !filtreCouleurs.has(s.couleur || "")) return false;
    return RH_CHAMPS_BASE.every((c) => {
      const sel = filtresValeurs[c.cle];
      if (!sel) return true;
      return sel.has(rhValeurBrute(s, c.cle));
    });
  }
  function comparer(a, b) {
    if (triCouleur) {
      const ca = (a.couleur || "") === triCouleur ? 0 : 1;
      const cb = (b.couleur || "") === triCouleur ? 0 : 1;
      if (ca !== cb) return ca - cb;
    }
    if (!triColonne) return `${a.nom || ""} ${a.prenom || ""}`.localeCompare(`${b.nom || ""} ${b.prenom || ""}`);
    const cmp = rhValeurBrute(a, triColonne).localeCompare(rhValeurBrute(b, triColonne), "fr", { numeric: true });
    return triSens === "desc" ? -cmp : cmp;
  }
  const saisons = Array.from(new Set(liste.map((s) => s.saison))).sort();
  if (saisonActive && !saisons.includes(saisonActive)) saisons.push(saisonActive);
  const listeSaison = liste.filter((s) => s.saison === saisonActive);
  const filtres_ = listeSaison.filter(passeFiltres);
  // Les salariés en fin de contrat (date de fin renseignée) passent en fin de liste,
  // surlignés, pour que l'effectif actif reste visible en premier. Se base sur l'état au
  // dernier chargement (ordreDateFin), pas sur la valeur en cours de saisie : sinon la ligne
  // saute de groupe à l'instant même où on tape la date, empêchant de la finir tranquillement.
  const listeAffichee = [
    ...filtres_.filter((s) => !ordreDateFin.current.get(s.id)).sort(comparer),
    ...filtres_.filter((s) => !!ordreDateFin.current.get(s.id)).sort(comparer),
  ];

  function entete(c, largeur) {
    const options = Array.from(new Set(listeSaison.map((s) => rhValeurBrute(s, c.cle))))
      .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
      .map((brute) => ({ brute, label: rhValeurLabel(c.cle, brute) }));
    const selection = filtresValeurs[c.cle] || null;
    return (
      <th key={c.cle} style={{padding:'8px 10px',position:'relative',minWidth:largeur,maxWidth:largeur,whiteSpace:'normal'}}>
        <button onClick={()=>setMenuOuvert(menuOuvert === c.cle ? null : c.cle)}
          style={{display:'flex',alignItems:'flex-start',gap:5,background:'none',border:'none',cursor:'pointer',font:'inherit',fontSize:12.5,fontWeight:800,padding:0,textAlign:'left',whiteSpace:'normal',lineHeight:1.3,textTransform:'uppercase',letterSpacing:'.4px',color: selection ? 'var(--coral-d)' : 'var(--ink)'}}>
          <span>{c.label}</span> <span style={{fontSize:10,flexShrink:0}}>▾</span>
        </button>
        {menuOuvert === c.cle && (
          <MenuFiltreColonne
            options={options}
            selection={selection}
            onValider={(nouvelle)=>{
              const next = { ...filtresValeurs };
              if (nouvelle === null) delete next[c.cle]; else next[c.cle] = nouvelle;
              setFiltresValeurs(next);
            }}
            onTrier={(sens)=>{ setTriColonne(c.cle); setTriSens(sens); }}
            onFermer={()=>setMenuOuvert(null)}
          />
        )}
      </th>
    );
  }

  return (
    <div>
      {/* Saisons/archives : réservé au superviseur — un directeur/chef ne voit et ne travaille
          que sur la saison en cours (l'année actuelle), jamais sur les dossiers archivés. */}
      {superviseur && (
        <div className="ig-noprint" style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap',marginBottom:10}}>
          {saisons.map((s) => (
            <button key={s} className={"ig-btn ig-btn-sm "+(saisonActive===s?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setSaisonActive(s)}>Saison {s}</button>
          ))}
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={nouvelleSaison}>+ Nouvelle saison</button>
          {termines.length > 0 && (
            <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={archiverTermines}>
              📦 Archiver les {termines.length} contrat{termines.length>1?'s':''} terminé{termines.length>1?'s':''}
            </button>
          )}
        </div>
      )}
      <div className="ig-noprint" style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
        <button className="ig-btn ig-btn-ink" onClick={()=>setAjout(true)}>+ Nouveau salarié</button>
        <span className="ig-muted" style={{fontSize:12}}>Filtre/tri par couleur : cliquez « Couleur ▾ » dans le tableau.</span>
        {(filtresActifs || triCouleur) && <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>{ setFiltresValeurs({}); setFiltreCouleurs(null); setTriCouleur(null); }}>✕ Réinitialiser les filtres</button>}
        {selection.size > 0 && (
          <div style={{marginLeft:'auto',display:'flex',gap:8}}>
            {superviseur && (
              <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setArchiverModal(true)}>
                📦 Archiver la sélection vers… ({selection.size})
              </button>
            )}
            <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={supprimerSelection} style={{color:'var(--coral-d)'}}>
              🗑 Supprimer la sélection ({selection.size})
            </button>
          </div>
        )}
      </div>
      {archiverModal && (
        <ArchiverVersModal saisons={saisons.filter((s)=>s!==saisonActive)} onValider={archiverSelectionVers} onClose={()=>setArchiverModal(false)} />
      )}
      {flash && <div className="ig-status-line ig-noprint" style={{background:'#EAF3F3',marginBottom:14}}>{flash}</div>}
      {erreur && <div className="ig-noprint" style={{background:'#FCE5D6',border:'1.5px solid #E5A06A',color:'#9A4A1B',borderRadius:12,padding:'12px 16px',marginBottom:14,fontSize:14}}>{erreur}</div>}
      {listeAffichee.length === 0 ? <div className="ig-muted">{filtresActifs ? "Aucun salarié ne correspond aux filtres." : "Aucun salarié pour l'instant."}</div> : (
        <div className="ig-card" style={{padding:'6px 10px',overflow:'auto',maxHeight:'70vh'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13,whiteSpace:'nowrap'}}>
            <thead>
              <tr style={{textAlign:'left',borderBottom:'2px solid var(--sand-2)',verticalAlign:'bottom',background:'var(--sand)',position:'sticky',top:0,zIndex:1}}>
                <th style={{padding:'8px 6px'}}>
                  <input type="checkbox"
                    checked={listeAffichee.length > 0 && listeAffichee.every((s) => selection.has(s.id))}
                    onChange={(e)=>{
                      if (e.target.checked) setSelection(new Set(listeAffichee.map((s)=>s.id)));
                      else setSelection(new Set());
                    }} />
                </th>
                {entete(RH_CHAMPS_BASE[0], 56)}
                {entete(RH_CHAMPS_BASE[1], 150)}
                {entete(RH_CHAMPS_BASE[2], 145)}
                {entete(RH_CHAMPS_BASE[3], 135)}
                {entete(RH_CHAMPS_BASE[4], 270)}
                {entete(RH_CHAMPS_BASE[5], 250)}
                {entete(RH_CHAMPS_BASE[6], 130)}
                {entete(RH_CHAMPS_BASE[7], 90)}
                {entete(RH_CHAMPS_BASE[8], 130)}
                {entete(RH_CHAMPS_BASE[9], 120)}
                {entete(RH_CHAMPS_BASE[10], 70)}
                {entete(RH_CHAMPS_BASE[11], 70)}
                <th style={{padding:'8px 10px',position:'relative'}}>
                  <button onClick={()=>setMenuCouleurOuvert(!menuCouleurOuvert)}
                    style={{display:'flex',alignItems:'center',gap:5,background:'none',border:'none',cursor:'pointer',font:'inherit',fontSize:12.5,fontWeight:800,padding:0,textTransform:'uppercase',letterSpacing:'.4px',color: (filtreCouleurs || triCouleur) ? 'var(--coral-d)' : 'var(--ink)'}}>
                    Couleur <span style={{fontSize:10}}>▾</span>
                  </button>
                  {menuCouleurOuvert && (
                    <MenuCouleur
                      filtreCouleurs={filtreCouleurs}
                      triCouleur={triCouleur}
                      toutesLesCouleurs={Array.from(new Set(listeSaison.map((x) => x.couleur || "")))}
                      onFiltrer={setFiltreCouleurs}
                      onTrier={setTriCouleur}
                      onFermer={()=>setMenuCouleurOuvert(false)}
                    />
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {listeAffichee.map((s) => (
                <tr key={s.id} style={{borderTop:'1px solid var(--sand-2)',background: s.couleur || undefined}}>
                  <td style={{padding:'4px 6px'}}>
                    <input type="checkbox" checked={selection.has(s.id)} onChange={(e)=>{
                      setSelection((sel) => { const n = new Set(sel); if (e.target.checked) n.add(s.id); else n.delete(s.id); return n; });
                    }} />
                  </td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" type="number" value={s.heures_contrat ?? ""} style={{width:56}} onChange={(e)=>majCellule(s.id,'heures_contrat', e.target.value===""?null:Number(e.target.value))} onBlur={()=>sauverCellule(s.id,'heures_contrat', s.heures_contrat)} /></td>
                  <td style={{padding:'4px 6px'}}>
                    <input className="ig-cell" value={s.nom || ""} style={{width:150,fontSize:15.5,fontWeight:800,color:'var(--ink)'}} onChange={(e)=>majCellule(s.id,'nom', e.target.value)} onBlur={()=>sauverCellule(s.id,'nom', s.nom)} />
                    {s.provisoire && <span title="Créée par le directeur, en attente de l'onboarding réel via le Form" style={{display:'inline-block',marginTop:2,padding:'1px 5px',borderRadius:20,background:'var(--sand-2)',color:'var(--ink-2)',fontSize:9,fontWeight:700,letterSpacing:'.3px'}}>PAS ONBOARDING</span>}
                  </td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" value={s.prenom || ""} style={{width:145,fontSize:15.5,fontWeight:800,color:'var(--ink)'}} onChange={(e)=>majCellule(s.id,'prenom', e.target.value)} onBlur={()=>sauverCellule(s.id,'prenom', s.prenom)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" value={s.telephone || ""} style={{width:135}} onChange={(e)=>majCellule(s.id,'telephone', e.target.value)} onBlur={()=>sauverCellule(s.id,'telephone', s.telephone)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" value={s.email || ""} style={{width:270}} onChange={(e)=>majCellule(s.id,'email', e.target.value)} onBlur={()=>sauverCellule(s.id,'email', s.email)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" value={s.poste || ""} style={{width:250}} onChange={(e)=>majCellule(s.id,'poste', e.target.value)} onBlur={()=>sauverCellule(s.id,'poste', s.poste)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" type="date" value={s.date_debut || ""} style={{width:130,fontSize:14.5,fontWeight:700,color:'var(--ink)'}} onChange={(e)=>sauverCellule(s.id,'date_debut', e.target.value || null)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" type="number" value={s.salaire_net ?? ""} style={{width:90,fontSize:15,fontWeight:800,color:'var(--ink)'}} onChange={(e)=>majCellule(s.id,'salaire_net', e.target.value===""?null:Number(e.target.value))} onBlur={()=>sauverCellule(s.id,'salaire_net', s.salaire_net)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" type="date" value={s.date_fin || ""} style={{width:130,fontSize:14.5,fontWeight:700,color:'var(--ink)'}} onChange={(e)=>sauverCellule(s.id,'date_fin', e.target.value || null)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" type="date" value={s.date_prolongation_fin || ""} style={{width:120}} onChange={(e)=>sauverCellule(s.id,'date_prolongation_fin', e.target.value || null)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" value={s.loge || ""} style={{width:70}} onChange={(e)=>majCellule(s.id,'loge', e.target.value)} onBlur={()=>sauverCellule(s.id,'loge', s.loge)} /></td>
                  <td style={{padding:'4px 6px'}}><input className="ig-cell" value={s.vehicule || ""} style={{width:70}} onChange={(e)=>majCellule(s.id,'vehicule', e.target.value)} onBlur={()=>sauverCellule(s.id,'vehicule', s.vehicule)} /></td>
                  <td style={{padding:'4px 6px',display:'flex',gap:4,alignItems:'center'}}>
                    <SelecteurCouleurLigne valeur={s.couleur} onChoisir={(c)=>sauverCellule(s.id,'couleur', c)} />
                    <button className="ig-btn ig-btn-ghost ig-btn-icon" onClick={()=>setEdition(s)} title="Fiche complète">📋</button>
                    {superviseur && (
                      <button className="ig-btn ig-btn-ghost ig-btn-icon" onClick={()=>genererPromesse(s)} disabled={promesseBusy===s.id} title="Promesse d'embauche">
                        {promesseBusy===s.id ? "…" : "📄"}
                      </button>
                    )}
                    {superviseur && (
                      <button className="ig-btn ig-btn-ghost ig-btn-icon" onClick={()=>envoyerPromesseParEmail(s)} disabled={emailBusy===s.id} title={s.email ? `Envoyer par email à ${s.email}` : "Envoyer par email (aucun email enregistré)"}>
                        {emailBusy===s.id ? "…" : "📧"}
                      </button>
                    )}
                    <button className="ig-btn ig-btn-ghost ig-btn-icon" onClick={()=>supprimer(s)} style={{color:'var(--coral-d)'}} title="Supprimer">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ajout && <RhSalarieModal resto={resto} unite={unite} superviseur={superviseur} onSave={creer} onClose={()=>setAjout(false)} />}
      {edition && <RhSalarieModal resto={resto} unite={unite} salarie={edition} superviseur={superviseur} onSave={modifier} onClose={()=>setEdition(null)} />}
    </div>
  );
}

// ---------- Espace RH : point d'entrée après connexion individuelle ----------
// ---------- Modal Gestion des accès RH (superviseur uniquement) ----------
// Permet de créer un compte directeur/chef (ou de lui ajouter un établissement) et de
// retirer un accès existant, sans jamais avoir besoin d'ouvrir Supabase.
function AccesRHModal({ restaurants, onClose }) {
  const [liste, setListe] = useState(null);
  const [erreur, setErreur] = useState("");
  const [flash, setFlash] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [resto, setResto] = useState(restaurants[0] || "");
  const [unite, setUnite] = useState("SALLE");
  const [editionMdp, setEditionMdp] = useState(null); // user_id du compte en cours d'édition, ou null
  const [nouveauMdp, setNouveauMdp] = useState("");

  function charger() {
    setListe(null);
    RhAdmin.lister().then((r) => { if (r.ok) setListe(r.acces); else setErreur(r.erreur || "Chargement impossible."); });
  }
  useEffect(() => { charger(); }, []);

  async function creer() {
    if (busy) return;
    if (!email.trim()) { setErreur("Renseignez l'email."); return; }
    setBusy(true); setErreur(""); setFlash("");
    const r = await RhAdmin.creer({ email: email.trim(), motDePasse, resto, unite });
    setBusy(false);
    if (!r.ok) { setErreur(r.erreur || "Échec de la création."); return; }
    setFlash(`Accès créé pour ${email.trim()} (${resto} · ${unite === "SALLE" ? "Salle" : "Cuisine"}).`);
    setEmail(""); setMotDePasse("");
    charger();
  }

  async function supprimer(a) {
    if (!confirm(`Retirer l'accès de ${a.email} à ${a.resto} (${a.unite === "SALLE" ? "Salle" : "Cuisine"}) ?`)) return;
    const r = await RhAdmin.supprimer(a.id);
    if (!r.ok) { setErreur(r.erreur || "Suppression impossible."); return; }
    charger();
  }

  async function validerMdp(a) {
    if (busy) return;
    if (!nouveauMdp || nouveauMdp.length < 6) { setErreur("Le mot de passe doit faire au moins 6 caractères."); return; }
    setBusy(true); setErreur(""); setFlash("");
    const r = await RhAdmin.changerMotDePasse({ user_id: a.user_id, motDePasse: nouveauMdp });
    setBusy(false);
    if (!r.ok) { setErreur(r.erreur || "Échec du changement de mot de passe."); return; }
    setFlash(`Mot de passe mis à jour pour ${a.email}.`);
    setEditionMdp(null); setNouveauMdp("");
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth:560}}>
        <h3>Accès RH</h3>
        <div className="ig-muted" style={{marginBottom:14}}>Un compte par directeur/chef, cloisonné par établissement et par unité (Salle/Cuisine).</div>

        <div style={{maxHeight:220,overflowY:'auto',border:'1px solid var(--line)',borderRadius:10,marginBottom:16}}>
          {liste === null ? (
            <div style={{padding:14}} className="ig-muted">Chargement…</div>
          ) : liste.length === 0 ? (
            <div style={{padding:14}} className="ig-muted">Aucun accès créé pour le moment.</div>
          ) : (
            <table style={{width:'100%',fontSize:12.5,borderCollapse:'collapse'}}>
              <tbody>
                {liste.map((a) => (
                  <React.Fragment key={a.id}>
                    <tr style={{borderBottom: editionMdp===a.user_id ? 'none' : '1px solid var(--line)'}}>
                      <td style={{padding:'8px 10px'}}>{a.email}{a.superviseur && <span style={{marginLeft:6,padding:'1px 6px',borderRadius:20,background:'var(--ink)',color:'var(--sand)',fontSize:9,letterSpacing:'.4px'}}>SUPERVISEUR</span>}</td>
                      <td style={{padding:'8px 10px'}}>{a.resto}</td>
                      <td style={{padding:'8px 10px'}}>{a.unite === "SALLE" ? "Salle" : a.unite === "CUISINE" ? "Cuisine" : "Tous"}</td>
                      <td style={{padding:'8px 10px',textAlign:'right',whiteSpace:'nowrap'}}>
                        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>{ setEditionMdp(editionMdp===a.user_id ? null : a.user_id); setNouveauMdp(""); setErreur(""); }}>Mot de passe</button>
                        {!a.superviseur && <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>supprimer(a)} style={{marginLeft:6}}>Retirer</button>}
                      </td>
                    </tr>
                    {editionMdp === a.user_id && (
                      <tr style={{borderBottom:'1px solid var(--line)'}}>
                        <td colSpan={4} style={{padding:'0 10px 10px'}}>
                          <div style={{display:'flex',gap:8,alignItems:'center'}}>
                            <input type="password" value={nouveauMdp} autoFocus onChange={(e)=>setNouveauMdp(e.target.value)} placeholder="Nouveau mot de passe (6 caractères min.)" style={{flex:1}} />
                            <button className="ig-btn ig-btn-primary ig-btn-sm" onClick={()=>validerMdp(a)} disabled={busy}>{busy ? "…" : "Valider"}</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="ig-muted" style={{fontWeight:600,marginBottom:8}}>Ajouter un accès</div>
        <div className="ig-field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e)=>{ setEmail(e.target.value); setErreur(""); }} placeholder="prenom@indiegroup.fr" />
        </div>
        <div className="ig-field">
          <label>Mot de passe (uniquement si le compte n'existe pas encore)</label>
          <input type="password" value={motDePasse} onChange={(e)=>setMotDePasse(e.target.value)} placeholder="Au moins 6 caractères" />
        </div>
        <div className="ig-times">
          <div className="ig-field" style={{margin:0}}>
            <label>Établissement</label>
            <select value={resto} onChange={(e)=>setResto(e.target.value)}>
              {restaurants.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="ig-field" style={{margin:0}}>
            <label>Unité</label>
            <select value={unite} onChange={(e)=>setUnite(e.target.value)}>
              <option value="SALLE">Salle</option>
              <option value="CUISINE">Cuisine</option>
            </select>
          </div>
        </div>
        {erreur && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:8,fontWeight:600}}>{erreur}</div>}
        {flash && <div style={{color:'var(--sea)',fontSize:13,marginTop:8,fontWeight:600}}>{flash}</div>}
        <div style={{display:'flex',gap:10,marginTop:16}}>
          <button className="ig-btn ig-btn-ghost" onClick={onClose}>Fermer</button>
          <button className="ig-btn ig-btn-primary" onClick={creer} disabled={busy}>{busy ? "Création…" : "Créer / ajouter cet accès"}</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Repos hebdomadaire non pris : suivi mensuel + montant à payer ----------
function ReposHebdoRH({ resto, unite, superviseur }) {
  const auj = new Date();
  const [annee, setAnnee] = useState(auj.getFullYear());
  const [moisNum, setMoisNum] = useState(auj.getMonth() + 1); // 1..12
  const mois = `${annee}-${String(moisNum).padStart(2, "0")}`;
  const [liste, setListe] = useState(null);
  const [genBusy, setGenBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [erreur, setErreur] = useState("");
  const [flash, setFlash] = useState("");

  useEffect(() => {
    let on = true;
    setListe(null);
    RhReposHebdo.list(resto, unite, mois).then((l) => { if (on) setListe(l); });
    return () => { on = false; };
  }, [resto, unite, mois]);

  function montrerErreur(msg) { setErreur(msg); setTimeout(() => setErreur(""), 6000); }
  function montrerFlash(msg) { setFlash(msg); setTimeout(() => setFlash(""), 6000); }

  async function generer() {
    if (genBusy) return;
    setGenBusy(true); setErreur("");
    const ok = await RhReposHebdo.genererMois(resto, unite, mois);
    if (ok) {
      const l = await RhReposHebdo.list(resto, unite, mois);
      setListe(l);
      montrerFlash("Liste mise à jour avec les salariés actuellement sous contrat pour ce mois.");
    } else montrerErreur("Échec de la génération. Réessayez.");
    setGenBusy(false);
  }

  async function exporter() {
    if (exportBusy) return;
    setExportBusy(true); setErreur("");
    const r = await RhSheetSync.exporterReposHebdo(resto, unite, mois);
    setExportBusy(false);
    if (!r.ok) { montrerErreur(`Échec de l'export : ${r.erreur || "erreur inconnue"}`); return; }
    montrerFlash(r.exportes > 0
      ? `${r.exportes} ligne${r.exportes>1?'s':''} "RH NON PRIS ${MOIS_NOMS[moisNum-1].toUpperCase()}" ajoutée${r.exportes>1?'s':''} dans le Sheet Extra.`
      : "Aucun salarié avec un repos non pris > 0 ce mois-ci : rien à exporter.");
  }

  async function majRepos(l, valeur) {
    const n = valeur === "" ? 0 : Number(valeur);
    setListe(liste.map((x) => (x.id === l.id ? { ...x, repos_non_pris: n } : x)));
    const maj = await RhReposHebdo.maj(l.id, { repos_non_pris: n });
    if (!maj) montrerErreur("La sauvegarde a échoué pour cette case. Réessayez.");
  }

  async function retirer(l) {
    if (!confirm(`Retirer ${l.prenom || ""} ${l.nom} de ce mois ?`)) return;
    const ok = await RhReposHebdo.supprimer(l.id);
    if (ok) setListe(liste.filter((x) => x.id !== l.id));
    else montrerErreur("La suppression a échoué. Réessayez.");
  }

  if (liste === null) return <div className="ig-muted">Chargement…</div>;

  // Taux journalier = salaire net ÷ 30 (convention standard), à ajuster si besoin depuis la fiche.
  const netJour = (l) => (l.salaire_net != null ? l.salaire_net / 30 : null);
  const montant = (l) => (netJour(l) != null ? netJour(l) * (l.repos_non_pris || 0) : null);
  const totalRepos = liste.reduce((s, l) => s + (Number(l.repos_non_pris) || 0), 0);
  const totalAPayer = liste.reduce((s, l) => s + (montant(l) || 0), 0);
  const fmtEuro = (n) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div>
      <div className="ig-noprint" style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setAnnee(annee - 1)}>◀</button>
        <span style={{fontWeight:700,minWidth:44,textAlign:'center'}}>{annee}</span>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setAnnee(annee + 1)}>▶</button>
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginLeft:10}}>
          {MOIS_NOMS.map((n, i) => (
            <button key={i} className={"ig-btn ig-btn-sm "+(moisNum===i+1?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setMoisNum(i + 1)}>{n.slice(0,3)}</button>
          ))}
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          {superviseur && (
            <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={exporter} disabled={exportBusy || liste.length === 0}>
              {exportBusy ? "Export…" : "↓ Exporter vers le Sheet Extra"}
            </button>
          )}
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={generer} disabled={genBusy}>
            {genBusy ? "Génération…" : "↻ Générer la liste du mois"}
          </button>
        </div>
      </div>
      {erreur && <div style={{color:'var(--coral-d)',fontSize:13,marginBottom:10,fontWeight:600}}>{erreur}</div>}
      {flash && <div style={{color:'var(--sea)',fontSize:13,marginBottom:10,fontWeight:600}}>{flash}</div>}
      <div className="ig-card" style={{padding:'12px 16px',marginBottom:14,display:'flex',gap:24,flexWrap:'wrap'}}>
        <div><div className="ig-muted" style={{fontSize:12}}>Salariés</div><div style={{fontWeight:800,fontSize:18}}>{liste.length}</div></div>
        <div><div className="ig-muted" style={{fontSize:12}}>Total repos non pris</div><div style={{fontWeight:800,fontSize:18}}>{totalRepos}</div></div>
        <div><div className="ig-muted" style={{fontSize:12}}>Total à payer</div><div style={{fontWeight:800,fontSize:18,color:'var(--coral-d)'}}>{fmtEuro(totalAPayer)}</div></div>
      </div>
      {liste.length === 0 ? (
        <div className="ig-muted">Aucun salarié pour {MOIS_NOMS[moisNum-1]} {annee}. Clique sur "↻ Générer la liste du mois" pour la remplir depuis les fiches sous contrat.</div>
      ) : (
        <div className="ig-card" style={{padding:'6px 10px',overflow:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
            <thead>
              <tr style={{textAlign:'left',borderBottom:'2px solid var(--sand-2)'}}>
                <th style={{padding:'8px 10px'}}>Unité</th>
                <th style={{padding:'8px 10px'}}>Nom</th>
                <th style={{padding:'8px 10px'}}>Prénom</th>
                <th style={{padding:'8px 10px'}}>Salaire net</th>
                <th style={{padding:'8px 10px'}}>Net / jour</th>
                <th style={{padding:'8px 10px'}}>Repos non pris</th>
                <th style={{padding:'8px 10px'}}>Montant à payer</th>
                <th style={{padding:'8px 10px'}}></th>
              </tr>
            </thead>
            <tbody>
              {liste.map((l) => (
                <tr key={l.id} style={{borderTop:'1px solid var(--sand-2)'}}>
                  <td style={{padding:'6px 10px'}}>{unite === "SALLE" ? "Salle" : "Cuisine"}</td>
                  <td style={{padding:'6px 10px',fontWeight:800}}>{l.nom}</td>
                  <td style={{padding:'6px 10px'}}>{l.prenom}</td>
                  <td style={{padding:'6px 10px'}}>{l.salaire_net != null ? `${l.salaire_net} €` : <span className="ig-muted">—</span>}</td>
                  <td style={{padding:'6px 10px'}}>{netJour(l) != null ? fmtEuro(netJour(l)) : <span className="ig-muted">—</span>}</td>
                  <td style={{padding:'6px 10px'}}>
                    <input type="number" min="0" className="ig-cell" style={{width:70}} value={l.repos_non_pris}
                      onChange={(e)=>majRepos(l, e.target.value)} />
                  </td>
                  <td style={{padding:'6px 10px',fontWeight:700}}>{montant(l) != null ? fmtEuro(montant(l)) : <span className="ig-muted">—</span>}</td>
                  <td style={{padding:'6px 10px'}}><button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>retirer(l)} style={{color:'var(--coral-d)'}}>Retirer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------- Recherche de salarié tous établissements (pour "+ Ajouter un extra") ----------
function ChoixSalarieExtraModal({ resto, unite, onValider, onClose }) {
  const [recherche, setRecherche] = useState("");
  const [resultats, setResultats] = useState([]);
  const [selection, setSelection] = useState(null);
  const [date, setDate] = useState(dateISOLocale(new Date()));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = recherche.trim();
    if (selection || q.length < 2) { setResultats([]); return; }
    let on = true;
    setBusy(true);
    const t = setTimeout(() => {
      RhAdmin.rechercherSalaries(q).then((r) => { if (on) { setResultats(r); setBusy(false); } });
    }, 300);
    return () => { on = false; clearTimeout(t); };
  }, [recherche, selection]);

  function choisir(c) {
    setSelection(c);
    setRecherche(`${c.prenom || ""} ${c.nom}`.trim());
  }

  function valider() {
    if (!selection) { setErr("Choisissez un salarié dans la liste."); return; }
    if (!date) { setErr("Indiquez la date de la soirée."); return; }
    onValider({
      salarieNom: selection.nom, salariePrenom: selection.prenom || "",
      restoOrigine: selection.resto, poste: selection.poste || "", date,
    });
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e)=>e.stopPropagation()} style={{maxWidth:480}}>
        <h3>Ajouter un extra</h3>
        <div className="ig-muted" style={{marginBottom:10}}>Cherchez le salarié (de {resto} ou d'un autre établissement) et indiquez la date de la soirée. Les heures et le taux se renseignent après, tant que ce n'est pas validé.</div>

        <div className="ig-field" style={{position:'relative'}}>
          <label>Salarié</label>
          <input value={recherche} onChange={(e)=>{ setRecherche(e.target.value); setSelection(null); setErr(""); }} placeholder="Tapez un nom (2 lettres minimum)…" />
          {recherche && !selection && (busy || resultats.length > 0) && (
            <div className="ig-card" style={{position:'absolute',zIndex:5,left:0,right:0,marginTop:4,padding:6,maxHeight:220,overflowY:'auto'}}>
              {busy && <div className="ig-muted" style={{padding:8,fontSize:13}}>Recherche…</div>}
              {!busy && resultats.map((c) => (
                <div key={c.id} style={{padding:'8px 10px',cursor:'pointer',borderRadius:8}}
                  onClick={()=>choisir(c)}
                  onMouseDown={(ev)=>ev.preventDefault()}>
                  <b>{c.prenom} {c.nom}</b> <span className="ig-muted">· {c.poste || "—"} · {c.resto}{c.resto === resto ? " (cet établissement)" : ""}</span>
                </div>
              ))}
            </div>
          )}
          {recherche && !selection && !busy && recherche.trim().length >= 2 && resultats.length === 0 && (
            <div className="ig-muted" style={{marginTop:6,fontSize:13}}>Aucun salarié ne correspond.</div>
          )}
        </div>

        {selection && (
          <div className="ig-field">
            <label>Date de la soirée</label>
            <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
          </div>
        )}

        {err && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:10,fontWeight:600}}>{err}</div>}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={valider}>Ajouter l'extra</button>
        </div>
      </div>
    </div>
  );
}

// Export xlsx du récap d'extras (même format que l'ancien Google Sheet, pour intégration
// PayFit), adapté aux noms de colonnes snake_case de rh_extras.
function exporterRecapExtrasRH(liste, mois, nomFichier) {
  const realises = liste.filter((x) => x.statut === "realisee");
  const enteteDetail = [
    "Horodateur", "Adresse e-mail", "Etablissement où est effectué l'extra", "DATE",
    "NOM  (SI FACTURE INDIQUER LE NOM SOCIETE)", "PRENOM", "Etablissement d'origine de l'extra",
    "1Nombre d'heures effectuées (mettre 1 si FORFAIT)",
    "Taux horaire net (utiliser Autre pour FORFAIT et remplir le montant du forfait)",
    "Extra fait sur ses heures de l'établissement d'origine ? (donc non rémunéré en EXTRA - Mettre oui si facture)",
    "Taux Horaire Brut", "Prime Net", "Prime Brute", "Prime Cout Total",
  ];
  const aoaDetail = [enteteDetail];
  realises.forEach((x) => {
    const horodateur = x.valide_le ? new Date(x.valide_le) : new Date(x.cree_le);
    aoaDetail.push([
      `${fmtDate(horodateur)} ${horodateur.toLocaleTimeString("fr-FR")}`, "",
      x.resto, fmtDate(new Date(x.date + "T00:00:00")), x.salarie_nom, x.salarie_prenom, x.resto_origine,
      x.heures_reelles, x.taux_horaire_net, x.sur_heures_origine ? "OUI" : "NON",
      x.taux_brut, x.prime_net, x.prime_brute, x.prime_cout_total,
    ]);
  });
  const parSalarie = {};
  realises.forEach((x) => {
    const key = idSalarie({ n: x.salarie_nom, p: x.salarie_prenom });
    const pf = PAYFIT_IDS[key] || ["", ""];
    const cur = parSalarie[key] || { nom: x.salarie_nom, prenom: x.salarie_prenom, identifiant: pf[0], matricule: pf[1], heures: 0, primeNet: 0, primeBrute: 0, primeCoutTotal: 0 };
    cur.heures += Number(x.heures_reelles) || 0;
    cur.primeNet += x.prime_net || 0;
    cur.primeBrute += x.prime_brute || 0;
    cur.primeCoutTotal += x.prime_cout_total || 0;
    parSalarie[key] = cur;
  });
  const aoaRecap = [["Identifiant PayFit", "Matricule", "Nom", "Prénom", "Total heures extra", "Total Prime Net", "Total Prime Brute", "Total Coût employeur", "Mois"]];
  Object.values(parSalarie).forEach((c) => aoaRecap.push([c.identifiant, c.matricule, c.nom, c.prenom, c.heures, c.primeNet, c.primeBrute, c.primeCoutTotal, mois]));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoaDetail), "Détail extras");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoaRecap), "Récap par salarié");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nomFichier;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// ---------- Extras (prêt de main-d'œuvre) : module RH, par établissement + unité ----------
function ExtrasRH({ resto, unite, superviseur }) {
  const auj = new Date();
  const [annee, setAnnee] = useState(auj.getFullYear());
  const [moisNum, setMoisNum] = useState(auj.getMonth() + 1);
  const mois = `${annee}-${String(moisNum).padStart(2, "0")}`;
  const [liste, setListe] = useState(null);
  const [etabsJ, setEtabsJ] = useState({});
  const [ajout, setAjout] = useState(false);
  const [fiche, setFiche] = useState(false);
  const [flash, setFlash] = useState("");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    let on = true;
    setListe(null);
    Promise.all([RhExtras.list(resto, unite, mois), EtablissementsJuridique.load()]).then(([l, ej]) => {
      if (!on) return;
      setListe(l); setEtabsJ(ej);
    });
    return () => { on = false; };
  }, [resto, unite, mois]);

  function montrerFlash(msg) { setFlash(msg); setTimeout(() => setFlash(""), 6000); }

  async function creerExtra({ salarieNom, salariePrenom, restoOrigine, poste, date }) {
    const nomMaj = salarieNom.toUpperCase();
    const prenomMaj = (salariePrenom || "").toUpperCase();
    const docs = genererDocumentsExtra({ resto, restoOrigine, salarieNom: nomMaj, salariePrenom: prenomMaj, poste, date }, etabsJ);
    const cree = await RhExtras.creer({
      resto, unite, resto_origine: restoOrigine, salarie_nom: nomMaj, salarie_prenom: prenomMaj,
      poste, date, statut: "a_valider", payfit_statut: "a_faire",
      contrat_html: docs.contratHTML || null, contrat_genere_at: docs.contratGenereAt || null,
    });
    if (!cree) { montrerFlash("Échec de la création de l'extra. Réessayez."); return; }
    setAjout(false);
    if (cleMois(new Date(date + "T00:00:00")) === mois) setListe([cree, ...(liste || [])]);
    montrerFlash(`Extra créé pour ${prenomMaj} ${nomMaj} (${restoOrigine} → ${resto}) le ${fmtDate(new Date(date + "T00:00:00"))}.${docs.contratHTML ? " Le contrat de prêt est prêt." : ""} Reste à renseigner les heures et le taux avant de valider.`);
    // Synchro Sheet "Extra" : crée tout de suite une NOUVELLE ligne (jamais de recherche/
    // fusion avec une ligne existante, même pour la même personne à la même date) ; le numéro
    // de ligne renvoyé est aussitôt mémorisé sur la fiche (sheet_ligne) pour que les prochaines
    // synchros (heures/taux, validation) écrivent directement dessus, sans ambiguïté.
    RhSheetSync.upsertExtra({ resto, unite, restoOrigine, salarieNom: nomMaj, salariePrenom: prenomMaj, date, champs: { surHeuresOrigine: false } })
      .then((r) => {
        if (!r.ok) { montrerFlash(`⚠ Extra enregistré, mais la synchro vers le Sheet Extra a échoué : ${r.erreur}`); return; }
        RhExtras.maj(cree.id, { sheet_ligne: r.ligne }).then((maj) => {
          if (maj) setListe((l) => (l || []).map((it) => (it.id === cree.id ? maj : it)));
        });
      });
  }

  function modifierChamp(id, champ, valeur) {
    const next = (liste || []).map((x) => (x.id === id ? { ...x, [champ]: valeur } : x));
    setListe(next);
  }
  async function sauverChamp(id, champ, valeur) {
    const maj = await RhExtras.maj(id, { [champ]: valeur });
    if (!maj) { montrerFlash("La sauvegarde a échoué. Réessayez."); return; }
    const champSheet = champ === "heures_estimees" ? "heuresEstimees" : champ === "taux_horaire_net" ? "tauxHoraireNet" : champ === "sur_heures_origine" ? "surHeuresOrigine" : null;
    if (champSheet && maj.sheet_ligne) {
      RhSheetSync.upsertExtra({
        resto, unite, restoOrigine: maj.resto_origine, salarieNom: maj.salarie_nom, salariePrenom: maj.salarie_prenom, date: maj.date,
        champs: { [champSheet]: valeur }, ligneCible: maj.sheet_ligne,
      }).then((r) => { if (!r.ok) montrerFlash(`⚠ Sauvegardé, mais la synchro vers le Sheet Extra a échoué : ${r.erreur}`); });
    }
  }

  async function validerExtra(id) {
    const x = (liste || []).find((it) => it.id === id);
    if (!x) return;
    if (!x.heures_estimees || Number(x.heures_estimees) <= 0) { montrerFlash("Indiquez le nombre d'heures avant de valider."); return; }
    if (!x.sur_heures_origine && (!x.taux_horaire_net || Number(x.taux_horaire_net) <= 0)) { montrerFlash("Indiquez le taux horaire net avant de valider (ou cochez « sur ses heures d'origine »)."); return; }
    const calc = calculExtra(x.heures_estimees, x.taux_horaire_net, x.sur_heures_origine);
    const patch = {
      heures_reelles: Number(x.heures_estimees), statut: "realisee", valide_le: new Date().toISOString(),
      taux_brut: calc.tauxBrut, prime_net: calc.primeNet, prime_brute: calc.primeBrute, prime_cout_total: calc.primeCoutTotal,
    };
    const maj = await RhExtras.maj(id, patch);
    if (!maj) { montrerFlash("Échec de la validation. Réessayez."); return; }
    setListe((liste || []).map((it) => (it.id === id ? maj : it)));
    montrerFlash("Heures validées.");
    if (maj.sheet_ligne) {
      RhSheetSync.upsertExtra({
        resto, unite, restoOrigine: maj.resto_origine, salarieNom: maj.salarie_nom, salariePrenom: maj.salarie_prenom, date: maj.date,
        champs: {
          heuresEstimees: maj.heures_reelles, tauxHoraireNet: maj.taux_horaire_net, surHeuresOrigine: maj.sur_heures_origine,
          tauxBrut: maj.taux_brut, primeNet: maj.prime_net, primeBrute: maj.prime_brute, primeCoutTotal: maj.prime_cout_total,
        },
        ligneCible: maj.sheet_ligne,
      }).then((r) => { if (!r.ok) montrerFlash(`⚠ Heures validées, mais la synchro vers le Sheet Extra a échoué : ${r.erreur}`); });
    }
  }

  async function supprimerExtra(x) {
    if (!confirm(`Supprimer cet extra de ${x.salarie_prenom} ${x.salarie_nom} ?`)) return;
    const ok = await RhExtras.supprimer(x.id);
    if (ok) setListe((liste || []).filter((it) => it.id !== x.id));
    else montrerFlash("La suppression a échoué. Réessayez.");
  }

  function voirContrat(x) {
    if (!x.contrat_html) return;
    imprimerDocument(`Contrat de prêt — ${x.salarie_prenom} ${x.salarie_nom}`, x.contrat_html, STYLE_CONTRAT, `contrat_pret_${slugKey(x.salarie_prenom + "_" + x.salarie_nom)}_${x.date}`);
  }

  async function enregistrerFiche(data) {
    const next = { ...etabsJ, [resto]: data };
    setEtabsJ(next);
    await EtablissementsJuridique.save(next);
    setFiche(false);
    montrerFlash("Fiche juridique enregistrée.");
  }

  if (liste === null) return <div className="ig-muted">Chargement…</div>;

  const q = normTxt(recherche);
  const filtres = liste.filter((x) => !q || normTxt(`${x.salarie_prenom} ${x.salarie_nom}`).includes(q));
  const ficheOk = etabsJ[resto] && etabsJ[resto].siret && etabsJ[resto].raisonSociale;

  return (
    <div>
      <div className="ig-noprint" style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
        <button className="ig-btn ig-btn-ink" onClick={()=>setAjout(true)}>+ Ajouter un extra</button>
        <a className="ig-btn ig-btn-ghost" href="https://forms.gle/pNFPqnH2eAX3C7gs7" target="_blank" rel="noopener noreferrer">+ Ajouter un extra extérieur</a>
        {superviseur && <button className="ig-btn ig-btn-ghost" onClick={()=>setFiche(true)}>Fiche juridique de {resto}</button>}
        {superviseur && !ficheOk && <span style={{color:'var(--coral-d)',fontSize:13,fontWeight:600}}>⚠ à compléter avant de générer des contrats valides</span>}
      </div>

      {flash && <div className="ig-status-line ig-noprint" style={{background:'#EAF3F3',marginBottom:14}}>{flash}</div>}

      <div className="ig-card ig-noprint" style={{padding:'14px 18px',marginBottom:14}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{fontSize:20}}>💡</span>
          <span style={{fontWeight:800,fontSize:13,textTransform:'uppercase',letterSpacing:'.4px',color:'var(--ink)'}}>Repères pour saisir un extra</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,background:'#FBF3E4',border:'1.5px solid #E9D2A0',borderRadius:10,padding:'8px 14px',marginBottom:12,fontSize:13}}>
          <span style={{fontSize:18,flexShrink:0}}>🧾</span>
          <span><b>Forfait ?</b> Mettez <b>1</b> dans « Heures » et le montant du forfait dans « Taux net € ».</span>
        </div>
        <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
          {[
            { taux: "15 €", postes: "Commis, Runner, Plongeur, Officier, Hôtesse", couleur: "var(--sea)" },
            { taux: "15 €", postes: "CDR, CDP, Limonadier, Barman", couleur: "var(--coral)" },
            { taux: "18 €", postes: "Directeur, Chef, Chef Barman, Manager/Chef hôtesse", couleur: "var(--ink)" },
          ].map((r, i) => (
            <div key={i} style={{flex:'1 1 220px',display:'flex',alignItems:'center',gap:12,background:'var(--sand)',borderRadius:12,padding:'10px 14px'}}>
              <div style={{width:46,height:46,borderRadius:'50%',background:r.couleur,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,flexShrink:0}}>{r.taux}</div>
              <div style={{fontSize:12.5,color:'var(--ink-soft)',lineHeight:1.4}}>{r.postes}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="ig-card" style={{padding:'16px 20px',marginBottom:18}}>
        <div className="ig-noprint" style={{display:'flex',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}}>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setAnnee(annee - 1)}>◀</button>
          <span style={{fontWeight:700,minWidth:44,textAlign:'center'}}>{annee}</span>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setAnnee(annee + 1)}>▶</button>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {MOIS_NOMS.map((n, i) => (
              <button key={i} className={"ig-btn ig-btn-sm "+(moisNum===i+1?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setMoisNum(i + 1)}>{n.slice(0,3)}</button>
            ))}
          </div>
          <input value={recherche} onChange={(e)=>setRecherche(e.target.value)} placeholder="Rechercher un salarié…" style={{marginLeft:'auto',flex:'1 1 200px',minWidth:0}} />
        </div>
        {filtres.length === 0 ? <div className="ig-muted">{recherche ? "Aucun salarié ne correspond." : "Aucun extra ce mois-ci."}</div> : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtres.map((x) => (
              <div key={x.id} className="ig-extra-row">
                <div className="ig-extra-head">
                  <div style={{minWidth:180}}><b>{x.salarie_prenom} {x.salarie_nom}</b><br /><span className="ig-muted" style={{fontSize:12}}>{x.resto_origine === resto ? "cet établissement" : x.resto_origine} · {x.poste} · {fmtDate(new Date(x.date+"T00:00:00"))}</span></div>
                  <span className="ig-pill" style={{background: x.statut==='realisee' ? '#EAF3F3' : '#FCE5D6'}}>{x.statut === 'realisee' ? '✓ heures validées' : 'à valider'}</span>
                  {x.contrat_html && <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>voirContrat(x)}>Contrat de prêt</button>}
                  {x.statut === 'realisee' && <span className="ig-muted" style={{fontSize:13,fontWeight:600}}>{x.heures_reelles}h · {fmtEuro(x.prime_net)} net</span>}
                  <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>supprimerExtra(x)} style={{color:'var(--coral-d)'}}>Supprimer</button>
                </div>
                {x.statut !== 'realisee' && (
                  <div className="ig-extra-saisie">
                    <div className="ig-extra-champ">
                      <label>Heures</label>
                      <input type="number" min="0" step="0.25" inputMode="decimal" placeholder="0" value={x.heures_estimees ?? ""} onChange={(e)=>modifierChamp(x.id,'heures_estimees', e.target.value === "" ? null : Number(e.target.value))} onBlur={()=>sauverChamp(x.id,'heures_estimees', x.heures_estimees)} />
                    </div>
                    <div className="ig-extra-champ">
                      <label>Taux net €</label>
                      <input type="number" min="0" step="0.5" inputMode="decimal" placeholder="0" disabled={x.sur_heures_origine} value={x.taux_horaire_net ?? ""} onChange={(e)=>modifierChamp(x.id,'taux_horaire_net', e.target.value === "" ? null : Number(e.target.value))} onBlur={()=>sauverChamp(x.id,'taux_horaire_net', x.taux_horaire_net)} />
                    </div>
                    <label className="ig-extra-check">
                      <input type="checkbox" checked={!!x.sur_heures_origine} onChange={(e)=>{ modifierChamp(x.id,'sur_heures_origine', e.target.checked); sauverChamp(x.id,'sur_heures_origine', e.target.checked); }} />
                      sur heures d'origine
                    </label>
                    <button className="ig-btn ig-btn-primary" style={{marginLeft:'auto'}} onClick={()=>validerExtra(x.id)}>✓ Valider</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {superviseur && <VueGlobaleExtrasRH resto={resto} unite={unite} />}

      {ajout && <ChoixSalarieExtraModal resto={resto} unite={unite} onValider={creerExtra} onClose={()=>setAjout(false)} />}
      {fiche && <FicheJuridiqueModal resto={resto} valeurs={etabsJ[resto]} onSave={enregistrerFiche} onClose={()=>setFiche(false)} />}
    </div>
  );
}

// Colonnes de l'historique des extras : "valeur" = valeur brute triable/filtrable,
// "aff" = ce qui s'affiche dans la cellule (si absent, identique à "valeur").
const EXTRAS_HISTORIQUE_COLONNES = [
  { cle: "date", label: "Date", valeur: (x) => x.date, aff: (x) => fmtDate(new Date(x.date + "T00:00:00")) },
  { cle: "salarie", label: "Salarié", valeur: (x) => `${x.salarie_prenom || ""} ${x.salarie_nom || ""}`.trim() },
  { cle: "poste", label: "Poste", valeur: (x) => x.poste || "" },
  { cle: "origine", label: "Origine", valeur: (x) => x.resto_origine || "" },
  { cle: "statut", label: "Statut", valeur: (x) => (x.statut === "realisee" ? "✓ validé" : "à valider") },
  { cle: "heures", label: "Heures", valeur: (x) => String(x.statut === "realisee" ? (x.heures_reelles ?? "") : (x.heures_estimees ?? "")) },
  { cle: "taux", label: "Taux horaire", valeur: (x) => String(x.taux_horaire_net ?? ""), aff: (x) => (x.taux_horaire_net != null ? fmtEuro(x.taux_horaire_net) : "—") },
  { cle: "primeNet", label: "Prime Net", valeur: (x) => String(x.statut === "realisee" ? (x.prime_net ?? "") : ""), aff: (x) => (x.statut === "realisee" ? fmtEuro(x.prime_net) : "—") },
];

// ---------- Historique des extras d'UN établissement + une unité (superviseur), tous mois
// confondus — jamais mélangé avec un autre établissement, ni entre Salle et Cuisine d'un
// même établissement : chacun son récap. Filtres par colonne (façon tableur, comme le
// registre embauche) en plus de la recherche libre et du filtre par mois. ----------
function VueGlobaleExtrasRH({ resto, unite }) {
  const [tout, setTout] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreMois, setFiltreMois] = useState("");
  const [filtresValeurs, setFiltresValeurs] = useState({});
  const [menuOuvert, setMenuOuvert] = useState(null);
  const [triColonne, setTriColonne] = useState(null);
  const [triSens, setTriSens] = useState("asc");

  useEffect(() => {
    let on = true;
    setTout(null);
    setFiltresValeurs({}); setTriColonne(null);
    RhExtras.listParEtablissement(resto, unite).then((l) => { if (on) setTout(l); });
    return () => { on = false; };
  }, [resto, unite]);

  if (tout === null) return <div className="ig-card" style={{padding:'16px 20px',marginBottom:18}}><div className="ig-muted">Chargement de l'historique…</div></div>;

  const moisDisponibles = Array.from(new Set(tout.map((x) => cleMois(new Date(x.date + "T00:00:00"))))).sort().reverse();
  const filtresActifs = Object.keys(filtresValeurs).length > 0;

  const q = normTxt(recherche);
  const filtres = tout
    .filter((x) => {
      if (filtreMois && cleMois(new Date(x.date + "T00:00:00")) !== filtreMois) return false;
      if (q && !normTxt(`${x.salarie_prenom} ${x.salarie_nom} ${x.poste}`).includes(q)) return false;
      return EXTRAS_HISTORIQUE_COLONNES.every((c) => {
        const sel = filtresValeurs[c.cle];
        if (!sel) return true;
        return sel.has(c.valeur(x));
      });
    })
    .sort((a, b) => {
      if (!triColonne) return b.date.localeCompare(a.date);
      const col = EXTRAS_HISTORIQUE_COLONNES.find((c) => c.cle === triColonne);
      const cmp = col.valeur(a).localeCompare(col.valeur(b), "fr", { numeric: true });
      return triSens === "desc" ? -cmp : cmp;
    });

  const totaux = filtres.reduce((acc, x) => {
    if (x.statut === "realisee") {
      acc.heures += Number(x.heures_reelles) || 0;
      acc.primeNet += x.prime_net || 0;
    }
    return acc;
  }, { heures: 0, primeNet: 0 });

  function entete(c) {
    const options = Array.from(new Set(tout.map((x) => c.valeur(x))))
      .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
      .map((brute) => ({ brute, label: brute || "(vide)" }));
    const selection = filtresValeurs[c.cle] || null;
    return (
      <th key={c.cle} style={{padding:'6px 8px',position:'relative'}}>
        <button onClick={()=>setMenuOuvert(menuOuvert === c.cle ? null : c.cle)}
          style={{display:'flex',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',font:'inherit',fontSize:12.5,fontWeight:700,padding:0,color: selection ? 'var(--coral-d)' : 'var(--ink)'}}>
          <span>{c.label}</span> <span style={{fontSize:9}}>▾</span>
        </button>
        {menuOuvert === c.cle && (
          <MenuFiltreColonne
            options={options}
            selection={selection}
            onValider={(nouvelle)=>{
              const next = { ...filtresValeurs };
              if (nouvelle === null) delete next[c.cle]; else next[c.cle] = nouvelle;
              setFiltresValeurs(next);
            }}
            onTrier={(sens)=>{ setTriColonne(c.cle); setTriSens(sens); }}
            onFermer={()=>setMenuOuvert(null)}
          />
        )}
      </th>
    );
  }

  return (
    <div className="ig-card" style={{padding:'16px 20px',marginBottom:18,borderColor:'var(--ink)'}}>
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:16,fontWeight:600,marginBottom:10}}>Historique des extras — {resto} ({unite}), tous mois</div>
      <div className="ig-noprint" style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
        <input value={recherche} onChange={(e)=>setRecherche(e.target.value)} placeholder="Rechercher un salarié / poste…" style={{minWidth:200}} />
        <select value={filtreMois} onChange={(e)=>setFiltreMois(e.target.value)}>
          <option value="">Tous les mois</option>
          {moisDisponibles.map((m) => (<option key={m} value={m}>{m}</option>))}
        </select>
        {filtresActifs && <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setFiltresValeurs({})}>✕ Réinitialiser les filtres</button>}
        <button className="ig-btn ig-btn-ghost" onClick={()=>exporterRecapExtrasRH(filtres, filtreMois || `${resto}-${unite}`, `Extras_${resto}_${unite}_${filtreMois || "historique"}.xlsx`)}>⬇ Export (xlsx)</button>
      </div>
      <div className="ig-muted" style={{marginBottom:10,fontSize:13}}>
        {filtres.length} extra{filtres.length>1?'s':''} · {totaux.heures}h validées · {fmtEuro(totaux.primeNet)} net
      </div>
      {filtres.length === 0 ? <div className="ig-muted">Aucun extra ne correspond.</div> : (
        <div style={{overflowX:'auto',maxHeight:480,overflowY:'auto'}}>
          <table style={{width:'100%',fontSize:12.5,borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:'var(--sand)'}}>
              <tr style={{textAlign:'left'}}>
                {EXTRAS_HISTORIQUE_COLONNES.map((c) => entete(c))}
              </tr>
            </thead>
            <tbody>
              {filtres.map((x) => (
                <tr key={x.id} style={{borderTop:'1px solid var(--sand-2)'}}>
                  {EXTRAS_HISTORIQUE_COLONNES.map((c) => (
                    <td key={c.cle} style={{padding:'6px 8px'}}>{(c.aff || c.valeur)(x)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EspaceRH({ acces, restaurants, onAjouterEtablissement, onBack, onDeconnexion }) {
  const estSuperviseur = acces.some((a) => a.superviseur);
  const scopes = acces.filter((a) => !a.superviseur); // [{resto, unite}]
  // Un compte directeur/chef peut avoir accès à plusieurs établissements (ex : Pablo Saint
  // Barth ET Pablo) : dans ce cas il choisit lequel ouvrir, au lieu de toujours atterrir sur
  // le premier de la liste (bug corrigé ici — avant, "scopes[0]" était pris sans condition).
  const plusieursScopes = scopes.length > 1;
  const [restoActif, setRestoActif] = useState(estSuperviseur || plusieursScopes ? null : scopes[0].resto);
  const [uniteActive, setUniteActive] = useState(estSuperviseur || plusieursScopes ? null : scopes[0].unite);
  const [gestionAcces, setGestionAcces] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [compteursRH, setCompteursRH] = useState({}); // effectif réel par établissement (rh_salaries)
  // Sous-parties de l'Espace RH d'un établissement : "registre" (liste des salariés actuelle)
  // est la première ; d'autres sections viendront s'ajouter à côté par la suite.
  const [sousSection, setSousSection] = useState(null);
  const SOUS_SECTIONS_RH = [
    { cle: "registre", label: "Registre embauche" },
    { cle: "repos_hebdo", label: "Repos hebdo non pris" },
    { cle: "extras", label: "Extras" },
    { cle: "planning", label: "Planning" },
  ];

  useEffect(() => {
    let on = true;
    RhSalaries.compterParResto().then((c) => { if (on) setCompteursRH(c); });
    return () => { on = false; };
  }, [refreshKey]);

  // Rattrapage en un clic : va chercher dans le Google Sheet les salariés déjà onboardés
  // mais jamais reçus par l'app (onboardés avant la mise en place de la synchro automatique),
  // et les crée en base. Ne touche jamais aux fiches déjà existantes. Scopé sur l'établissement
  // actif quand on en a choisi un (évite d'importer les autres établissements en même temps).
  async function importerDepuisSheet() {
    if (importBusy) return;
    setImportBusy(true); setImportMsg("");
    const r = await RhSheetSync.importerTout(restoActif || undefined);
    setImportBusy(false);
    if (!r.ok) { setImportMsg(`Échec de l'import : ${r.erreur || "erreur inconnue"}`); return; }
    const morceaux = [];
    if (r.importes > 0) morceaux.push(`${r.importes} nouvelle${r.importes>1?'s':''} fiche${r.importes>1?'s':''}`);
    if (r.completes > 0) morceaux.push(`${r.completes} fiche${r.completes>1?'s':''} complétée${r.completes>1?'s':''} (dates/heures manquantes)`);
    setImportMsg(morceaux.length > 0 ? `Import terminé : ${morceaux.join(", ")}.` : "Rien à importer : tout est déjà à jour.");
    setRefreshKey((k) => k + 1);
  }

  if (estSuperviseur && !restoActif) {
    return (
      <>
        <div className="ig-noprint" style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:10,alignItems:'center'}}>
          {importMsg && <span className="ig-muted" style={{fontSize:12.5}}>{importMsg}</span>}
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={importerDepuisSheet} disabled={importBusy}>{importBusy ? "Import…" : "↻ Importer depuis le Sheet"}</button>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setGestionAcces(true)}><Icon.Shield/> Accès RH</button>
        </div>
        <RestoPicker restaurants={restaurants} onPick={(r)=>{ setRestoActif(r); setUniteActive("SALLE"); }} onAdd={onAjouterEtablissement} compteurs={compteursRH} />
        {gestionAcces && <AccesRHModal restaurants={restaurants} onClose={()=>setGestionAcces(false)} />}
      </>
    );
  }

  // Directeur/chef avec accès à plusieurs établissements : écran de choix (même esprit que
  // le RestoPicker du superviseur), limité aux seuls établissements/unités accordés.
  if (!estSuperviseur && plusieursScopes && !restoActif) {
    return (
      <div>
        <div className="ig-eyebrow">Espace RH</div>
        <h2 className="ig-section-title">Choisissez un établissement</h2>
        <p className="ig-muted">Vous avez accès à {scopes.length} établissements.</p>
        <div className="ig-resto-grid">
          {scopes.map((s, i) => (
            <button key={i} className="ig-resto" onClick={()=>{ setRestoActif(s.resto); setUniteActive(s.unite); }}>
              <div><div className="nm">{s.resto}</div><div className="ig-muted" style={{fontSize:12}}>{s.unite}</div></div>
              <Icon.Chevron />
            </button>
          ))}
        </div>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onDeconnexion} style={{marginTop:14}}>Déconnexion</button>
      </div>
    );
  }

  return (
    <div>
      <div className="ig-noprint" style={{display:'flex',alignItems:'center',gap:14,marginBottom:14,flexWrap:'wrap'}}>
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>{
          if (sousSection) { setSousSection(null); return; }
          if (estSuperviseur || plusieursScopes) setRestoActif(null); else onBack();
        }}><Icon.Back/> {sousSection ? "Sections" : ((estSuperviseur || plusieursScopes) ? "Établissements" : "Retour")}</button>
        <div>
          <div className="ig-eyebrow" style={{margin:0}}>Espace RH{estSuperviseur && <span style={{marginLeft:8,padding:'2px 8px',borderRadius:20,background:'var(--ink)',color:'var(--sand)',fontSize:10,letterSpacing:'.5px'}}>SUPERVISEUR</span>}</div>
          <h2 className="ig-section-title">{restoActif}</h2>
        </div>
        {estSuperviseur && sousSection && sousSection !== "planning" && (
          <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
            {importMsg && <span className="ig-muted" style={{fontSize:12.5}}>{importMsg}</span>}
            <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={importerDepuisSheet} disabled={importBusy}>{importBusy ? "Import…" : "↻ Importer depuis le Sheet"}</button>
            <button className={"ig-btn ig-btn-sm "+(uniteActive==='SALLE'?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setUniteActive('SALLE')}>Salle</button>
            <button className={"ig-btn ig-btn-sm "+(uniteActive==='CUISINE'?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setUniteActive('CUISINE')}>Cuisine</button>
            <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setGestionAcces(true)}><Icon.Shield/> Accès RH</button>
          </div>
        )}
        <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={onDeconnexion}>Déconnexion</button>
      </div>
      {!sousSection ? (
        <div>
          <div className="ig-eyebrow">Étape 2</div>
          <h2 className="ig-section-title">Choisissez une section</h2>
          <p className="ig-muted">{SOUS_SECTIONS_RH.length} section{SOUS_SECTIONS_RH.length>1?'s':''} pour {restoActif}.</p>
          <div className="ig-resto-grid">
            {SOUS_SECTIONS_RH.map((s) => (
              <button key={s.cle} className="ig-resto" onClick={()=>setSousSection(s.cle)}>
                <div><div className="nm">{s.label}</div></div>
                <Icon.Chevron />
              </button>
            ))}
          </div>
        </div>
      ) : sousSection === "registre" ? (
        <ListeSalariesRH key={refreshKey} resto={restoActif} unite={uniteActive} superviseur={estSuperviseur} />
      ) : sousSection === "repos_hebdo" ? (
        <ReposHebdoRH resto={restoActif} unite={uniteActive} superviseur={estSuperviseur} />
      ) : sousSection === "extras" ? (
        <ExtrasRH resto={restoActif} unite={uniteActive} superviseur={estSuperviseur} />
      ) : sousSection === "planning" && (
        // Réutilise ManagerView telle quelle (mêmes données kv/kv_history que l'Espace
        // manager par code partagé) : rien n'est dupliqué ni migré, donc tout l'historique
        // déjà accompli reste intact, et les directeurs peuvent continuer à travailler sur
        // l'Espace manager en parallèle tant que ce nouvel onglet n'est pas définitif.
        <ManagerView resto={restoActif} superviseur={estSuperviseur} onBack={()=>setSousSection(null)} />
      )}
      {gestionAcces && <AccesRHModal restaurants={restaurants} onClose={()=>setGestionAcces(false)} />}
    </div>
  );
}

// ---------- Application principale ----------
export default function App() {
  const [role, setRole] = useState(null);     // 'manager' | 'salarie' | 'rh'
  const [askCode, setAskCode] = useState(false);
  const [askRH, setAskRH] = useState(false);
  const [rhAcces, setRhAcces] = useState(null); // droits RH de la personne connectée
  const [resto, setResto] = useState(null);
  const [emp, setEmp] = useState(null);
  const [etabsAjoutes, setEtabsAjoutes] = useState([]);
  const [session, setSession] = useState(null); // session manager (Supabase Auth)
  // Accès étendu (export PayFit, validations à la place du salarié, forcer le modèle...),
  // réservé à Océane. Mémorisé sur cet appareil pour ne pas retaper le code à chaque visite.
  const [superviseur, setSuperviseur] = useState(() => localStorage.getItem("ig_superviseur") === "1");

  useEffect(() => {
    let on = true;
    Store.get(kEtablissements).then((v) => { if (on && Array.isArray(v)) setEtabsAjoutes(v); });
    return () => { on = false; };
  }, []);

  // Suit l'état de connexion manager (persisté par Supabase entre les visites).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => { authSub.subscription.unsubscribe(); };
  }, []);

  // Liste complète : restaurants du fichier + établissements ajoutés (sans doublon).
  const restaurants = useMemo(() => {
    const set = new Set(RESTAURANTS);
    etabsAjoutes.forEach((r) => set.add(r));
    return Array.from(set);
  }, [etabsAjoutes]);

  function ajouterEtablissement(nom) {
    const propre = nom.trim();
    if (!propre) return;
    // Évite les doublons (insensible à la casse/accents).
    if (restaurants.some((r) => normTxt(r) === normTxt(propre))) return;
    const next = [...etabsAjoutes, propre];
    setEtabsAjoutes(next);
    Store.set(kEtablissements, next);
  }
  function reset() { setRole(null); setAskCode(false); setAskRH(false); setRhAcces(null); setResto(null); setEmp(null); }
  async function deconnexion() {
    await supabase.auth.signOut();
    localStorage.removeItem("ig_superviseur");
    setSuperviseur(false);
    reset();
  }
  async function deconnexionRH() {
    await supabase.auth.signOut();
    reset();
  }

  let content;
  if (askCode) {
    content = <CodeGate onOk={(estSuperviseur)=>{
      setAskCode(false);
      setRole('manager');
      setSuperviseur(estSuperviseur);
      if (estSuperviseur) localStorage.setItem("ig_superviseur", "1");
      else localStorage.removeItem("ig_superviseur");
    }} onCancel={()=>setAskCode(false)} />;
  } else if (askRH) {
    content = <RHLoginForm onOk={(acces)=>{ setAskRH(false); setRole('rh'); setRhAcces(acces); }} onCancel={()=>setAskRH(false)} />;
  } else if (!role) {
    content = (
      <div className="ig-hero ig-hero-bg ig-fullbleed" style={{textAlign:'center',padding:'40px 20px',backgroundImage:`url(${fondAccueil})`}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:36}}>
          <svg width="84" height="84" viewBox="0 0 64 64" aria-label="Indie Group">
            <rect width="64" height="64" rx="14" fill="#111111"/>
            <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontFamily="'Inter',system-ui,sans-serif" fontWeight="800" fontSize="31" letterSpacing="-1.5" fill="#ffffff">IG</text>
          </svg>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontWeight:700,fontSize:30,letterSpacing:'-.5px',color:'#fff'}}>Indie Group RH</div>
        </div>
        <div className="ig-roles" style={{width:'100%',maxWidth:720,margin:0}}>
          <button className="ig-role" onClick={()=> session ? setRole('manager') : setAskCode(true)} style={{textAlign:'center'}}>
            <div className="ig-ic" style={{background:'var(--ink)',color:'var(--sand)',margin:'0 auto 16px'}}><Icon.Shield/></div>
            <h3 style={{margin:0}}>Je suis manager</h3>
          </button>
          <button className="ig-role" onClick={()=>setRole('salarie')} style={{textAlign:'center'}}>
            <div className="ig-ic" style={{background:'var(--coral)',color:'#fff',margin:'0 auto 16px'}}><Icon.User/></div>
            <h3 style={{margin:0}}>Je suis salarié</h3>
          </button>
          <button className="ig-role" onClick={()=>setAskRH(true)} style={{textAlign:'center'}}>
            <div className="ig-ic" style={{background:'var(--sea)',color:'#fff',margin:'0 auto 16px'}}><Icon.Shield/></div>
            <h3 style={{margin:0}}>Espace RH</h3>
          </button>
        </div>
      </div>
    );
  } else if (role === "manager" && !resto) {
    content = <RestoPicker restaurants={restaurants} onPick={setResto} onAdd={ajouterEtablissement} />;
  } else if (role === "manager") {
    content = <ManagerView resto={resto} onBack={()=>setResto(null)} superviseur={superviseur} />;
  } else if (role === "rh") {
    content = <EspaceRH acces={rhAcces} restaurants={restaurants} onAjouterEtablissement={ajouterEtablissement} onBack={reset} onDeconnexion={deconnexionRH} />;
  } else if (role === "salarie" && !emp) {
    content = <EmployeeIdentify restaurants={restaurants} onFound={(e)=>{ setEmp(e); setResto(e.r); }} onBack={()=>setRole(null)} />;
  } else {
    content = <EmployeeView resto={resto} emp={emp} onBack={()=>{ setEmp(null); setResto(null); }} />;
  }

  return (
    <div className="ig-app">
      <style>{CSS}</style>
      <div className="ig-topbar ig-noprint">
        <div className="ig-wrap">
          <button className="ig-brand" style={{background:'none',border:'none',color:'inherit',cursor:'pointer',padding:0}} onClick={reset}>
            🌊 Indie Group RH
          </button>
          {role && (
            <div className="ig-tag">
              <span className="ig-pill">{role==='manager'?<Icon.Shield width={15} height={15}/>:role==='rh'?<Icon.Shield width={15} height={15}/>:<Icon.User width={15} height={15}/>}{role==='manager'?'Manager':role==='rh'?'Espace RH':'Salarié'}</span>
              {resto && <span className="ig-pill">{resto}</span>}
              {role==='manager' && (
                <button onClick={deconnexion} style={{background:'rgba(243,236,224,.12)',color:'var(--sand)',border:'none',padding:'6px 12px',borderRadius:999,cursor:'pointer',fontSize:13,fontFamily:'Inter',fontWeight:600}}>Déconnexion</button>
              )}
              {role==='rh' && (
                <button onClick={deconnexionRH} style={{background:'rgba(243,236,224,.12)',color:'var(--sand)',border:'none',padding:'6px 12px',borderRadius:999,cursor:'pointer',fontSize:13,fontFamily:'Inter',fontWeight:600}}>Déconnexion</button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={"ig-wrap" + (role === "rh" ? " ig-wrap-rh" : "")} style={{paddingTop:24,paddingBottom:60}}>
        {content}
      </div>
    </div>
  );
}
