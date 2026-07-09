import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

const EMPLOYEES = [{"n":"HASMI","p":"Yacine","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ABOU","p":"Ismail","r":"PABLO","po":"Plongeur","u":"CUISINE","h":35},{"n":"FERRAND","p":"Anthony","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":44},{"n":"DORSO","p":"Marie-Cécile","r":"INDIE BEACH","po":"Directeur","u":"SALLE","h":35},{"n":"DUFOUR","p":"Alexandre","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"FROMMHERZ","p":"Tristan","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"RIET","p":"Antoine","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":39},{"n":"ID HADDOUCH","p":"Réda","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":35},{"n":"RIBE","p":"Oceane","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"GUILLET","p":"Valentin","r":"PABLO","po":"Runner","u":"SALLE","h":35},{"n":"THOMAS","p":"Lou","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CARDONA DE MARINIS","p":"Camille","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BERNARD","p":"Camille","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BALLUET","p":"Arthur","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":35},{"n":"LOPIS","p":"Adrien","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":35},{"n":"HORVILLE","p":"Brice","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ANDRE","p":"Lisa","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Vestiaire","u":"SALLE","h":39},{"n":"IBANEZ","p":"Guilhem","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"LEBARILLIER","p":"Juliette","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":35},{"n":"SANTINI","p":"Yael","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"INZOUDINE","p":"Chaher","r":"CAFE FLORA","po":"Commis de Cuisine","u":"CUISINE","h":35},{"n":"LAROMIGUIÈRE","p":"Pierre-Alexandre","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":35},{"n":"ROBIN","p":"Lou","r":"CAFE FLORA","po":"COMMIS DE SALLE","u":"SALLE","h":35},{"n":"ROY","p":"Maiwen","r":"CAFE FLORA","po":"Runner","u":"SALLE","h":35},{"n":"BILLARD","p":"Thibault","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"BRAULT","p":"Nicolas","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"MANGER MONTALS","p":"Humberto","r":"CAFE DE L ORMEAU","po":"chef de cuisine","u":"CUISINE","h":42},{"n":"DE PADOVA","p":"Marcio","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LANCON","p":"Romain","r":"INDIE GROUP BUREAU","po":"Directeur","u":"SALLE","h":35},{"n":"BILLERY","p":"Éléonore","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"GARCIA","p":"Florian","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BEAUFRERE","p":"Herman","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"INNELLA","p":"Camila","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"CANTERA MORALES","p":"Magaly","r":"INDIE BEACH","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"AIRO","p":"Andrea","r":"INDIE BEACH","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"ANGLES","p":"Louis","r":"INDIE BEACH","po":"Chef Plagiste","u":"SALLE","h":42},{"n":"BELL","p":"Nathan","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":42},{"n":"BONNEVIE","p":"Cynthia","r":"INDIE BEACH","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"DUPON","p":"Romain","r":"INDIE BEACH","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"DAOUPHARS","p":"Mathieu","r":"INDIE BEACH","po":"Chef de Bar","u":"SALLE","h":42},{"n":"MSAHAZI","p":"Ousseine","r":"CAFE DE L ORMEAU","po":"Commis de Cuisine","u":"CUISINE","h":39},{"n":"SOULAIMANA","p":"Said","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"COMBEAU","p":"Vincent","r":"INDIE BEACH","po":"Chef de Bar","u":"SALLE","h":42},{"n":"DIAFAT","p":"Selim","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BOUAZZA","p":"Sâra","r":"PABLO","po":"Hotesse","u":"SALLE","h":42},{"n":"HANTZ","p":"Loane","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":35},{"n":"DOUX","p":"Clemence","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":42},{"n":"GRANET","p":"Romain","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"MACCHINI","p":"David","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":42},{"n":"BENICHOU","p":"Marine","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BIGORGNE","p":"Adrien","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":35},{"n":"GUELI","p":"Estefanía","r":"PABLO","po":"Patissier","u":"CUISINE","h":42},{"n":"KOSCIAREK","p":"Nicolas","r":"INDIE BEACH","po":"Manager","u":"SALLE","h":42},{"n":"PANES","p":"Stanislas","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"PORRE","p":"Lorin","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"CUARTERO","p":"Emmanuel","r":"PABLO","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"ANTUNES","p":"Léna","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"BOGLIETTI","p":"Mercedes","r":"CAFE FLORA","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"DUFOUR","p":"Nicolas","r":"CAFE FLORA","po":"Chef de Cuisine","u":"CUISINE","h":44},{"n":"GONZALEZ CARO","p":"Francisco","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"LILLOUX","p":"Matuanui","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":44},{"n":"SARKADI","p":"Zoltánné","r":"CAFE FLORA","po":"Plongeur","u":"CUISINE","h":44},{"n":"TERNES","p":"Camilla","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CARNEIRO","p":"Mélinda","r":"PABLO","po":"Directeur","u":"SALLE","h":35},{"n":"NEVES","p":"Jessica","r":"PABLO","po":"Manager","u":"SALLE","h":42},{"n":"FAZIO","p":"Luca","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ROUX","p":"Ange","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"THERY","p":"Elias","r":"INDIE BEACH","po":"Officier","u":"SALLE","h":42},{"n":"DUPERTHUY","p":"Jean","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"ATHOUMANI","p":"Azali","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"RIVET","p":"Maurine","r":"PLAYAMIGOS","po":"Directeur","u":"SALLE","h":42},{"n":"SOULAT","p":"Geoffrey","r":"PLAYAMIGOS","po":"Chef Plagiste","u":"SALLE","h":42},{"n":"DENIS","p":"Adrian","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"MONNIER","p":"Sebastien","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LEVY","p":"Corinne","r":"CAFE FLORA","po":"Directeur","u":"SALLE","h":44},{"n":"VALEMBOIS","p":"Ange","r":"PABLO","po":"Chef de Bar","u":"SALLE","h":42},{"n":"LE TOUX","p":"Aéla","r":"INDIE BEACH","po":"CONSEILLERE EN VENTE","u":"SALLE","h":35},{"n":"NIBEAUDEAU","p":"Solenne","r":"INDIE BEACH","po":"autres","u":"SALLE","h":35},{"n":"BENAT","p":"Alexia","r":"INDIE BEACH","po":"Caissière","u":"SALLE","h":42},{"n":"JEAN PIERRE","p":"Maëlle","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LEAL OSORIO","p":"Jesus Enrique","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LAURENT","p":"Margaux","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":42},{"n":"ABOUBACAR","p":"Kassim Mrenda","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"CALTAGIRONE","p":"Clement","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MARTINEZ VASQUEZ","p":"Francisco Leonel","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"VILLEDIEU","p":"Romane","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"CELIA","p":"Federico","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DUARTE","p":"Dwayne Lloyd","r":"PABLO","po":"Officier","u":"SALLE","h":42},{"n":"KOKA","p":"Victoria","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DENIS","p":"Alexis","r":"PABLO","po":"Barman","u":"SALLE","h":42},{"n":"DUFOUR","p":"Maxence","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"BELHADJ","p":"Adil","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"VILLARINI","p":"Julien","r":"CAFE FLORA","po":"pizzaiolo","u":"CUISINE","h":44},{"n":"KOGLER","p":"Theo","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LLOBERES","p":"Manon","r":"PABLO","po":"Barman","u":"SALLE","h":42},{"n":"ROUSSEL","p":"Fabien","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LANNOY","p":"Aurélien","r":"PLAYAMIGOS","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"ATTOUMANI","p":"Dilane","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":39},{"n":"SALAS","p":"Mickaël","r":"PLAYAMIGOS","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"BARRAGAN","p":"Paola","r":"PLAYAMIGOS","po":"Chef de Bar","u":"SALLE","h":42},{"n":"MALLEK","p":"Hadj","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"RADJABOU","p":"Soule","r":"PLAYAMIGOS","po":"Plongeur","u":"CUISINE","h":42},{"n":"FERRAH","p":"Claire","r":"PLAYAMIGOS","po":"Manager","u":"SALLE","h":42},{"n":"POLO","p":"Jean-Baptiste","r":"CAFE DE L ORMEAU","po":"Manager","u":"SALLE","h":42},{"n":"BAROUDI","p":"Mehdi Charles","r":"INDIE BEACH","po":"autres","u":"SALLE","h":42},{"n":"BENHADJ","p":"Kamil","r":"INDIE BEACH","po":"Agent Entretien","u":"SALLE","h":39},{"n":"LEGENDRE","p":"Sacha","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LOUSSOUARN","p":"Ahès","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":42},{"n":"RASZKOWSKI","p":"Noah","r":"PABLO","po":"Runner","u":"SALLE","h":42},{"n":"LASCHUCK","p":"Ahirton","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"GOMEZ","p":"Cristian","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MOLANO RIOS","p":"Leslie Tatiana","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":42},{"n":"LE BORGNE","p":"Maxime","r":"PABLO","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"SAID","p":"Faielledine Ben","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"BIANCHI","p":"Augusto","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"SANTONI","p":"Agathe","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DUMAS PELLECHIA","p":"Quentin","r":"PABLO","po":"Public Relation","u":"SALLE","h":24},{"n":"GNEBEHI","p":"Maellie","r":"PABLO","po":"Hotesse","u":"SALLE","h":42},{"n":"TRAMBAUD","p":"Maxence","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"GIRARD","p":"Alexis","r":"CAFE FLORA","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"CORBET","p":"Kathleen","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CHARLOT","p":"Alexandre","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"MOREL","p":"Sébastien","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BOCABEILLE","p":"Ilona","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"AMODIO","p":"Francesco Paolo","r":"CHERRY","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"RICCARDI","p":"Vito","r":"CHERRY","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"CARRILLO RAMIREZ","p":"Victor Hugo","r":"LA SAUVAGEONNE","po":"Chef de Cuisine","u":"CUISINE","h":35},{"n":"GALIONE","p":"Giusepe","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"GALIONE","p":"Gennaro","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BENECKO","p":"Alin","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DUJARDIN","p":"Maxime","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"MULLER","p":"Cyril","r":"LA SAUVAGEONNE","po":"Chef de Cuisine","u":"CUISINE","h":44},{"n":"SARRAT","p":"Paola","r":"CHERRY","po":"Directeur","u":"SALLE","h":42},{"n":"STRACH","p":"Sarah","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"ALI MOUSSA","p":"Anziz Habib","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":42},{"n":"GOUX","p":"Fabien","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LE PORZE","p":"Nathan","r":"CHERRY","po":"Chef de Bar","u":"SALLE","h":42},{"n":"BLANC","p":"Thomas","r":"LA SAUVAGEONNE","po":"Manager","u":"SALLE","h":44},{"n":"VERNAT","p":"Guillaume","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":39},{"n":"DERRARIDJ","p":"Fabien","r":"CAFE FLORA","po":"pizzaiolo","u":"CUISINE","h":44},{"n":"HIRET","p":"Salomé","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":35},{"n":"MORELLO","p":"Lenny","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":42},{"n":"SOTO MUNOZ","p":"Lliuvashka","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"PESTY","p":"Heloise","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"MALO","p":"Julien","r":"CAFE DE L ORMEAU","po":"Chef de Bar","u":"SALLE","h":39},{"n":"BRANDO RUBIANO","p":"Maria Camila","r":"PLAYAMIGOS","po":"Patissier","u":"CUISINE","h":42},{"n":"HELLER","p":"Emma","r":"CHERRY","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"MANENT","p":"Maëna","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"GUEMBOU","p":"Gwenaëlle","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"KAYA","p":"Axel","r":"LA SAUVAGEONNE","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"TANG","p":"Chhunhay","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"VIRET","p":"Kevin","r":"INDIE BEACH","po":"Manager","u":"SALLE","h":42},{"n":"BOULAY","p":"Ariane","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"FERNANDEZ GOMEZ","p":"Agustin","r":"INDIE BEACH","po":"Commis de cuisine","u":"CUISINE","h":42},{"n":"SEIBANE","p":"Silvana","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BOEUF","p":"Etienne","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DESMEDT","p":"Guillaume","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"FABRE","p":"Mathis","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"IBRAHIMA","p":"Zidani","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":39},{"n":"MOUIGNI","p":"Kassim","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":42},{"n":"ANESSI","p":"Abel","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"LAMY","p":"Hugo","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"ORIGET","p":"Anais","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":44},{"n":"ROUDERGUES","p":"Cezanne","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":39},{"n":"PROCHASSON","p":"Maelle","r":"LA SAUVAGEONNE","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"SOMNARD","p":"Thomas","r":"PABLO","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LESELLIER","p":"Marine","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":42},{"n":"BOMSEL","p":"Charles-Elie","r":"LA SAUVAGEONNE","po":"Sommelier","u":"SALLE","h":35},{"n":"CHIQUET","p":"Manon","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":42},{"n":"BENOIT","p":"Joffrey","r":"PLAYAMIGOS","po":"Commis de Bar","u":"SALLE","h":35},{"n":"DE VINCENTI MENNA","p":"Franco","r":"INDIE BEACH","po":"Demi chef de partie","u":"CUISINE","h":42},{"n":"AVILEZ SANTANA","p":"Oscar","r":"INDIE GROUP BUREAU","po":"CHEF EXECUTIF","u":"CUISINE","h":35},{"n":"DHIB","p":"Kheira","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"MOUZON","p":"Justin","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":42},{"n":"COLLINET","p":"Sarah Marie","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CAILLOL","p":"Margot","r":"CHERRY","po":"Barman","u":"SALLE","h":42},{"n":"LUFTMAN","p":"Louis","r":"INDIE GROUP BUREAU","po":"RESPONSABLE MARKETING","u":"SALLE","h":39},{"n":"BAKAR","p":"Yanisse","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BARNA","p":"Yan","r":"INDIE BEACH","po":"Demi Chef de Partie","u":"CUISINE","h":42},{"n":"TCHOUPE","p":"Lenny","r":"INDIE BEACH","po":"autres","u":"CUISINE","h":42},{"n":"VILLAMOR","p":"Victor","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"KHERRAZ","p":"Mohamed","r":"CHERRY","po":"Runner","u":"SALLE","h":39},{"n":"LELUAN","p":"Leïla","r":"LA SAUVAGEONNE","po":"Patissier","u":"CUISINE","h":44},{"n":"MAILLARD","p":"Jules","r":"INDIE BEACH","po":"Commis de Bar","u":"SALLE","h":42},{"n":"LE TRIONNAIRE","p":"Leo","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":39},{"n":"GOBIN","p":"Mathis","r":"INDIE BEACH","po":"Sommelier","u":"SALLE","h":42},{"n":"NGUYEN","p":"Lou","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"DO ROSARIO","p":"Franco","r":"INDIE BEACH","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"COURIAUD","p":"Yanis","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CARVIN","p":"Sofiane","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"RAMIREZ PLATA","p":"Franyuly Maritza","r":"PABLO","po":"Patissier","u":"CUISINE","h":42},{"n":"FRANCO MENDES","p":"Tiago","r":"INDIE BEACH","po":"Commis de Bar","u":"SALLE","h":39},{"n":"MIQUEL","p":"Ornella","r":"CAFE FLORA","po":"Commis de Salle","u":"SALLE","h":35},{"n":"RENAUX","p":"Tom","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CELESTINE","p":"Adrien","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":35},{"n":"PERADEL","p":"Nathan","r":"CAFE DE L ORMEAU","po":"Sommelier","u":"SALLE","h":35},{"n":"BOURGOIS","p":"Gael","r":"INDIE BEACH","po":"Directeur","u":"SALLE","h":42},{"n":"BALBI SABARROS","p":"Noelia","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":42},{"n":"DABOVE LÓPEZ","p":"Gaston","r":"INDIE BEACH","po":"Chef de Cuisine","u":"CUISINE","h":44},{"n":"GRANDVOINET","p":"Gilles","r":"CAFE DE L ORMEAU","po":"Chef de Cuisine","u":"CUISINE","h":35},{"n":"RALLO","p":"Alexandre","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":42},{"n":"ELSENSOHN","p":"Jade","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":42},{"n":"BAL","p":"Sébastien","r":"PLAYAMIGOS","po":"Officier","u":"SALLE","h":35},{"n":"TERMELLIL","p":"Tarek","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":44},{"n":"BIRD","p":"Kelly","r":"INDIE BEACH","po":"Conseillère de vente","u":"SALLE","h":35},{"n":"KHENOUCHE","p":"Ademe","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"PEZZULLI","p":"Gianni","r":"PABLO","po":"Commis de Salle","u":"SALLE","h":42},{"n":"BONEVIE","p":"Cynthia","r":"INDIE BEACH","po":"Chef Hotesse","u":"SALLE","h":44},{"n":"TITEUX","p":"Dylan","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"HARDUIN","p":"Romane","r":"PLAYAMIGOS","po":"Hotesse","u":"SALLE","h":42},{"n":"NEVES","p":"Marie","r":"INDIE BEACH","po":"Caissière","u":"SALLE","h":44},{"n":"ACHIKIAN","p":"Justine","r":"PLAYAMIGOS","po":"Manager","u":"SALLE","h":44},{"n":"ICHAMBE","p":"Marie","r":"CAFE DE L ORMEAU","po":"Manager","u":"SALLE","h":44},{"n":"RIVIERE","p":"Aurelien","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":39},{"n":"JULIEN","p":"Lucas","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"BOUZNAD","p":"Hamza","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"DE VASCONCELOS","p":"Margot","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":35},{"n":"MARTIN","p":"Thibaut","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"PETRUCHELLI","p":"Philippe","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"POLO","p":"Jean Baptiste","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"DENURA","p":"Frédéric","r":"PLAYAMIGOS","po":"Chef de Bar","u":"SALLE","h":44},{"n":"PASQUINI","p":"Noah","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LAQUET","p":"Alexis","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"CHICHE","p":"Benjamin","r":"CHERRY","po":"Directeur","u":"SALLE","h":35},{"n":"BORDJIBA","p":"Abdelkarim","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"CAPPODANNO","p":"Lisa","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":39},{"n":"NASSERDINE","p":"Ahamed","r":"LA SAUVAGEONNE","po":"Plongeur","u":"CUISINE","h":39},{"n":"QUENET","p":"Lisa","r":"INDIE GROUP BUREAU","po":"assitante administrative","u":"SALLE","h":44},{"n":"PALOMO DEL RIO","p":"Serge","r":"CHERRY","po":"chef de bar","u":"SALLE","h":42},{"n":"BEY","p":"Hugo","r":"CHERRY","po":"Manager","u":"SALLE","h":42},{"n":"EL KENOUNI BOUSBAA","p":"Soumia","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"MAHAMADOU","p":"Bathily","r":"CHERRY","po":"commis de salle","u":"SALLE","h":42},{"n":"GOSALBES","p":"Lauriane","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ZANCHI","p":"Magali Luz","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CHOUCHANE","p":"Mathis","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":35},{"n":"SELOUANE","p":"Aissa","r":"CHERRY","po":"Runner","u":"SALLE","h":42},{"n":"OLAZ","p":"Johana Nerea Eugenia","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"GODET DES MARAIS","p":"Marine","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"SOUMARE","p":"Yaya","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":35},{"n":"TCHAKO","p":"Aissata","r":"CHERRY","po":"Hotesse","u":"SALLE","h":42},{"n":"GUILLEMIN","p":"Oscar","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ABOUMADI","p":"Mohamed","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"DIALLO","p":"Moussa","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":35},{"n":"RODRÍGUEZ ALARCON","p":"Felipe Andres","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MORENO LOPEZ","p":"Ricardo Israel","r":"CHERRY","po":"Commis de Cuisine","u":"CUISINE","h":35},{"n":"MAUREIRA CHANDÍA","p":"Sebastián Nickolas","r":"CHERRY","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"AZZARA","p":"Sofia","r":"CHERRY","po":"cheffe hotesse","u":"SALLE","h":42},{"n":"MISSONSA","p":"Rohann","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"LASSALLE","p":"Benoit","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"COLIN","p":"Jeremie","r":"CHERRY","po":"Chef de Bar","u":"SALLE","h":42},{"n":"COURTHIEU","p":"Gregoire","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"OUAKKA","p":"Ihsan","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BERTIN","p":"Julie","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":39},{"n":"GARAVAGLIA","p":"Alessandro","r":"PABLO SAINT BARTH","po":"Sommelier","u":"SALLE","h":42},{"n":"HEBRARD","p":"Florian","r":"PABLO SAINT BARTH","po":"Manager","u":"SALLE","h":42},{"n":"REYES","p":"Prince-Zyrose","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"MARCEL","p":"Julien","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BRISBOUT","p":"Thomas","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"CUXAC","p":"Daniel","r":"PABLO SAINT BARTH","po":"Chef de Bar","u":"SALLE","h":42},{"n":"CESPITES","p":"Benjamin","r":"PABLO SAINT BARTH","po":"Chef de partie","u":"CUISINE","h":42},{"n":"MOLINIER","p":"Alexandre","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BEAL","p":"Faustine","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"PANIZZA STAIANO","p":"Facundo Alejo","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DAVIS","p":"Carmen Luisa","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":42},{"n":"MATHIEU","p":"Paul","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"TROIANO PALUMBO","p":"Naomi","r":"PABLO SAINT BARTH","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"KAPELA","p":"Adonis","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"VINCENT","p":"Margot","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":42},{"n":"SUD","p":"Gabin","r":"PABLO SAINT BARTH","po":"Runner","u":"SALLE","h":35},{"n":"OPALA","p":"Romain","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BADACHE","p":"Sophian","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"REY","p":"Benjamin","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef de Bar","u":"SALLE","h":42},{"n":"IDRISSI","p":"Khalid","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CARVAJAL MOLANO","p":"Elides","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"BOCHARD","p":"Marsile","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CRAPOULET","p":"Marine","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LEGER","p":"Ella","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"BASTERRICA","p":"Camila Aylen","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BERNAT","p":"Emma","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BONAVENTURE","p":"Margaux","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"FERNANDEZ","p":"Noah","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Runner","u":"SALLE","h":39},{"n":"LANGLOIS","p":"Arthur","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Commis de Salle","u":"SALLE","h":39},{"n":"ZOFFOLI","p":"Carla","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Commis de Salle","u":"SALLE","h":39},{"n":"BARBERO DE LUCAS","p":"Manuel","r":"PABLO SAINT BARTH","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"LEPORI","p":"Gianluca","r":"PABLO SAINT BARTH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"CESAIRE","p":"Joris","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BELLEVUE","p":"Bervirson","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BERNARDINI","p":"Theo","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"COQUILLAS","p":"Randy","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"PAMBOU","p":"Kimberley","r":"CHERRY","po":"Hotesse","u":"SALLE","h":42},{"n":"HENRY","p":"Ricardo","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"REGNAULD","p":"Pacome","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":44},{"n":"NADHOIM","p":"Youssouf","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"JUAN ALBERTO","p":"Rincón Paez","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"FORTILLIEN PEDRO","p":"Maria","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"SAHOUI","p":"Julian","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"SAID","p":"Ibrahim","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":39},{"n":"DESESSARD","p":"Alexis","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"DEVIANNE","p":"Raphael","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BRANDO","p":"Maria Camila","r":"PLAYAMIGOS","po":"Patissier","u":"CUISINE","h":44},{"n":"SCHWARTZ","p":"Adryan","r":"CAFE DE L ORMEAU","po":"Commis de Cuisine","u":"CUISINE","h":39},{"n":"GAËL","p":"Martin","r":"INDIE GROUP BUREAU","po":"autres","u":"SALLE","h":35},{"n":"LEBARRILIER","p":"Juliette","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":39},{"n":"CARRIER","p":"Jules","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":35},{"n":"SANTAMARIA","p":"Nolan","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"ALEM","p":"Elyes","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":39},{"n":"HERRERO","p":"Allison","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MEROLLE","p":"Sophie","r":"CAT CLUB","po":"Chef de Rang","u":"SALLE","h":42},{"n":"TELMAT","p":"Marine","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BEGUIN","p":"Antoine","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"QUD","p":"Gabin","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"ST PAUL","p":"Guilhem","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"REYTINAT-HARDOUIN","p":"Alice","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BARTHELEMY","p":"Anaïs","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"NYANG","p":"Ebrima","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"NKOLO","p":"Theodore","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"CHARLES","p":"Alexis","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":42},{"n":"LABUNETS","p":"Anatolii","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Runner","u":"SALLE","h":35},{"n":"SELLAM","p":"Alexis","r":"CAT CLUB","po":"Officier","u":"SALLE","h":42},{"n":"SORRESSO","p":"Davide","r":"PABLO SAINT BARTH","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"POLANCO","p":"Roberto","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"COMBE","p":"Baptiste","r":"LA SAUVAGEONNE","po":"Runner","u":"SALLE","h":35},{"n":"ADAM","p":"Paul","r":"CAT CLUB","po":"Commis de Bar","u":"SALLE","h":35},{"n":"LEGOUVERNEUR","p":"Tommy","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"ROMAIN","p":"Panabieres","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"SAFFIOTI","p":"Gianni","r":"CAT CLUB","po":"Chef de Rang","u":"SALLE","h":35},{"n":"VAN MOE","p":"Andrea","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"POLANCO PALMA","p":"Celina","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"LAFRANCE","p":"Guillaume","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"GARCIA MENDOZA","p":"Miguel Angel","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"DOERN","p":"Léa","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"ARAUJO","p":"Audrey","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":39},{"n":"ARANDELOVIC","p":"Sasa","r":"CHERRY","po":"Chef de Cuisine","u":"CUISINE","h":42},{"n":"PROST","p":"Matthieu","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"NUSSBAUM","p":"Samuel","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"GESMUNDO","p":"Francesca","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"DURST","p":"Lilou","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"THOMAS","p":"Sarah","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Sommelier","u":"SALLE","h":39},{"n":"BISSOLY","p":"Jordan","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"WANN","p":"Zenab","r":"CHERRY","po":"Sommelier","u":"SALLE","h":42},{"n":"BEGUIN","p":"Naïs","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"RAKOTOSAONA","p":"Fitia","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"ROMANO","p":"Mattia","r":"CHERRY","po":"Second de Cuisine","u":"CUISINE","h":42},{"n":"FOGTMAN","p":"Ayrton","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":44},{"n":"DABOVE LÓPEZ","p":"Gastón","r":"INDIE GROUP BUREAU","po":"Chef de Cuisine","u":"CUISINE","h":35},{"n":"ZAGHDOUD","p":"Mourad","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"NDIAYE","p":"Hamidou","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":39},{"n":"SOMAN","p":"Saha","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"GODARD","p":"Andy","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"BENEDETTI","p":"Aurelia","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LOUGASSI","p":"Mano","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":44},{"n":"MOREL","p":"Sebastien","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":44},{"n":"ROTA","p":"Anthony","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"FRANGEUL","p":"Lea","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"FRIH","p":"Majid","r":"INDIE BEACH","po":"Officier","u":"SALLE","h":44},{"n":"FLESCHEN","p":"Zoé","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"GAITAN","p":"Santiago","r":"CAFE FLORA","po":"Cuisinier","u":"CUISINE","h":42},{"n":"MENDEZ","p":"Yojan Alexander","r":"CHERRY","po":"Patissier","u":"CUISINE","h":42},{"n":"GAUCHAT","p":"Claudia","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"COSTANZA","p":"Paul","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"ROSSO UGO","p":"Sacha","r":"PLAYAMIGOS","po":"Commis de Bar","u":"SALLE","h":39},{"n":"LUNT","p":"Malachi","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":44},{"n":"DERVIEAU CAPELLE","p":"Margot","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":39},{"n":"BERNARD","p":"Angelys","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":44},{"n":"AUGUSTE","p":"Lukas","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"LAMBERTI","p":"Tom Pablo César","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"COMPAIN","p":"Ludovic","r":"CAFE FLORA","po":"Barman","u":"SALLE","h":39},{"n":"GHIRINGHELLI","p":"Joaquin","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"PETKOVIC","p":"Milosav","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"CORNILLON","p":"Victor","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"LAMBERTON","p":"Robinson","r":"PLAYAMIGOS","po":"Officier","u":"SALLE","h":39},{"n":"MUTEL","p":"Hugo","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":44},{"n":"HOUCINI","p":"Yanis","r":"INDIE GROUP BUREAU","po":"CONTROLE DE GESTION","u":"BUREAU","h":42},{"n":"EVRAD","p":"Clara","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"KERANGUYADER","p":"Thomas","r":"CAFE FLORA","po":"Manager","u":"SALLE","h":42},{"n":"LOMBARDI","p":"Cloe","r":"CAFE FLORA","po":"Manager","u":"SALLE","h":42},{"n":"LEBARRILLIER","p":"Juliette","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":44},{"n":"RIVIERE","p":"Jules","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"PERES","p":"Guillaume","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"TROIN","p":"Agathe","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":39},{"n":"SANCHEZ-PASTOR AYLLON","p":"Victoria Qianlu","r":"CHERRY","po":"Commis de Cuisine","u":"CUISINE","h":42},{"n":"BOULASSEL","p":"Abdelfettah","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"REVERTE","p":"Jordan","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":44},{"n":"ORLA","p":"Lily-Rose","r":"PLAYAMIGOS","po":"Commis de Salle","u":"SALLE","h":44},{"n":"GOMEZ MONTES","p":"Maria Del Pilar","r":"CAFE DE L ORMEAU","po":"Patissier","u":"CUISINE","h":42},{"n":"GHARSALLAH","p":"Adem","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":42},{"n":"AMON","p":"Eloge Ferdinand","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"REDER","p":"Jean Charles","r":"PLAYAMIGOS","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"ROSANO","p":"Emma","r":"CHERRY","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"MENNEA","p":"Salvatore","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":44},{"n":"SERRE","p":"Candice","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BARBIER","p":"Anna","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LA RANA","p":"Andrea","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"LAGACHE","p":"Marine","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":44},{"n":"AHMED","p":"Harouna","r":"INDIE BEACH","po":"Plongeur","u":"CUISINE","h":39},{"n":"MICHALLAT","p":"Julie","r":"INDIE BEACH","po":"Agent d'entretien","u":"SALLE","h":39},{"n":"VESELOVSKYI","p":"Vitalii","r":"INDIE GROUP BUREAU","po":"intendant","u":"SALLE","h":35},{"n":"PALUSSIÈRE","p":"Alexis","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"TREMOULET PAJOT","p":"Malou","r":"PLAYAMIGOS","po":"Hotesse","u":"SALLE","h":35},{"n":"ESTEVE","p":"Guillaume","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":35},{"n":"TAGANZA","p":"Yassine","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":42},{"n":"CURTIL","p":"Paul","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"GARAVAGLIA","p":"Gloria","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":35},{"n":"MACAULEY","p":"Tara","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"MAURETTE","p":"Oscar","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"LAVEDER","p":"Laurette","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"POLLIER","p":"Bastien","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":35},{"n":"FALCOZ","p":"Costin","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"BIOLLEY","p":"Lola","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"HAMIDOU","p":"Chiraz","r":"CAFE DE L ORMEAU","po":"Plongeur","u":"CUISINE","h":39},{"n":"JULIAN DELALANDE","p":"Axel","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"LAMRI","p":"Ahmed","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"LO","p":"Maeva Gueda","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CARBONE","p":"Sonny","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":39},{"n":"VENEGAS MARISCAL","p":"Rodolfo Ignacio","r":"PABLO","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"ARCHERAY LEBLOND","p":"Clara","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"PICARD","p":"Laure","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"BODIN","p":"Victor","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"MARCON","p":"Mathis","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":39},{"n":"FRANCO MENDES","p":"Ricardo","r":"INDIE BEACH","po":"Plagiste","u":"SALLE","h":35},{"n":"GARCIA","p":"Remi","r":"PABLO","po":"Runner","u":"SALLE","h":39},{"n":"PLAYOUST","p":"Gabin","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":42},{"n":"CANTERA","p":"Magaly","r":"INDIE BEACH","po":"Second de Cuisine","u":"CUISINE","h":44},{"n":"DELORME","p":"Elisa","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"CHAILLOU","p":"Marianne","r":"INDIE BEACH","po":"Patissier","u":"CUISINE","h":42},{"n":"ANTONA","p":"Jean Dominique","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"DRODE","p":"Axel","r":"CAFE FLORA","po":"Chef de Rang","u":"SALLE","h":42},{"n":"LE VERGE—SERANDOUR","p":"Ewenn","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BELASCO","p":"Pierre","r":"CHERRY","po":"Sommelier","u":"SALLE","h":44},{"n":"FERAY","p":"Gregory","r":"CHERRY","po":"Patissier","u":"CUISINE","h":44},{"n":"DEDIEU","p":"Loan","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"GUITTON","p":"Mathilde","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":39},{"n":"DUMAS","p":"Edouard","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"JARDSON GESMAR","p":"Junior Frederico","r":"LA SAUVAGEONNE","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"BEEDASSY","p":"Mathea","r":"LA SAUVAGEONNE","po":"Chef Hotesse","u":"SALLE","h":42},{"n":"ORIGET","p":"Anaïs","r":"LA SAUVAGEONNE","po":"Barman","u":"SALLE","h":42},{"n":"SAQUET","p":"Fanny","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BAUDINO","p":"Eliza","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":42},{"n":"DUBOYS DE LABARRE","p":"Andreas","r":"PLAYAMIGOS","po":"Runner","u":"SALLE","h":39},{"n":"BORDERES","p":"Célia","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":42},{"n":"LEGRIER","p":"Aurore","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":44},{"n":"TOSTO","p":"Alexandre","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"ROUMLY","p":"Charif","r":"CHERRY","po":"Plongeur","u":"CUISINE","h":39},{"n":"ARNAL","p":"Noe","r":"LA SAUVAGEONNE","po":"Chef de Rang","u":"SALLE","h":42},{"n":"SMAILI","p":"Eva","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":42},{"n":"VERDIER","p":"Sadio","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"DESBIENS","p":"Lhone","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":35},{"n":"DI MAGGIO","p":"Yaron","r":"CHERRY","po":"Chef de Partie","u":"CUISINE","h":44},{"n":"BERTUCCI","p":"Mickaël","r":"CHERRY","po":"Runner","u":"SALLE","h":39},{"n":"ANDRADE","p":"Adriana","r":"CAFE DE L ORMEAU","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"DAGUIER","p":"Rebecca","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"GODET","p":"Melina","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":42},{"n":"DI CARMINE","p":"Julia","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"HATTON","p":"Lucy","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":39},{"n":"ROUAG","p":"Morad","r":"CAFE DE L ORMEAU","po":"Chef de Rang","u":"SALLE","h":42},{"n":"TADDEI","p":"Maxime","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":39},{"n":"BLANCKAERT","p":"John","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":42},{"n":"DELFOSSE","p":"Oriane","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":35},{"n":"DJAI","p":"Manola","r":"INDIE BEACH","po":"Barman","u":"SALLE","h":39},{"n":"CHARTIER","p":"Jean","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":42},{"n":"COLLINET","p":"Sarah","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"RIJO SOARES","p":"Aloice","r":"INDIE BEACH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"WEHRLEN","p":"Romane","r":"INDIE BEACH","po":"autres","u":"SALLE","h":35},{"n":"BORNEUF","p":"Rose","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":42},{"n":"ABOUBACAR","p":"Kassim","r":"INDIE BEACH","po":"Commis de Cuisine","u":"CUISINE","h":44},{"n":"GOMES","p":"Angelique","r":"INDIE BEACH","po":"Hotesse","u":"SALLE","h":44},{"n":"ALAIN","p":"Dubois","r":"INDIE BEACH","po":"Chef de Partie","u":"CUISINE","h":42},{"n":"ID HADDOUCH","p":"Reda","r":"PLAYAMIGOS","po":"Plagiste","u":"SALLE","h":39},{"n":"COSTA","p":"Noa","r":"CAFE FLORA","po":"Commis de Salle","u":"SALLE","h":35},{"n":"ALCAMO","p":"Marie","r":"INDIE BEACH","po":"Chef de Rang","u":"SALLE","h":44},{"n":"PETIT","p":"Fiona","r":"LA SAUVAGEONNE","po":"Commis de Salle","u":"SALLE","h":35},{"n":"GALIBERT","p":"Rudy","r":"LA SAUVAGEONNE","po":"Directeur","u":"SALLE","h":35},{"n":"MEIGNAN","p":"Pablo","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":35},{"n":"PRES","p":"Sofiia","r":"PABLO","po":"Agent d'entretien sanitaire","u":"SALLE","h":35},{"n":"DESIGAUX","p":"Clemence","r":"PABLO SAINT BARTH","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MAURETTE","p":"Lucas","r":"INDIE BEACH","po":"Runner","u":"SALLE","h":35},{"n":"ALDA","p":"Manon","r":"CAT CLUB","po":"Hotesse","u":"SALLE","h":35},{"n":"BOURDIN","p":"Corentin","r":"JCP LA SAUVAGEONNE MEGEVE","po":"Barman","u":"SALLE","h":35},{"n":"BOUCHAREYCHAS","p":"Romain","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"BUCCI","p":"Chiara","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"DEROUGEMONT","p":"Maxime","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MULLER","p":"Mathilde","r":"PABLO","po":"autres","u":"SALLE","h":35},{"n":"DESACHY","p":"Marion","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"GINOUX","p":"Andrea","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"LAJOUS","p":"Karine","r":"PABLO","po":"Agent Entretien","u":"SALLE","h":35},{"n":"POINSOT","p":"Eddy","r":"CHERRY","po":"Barman","u":"SALLE","h":35},{"n":"GOMEZ GAMEZ","p":"Eduard","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MARIOTTI","p":"Carla-Marie","r":"CAT CLUB","po":"Hotesse","u":"SALLE","h":35},{"n":"NADAUD","p":"Lisa","r":"CAT CLUB","po":"autres","u":"SALLE","h":35},{"n":"LOPEZ CRUZ","p":"Vanessa Carolina","r":"CAFE DE L ORMEAU","po":"Cuisinier","u":"CUISINE","h":35},{"n":"MANDIN","p":"Nathanael","r":"CAFE DE L ORMEAU","po":"Runner","u":"SALLE","h":35},{"n":"NGUYEN","p":"Kim Lorelei","r":"CAT CLUB","po":"Commis de Salle","u":"SALLE","h":35},{"n":"AGOSTINHO","p":"Mikael","r":"PABLO SAINT BARTH","po":"Barman","u":"SALLE","h":35},{"n":"CHAWKI","p":"Walid","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"CRISTI","p":"Giovanni","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"DESBRUGERES","p":"Paul","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"COUCHOT","p":"Olivier","r":"CHERRY","po":"Barman","u":"SALLE","h":35},{"n":"FORTILIEN PEDRO","p":"Maria Altagracia","r":"PABLO SAINT BARTH","po":"Plongeur","u":"CUISINE","h":35},{"n":"GIGANTE","p":"Diane","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"RAUFASTE","p":"Lola","r":"PABLO SAINT BARTH","po":"autres","u":"SALLE","h":35},{"n":"JOSEPH","p":"Anton","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"BELINGO","p":"Donatien","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"HOUNET","p":"Gabriel","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"KALAYCI","p":"Timucin","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"LEBASTARD","p":"Noe-Baltazar","r":"CHERRY","po":"Runner","u":"SALLE","h":35},{"n":"REINERTZ","p":"Mélody","r":"CHERRY","po":"Chef de Rang","u":"SALLE","h":35},{"n":"SAINTINI","p":"Kevin","r":"LA SAUVAGEONNE","po":"Cuisinier","u":"CUISINE","h":35},{"n":"CHENNIT","p":"Adam","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"MICHEL","p":"Denis","r":"CAFE DE L ORMEAU","po":"Barman","u":"SALLE","h":35},{"n":"GÜELI","p":"Estefania","r":"PABLO","po":"Patissier","u":"CUISINE","h":35},{"n":"COLLART","p":"Ines","r":"PABLO SAINT BARTH","po":"Hotesse","u":"SALLE","h":35},{"n":"LOMBARD","p":"Daniel","r":"CAFE FLORA","po":"Chef de Partie","u":"CUISINE","h":35},{"n":"WARDI","p":"Inès","r":"PABLO SAINT BARTH","po":"Chef de Rang","u":"SALLE","h":35},{"n":"AYAD","p":"Sabrina","r":"PLAYAMIGOS","po":"Chef de Rang","u":"SALLE","h":42},{"n":"BARBAS","p":"Charlize","r":"CHERRY","po":"Commis de Salle","u":"SALLE","h":35},{"n":"TOMAS","p":"Lola","r":"CAT CLUB","po":"autres","u":"SALLE","h":35}];

// ---------- Constantes métier ----------
// Accès manager par CODE simple. Le code est vérifié dans l'app, puis l'app se connecte
// à UN compte Supabase partagé (identifiants ci-dessous) : la base reste ainsi protégée
// en écriture (seuls les utilisateurs connectés peuvent écrire). Le manager ne tape que le code.
// -> Créez ce compte dans Supabase (Authentication → Users) avec EXACTEMENT cet e-mail et ce mot de passe.
const CODE_MANAGER = "1942";                       // code tapé par le manager (modifiable ici)
const MANAGER_EMAIL = "manager@indiegroup.fr";     // compte partagé (à créer dans Supabase)
const MANAGER_SECRET = "IndieGroup-Manager-2026";  // mot de passe du compte partagé (>= 6 caractères)
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const JOURS_COURT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
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

// ---------- Feuille d'émargement (format du modèle papier) ----------
function EmargementSheet({ resto, semDate, planning, pointages, team }) {
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
                      </td>
                    );
                  })}
                  <td className="daycell" style={{textAlign:'center',fontWeight:700,fontSize:13}}>
                    {pl?fmtHeures(tot):'—'}
                    {(() => {
                      const ptAll = pointages[idSalarie(e)];
                      const signee = ptAll && ptAll.semaine && ptAll.semaine.signee;
                      return signee
                        ? <div className="sig signed" style={{marginTop:6}}>✓ semaine validée</div>
                        : <div className="sig" style={{marginTop:6}}>signature ____</div>;
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

// ---------- Vue Manager ----------
function ManagerView({ resto, onBack }) {
  const [semDate, setSemDate] = useState(new Date());
  const [planning, setPlanning] = useState({}); // { idSalarie: { 0..6 } }
  const [pointages, setPointages] = useState({});
  const [edit, setEdit] = useState(null); // { emp, jour }
  const [vue, setVue] = useState("planning"); // planning | emargement
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

  function genererTout() {
    const next = { ...planning };
    team.forEach((e) => {
      next[idSalarie(e)] = genererPlanningAuto(e, sem);
    });
    persistPlanning(next);
  }
  function genererUn(e) {
    const next = { ...planning, [idSalarie(e)]: genererPlanningAuto(e, sem) };
    persistPlanning(next);
  }

  function montrerFlash(msg) {
    setFlash(msg);
    setTimeout(() => setFlash(""), 3500);
  }

  // Impression du planning de la semaine dans une nouvelle fenêtre.
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
          <div className="ig-eyebrow" style={{margin:0}}>Espace manager</div>
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

      <WeekNav semDate={semDate} setSemDate={setSemDate} />

      {vue === "planning" && (
        <>
          <div className="ig-noprint" style={{display:'flex',gap:10,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
            <button className="ig-btn ig-btn-primary" onClick={genererTout}><Icon.Wand/> Générer le planning automatique</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>setAjout(true)}>+ Ajouter un salarié</button>
            <button className="ig-btn ig-btn-ghost" onClick={()=>{ setModeSelect((v)=>!v); setSelection(new Set()); setConfirmLot(false); }} style={modeSelect?{borderColor:'var(--coral-d)',color:'var(--coral-d)'}:undefined}>🧹 {modeSelect?"Terminer le nettoyage":"Nettoyer l'effectif"}</button>
            <button className="ig-btn ig-btn-ghost" onClick={enregistrerModele} disabled={Object.keys(planning).length===0} title="Mémoriser les horaires de cette semaine comme modèle">★ Enregistrer comme modèle</button>
            <button className="ig-btn ig-btn-ghost" onClick={appliquerModele} disabled={!modele} title="Reprendre les horaires du modèle pour les salariés sans planning">⤵ Appliquer le modèle</button>
            <button className="ig-btn ig-btn-ink" onClick={imprimerPlanning} disabled={Object.keys(planning).length===0}><Icon.Print/> Télécharger le planning en PDF</button>
            {valide ? (
              <button className="ig-btn ig-btn-ghost" onClick={devaliderPlanning} style={{borderColor:'var(--sea)',color:'var(--sea)'}}><Icon.Check/> Planning validé — repasser en préparation</button>
            ) : (
              <button className="ig-btn ig-btn-primary" onClick={validerPlanning} disabled={Object.keys(planning).length===0} style={{background:'var(--sea)'}}><Icon.Check/> Valider le planning</button>
            )}
          </div>
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
        <EmargementSheet resto={resto} semDate={semDate} planning={planning} pointages={pointages} team={team} />
      )}

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
  const sem = cleSemaine(semDate);
  const id = idSalarie(emp);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

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

      {valide === false ? (
        <div className="ig-card ig-clock-card" style={{marginBottom:22}}>
          <div className="ig-clock-date" style={{textTransform:'capitalize',fontSize:18,marginBottom:18}}>{now.toLocaleDateString("fr-FR",{weekday:'long',day:'numeric',month:'long'})}</div>
          <div style={{fontSize:18,fontWeight:600,fontFamily:"'Inter',system-ui,sans-serif"}}>Planning en cours de préparation</div>
          <div className="ig-muted" style={{marginTop:8,maxWidth:380,marginLeft:'auto',marginRight:'auto'}}>Votre manager finalise le planning de la semaine. Revenez un peu plus tard : vous pourrez voir vos horaires et confirmer votre présence dès qu'il sera validé.</div>
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
            <div className="ig-muted" style={{marginBottom:18}}>{planJour.statut===STATUTS.DEMI_CP?'Demi-journée travaillée : ':'Service prévu aujourd’hui : '}<b>{planJour.debut} – {planJour.fin}{planJour.coupure && planJour.debut2 && planJour.fin2 ? ` puis ${planJour.debut2} – ${planJour.fin2}` : ''}</b>{planJour.statut===STATUTS.DEMI_CP?` · ½ CP`:(planJour.coupure?' · coupure':(planJour.pause?` · ${planJour.pause}h de pause`:''))}</div>
            {monPt.confirme ? (
              <div className="ig-status-line" style={{background:'#EAF3F3'}}>
                <span className="ig-stamp" style={{borderColor:'var(--sea)'}}><Icon.Check width={15} height={15}/> Présence confirmée</span>
                <div className="ig-muted" style={{marginTop:8}}>Horaires validés : {monPt.debut} – {monPt.fin}. À demain !</div>
              </div>
            ) : (
              <div className="ig-clock-actions">
                <button className="ig-clock-btn" style={{background:'var(--sea)',color:'#fff',minWidth:240}} onClick={confirmerJour}>
                  Je confirme ma présence
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
                  <div style={{fontSize:14}}><b style={{textTransform:'capitalize'}}>{JOURS[j]}</b> <span className="ig-muted">{fmtJour(ajouterJours(lundi,j))} · {p.debut} – {p.fin}</span></div>
                  <button className="ig-btn ig-btn-sm" style={{background:'var(--sea)',color:'#fff'}} onClick={()=>confirmerJourPasse(j)}>Confirmer ce jour</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mon planning du jour uniquement */}
      <div className="ig-weekbar">
        <span className="lbl" style={{textTransform:'capitalize'}}>Mon planning · {now.toLocaleDateString("fr-FR",{weekday:'long',day:'numeric',month:'long'})}</span>
      </div>
      <div className="ig-card" style={{padding:'18px 20px'}}>
        {!planning ? (
          <div className="ig-muted">Votre planning n'a pas encore été publié par votre manager pour aujourd'hui.</div>
        ) : !planJour || planJour.statut===STATUTS.OFF ? (
          <div style={{fontSize:16,fontWeight:600,color:'var(--ink-soft)'}}>Repos aujourd'hui (OFF)</div>
        ) : planJour.statut===STATUTS.CP ? (
          <div style={{fontSize:16,fontWeight:600,color:'#3A6EA5'}}>Congé payé (CP)</div>
        ) : planJour.statut===STATUTS.AM ? (
          <div style={{fontSize:16,fontWeight:600,color:'#C2702A'}}>Arrêt maladie (AM)</div>
        ) : planJour.statut===STATUTS.SANS_SOLDE ? (
          <div style={{fontSize:16,fontWeight:600,color:'#6B5B95'}}>Congé sans solde (CSS)</div>
        ) : planJour.statut===STATUTS.DEMI_CP ? (
          <div>
            <div style={{fontSize:24,fontFamily:"'Inter',system-ui,sans-serif",fontWeight:600}}>{planJour.debut} – {planJour.fin}</div>
            <div className="ig-muted" style={{marginTop:4}}>Demi-CP · {planJour.demi==="am"?"matin en congé":"après-midi en congé"} · {fmtHeures(dureeJour(planJour))} travaillées</div>
          </div>
        ) : (
          <div>
            <div style={{fontSize:24,fontFamily:"'Inter',system-ui,sans-serif",fontWeight:600}}>{planJour.debut} – {planJour.fin}{planJour.coupure && planJour.debut2 && planJour.fin2 ? `  ·  ${planJour.debut2} – ${planJour.fin2}` : ''}</div>
            <div className="ig-muted" style={{marginTop:4}}>{planJour.coupure && planJour.debut2 && planJour.fin2 ? 'Service en coupure · ' : ''}{planJour.pause?`${planJour.pause}h de pause incluse · `:''}{fmtHeures(dureeJour(planJour))} de travail</div>
          </div>
        )}
      </div>

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
      <p style={{marginBottom:20}}>Indiquez votre prénom, votre nom et votre restaurant pour accéder à votre planning.</p>
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

      <button className="ig-btn ig-btn-primary" onClick={valider}>Voir mon planning</button>
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
    if (code !== CODE_MANAGER) { setErreur("Code incorrect. Réessayez."); setCode(""); return; }
    setErreur("");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: MANAGER_EMAIL, password: MANAGER_SECRET });
    setBusy(false);
    if (error) { setErreur("Compte manager non configuré dans Supabase (voir la doc)."); return; }
    onOk();
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
  async function deconnexion() { await supabase.auth.signOut(); reset(); }

  let content;
  if (askCode) {
    content = <CodeGate onOk={()=>{ setAskCode(false); setRole('manager'); }} onCancel={()=>setAskCode(false)} />;
  } else if (!role) {
    content = (
      <div className="ig-hero">
        <div className="ig-eyebrow">Indie Group · Plannings &amp; émargement</div>
        <h1 className="ig-display">Le planning de vos<br/>restaurants, au clair.</h1>
        <p>Générez les plannings de la semaine selon les contrats de chacun, ajustez-les à la main, et laissez vos équipes pointer leurs heures. Une feuille d'émargement prête à imprimer pour chaque restaurant.</p>
        <div className="ig-roles">
          <button className="ig-role" onClick={()=> session ? setRole('manager') : setAskCode(true)}>
            <div className="ig-ic" style={{background:'var(--ink)',color:'var(--sand)'}}><Icon.Shield/></div>
            <h3>Je suis manager</h3>
            <p>Générer et modifier les plannings, suivre les pointages, imprimer les feuilles d'émargement.</p>
          </button>
          <button className="ig-role" onClick={()=>setRole('salarie')}>
            <div className="ig-ic" style={{background:'var(--coral)',color:'#fff'}}><Icon.User/></div>
            <h3>Je suis salarié</h3>
            <p>Voir mon planning de la semaine et pointer mes arrivées, pauses et départs.</p>
          </button>
        </div>
      </div>
    );
  } else if (role === "manager" && !resto) {
    content = <RestoPicker restaurants={restaurants} onPick={setResto} onAdd={ajouterEtablissement} />;
  } else if (role === "manager") {
    content = <ManagerView resto={resto} onBack={()=>setResto(null)} />;
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
