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
  unique (resto, salarie_id)
);
create index if not exists rh_salaries_scope_idx on public.rh_salaries (resto, unite);

-- Ajout ultérieur (registre d'embauche) : "if not exists" pour rester sans risque
-- à rejouer même si la table rh_salaries existe déjà.
alter table public.rh_salaries add column if not exists staff_party boolean;
alter table public.rh_salaries add column if not exists heures_contrat numeric;
alter table public.rh_salaries add column if not exists date_prolongation_fin date;
-- Couleur de la ligne dans le tableau RH (remplissage façon Excel), ex: '#FBE2DC'. NULL = aucune.
alter table public.rh_salaries add column if not exists couleur text;

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
  poste           text not null,
  statut          text not null default 'a_pourvoir' check (statut in ('a_pourvoir','en_cours','valide','pourvu')),
  nom             text,
  prenom          text,
  salaire_propose numeric,
  notes           text,
  cree_le         timestamptz not null default now(),
  maj_le          timestamptz not null default now()
);
create index if not exists rh_previsionnel_scope_idx on public.rh_previsionnel (resto, unite);

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
