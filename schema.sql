-- ============================================================================
--  Indie Group — Plannings & émargement
--  Schéma de base de données Supabase (à exécuter dans SQL Editor)
-- ============================================================================
--  Modèle clé-valeur : une seule table "kv" (clé texte -> valeur JSON).
--  Les clés suivent le format de l'application :
--    planning:<RESTO>:<AAAA-MM-JJ>     roster:<RESTO>       modele:<RESTO>
--    pointages:<RESTO>:<AAAA-MM-JJ>    validation:<RESTO>:<AAAA-MM-JJ>
--    etablissements
-- ============================================================================

create table if not exists public.kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- Met à jour automatiquement updated_at à chaque écriture.
create or replace function public.kv_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists kv_touch_trg on public.kv;
create trigger kv_touch_trg before update on public.kv
  for each row execute function public.kv_touch();

-- ----------------------------------------------------------------------------
--  Sécurité (Row Level Security)
-- ----------------------------------------------------------------------------
alter table public.kv enable row level security;

-- MANAGERS (utilisateurs connectés) : accès complet en lecture et écriture.
drop policy if exists managers_all on public.kv;
create policy managers_all on public.kv
  for all
  to authenticated
  using (true)
  with check (true);

-- SALARIÉS (anonymes) : LECTURE des plannings, effectifs, validation, établissements.
drop policy if exists anon_read on public.kv;
create policy anon_read on public.kv
  for select
  to anon
  using (
    key like 'planning:%'
    or key like 'validation:%'
    or key like 'roster:%'
    or key = 'etablissements'
  );

-- SALARIÉS (anonymes) : LECTURE de leurs pointages.
drop policy if exists anon_pointages_select on public.kv;
create policy anon_pointages_select on public.kv
  for select
  to anon
  using (key like 'pointages:%');

-- SALARIÉS (anonymes) : CRÉATION / MISE À JOUR des pointages uniquement.
drop policy if exists anon_pointages_insert on public.kv;
create policy anon_pointages_insert on public.kv
  for insert
  to anon
  with check (key like 'pointages:%');

drop policy if exists anon_pointages_update on public.kv;
create policy anon_pointages_update on public.kv
  for update
  to anon
  using (key like 'pointages:%')
  with check (key like 'pointages:%');

-- ============================================================================
--  Historique / sauvegarde automatique
-- ============================================================================
--  Avant chaque écrasement d'une valeur existante dans "kv", l'ancienne valeur
--  est conservée ici. Permet de retrouver et restaurer une version précédente
--  (planning, effectif...) si une modification a été écrasée par erreur.
create table if not exists public.kv_history (
  id       bigint generated always as identity primary key,
  key      text not null,
  value    jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists kv_history_key_idx on public.kv_history (key, saved_at desc);

create or replace function public.kv_snapshot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.kv_history (key, value, saved_at) values (old.key, old.value, old.updated_at);
  return new;
end;
$$;

drop trigger if exists kv_snapshot_trg on public.kv;
create trigger kv_snapshot_trg before update on public.kv
  for each row execute function public.kv_snapshot();

alter table public.kv_history enable row level security;

-- MANAGERS (utilisateurs connectés) : lecture seule (restauration = réécriture
-- normale dans "kv", pas d'écriture directe dans l'historique lui-même).
drop policy if exists managers_read_history on public.kv_history;
create policy managers_read_history on public.kv_history
  for select
  to authenticated
  using (true);

-- ============================================================================
--  Module RH — comptes individuels cloisonnés par établissement + unité
-- ============================================================================
--  Contrairement au reste de l'appli (code manager partagé), le RH utilise un
--  vrai compte (email + mot de passe) par personne, créé manuellement dans
--  Supabase → Authentication → Users. Cette table dit à quel établissement et
--  quelle unité (SALLE / CUISINE) chaque compte a droit ; superviseur = true
--  donne accès à tout, tous établissements et unités confondus.
create table if not exists public.rh_acces (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  resto       text not null,
  unite       text not null check (unite in ('SALLE','CUISINE','TOUS')),
  superviseur boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (user_id, resto, unite)
);
alter table public.rh_acces enable row level security;

-- Chacun ne peut lire que SES PROPRES droits (pour que l'appli sache quoi afficher).
drop policy if exists self_read_acces on public.rh_acces;
create policy self_read_acces on public.rh_acces
  for select to authenticated using (user_id = auth.uid());

-- Fiches RH des salariés. Champs "de base" (nom, prénom, téléphone, email,
-- poste, dates de contrat, salaire net, logé) : modifiables par le
-- directeur/chef concerné. Champs sensibles (état civil, sécu, IBAN, salaire
-- brut, pièces jointes...) : réservés au superviseur, verrouillés en base
-- pour tout autre compte par le déclencheur rh_salaries_guard ci-dessous.
create table if not exists public.rh_salaries (
  id                    bigint generated always as identity primary key,
  resto                 text not null,
  unite                 text not null check (unite in ('SALLE','CUISINE')),
  salarie_id            text not null,
  -- Saison de la fiche (ex: "2026") : permet d'archiver une saison sur le Google Sheet
  -- puis de repartir sur une liste vide pour la saison suivante, sans jamais rien
  -- supprimer — l'ancienne saison reste consultable dans l'appli via un onglet dédié.
  saison                text not null default to_char(now(), 'YYYY'),
  -- champs modifiables par le directeur/chef
  nom text, prenom text, telephone text, email text, poste text,
  date_debut date, date_fin date, salaire_net numeric, loge text,
  staff_party boolean, heures_contrat numeric, date_prolongation_fin date,
  -- champs réservés au superviseur
  civilite text, date_naissance date, lieu_naissance text, nationalite text,
  adresse text, code_postal text, ville text, secu text,
  mutuelle boolean, affiliation_mutuelle text, iban text, bic text,
  salaire_brut numeric, vehicule text, promesse_embauche text,
  periode_essai_jours int, date_fin_periode_essai date, type_contrat text,
  heures_semaine numeric, heures_sup numeric, niveau text, echelon text,
  code_pcs text, due text, statut_payfit text,
  piece_identite_url text, carte_sejour_url text, carte_vitale_url text, carte_mutuelle_url text,
  contact_urgence text,
  cree_le timestamptz not null default now(),
  maj_le  timestamptz not null default now(),
  unique (resto, salarie_id, saison)
);

-- Ajout ultérieur (registre d'embauche) : "if not exists" pour rester sans risque
-- à rejouer même si la table rh_salaries existe déjà. IMPORTANT : ces colonnes doivent
-- être ajoutées AVANT tout index/contrainte qui les référence ci-dessous, sinon "create
-- table if not exists" (no-op si la table existe déjà) laisserait la colonne absente au
-- moment de créer l'index, avec une erreur "column does not exist".
alter table public.rh_salaries add column if not exists staff_party boolean;
alter table public.rh_salaries add column if not exists heures_contrat numeric;
alter table public.rh_salaries add column if not exists date_prolongation_fin date;
alter table public.rh_salaries add column if not exists saison text not null default to_char(now(), 'YYYY');

create index if not exists rh_salaries_scope_idx on public.rh_salaries (resto, unite, saison);

-- La contrainte d'unicité portait à l'origine seulement sur (resto, salarie_id) : sans la
-- saison dedans, réonboarder la même personne l'année suivante écraserait sa fiche archivée
-- de la saison précédente au lieu d'en créer une nouvelle. Migration sans risque à rejouer.
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'rh_salaries_resto_salarie_id_key'
  ) then
    alter table public.rh_salaries drop constraint rh_salaries_resto_salarie_id_key;
  end if;
end $$;
alter table public.rh_salaries drop constraint if exists rh_salaries_resto_salarie_id_saison_key;
alter table public.rh_salaries add constraint rh_salaries_resto_salarie_id_saison_key unique (resto, salarie_id, saison);
-- Couleur de la ligne dans le tableau RH (remplissage façon Excel), ex: '#FBE2DC'. NULL = aucune.
alter table public.rh_salaries add column if not exists couleur text;

-- "provisoire" = true : fiche créée à l'avance par le directeur/chef (registre d'embauche,
-- salaire/dates/tél déjà connus) mais la personne n'a pas encore rempli le vrai Google Form.
-- À l'onboarding réel (formSubmit), l'app cherche une fiche "provisoire" qui lui ressemble
-- (nom approchant, même établissement) : si trouvée, elle est mise à jour (nom/prénom
-- corrigés par le Form, provisoire repasse à false) au lieu de créer un doublon — le
-- directeur ne ressaisit jamais ce qu'il avait déjà rempli.
alter table public.rh_salaries add column if not exists provisoire boolean not null default false;

-- "Logé" est passé d'une case à cocher à un champ texte libre (pour préciser
-- "seul", "en colocation"...). Convertit une éventuelle colonne booléenne existante
-- sans perdre les données déjà saisies ; ne fait rien si c'est déjà du texte.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'rh_salaries'
      and column_name = 'loge' and data_type = 'boolean'
  ) then
    alter table public.rh_salaries
      alter column loge type text
      using (case when loge then 'Oui' when loge is false then 'Non' else null end);
  end if;
end $$;

create or replace function public.rh_salaries_touch()
returns trigger language plpgsql as $$
begin
  new.maj_le = now();
  return new;
end;
$$;
drop trigger if exists rh_salaries_touch_trg on public.rh_salaries;
create trigger rh_salaries_touch_trg before update on public.rh_salaries
  for each row execute function public.rh_salaries_touch();

-- Verrouille les champs sensibles pour tout compte AUTHENTIFIÉ qui n'est pas
-- superviseur (directeur/chef), quoi que le client envoie — protection en
-- base, pas seulement dans l'écran. Les soumissions ANONYMES (formulaire
-- d'onboarding rempli par le salarié lui-même, cf. policy anon plus bas) ne
-- sont PAS concernées : c'est le salarié qui renseigne ses propres champs
-- sensibles à ce moment-là, c'est légitime.
create or replace function public.rh_salaries_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare est_superviseur boolean;
begin
  if auth.uid() is null then
    return new;
  end if;
  select coalesce(bool_or(superviseur), false) into est_superviseur
    from public.rh_acces where user_id = auth.uid();
  if not est_superviseur then
    if tg_op = 'UPDATE' then
      new.staff_party := old.staff_party;
      new.civilite := old.civilite; new.date_naissance := old.date_naissance;
      new.lieu_naissance := old.lieu_naissance; new.nationalite := old.nationalite;
      new.adresse := old.adresse; new.code_postal := old.code_postal; new.ville := old.ville;
      new.secu := old.secu; new.mutuelle := old.mutuelle; new.affiliation_mutuelle := old.affiliation_mutuelle;
      new.iban := old.iban; new.bic := old.bic; new.salaire_brut := old.salaire_brut;
      new.promesse_embauche := old.promesse_embauche;
      new.periode_essai_jours := old.periode_essai_jours; new.date_fin_periode_essai := old.date_fin_periode_essai;
      new.type_contrat := old.type_contrat; new.heures_semaine := old.heures_semaine; new.heures_sup := old.heures_sup;
      new.niveau := old.niveau; new.echelon := old.echelon; new.code_pcs := old.code_pcs; new.due := old.due;
      new.statut_payfit := old.statut_payfit;
      new.piece_identite_url := old.piece_identite_url; new.carte_sejour_url := old.carte_sejour_url;
      new.carte_vitale_url := old.carte_vitale_url; new.carte_mutuelle_url := old.carte_mutuelle_url;
      new.contact_urgence := old.contact_urgence;
    else
      new.staff_party := null;
      new.civilite := null; new.date_naissance := null; new.lieu_naissance := null; new.nationalite := null;
      new.adresse := null; new.code_postal := null; new.ville := null; new.secu := null;
      new.mutuelle := null; new.affiliation_mutuelle := null; new.iban := null; new.bic := null;
      new.salaire_brut := null; new.promesse_embauche := null;
      new.periode_essai_jours := null; new.date_fin_periode_essai := null; new.type_contrat := null;
      new.heures_semaine := null; new.heures_sup := null; new.niveau := null; new.echelon := null;
      new.code_pcs := null; new.due := null; new.statut_payfit := null;
      new.piece_identite_url := null; new.carte_sejour_url := null;
      new.carte_vitale_url := null; new.carte_mutuelle_url := null; new.contact_urgence := null;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists rh_salaries_guard_trg on public.rh_salaries;
create trigger rh_salaries_guard_trg before insert or update on public.rh_salaries
  for each row execute function public.rh_salaries_guard();

alter table public.rh_salaries enable row level security;

-- Superviseur : accès complet, tous établissements.
drop policy if exists superviseur_all_rh on public.rh_salaries;
create policy superviseur_all_rh on public.rh_salaries
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur));

-- Directeur / chef : uniquement leur établissement + leur unité.
drop policy if exists directeur_scope_rh on public.rh_salaries;
create policy directeur_scope_rh on public.rh_salaries
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_salaries.resto and a.unite = rh_salaries.unite))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_salaries.resto and a.unite = rh_salaries.unite));

-- L'onboarding public (formulaire de l'appli, sans connexion) n'existe plus : c'est
-- désormais le vrai Google Form d'Océane, relié à l'appli par la fonction Edge
-- "sheet-sync" (action "formSubmit"), qui écrit avec la clé "service role" — donc en
-- contournant les policies RLS, pas au travers d'elles. Aucun accès anonyme en écriture
-- n'est donc plus nécessaire sur rh_salaries ; ces anciennes policies sont retirées.
drop policy if exists anon_onboarding_insert on public.rh_salaries;
drop policy if exists anon_onboarding_update on public.rh_salaries;

-- ============================================================================
--  Prévisionnel de recrutement — suivi des postes à pourvoir, AVANT l'onboarding
-- ============================================================================
--  Totalement séparé de rh_salaries : la vraie fiche salarié ne se crée que quand la
--  personne remplit elle-même le Google Form (pour ne jamais avoir un nom mal saisi par
--  un tiers). Cette table sert seulement aux directeurs/chefs à préparer et suivre leurs
--  recrutements en amont (comme leur ancien registre d'embauche en Google Sheet), avec
--  éventuellement le nom d'un candidat en cours de discussion. Aucun lien technique avec
--  rh_salaries, donc aucun risque de doublon : une fois la personne recrutée et onboardée,
--  le directeur marque juste la ligne "pourvu" (ou la supprime).
create table if not exists public.rh_previsionnel (
  id              bigint generated always as identity primary key,
  resto           text not null,
  unite           text not null check (unite in ('SALLE','CUISINE')),
  -- Libellé libre (ex: "2026", "2026-2027") : permet de garder un historique année par
  -- année du registre d'embauche, comme le tableur qu'Océane tenait avant.
  annee           text not null default to_char(now(), 'YYYY'),
  poste           text not null,
  statut          text not null default 'a_pourvoir' check (statut in ('a_pourvoir','en_cours','valide','pourvu')),
  nom             text,
  prenom          text,
  salaire_propose numeric,
  notes           text,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now()
);
-- Ajout ultérieur : "if not exists" pour rester sans risque à rejouer si la table existe déjà.
alter table public.rh_previsionnel add column if not exists annee text not null default to_char(now(), 'YYYY');
create index if not exists rh_previsionnel_scope_idx on public.rh_previsionnel (resto, unite, annee);

create or replace function public.rh_previsionnel_touch()
returns trigger language plpgsql as $$
begin
  new.maj_le = now();
  return new;
end;
$$;
drop trigger if exists rh_previsionnel_touch_trg on public.rh_previsionnel;
create trigger rh_previsionnel_touch_trg before update on public.rh_previsionnel
  for each row execute function public.rh_previsionnel_touch();

alter table public.rh_previsionnel enable row level security;

drop policy if exists superviseur_all_previsionnel on public.rh_previsionnel;
create policy superviseur_all_previsionnel on public.rh_previsionnel
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur));

drop policy if exists directeur_scope_previsionnel on public.rh_previsionnel;
create policy directeur_scope_previsionnel on public.rh_previsionnel
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_previsionnel.resto and a.unite = rh_previsionnel.unite))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_previsionnel.resto and a.unite = rh_previsionnel.unite));

-- ============================================================================
--  Repos hebdomadaire non pris — suivi mensuel par salarié, avec calcul du
--  montant à payer (indemnisation d'un repos hebdo obligatoire non accordé)
-- ============================================================================
--  Une ligne par salarié RÉELLEMENT sous contrat (provisoire = false) et par mois
--  ("mois" au format 'AAAA-MM'). La liste du mois se génère automatiquement depuis
--  rh_salaries (bornée par date_debut/date_fin, comme le Registre Embauche) : le
--  directeur n'a plus qu'à saisir le nombre de repos non pris, le reste (net/jour,
--  montant à payer, récap) se calcule tout seul. "nom"/"prenom"/"salaire_net" sont
--  figés au moment de la génération du mois (comme l'ancien Google Sheet), pour que
--  l'historique de paiement ne bouge jamais rétroactivement si la fiche RH change
--  ensuite ; "salarie_id" reste un lien vers la fiche pour le confort d'affichage,
--  mais n'est pas requis (mis à null si la fiche est supprimée un jour).
create table if not exists public.rh_repos_hebdo (
  id             bigint generated always as identity primary key,
  resto          text not null,
  unite          text not null check (unite in ('SALLE','CUISINE')),
  mois           text not null, -- 'AAAA-MM', ex: '2026-01'
  salarie_id     bigint references public.rh_salaries(id) on delete set null,
  nom            text not null,
  prenom         text,
  salaire_net    numeric,
  repos_non_pris numeric not null default 0,
  cree_le        timestamptz not null default now(),
  maj_le         timestamptz not null default now(),
  unique (resto, unite, mois, salarie_id)
);
create index if not exists rh_repos_hebdo_scope_idx on public.rh_repos_hebdo (resto, unite, mois);

create or replace function public.rh_repos_hebdo_touch()
returns trigger language plpgsql as $$
begin
  new.maj_le = now();
  return new;
end;
$$;
drop trigger if exists rh_repos_hebdo_touch_trg on public.rh_repos_hebdo;
create trigger rh_repos_hebdo_touch_trg before update on public.rh_repos_hebdo
  for each row execute function public.rh_repos_hebdo_touch();

alter table public.rh_repos_hebdo enable row level security;

drop policy if exists superviseur_all_repos_hebdo on public.rh_repos_hebdo;
create policy superviseur_all_repos_hebdo on public.rh_repos_hebdo
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur));

drop policy if exists directeur_scope_repos_hebdo on public.rh_repos_hebdo;
create policy directeur_scope_repos_hebdo on public.rh_repos_hebdo
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_repos_hebdo.resto and a.unite = rh_repos_hebdo.unite))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_repos_hebdo.resto and a.unite = rh_repos_hebdo.unite));

-- ============================================================================
--  Extras (prêt de main-d'œuvre entre établissements) — déplacé depuis Planning
--  dans l'Espace RH, avec les mêmes comptes/droits que le Registre Embauche et le
--  Repos hebdo non pris (superviseur = tout, directeur/chef = son établissement +
--  son unité). "resto"/"unite" ci-dessous désignent l'établissement DESTINATAIRE
--  (celui qui emprunte le salarié et paie la prime) : c'est lui qui doit voir et
--  gérer la ligne, pas l'établissement d'origine.
-- ============================================================================
create table if not exists public.rh_extras (
  id                bigint generated always as identity primary key,
  resto             text not null,
  unite             text not null check (unite in ('SALLE','CUISINE')),
  resto_origine     text not null,
  salarie_nom       text not null,
  salarie_prenom    text not null,
  poste             text,
  date              date not null,
  heures_estimees   numeric,
  taux_horaire_net  numeric,
  sur_heures_origine boolean not null default false,
  statut            text not null default 'a_valider' check (statut in ('a_valider','realisee')),
  heures_reelles    numeric,
  taux_brut         numeric,
  prime_net         numeric,
  prime_brute       numeric,
  prime_cout_total  numeric,
  payfit_statut     text default 'a_faire',
  contrat_html      text,
  contrat_genere_at timestamptz,
  cree_le           timestamptz not null default now(),
  valide_le         timestamptz,
  maj_le            timestamptz not null default now()
);
-- Numéro de ligne dans le Sheet "Extra" (SHEET_ID_EXTRA), fixé une fois pour toutes à la
-- création : chaque extra garde ainsi SA ligne, même si un autre extra existe déjà pour la
-- même personne à la même date (avant, la ligne était retrouvée par nom+prénom+date+établissement,
-- ce qui fusionnait à tort deux extras distincts de la même personne en une seule ligne).
alter table public.rh_extras add column if not exists sheet_ligne integer;
create index if not exists rh_extras_scope_idx on public.rh_extras (resto, unite, date);

create or replace function public.rh_extras_touch()
returns trigger language plpgsql as $$
begin
  new.maj_le = now();
  return new;
end;
$$;
drop trigger if exists rh_extras_touch_trg on public.rh_extras;
create trigger rh_extras_touch_trg before update on public.rh_extras
  for each row execute function public.rh_extras_touch();

alter table public.rh_extras enable row level security;

drop policy if exists superviseur_all_extras on public.rh_extras;
create policy superviseur_all_extras on public.rh_extras
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur));

drop policy if exists directeur_scope_extras on public.rh_extras;
create policy directeur_scope_extras on public.rh_extras
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_extras.resto and a.unite = rh_extras.unite))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.resto = rh_extras.resto and a.unite = rh_extras.unite));

-- ============================================================================
--  Documents RH : dossier par salarié, archivé par établissement/unité/année
-- ============================================================================
--  Les documents (contrats, pièces d'identité...) sont gérés entièrement par le
--  système Apps Script existant d'Océane (dossier + fichiers créés automatiquement
--  à l'envoi du Google Form), pas par l'appli. Le bucket Supabase ci-dessous n'est
--  plus utilisé ; il ne reste ici que si d'anciens fichiers y avaient déjà été
--  déposés avant la mise en place de ce système.
insert into storage.buckets (id, name, public)
values ('rh-documents', 'rh-documents', false)
on conflict (id) do nothing;

drop policy if exists rh_documents_access on storage.objects;
create policy rh_documents_access on storage.objects
  for all to authenticated
  using (
    bucket_id = 'rh-documents'
    and exists (
      select 1 from public.rh_acces a
      where a.user_id = auth.uid()
        and (
          a.superviseur
          or (a.resto = (storage.foldername(name))[1] and a.unite = (storage.foldername(name))[2])
        )
    )
  )
  with check (
    bucket_id = 'rh-documents'
    and exists (
      select 1 from public.rh_acces a
      where a.user_id = auth.uid()
        and (
          a.superviseur
          or (a.resto = (storage.foldername(name))[1] and a.unite = (storage.foldername(name))[2])
        )
    )
  );

-- ============================================================================
--  Primes — suivi des primes/régularisations à transmettre pour la paie (Payfit)
-- ============================================================================
--  Totalement séparé de rh_salaries : ce n'est pas une fiche salarié, juste une ligne
--  de suivi (une prime peut concerner un salarié d'un autre établissement que celui où
--  elle est accordée — cas fréquent, d'où les deux champs établissement séparés).
--  Réservé au superviseur : contrairement aux autres tables RH, il n'y a AUCUNE policy
--  "directeur_scope" ici — ni les directeurs ni les chefs n'y ont accès du tout, ni en
--  lecture ni en écriture, quel que soit leur établissement.
create table if not exists public.rh_primes (
  id                      bigint generated always as identity primary key,
  date_prime              date not null,
  raison                  text not null,
  etablissement_prime     text not null,
  nom_salarie             text not null,
  prenom_salarie          text not null,
  etablissement_origine   text not null,
  nombre                  numeric not null default 1,
  prime_unitaire_net      numeric,
  prime_unitaire_brut     numeric,
  prime_totale_net        numeric,
  prime_totale_brute      numeric,
  cout_total              numeric,
  mois_salaire            text,
  annee                   integer,
  statut                  text,
  cree_le                 timestamptz not null default now(),
  maj_le                  timestamptz not null default now()
);
create index if not exists rh_primes_periode_idx on public.rh_primes (annee, mois_salaire);

-- Numéro de ligne dans le Google Sheet "Prime" d'Océane, fixé une fois pour toutes à la
-- création (même principe que rh_extras.sheet_ligne, qui a corrigé une collision de lignes
-- sur ce Sheet-là) : chaque prime garde SA ligne, jamais retrouvée par recherche nom+date.
alter table public.rh_primes add column if not exists sheet_ligne integer;

create or replace function public.rh_primes_touch()
returns trigger language plpgsql as $$
begin
  new.maj_le = now();
  return new;
end;
$$;
drop trigger if exists rh_primes_touch_trg on public.rh_primes;
create trigger rh_primes_touch_trg before update on public.rh_primes
  for each row execute function public.rh_primes_touch();

alter table public.rh_primes enable row level security;

drop policy if exists superviseur_all_primes on public.rh_primes;
create policy superviseur_all_primes on public.rh_primes
  for all to authenticated
  using (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur))
  with check (exists (select 1 from public.rh_acces a where a.user_id = auth.uid() and a.superviseur));

-- ============================================================================
--  Rappel : les comptes managers se créent dans
--  Supabase → Authentication → Users → "Add user".
--  Et pensez à désactiver l'inscription libre :
--  Authentication → Providers → Email → décochez "Enable sign-ups".
--
--  Pour le RH : créez un compte (email + mot de passe) par directeur/chef de
--  la même façon, puis ajoutez sa ligne dans rh_acces, par exemple :
--    insert into public.rh_acces (user_id, resto, unite, superviseur)
--    values ('<uuid de l'utilisateur>', 'INDIE BEACH', 'SALLE', false);
--  Pour votre propre compte superviseur :
--    insert into public.rh_acces (user_id, resto, unite, superviseur)
--    values ('<votre uuid>', 'TOUS', 'TOUS', true);
-- ============================================================================
