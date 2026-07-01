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
--  Rappel : les comptes managers se créent dans
--  Supabase → Authentication → Users → "Add user".
--  Et pensez à désactiver l'inscription libre :
--  Authentication → Providers → Email → décochez "Enable sign-ups".
-- ============================================================================
