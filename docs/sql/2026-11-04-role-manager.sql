-- ============================================================================
--  Rôle « manager » — 04/11/2026
--  Un compte nominatif, comme les directeurs, mais limité au Planning et aux
--  Extras de son établissement et de son unité. Aucun accès au Registre, donc
--  aucun accès aux salaires mensuels, ni aux repos hebdo, ni au prévisionnel.
--
--  Le cloisonnement est posé DANS LA BASE, pas seulement dans l'écran : masquer
--  une colonne à l'affichage n'empêche pas de la lire autrement.
-- ============================================================================

-- 1) Le rôle porté par chaque accès. Par défaut « directeur » : tous les comptes
--    existants gardent exactement les droits qu'ils ont aujourd'hui.
alter table public.rh_acces
  add column if not exists role text not null default 'directeur';

alter table public.rh_acces drop constraint if exists rh_acces_role_check;
alter table public.rh_acces
  add constraint rh_acces_role_check check (role in ('directeur', 'manager'));

-- 2) Vue d'équipe pour le Planning : les seules colonnes dont le planning a
--    besoin. Ni salaire, ni IBAN, ni sécu, ni adresse, ni coordonnées.
--    La vue filtre elle-même selon les droits de la personne connectée, et
--    c'est elle, et non rh_salaries, que le Planning interrogera désormais.
create or replace view public.rh_equipe_planning as
select s.id, s.resto, s.unite, s.saison, s.nom, s.prenom, s.poste,
       s.date_debut, s.date_fin, s.heures_contrat, s.heures_semaine,
       s.provisoire, s.salarie_id
from public.rh_salaries s
where exists (
  select 1 from public.rh_acces a
  where a.user_id = auth.uid()
    and (a.superviseur
      or (a.resto = s.resto and (a.unite = s.unite or a.unite = 'TOUS')))
);

grant select on public.rh_equipe_planning to authenticated;

-- 3) rh_salaries : fermé aux managers. C'est cette table qui porte les salaires,
--    les IBAN et les numéros de sécurité sociale.
drop policy if exists directeur_scope_rh on public.rh_salaries;
create policy directeur_scope_rh on public.rh_salaries
  for all to authenticated
  using (exists (select 1 from public.rh_acces a
                 where a.user_id = auth.uid() and a.role <> 'manager'
                   and a.resto = rh_salaries.resto and a.unite = rh_salaries.unite))
  with check (exists (select 1 from public.rh_acces a
                 where a.user_id = auth.uid() and a.role <> 'manager'
                   and a.resto = rh_salaries.resto and a.unite = rh_salaries.unite));

-- 4) Prévisionnel de recrutement : fermé aux managers.
drop policy if exists directeur_scope_previsionnel on public.rh_previsionnel;
create policy directeur_scope_previsionnel on public.rh_previsionnel
  for all to authenticated
  using (exists (select 1 from public.rh_acces a
                 where a.user_id = auth.uid() and a.role <> 'manager'
                   and a.resto = rh_previsionnel.resto and a.unite = rh_previsionnel.unite))
  with check (exists (select 1 from public.rh_acces a
                 where a.user_id = auth.uid() and a.role <> 'manager'
                   and a.resto = rh_previsionnel.resto and a.unite = rh_previsionnel.unite));

-- 5) Repos hebdo non pris : fermé aux managers (le montant y est calculé à
--    partir du salaire net).
drop policy if exists directeur_scope_repos_hebdo on public.rh_repos_hebdo;
create policy directeur_scope_repos_hebdo on public.rh_repos_hebdo
  for all to authenticated
  using (exists (select 1 from public.rh_acces a
                 where a.user_id = auth.uid() and a.role <> 'manager'
                   and a.resto = rh_repos_hebdo.resto and a.unite = rh_repos_hebdo.unite))
  with check (exists (select 1 from public.rh_acces a
                 where a.user_id = auth.uid() and a.role <> 'manager'
                   and a.resto = rh_repos_hebdo.resto and a.unite = rh_repos_hebdo.unite));

-- 6) rh_extras : INCHANGÉ. Le manager y a accès sur son périmètre, montants
--    compris — c'est la décision prise le 04/11/2026.

-- 7) Vérification : la liste des accès avec leur rôle.
-- select a.resto, a.unite, a.role, a.superviseur, u.email
-- from public.rh_acces a left join auth.users u on u.id = a.user_id
-- order by a.resto, a.unite;
