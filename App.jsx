import React, { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "./supabaseClient";
// N'utiliser QUE les fonctions d'écriture de xlsx (aoa_to_sheet, book_new, write) sur des
// données internes à l'appli — jamais XLSX.read()/readFile() sur un fichier externe : les
// failles connues de ce paquet concernent la lecture de fichiers xlsx non fiables.
import * as XLSX from "xlsx";

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
function cleSemaine(d) {
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
  return `Emargement_${slug}_${lundi.toISOString().slice(0, 10)}.pdf`;
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
// Établissements ajoutés dans l'app (au-delà de ceux du fichier) : [nom, ...]
const kEtablissements = "etablissements";
// Validation du planning d'une semaine (booléen) : publie le planning aux salariés.
const kValidation = (resto, sem) => `validation:${slugKey(resto)}:${sem}`;
// Extras (prêt de main-d'œuvre) : une seule liste par mois calendaire, partagée entre tous
// les établissements (comme l'ancien "Réponses au formulaire" partagé). mois = "AAAA-MM".
const kExtras = (mois) => `extras:${mois}`;
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
.ig-modal { background:var(--white); border-radius:18px; padding:24px; max-width:440px; width:100%; }
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
@media (max-width:760px) {
  .ig-roles { grid-template-columns:1fr; }
  .ig-planning { font-size:11px; }
  .ig-planning th.who, .ig-planning td.who { min-width:110px; }
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
function EditModal({ jour, jourLabel, emp, p, onSave, onClose }) {
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
// d'absences [{ emp, date (Date), type: 'CP'|'CSS', choix }]. Retourne les noms des
// salariés sans identifiant PayFit connu (à compléter à la main avant import).
function exporterCongesPayFit(lignesAbsences, nomFichier) {
  const aoa = [];
  const ligne1 = [];
  PAYFIT_ENTETES_GROUPES.forEach(([label, n]) => { ligne1.push(label); for (let i = 1; i < n; i++) ligne1.push(""); });
  aoa.push(ligne1);
  aoa.push(PAYFIT_ENTETES_COLONNES);

  const manquants = new Set();
  lignesAbsences.forEach(({ emp, date, type, choix }) => {
    const row = new Array(33).fill("");
    const id = idSalarie(emp);
    const pf = PAYFIT_IDS[id];
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

const Extras = {
  async load(mois) { return (await Store.get(kExtras(mois))) || []; },
  async save(mois, liste) { await Store.set(kExtras(mois), liste); },
  // Charge l'historique complet, tous mois confondus (équivalent de l'ancien Google Sheet
  // où tout restait visible en permanence sur une seule feuille).
  async loadAll() {
    const lignes = await Store.listByPrefix("extras:");
    const tout = [];
    lignes.forEach((l) => { if (Array.isArray(l.value)) tout.push(...l.value); });
    tout.sort((a, b) => b.date.localeCompare(a.date));
    return tout;
  },
};
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

// Charge l'effectif actuel de plusieurs établissements (fichier + salariés ajoutés dans
// l'appli, hors salariés partis) : sert au sélecteur "quel salarié fait l'extra ce soir ?",
// qui doit pouvoir trouver un salarié de N'IMPORTE quel établissement du groupe.
async function chargerEffectifGlobal(restaurants) {
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const rosters = await Promise.all(restaurants.map((r) => Store.get(kRoster(r))));
  const tous = [];
  restaurants.forEach((r, i) => {
    const roster = rosters[i] || {};
    const supprimes = new Set(roster.supprimes || []);
    const departs = roster.departs || {};
    const base = EMPLOYEES.filter((e) => e.r === r).concat(roster.ajouts || []);
    base.forEach((e) => {
      const id = idSalarie(e);
      if (supprimes.has(id)) return;
      const fin = departs[id];
      if (fin && fin < aujourdHui) return;
      tous.push(e);
    });
  });
  return tous;
}

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
function construireContratPretHTML({ origineJ, destJ, salarie, poste, date, heures, tauxNet, dateGeneration }) {
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
    <p>Base convenue pour cette soirée : ${heures ? esc(String(heures)) : '(à valider après la soirée)'} heure(s) à ${fmtEuro(tauxNet)} net de l'heure.</p>
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

// Construit le corps HTML de l'avenant de prêt temporaire (côté salarié), plus court,
// remis en complément du contrat entre sociétés.
function construireAvenantHTML({ origineNom, destNom, salarie, poste, date, dateGeneration }) {
  const dateFr = fmtDate(new Date(date + "T00:00:00"));
  const genFr = fmtDate(dateGeneration);
  return `
    <h1>AVENANT DE PRÊT TEMPORAIRE</h1>
    <p class="sub" style="display:block;text-align:center;margin-bottom:14px">De la société ${esc(origineNom)} vers ${esc(destNom)}</p>
    <p>Nous vous confirmons votre prêt auprès de la société citée ci-dessus selon les modalités suivantes.</p>
    <h2>Article 1 : objet du prêt</h2>
    <p><b>${esc(salarie.p)} ${esc(salarie.n)}</b><br>Vous serez détaché(e) de l'entreprise ${esc(origineNom)} à la société ${esc(destNom)} et exercerez les fonctions de <b>${esc(poste)}</b>.</p>
    <h2>Article 2 : durée du prêt</h2>
    <p>Ce prêt aura lieu à la date suivante : ${dateFr}.</p>
    <h2>Article 3 : conditions d'exécution du prêt</h2>
    <p>Pendant la durée du prêt auprès de la société ${esc(destNom)}, vous resterez salarié(e) de l'entreprise ${esc(origineNom)}. Vous vous engagez à respecter les instructions et consignes de sécurité qui vous seront données, identiques à celles de votre établissement d'origine. Vous vous conformerez aux horaires et règles applicables au service au sein duquel vous êtes affecté(e).</p>
    <h2>Article 4 – Fin du prêt</h2>
    <p>À la fin du prêt, vous serez automatiquement réintégré(e) dans votre poste au sein de votre entreprise d'origine.</p>
    <h2>Article 5 : divers</h2>
    <p>Ce prêt s'effectue selon les modalités légales en vigueur. Les autres dispositions de votre contrat de travail demeurent inchangées.</p>
    <p>Fait le ${genFr}.<br><i>Faire précéder la signature de la mention manuscrite « Lu et approuvé »</i></p>
    <div class="signatures">
      <div>Le (la) salarié(e)<div class="ligne">${esc(salarie.p)} ${esc(salarie.n)}</div></div>
      <div>Pour la société ${esc(origineNom)}<div class="ligne">&nbsp;</div></div>
    </div>`;
}

// Génère et enregistre (dans l'enregistrement extra lui-même) le contrat + l'avenant,
// horodatés au moment de la création de l'extra — donc avant la soirée, comme l'exige la loi.
function genererDocumentsExtra(extra, etabsJ) {
  const origineJ = etabsJ[extra.restoOrigine] || null;
  const destJ = etabsJ[extra.resto] || null;
  const dateGeneration = new Date();
  const salarie = { n: extra.salarieNom, p: extra.salariePrenom };
  const contratHTML = construireContratPretHTML({ origineJ, destJ, salarie, poste: extra.poste, date: extra.date, heures: extra.heuresEstimees, tauxNet: extra.tauxHoraireNet, dateGeneration });
  const avenantHTML = construireAvenantHTML({ origineNom: (origineJ && origineJ.raisonSociale) || extra.restoOrigine, destNom: (destJ && destJ.raisonSociale) || extra.resto, salarie, poste: extra.poste, date: extra.date, dateGeneration });
  return { contratHTML, avenantHTML, contratGenereAt: dateGeneration.toISOString() };
}

// Export du récap mensuel des extras : une feuille "Détail" (une ligne par extra, mêmes
// colonnes que l'ancien formulaire) + une feuille "Récap par salarié" (totaux du mois),
// pour reprendre le travail d'intégration des primes en variables PayFit.
function exporterRecapExtras(liste, mois, nomFichier) {
  const realises = liste.filter((x) => x.statut === "realisee");
  const enteteDetail = ["Établissement", "Date", "Nom", "Prénom", "Établissement d'origine", "Poste", "Heures", "Taux horaire net", "Sur heures d'origine", "Taux horaire brut", "Prime Net", "Prime Brute", "Prime Coût Total", "Mois"];
  const aoaDetail = [enteteDetail];
  realises.forEach((x) => {
    aoaDetail.push([x.resto, x.date, x.salarieNom, x.salariePrenom, x.restoOrigine, x.poste, x.heuresReelles, x.tauxHoraireNet, x.surHeuresOrigine ? "OUI" : "NON", x.tauxBrut, x.primeNet, x.primeBrute, x.primeCoutTotal, mois]);
  });
  const parSalarie = {};
  realises.forEach((x) => {
    const key = x.salarieId || idSalarie({ n: x.salarieNom, p: x.salariePrenom });
    const pf = PAYFIT_IDS[key] || ["", ""];
    const cur = parSalarie[key] || { nom: x.salarieNom, prenom: x.salariePrenom, identifiant: pf[0], matricule: pf[1], heures: 0, primeNet: 0, primeBrute: 0, primeCoutTotal: 0 };
    cur.heures += Number(x.heuresReelles) || 0;
    cur.primeNet += x.primeNet || 0;
    cur.primeBrute += x.primeBrute || 0;
    cur.primeCoutTotal += x.primeCoutTotal || 0;
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
function fmtHeureImport(v) {
  if (v == null) return null;
  if (v instanceof Date) return String(v.getUTCHours()).padStart(2, "0") + ":" + String(v.getUTCMinutes()).padStart(2, "0");
  if (typeof v === "number") {
    const h = Math.floor(v), m = Math.round((v - h) * 60);
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  const s = String(v).trim().toUpperCase();
  const m1 = s.match(/^(\d{1,2})H(\d{2})?$/);
  if (m1) return String(Number(m1[1])).padStart(2, "0") + ":" + (m1[2] || "00");
  const n = Number(s.replace(",", "."));
  if (!isNaN(n)) { const h = Math.floor(n), mi = Math.round((n - h) * 60); return String(h).padStart(2, "0") + ":" + String(mi).padStart(2, "0"); }
  return null;
}
function parsePauseImport(v) {
  const s = (v == null ? "" : String(v)).toUpperCase();
  const m = s.match(/(\d+)\s*H/);
  if (m) return Number(m[1]);
  const mm = s.match(/(\d+)\s*MIN/);
  if (mm) return Number(mm[1]) / 60;
  return 1; // valeur par défaut si la case pause est vide ou illisible
}
// Décode une feuille "PLANNING ..." en { sem, lundi, entries:[{emp,jours}], nonReconnus:[...] }.
function parseSemaineDepuisFeuille(grille, resto, ajouts) {
  const dateBrute = grille[0] && grille[0][1];
  let lundiDate = dateBrute instanceof Date ? new Date(dateBrute.getUTCFullYear(), dateBrute.getUTCMonth(), dateBrute.getUTCDate()) : null;
  if (!lundiDate) return null;
  lundiDate = lundiDeLaSemaine(lundiDate);
  const sem = cleSemaine(lundiDate);
  const JOURS_COLS = [3, 6, 9, 12, 15, 18, 21]; // D,G,J,M,P,S,V (0-indexé)
  const entries = [];
  const nonReconnus = [];
  const approximatifs = [];
  let videsConsecutifs = 0;
  for (let r = 3; r < grille.length; r += 3) {
    const nom = grille[r] && grille[r][1];
    const prenom = grille[r + 1] && grille[r + 1][1];
    if (!nom && !prenom) { videsConsecutifs++; if (videsConsecutifs >= 3) break; continue; }
    videsConsecutifs = 0;
    if (!nom || !prenom) continue;
    // Recherche exacte d'abord ; si ça échoue (ex: nom de famille abrégé dans le fichier
    // source), on retente en tolérant les fautes/abréviations, mais seulement si un SEUL
    // candidat ressort clairement — sinon on préfère signaler plutôt que deviner.
    let emp = trouverSalarie(String(prenom), String(nom), resto, ajouts || []);
    let approx = false;
    if (!emp) {
      const suggestions = suggererSalaries(String(prenom), String(nom), resto, ajouts || []);
      if (suggestions.length === 1) { emp = suggestions[0]; approx = true; }
    }
    const jours = {};
    JOURS_COLS.forEach((c, j) => {
      const pauseCase = (grille[r][c + 2] != null) ? grille[r][c + 2] : grille[r + 1][c + 2];
      const pauseTxt = pauseCase == null ? "" : String(pauseCase).trim().toUpperCase();
      if (pauseTxt === "OFF") { jours[j] = { statut: STATUTS.OFF, debut: "", fin: "", pause: 0 }; return; }
      const debut = fmtHeureImport(grille[r][c]);
      const fin = fmtHeureImport(grille[r + 1][c]);
      if (!debut || !fin) return; // rien de fiable pour ce jour : on n'écrit rien plutôt que de deviner
      jours[j] = { statut: STATUTS.TRAVAIL, debut, fin, pause: parsePauseImport(pauseCase) };
    });
    if (emp) {
      entries.push({ emp, jours });
      if (approx) approximatifs.push(`"${prenom} ${nom}" → ${emp.p} ${emp.n}`);
    } else {
      nonReconnus.push(`${prenom} ${nom}`);
    }
  }
  return { sem, lundi: lundiDate, entries, nonReconnus, approximatifs };
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
    const ok = imprimerDocument(`Emargement ${resto}`, corps, styles, `Emargement_${slugKey(resto)}_${lundi.toISOString().slice(0,10)}`);
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
function GestionModal({ emp, semDate, depart, peutSupprimerDef, onMarquer, onSupprimer, onSupprimerDef, onAnnulerDepart, onClose }) {
  const [mode, setMode] = useState(null); // 'cp' | 'am' | 'suppr' | 'supprdef'
  const [jours, setJours] = useState([]); // index 0..6 sélectionnés
  const [dateFin, setDateFin] = useState(""); // date de fin de contrat saisie
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
  const [err, setErr] = useState(false);

  function valider() {
    if (!prenom.trim() || !nom.trim()) { setErr(true); return; }
    onAjouter({ prenom, nom, poste, unite, heures: Number(heures) });
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
  const [f, setF] = useState({ raisonSociale: "", adresse: "", cp: "", ville: "", capital: "", rcs: "", siret: "", ape: "", ...(valeurs || {}) });
  const champ = (label, key, placeholder) => (
    <div className="ig-field">
      <label>{label}</label>
      <input value={f[key]} onChange={(e)=>setF({ ...f, [key]: e.target.value })} placeholder={placeholder} />
    </div>
  );
  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e)=>e.stopPropagation()}>
        <h3>Fiche juridique — {resto}</h3>
        <div className="ig-muted" style={{marginBottom:10}}>Ces informations apparaissent sur les contrats de prêt de main-d'œuvre générés pour cet établissement (comme société prêteuse ou utilisatrice).</div>
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
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={()=>onSave(f)}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Modal Ajout d'un extra (choix du salarié + génération immédiate du contrat) ----------
function AjoutExtraModal({ resto, effectif, onValider, onClose }) {
  const [recherche, setRecherche] = useState("");
  const [selection, setSelection] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [heuresEstimees, setHeuresEstimees] = useState("");
  const [tauxHoraireNet, setTauxHoraireNet] = useState("");
  const [surHeuresOrigine, setSurHeuresOrigine] = useState(false);
  const [err, setErr] = useState("");

  const candidats = useMemo(() => {
    const q = normTxt(recherche);
    if (!q) return [];
    return effectif.filter((e) => e.r !== resto && (normTxt(e.n).includes(q) || normTxt(e.p).includes(q) || normTxt(`${e.p} ${e.n}`).includes(q))).slice(0, 8);
  }, [recherche, effectif, resto]);

  function choisir(e) {
    setSelection(e);
    setRecherche(`${e.p} ${e.n}`);
  }

  function valider() {
    if (!selection) { setErr("Choisissez un salarié dans la liste (établissement d'origine différent du vôtre)."); return; }
    if (!date) { setErr("Indiquez la date de la soirée."); return; }
    if (!surHeuresOrigine && (!tauxHoraireNet || Number(tauxHoraireNet) <= 0)) { setErr("Indiquez le taux horaire net (ou cochez « sur ses heures d'origine »)."); return; }
    onValider({
      salarieId: idSalarie(selection), salarie: selection, poste: selection.po || "", date,
      heuresEstimees: heuresEstimees === "" ? null : Number(heuresEstimees),
      tauxHoraireNet: Number(tauxHoraireNet) || 0, surHeuresOrigine,
    });
  }

  return (
    <div className="ig-overlay" onClick={onClose}>
      <div className="ig-modal" onClick={(e)=>e.stopPropagation()} style={{maxWidth:480}}>
        <h3>Contrat de prêt</h3>
        <div className="ig-muted" style={{marginBottom:10}}>Choisissez un salarié d'un autre établissement du groupe : le contrat de prêt de main-d'œuvre est généré immédiatement, prêt à signer avant la soirée.</div>

        <div className="ig-field" style={{position:'relative'}}>
          <label>Salarié (autre établissement)</label>
          <input value={recherche} onChange={(e)=>{ setRecherche(e.target.value); setSelection(null); setErr(""); }} placeholder="Tapez un nom…" />
          {recherche && !selection && candidats.length > 0 && (
            <div className="ig-card" style={{position:'absolute',zIndex:5,left:0,right:0,marginTop:4,padding:6,maxHeight:220,overflowY:'auto'}}>
              {candidats.map((e) => (
                <div key={idSalarie(e)} style={{padding:'8px 10px',cursor:'pointer',borderRadius:8}}
                  onClick={()=>choisir(e)}
                  onMouseDown={(ev)=>ev.preventDefault()}>
                  <b>{e.p} {e.n}</b> <span className="ig-muted">· {e.po} · {e.r}</span>
                </div>
              ))}
            </div>
          )}
          {recherche && !selection && candidats.length === 0 && (
            <div className="ig-muted" style={{marginTop:6,fontSize:13}}>Aucun salarié d'un autre établissement ne correspond.</div>
          )}
        </div>

        {selection && (
          <>
            <div className="ig-times">
              <div className="ig-field" style={{margin:0}}>
                <label>Date de la soirée</label>
                <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
              </div>
              <div className="ig-field" style={{margin:0}}>
                <label>Heures estimées (optionnel)</label>
                <input type="number" min="0" step="0.5" value={heuresEstimees} onChange={(e)=>setHeuresEstimees(e.target.value)} placeholder="Saisies après la soirée si inconnu" />
              </div>
            </div>
            <div className="ig-times">
              <div className="ig-field" style={{margin:0}}>
                <label>Taux horaire net</label>
                <input type="number" min="0" step="0.5" value={tauxHoraireNet} onChange={(e)=>setTauxHoraireNet(e.target.value)} disabled={surHeuresOrigine} placeholder="€ / heure" />
              </div>
              <div className="ig-field" style={{margin:0,display:'flex',alignItems:'flex-end',paddingBottom:6}}>
                <label style={{display:'flex',alignItems:'center',gap:8,fontWeight:400}}>
                  <input type="checkbox" checked={surHeuresOrigine} onChange={(e)=>setSurHeuresOrigine(e.target.checked)} />
                  Sur ses heures d'origine (non rémunéré en extra)
                </label>
              </div>
            </div>
          </>
        )}

        {err && <div style={{color:'var(--coral-d)',fontSize:13,marginTop:10,fontWeight:600}}>{err}</div>}
        <div style={{display:'flex',gap:10,marginTop:18}}>
          <button className="ig-btn ig-btn-ghost" style={{flex:1}} onClick={onClose}>Annuler</button>
          <button className="ig-btn ig-btn-primary" style={{flex:1}} onClick={valider}>Générer le contrat de prêt</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Onglet Extra (prêt de main-d'œuvre) ----------
function ExtraTab({ resto, superviseur }) {
  const [restaurants, setRestaurants] = useState([...RESTAURANTS]);
  const [effectif, setEffectif] = useState([]);
  const [etabsJ, setEtabsJ] = useState({});
  const [moisDate, setMoisDate] = useState(new Date());
  const [liste, setListe] = useState(null);
  const [ajout, setAjout] = useState(false);
  const [fiche, setFiche] = useState(false);
  const [flash, setFlash] = useState("");
  const [heuresSaisie, setHeuresSaisie] = useState({});

  const mois = cleMois(moisDate);

  useEffect(() => {
    let on = true;
    Store.get(kEtablissements).then((v) => { if (on && Array.isArray(v) && v.length) setRestaurants(Array.from(new Set([...RESTAURANTS, ...v]))); });
    return () => { on = false; };
  }, []);

  useEffect(() => {
    let on = true;
    Promise.all([chargerEffectifGlobal(restaurants), EtablissementsJuridique.load(), Extras.load(mois)]).then(([eff, ej, ex]) => {
      if (!on) return;
      setEffectif(eff); setEtabsJ(ej); setListe(ex);
    });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants.length, mois]);

  function montrerFlash(msg) { setFlash(msg); setTimeout(() => setFlash(""), 6000); }

  async function persisterDans(moisCible, nouvelleListe) {
    if (moisCible === mois) setListe(nouvelleListe);
    await Extras.save(moisCible, nouvelleListe);
  }

  async function creerExtra({ salarieId, salarie, poste, date, heuresEstimees, tauxHoraireNet, surHeuresOrigine }) {
    const nouveau = {
      id: (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(16).slice(2)}`),
      resto, restoOrigine: salarie.r, salarieId, salarieNom: salarie.n, salariePrenom: salarie.p,
      poste, date, heuresEstimees, tauxHoraireNet, surHeuresOrigine,
      statut: "a_valider", heuresReelles: null, payfitStatut: "a_faire", creeLe: new Date().toISOString(),
    };
    Object.assign(nouveau, genererDocumentsExtra(nouveau, etabsJ));
    const moisExtra = cleMois(new Date(date + "T00:00:00"));
    const base = moisExtra === mois ? (liste || []) : await Extras.load(moisExtra);
    await persisterDans(moisExtra, [...base, nouveau]);
    setAjout(false);
    montrerFlash(`Extra créé pour ${salarie.p} ${salarie.n} (${salarie.r} → ${resto}) le ${fmtDate(new Date(date + "T00:00:00"))}. Le contrat et l'avenant sont prêts.`);
  }

  async function validerHeures(id) {
    const val = heuresSaisie[id];
    if (val === undefined || val === "" || isNaN(Number(val))) return;
    const next = (liste || []).map((x) => {
      if (x.id !== id) return x;
      const calc = calculExtra(val, x.tauxHoraireNet, x.surHeuresOrigine);
      return { ...x, heuresReelles: Number(val), statut: "realisee", ...calc };
    });
    await persisterDans(mois, next);
    montrerFlash("Heures enregistrées.");
  }

  function voirDocument(x, quel) {
    const html = quel === "contrat" ? x.contratHTML : x.avenantHTML;
    if (!html) return;
    imprimerDocument(`${quel === "contrat" ? "Contrat de prêt" : "Avenant"} — ${x.salariePrenom} ${x.salarieNom}`, html, STYLE_CONTRAT, `${quel}_${slugKey(x.salariePrenom + "_" + x.salarieNom)}_${x.date}`);
  }

  async function enregistrerFiche(data) {
    const next = { ...etabsJ, [resto]: data };
    setEtabsJ(next);
    await EtablissementsJuridique.save(next);
    setFiche(false);
    montrerFlash("Fiche juridique enregistrée.");
  }

  if (liste === null) return <div className="ig-muted">Chargement…</div>;

  const mesDemandes = liste.filter((x) => x.resto === resto).sort((a, b) => b.date.localeCompare(a.date));
  const monEquipeAilleurs = liste.filter((x) => x.restoOrigine === resto).sort((a, b) => b.date.localeCompare(a.date));
  const ficheOk = etabsJ[resto] && etabsJ[resto].siret && etabsJ[resto].raisonSociale;

  return (
    <div>
      <div className="ig-noprint" style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
        <button className="ig-btn ig-btn-ink" onClick={()=>setAjout(true)}>+ Contrat de prêt</button>
        <button className="ig-btn ig-btn-ghost" onClick={()=>setFiche(true)}>Fiche juridique de {resto}</button>
        {!ficheOk && <span style={{color:'var(--coral-d)',fontSize:13,fontWeight:600}}>⚠ à compléter avant de générer des contrats valides</span>}
      </div>

      {flash && <div className="ig-status-line ig-noprint" style={{background:'#EAF3F3',marginBottom:14}}>{flash}</div>}

      <div className="ig-card" style={{padding:'16px 20px',marginBottom:18}}>
        <div className="ig-noprint" style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setMoisDate(new Date(moisDate.getFullYear(), moisDate.getMonth()-1, 1))}><Icon.Back width={14} height={14}/></button>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:16,fontWeight:600}}>Extras chez {resto} — {MOIS_NOMS[moisDate.getMonth()]} {moisDate.getFullYear()}</div>
          <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setMoisDate(new Date(moisDate.getFullYear(), moisDate.getMonth()+1, 1))}><Icon.Chevron width={14} height={14}/></button>
        </div>
        {mesDemandes.length === 0 ? <div className="ig-muted">Aucun extra ce mois-ci.</div> : (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {mesDemandes.map((x) => (
              <div key={x.id} style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',padding:'10px 0',borderTop:'1px solid var(--sand-2)'}}>
                <div style={{minWidth:180}}><b>{x.salariePrenom} {x.salarieNom}</b><br /><span className="ig-muted" style={{fontSize:12}}>{x.restoOrigine} · {x.poste} · {fmtDate(new Date(x.date+"T00:00:00"))}</span></div>
                <span className="ig-pill" style={{background: x.statut==='realisee' ? '#EAF3F3' : '#FCE5D6'}}>{x.statut === 'realisee' ? '✓ heures validées' : 'à valider'}</span>
                <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>voirDocument(x,'contrat')}>Voir le contrat</button>
                <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>voirDocument(x,'avenant')}>Voir l'avenant</button>
                {x.statut !== 'realisee' && (
                  <>
                    <input type="number" min="0" step="0.25" style={{width:90}} placeholder={x.heuresEstimees ? String(x.heuresEstimees) : "Heures"} value={heuresSaisie[x.id] ?? ""} onChange={(e)=>setHeuresSaisie({...heuresSaisie,[x.id]:e.target.value})} />
                    <button className="ig-btn ig-btn-sm" style={{background:'var(--sea)',color:'#fff'}} onClick={()=>validerHeures(x.id)}>Valider les heures</button>
                  </>
                )}
                {x.statut === 'realisee' && <span className="ig-muted" style={{fontSize:12}}>{x.heuresReelles}h · {fmtEuro(x.primeNet)} net</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {monEquipeAilleurs.length > 0 && (
        <div className="ig-card" style={{padding:'16px 20px',marginBottom:18}}>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:16,fontWeight:600,marginBottom:10}}>Salariés de {resto} en extra ailleurs</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {monEquipeAilleurs.map((x) => (
              <div key={x.id} style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',padding:'8px 0',borderTop:'1px solid var(--sand-2)',fontSize:13}}>
                <b>{x.salariePrenom} {x.salarieNom}</b><span className="ig-muted">→ {x.resto} · {fmtDate(new Date(x.date+"T00:00:00"))} · {x.statut === 'realisee' ? `${x.heuresReelles}h validées` : 'en attente des heures'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {superviseur && <VueGlobaleExtras />}

      {ajout && <AjoutExtraModal resto={resto} effectif={effectif} onValider={creerExtra} onClose={()=>setAjout(false)} />}
      {fiche && <FicheJuridiqueModal resto={resto} valeurs={etabsJ[resto]} onSave={enregistrerFiche} onClose={()=>setFiche(false)} />}
    </div>
  );
}
// ---------- Vue globale des extras (superviseur) : équivalent permanent du Google Sheet ----------
// Charge tout l'historique (tous mois confondus) et le garde consultable en direct dans l'appli,
// avec recherche/filtre, plutôt que de n'exposer qu'un export ponctuel du mois en cours.
function VueGlobaleExtras() {
  const [tout, setTout] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [filtreEtab, setFiltreEtab] = useState("");
  const [filtreMois, setFiltreMois] = useState("");

  useEffect(() => {
    let on = true;
    Extras.loadAll().then((l) => { if (on) setTout(l); });
    return () => { on = false; };
  }, []);

  if (tout === null) return <div className="ig-card" style={{padding:'16px 20px',marginBottom:18}}><div className="ig-muted">Chargement de l'historique complet…</div></div>;

  const etabs = Array.from(new Set(tout.map((x) => x.resto))).sort();
  const moisDisponibles = Array.from(new Set(tout.map((x) => cleMois(new Date(x.date + "T00:00:00"))))).sort().reverse();

  const q = normTxt(recherche);
  const filtres = tout.filter((x) => {
    if (filtreEtab && x.resto !== filtreEtab) return false;
    if (filtreMois && cleMois(new Date(x.date + "T00:00:00")) !== filtreMois) return false;
    if (q && !normTxt(`${x.salariePrenom} ${x.salarieNom} ${x.poste}`).includes(q)) return false;
    return true;
  });

  const totaux = filtres.reduce((acc, x) => {
    if (x.statut === "realisee") {
      acc.heures += Number(x.heuresReelles) || 0;
      acc.primeNet += x.primeNet || 0; acc.primeBrute += x.primeBrute || 0; acc.primeCoutTotal += x.primeCoutTotal || 0;
    }
    return acc;
  }, { heures: 0, primeNet: 0, primeBrute: 0, primeCoutTotal: 0 });

  return (
    <div className="ig-card" style={{padding:'16px 20px',marginBottom:18,borderColor:'var(--ink)'}}>
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontSize:16,fontWeight:600,marginBottom:10}}>Historique complet des extras — tous établissements, tous mois</div>
      <div className="ig-noprint" style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:12}}>
        <input value={recherche} onChange={(e)=>setRecherche(e.target.value)} placeholder="Rechercher un salarié / poste…" style={{minWidth:200}} />
        <select value={filtreEtab} onChange={(e)=>setFiltreEtab(e.target.value)}>
          <option value="">Tous les établissements</option>
          {etabs.map((r) => (<option key={r} value={r}>{r}</option>))}
        </select>
        <select value={filtreMois} onChange={(e)=>setFiltreMois(e.target.value)}>
          <option value="">Tous les mois</option>
          {moisDisponibles.map((m) => (<option key={m} value={m}>{m}</option>))}
        </select>
        <button className="ig-btn ig-btn-ghost" onClick={()=>exporterRecapExtras(filtres, filtreMois || "historique-complet", `Extras_${filtreMois || "historique-complet"}.xlsx`)}>⬇ Export (xlsx)</button>
      </div>
      <div className="ig-muted" style={{marginBottom:10,fontSize:13}}>
        {filtres.length} extra{filtres.length>1?'s':''} · {totaux.heures}h validées · {fmtEuro(totaux.primeNet)} net · {fmtEuro(totaux.primeBrute)} brut · {fmtEuro(totaux.primeCoutTotal)} coût total
      </div>
      {filtres.length === 0 ? <div className="ig-muted">Aucun extra ne correspond.</div> : (
        <div style={{overflowX:'auto',maxHeight:480,overflowY:'auto'}}>
          <table style={{width:'100%',fontSize:12.5,borderCollapse:'collapse'}}>
            <thead style={{position:'sticky',top:0,background:'var(--sand)'}}>
              <tr style={{textAlign:'left'}}>
                <th style={{padding:'6px 8px'}}>Date</th><th>Salarié</th><th>Poste</th><th>Origine</th><th>Destination</th><th>Statut</th><th>Heures</th><th>Prime Net</th><th>Prime Brute</th><th>Coût total</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((x) => (
                <tr key={x.id} style={{borderTop:'1px solid var(--sand-2)'}}>
                  <td style={{padding:'6px 8px'}}>{fmtDate(new Date(x.date+"T00:00:00"))}</td>
                  <td>{x.salariePrenom} {x.salarieNom}</td>
                  <td>{x.poste}</td>
                  <td>{x.restoOrigine}</td>
                  <td>{x.resto}</td>
                  <td>{x.statut === 'realisee' ? '✓ validé' : 'à valider'}</td>
                  <td>{x.statut === 'realisee' ? x.heuresReelles : (x.heuresEstimees ?? '—')}</td>
                  <td>{x.statut === 'realisee' ? fmtEuro(x.primeNet) : '—'}</td>
                  <td>{x.statut === 'realisee' ? fmtEuro(x.primeBrute) : '—'}</td>
                  <td>{x.statut === 'realisee' ? fmtEuro(x.primeCoutTotal) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
  const [importPreview, setImportPreview] = useState(null); // aperçu avant confirmation d'un import Excel
  const [importEnCours, setImportEnCours] = useState(false);
  const fileImportRef = useRef(null);
  const sem = cleSemaine(semDate);

  // Équipe effective : salariés du fichier + ajouts, moins ceux dont le contrat est terminé.
  const team = useMemo(() => {
    const base = EMPLOYEES.filter((e) => e.r === resto);
    const ajouts = roster.ajouts || [];
    const ajoutIds = new Set(ajouts.map((a) => idSalarie(a)));
    // Une fiche "ajoutée" a priorité sur la fiche du fichier de même identifiant
    // (permet de corriger ses heures / son poste sans créer de doublon).
    const tous = base.filter((e) => !ajoutIds.has(idSalarie(e))).concat(ajouts);
    const supprimes = new Set(roster.supprimes || []);
    return tous.filter((e) => {
      if (supprimes.has(idSalarie(e))) return false; // salarié du fichier supprimé après fin de contrat
      const fin = (roster.departs || {})[idSalarie(e)];
      // fin = date de fin de contrat (AAAA-MM-JJ). Visible tant que le lundi de la
      // semaine affichée est <= date de fin ; masqué pour les semaines entièrement après.
      return !fin || sem <= fin;
    });
  }, [resto, roster, sem]);

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
      // Nettoyage automatique (le lendemain de la fin de contrat ou après) :
      // - salariés AJOUTÉS : retirés de la liste des ajouts ;
      // - salariés du FICHIER : ajoutés à la liste des supprimés (le fichier n'est pas touché).
      // Dans les deux cas, l'historique des semaines passées est conservé.
      let rosterUtilise = rs || { ajouts: [], departs: {} };
      const aujourdHui = new Date().toISOString().slice(0, 10);
      const ajoutsR = rosterUtilise.ajouts || [];
      const departsR = rosterUtilise.departs || {};
      const supprimesR = rosterUtilise.supprimes || [];
      const idsAjoutes = new Set(ajoutsR.map((a) => idSalarie(a)));

      const finsPassees = Object.keys(departsR).filter((id) => aujourdHui > departsR[id]);
      if (finsPassees.length > 0) {
        const nouvDeparts = { ...departsR };
        const nouvSupprimes = [...supprimesR];
        let nouvAjouts = ajoutsR;
        finsPassees.forEach((id) => {
          delete nouvDeparts[id];
          if (idsAjoutes.has(id)) {
            nouvAjouts = nouvAjouts.filter((a) => idSalarie(a) !== id);
          } else if (!nouvSupprimes.includes(id)) {
            nouvSupprimes.push(id); // salarié du fichier : marqué supprimé
          }
        });
        rosterUtilise = { ...rosterUtilise, ajouts: nouvAjouts, departs: nouvDeparts, supprimes: nouvSupprimes };
        Store.set(kRoster(resto), rosterUtilise);
      }
      setRoster(rosterUtilise);
      setModele(md || null);
      setValide(!!vd);
      setLoading(false);
    });
    return () => { on = false; };
  }, [resto, sem]);

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
      const manquants = exporterCongesPayFit(lignes, nomFichier);
      montrerFlash(manquants.length > 0
        ? `Fichier téléchargé : ${MOIS_NOMS[mois-1]} ${annee}, ${lignes.length} ligne${lignes.length>1?'s':''}. ⚠ Identifiant PayFit introuvable pour : ${manquants.join(", ")} — à compléter à la main avant import.`
        : `Fichier téléchargé : ${MOIS_NOMS[mois-1]} ${annee}, ${lignes.length} ligne${lignes.length>1?'s':''} prête${lignes.length>1?'s':''} pour l'import PayFit.`);
    } finally {
      setExportEnCours(false);
    }
  }

  // Import d'un planning depuis un fichier Excel existant (format "PLANNING N" /
  // "PLANNING CUISINE N"). Analyse d'abord (aperçu, rien n'est écrit), puis confirmation
  // semaine par semaine avant d'écrire réellement dans la base.
  async function analyserImportPlanning(file) {
    setImportEnCours(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const semaines = {};
      wb.SheetNames.filter((n) => /^PLANNING/i.test(n)).forEach((n) => {
        const grille = feuilleEnGrille(wb.Sheets[n]);
        const res = parseSemaineDepuisFeuille(grille, resto, roster.ajouts || []);
        if (!res) return;
        if (!semaines[res.sem]) semaines[res.sem] = { sem: res.sem, lundi: res.lundi, entriesById: new Map(), nonReconnus: new Set(), approximatifs: new Set() };
        res.entries.forEach(({ emp, jours }) => {
          const id = idSalarie(emp);
          const cur = semaines[res.sem].entriesById.get(id) || { emp, jours: {} };
          semaines[res.sem].entriesById.set(id, { emp, jours: { ...cur.jours, ...jours } });
        });
        res.nonReconnus.forEach((n2) => semaines[res.sem].nonReconnus.add(n2));
        (res.approximatifs || []).forEach((n2) => semaines[res.sem].approximatifs.add(n2));
      });
      const liste = Object.values(semaines)
        .map((s) => ({ sem: s.sem, lundi: s.lundi, entries: [...s.entriesById.values()], nonReconnus: [...s.nonReconnus], approximatifs: [...s.approximatifs] }))
        .sort((a, b) => a.sem.localeCompare(b.sem));
      if (liste.length === 0) {
        montrerFlash("Aucune feuille \"PLANNING…\" avec une semaine reconnaissable n'a été trouvée dans ce fichier.");
      }
      setImportPreview({ liste, fichierNom: file.name });
    } catch (err) {
      montrerFlash("Impossible de lire ce fichier : " + err.message);
    } finally {
      setImportEnCours(false);
    }
  }
  async function confirmerImportSemaine(item) {
    const existant = (await Store.get(kPlanning(resto, item.sem))) || {};
    const next = { ...existant };
    item.entries.forEach(({ emp, jours }) => {
      const id = idSalarie(emp);
      next[id] = { ...(next[id] || {}), ...jours };
    });
    await Store.set(kPlanning(resto, item.sem), next);
    if (item.sem === sem) setPlanning(next);
    montrerFlash(`Semaine du ${fmtDate(item.lundi)} importée : ${item.entries.length} salarié${item.entries.length > 1 ? 's' : ''}.`);
    setImportPreview((cur) => cur ? { ...cur, liste: cur.liste.filter((x) => x.sem !== item.sem) } : cur);
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
    const ok = imprimerDocument(`Planning ${resto}`, corps, styles, `Planning_${slugKey(resto)}_${lundi.toISOString().slice(0,10)}`);
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
    const nouveau = { n: data.nom.trim().toUpperCase(), p: data.prenom.trim(), r: resto, po: data.poste.trim() || "—", u: data.unite, h: data.heures, _ajout: true };
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
          <button className={"ig-btn ig-btn-sm "+(vue==='extra'?'ig-btn-ink':'ig-btn-ghost')} onClick={()=>setVue('extra')}><Icon.User width={16} height={16}/> Extra</button>
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
            <button className="ig-btn ig-btn-ghost" onClick={()=>{ setModeSelect((v)=>!v); setSelection(new Set()); setConfirmLot(false); }} style={modeSelect?{borderColor:'var(--coral-d)',color:'var(--coral-d)'}:undefined}>🧹 {modeSelect?"Terminer le nettoyage":"Nettoyer l'effectif"}</button>
            <button className="ig-btn ig-btn-ghost" onClick={enregistrerModele} disabled={Object.keys(planning).length===0} title="Mémoriser les horaires de cette semaine comme modèle">★ Enregistrer comme modèle</button>
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
                <input ref={fileImportRef} type="file" accept=".xlsx" style={{display:'none'}} onChange={(e)=>{ const f=e.target.files[0]; if (f) analyserImportPlanning(f); e.target.value=""; }} />
                <button className="ig-btn ig-btn-ghost" onClick={()=>fileImportRef.current && fileImportRef.current.click()} disabled={importEnCours} title="Importer un planning existant au format PLANNING N / PLANNING CUISINE N (fichier Excel)">📥 {importEnCours ? "Analyse…" : "Importer un planning (Excel)"}</button>
              </>
            )}
            {valide ? (
              <button className="ig-btn ig-btn-ghost" onClick={devaliderPlanning} style={{borderColor:'var(--sea)',color:'var(--sea)'}}><Icon.Check/> Planning validé — repasser en préparation</button>
            ) : (
              <button className="ig-btn ig-btn-primary" onClick={validerPlanning} disabled={Object.keys(planning).length===0} style={{background:'var(--sea)'}}><Icon.Check/> Valider le planning</button>
            )}
          </div>
          {importPreview && (
            <div className="ig-noprint ig-card" style={{padding:'16px 20px',marginBottom:14}}>
              <div style={{fontWeight:700,marginBottom:10}}>Aperçu de l'import — {importPreview.fichierNom}</div>
              {importPreview.liste.length === 0 ? (
                <div className="ig-muted">Rien à importer dans ce fichier (voir le message ci-dessus).</div>
              ) : importPreview.liste.map((item) => (
                <div key={item.sem} style={{border:'1.5px solid var(--line)',borderRadius:12,padding:'12px 14px',marginBottom:10}}>
                  <div style={{fontWeight:600,marginBottom:6}}>Semaine du {fmtDate(item.lundi)} au {fmtDate(ajouterJours(item.lundi,6))}</div>
                  <div className="ig-muted" style={{marginBottom:8}}>{item.entries.length} salarié{item.entries.length>1?'s':''} reconnu{item.entries.length>1?'s':''} et prêt{item.entries.length>1?'s':''} à importer.</div>
                  {item.nonReconnus.length > 0 && (
                    <div style={{color:'var(--coral-d)',fontSize:13,marginBottom:8}}>⚠ Non reconnu{item.nonReconnus.length>1?'s':''} dans l'effectif de {resto} : {item.nonReconnus.join(", ")}</div>
                  )}
                  {item.approximatifs.length > 0 && (
                    <div style={{color:'#9A4A1B',fontSize:13,marginBottom:8}}>≈ Reconnu{item.approximatifs.length>1?'s':''} par approximation (à vérifier) : {item.approximatifs.join(" · ")}</div>
                  )}
                  <div style={{display:'flex',gap:8}}>
                    <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setImportPreview((cur)=>cur ? {...cur, liste: cur.liste.filter((x)=>x.sem!==item.sem)} : cur)}>Ignorer cette semaine</button>
                    <button className="ig-btn ig-btn-sm" style={{background:'var(--sea)',color:'#fff'}} disabled={item.entries.length===0} onClick={()=>confirmerImportSemaine(item)}>Confirmer l'import de cette semaine</button>
                  </div>
                </div>
              ))}
              <button className="ig-btn ig-btn-ghost ig-btn-sm" onClick={()=>setImportPreview(null)}>Fermer l'aperçu</button>
            </div>
          )}
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

      {vue === "extra" && <ExtraTab resto={resto} superviseur={superviseur} />}

      {edit && (
        <EditModal
          jour={edit.jour}
          jourLabel={JOURS[edit.jour]}
          emp={edit.emp}
          p={(planning[idSalarie(edit.emp)] && planning[idSalarie(edit.emp)][edit.jour]) || {statut:STATUTS.TRAVAIL,debut:"09:00",fin:"17:00",pause:1}}
          onSave={(data)=>saveCell(edit.emp, edit.jour, data)}
          onClose={()=>setEdit(null)}
        />
      )}

      {gestion && (() => {
        const finGestion = (roster.departs || {})[idSalarie(gestion)];
        const aujourdHui = new Date().toISOString().slice(0, 10);
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
          onClose={()=>setGestion(null)}
        />
        );
      })()}

      {ajout && (
        <AjoutModal resto={resto} onAjouter={ajouterSalarie} onClose={()=>setAjout(false)} />
      )}
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
function RestoPicker({ restaurants, onPick, onAdd }) {
  const [form, setForm] = useState(false);
  const [nom, setNom] = useState("");
  const [err, setErr] = useState("");
  const [counts, setCounts] = useState({}); // effectif RÉEL par restaurant (fiches + ajouts − retirés)

  useEffect(() => {
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
      setCounts(res);
    });
    return () => { on = false; };
  }, [restaurants]);

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
        {restaurants.map((r) => (
          <button key={r} className="ig-resto" onClick={() => onPick(r)}>
            <div>
              <div className="nm">{r}</div>
              <div className="ct">{counts[r] != null ? counts[r] : EMPLOYEES.filter((e)=>e.r===r).length} salariés</div>
            </div>
            <Icon.Chevron />
          </button>
        ))}
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
      const aujourdHui = new Date().toISOString().slice(0, 10);
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

// ---------- Application principale ----------
export default function App() {
  const [role, setRole] = useState(null);     // 'manager' | 'salarie'
  const [askCode, setAskCode] = useState(false);
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

  function reset() { setRole(null); setAskCode(false); setResto(null); setEmp(null); }
  async function deconnexion() {
    await supabase.auth.signOut();
    localStorage.removeItem("ig_superviseur");
    setSuperviseur(false);
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
  } else if (!role) {
    content = (
      <div className="ig-hero" style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',paddingTop:40}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:36}}>
          <svg width="84" height="84" viewBox="0 0 64 64" aria-label="Indie Group">
            <rect width="64" height="64" rx="14" fill="#111111"/>
            <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontFamily="'Inter',system-ui,sans-serif" fontWeight="800" fontSize="31" letterSpacing="-1.5" fill="#ffffff">IG</text>
          </svg>
          <div style={{fontFamily:"'Inter',system-ui,sans-serif",fontWeight:700,fontSize:30,letterSpacing:'-.5px'}}>Indie Group</div>
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
        </div>
      </div>
    );
  } else if (role === "manager" && !resto) {
    content = <RestoPicker restaurants={restaurants} onPick={setResto} onAdd={ajouterEtablissement} />;
  } else if (role === "manager") {
    content = <ManagerView resto={resto} onBack={()=>setResto(null)} superviseur={superviseur} />;
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
            🌊 Indie Group
            <small>Plannings</small>
          </button>
          {role && (
            <div className="ig-tag">
              <span className="ig-pill">{role==='manager'?<Icon.Shield width={15} height={15}/>:<Icon.User width={15} height={15}/>}{role==='manager'?'Manager':'Salarié'}</span>
              {resto && <span className="ig-pill">{resto}</span>}
              {role==='manager' && (
                <button onClick={deconnexion} style={{background:'rgba(243,236,224,.12)',color:'var(--sand)',border:'none',padding:'6px 12px',borderRadius:999,cursor:'pointer',fontSize:13,fontFamily:'Inter',fontWeight:600}}>Déconnexion</button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="ig-wrap" style={{paddingTop:24,paddingBottom:60}}>
        {content}
      </div>
    </div>
  );
}
