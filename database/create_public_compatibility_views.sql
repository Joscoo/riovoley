-- Compatibilidad PostgREST cuando solo public/graphql_public estan expuestos.
-- Crea vistas en public que apuntan a las tablas reales migradas por esquema.

begin;

grant usage on schema gamification to authenticated;
grant usage on schema gamification to anon;

do $$
declare
  users_view_sql text;
begin
  execute 'drop view if exists public.users';

  select
    'create view public.users as select ' ||
    string_agg(expr, ', ' order by ord) ||
    ' from core.users'
  into users_view_sql
  from (
    values
      (1,  'id',               'uuid'),
      (2,  'email',            'text'),
      (3,  'role',             'text'),
      (4,  'nombre',           'text'),
      (5,  'apellido',         'text'),
      (6,  'cedula',           'text'),
      (7,  'fecha_nacimiento', 'date'),
      (8,  'telefono',         'text'),
      (9,  'email_ciphertext', 'text'),
      (10, 'email_search_exact', 'text'),
      (11, 'email_search_partial', 'text[]'),
      (12, 'email_masked', 'text'),
      (13, 'telefono_ciphertext', 'text'),
      (14, 'telefono_search_exact', 'text'),
      (15, 'telefono_search_partial', 'text[]'),
      (16, 'telefono_masked', 'text'),
      (17, 'first_login',      'boolean'),
      (18, 'suspended',        'boolean'),
      (19, 'suspension_reason','text'),
      (20, 'suspension_until', 'timestamptz'),
      (21, 'suspended_at',     'timestamptz'),
      (22, 'last_login',       'timestamptz'),
      (23, 'created_at',       'timestamptz')
  ) as expected(ord, col_name, col_type)
  cross join lateral (
    select case
      when exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'core'
          and c.table_name = 'users'
          and c.column_name = expected.col_name
      ) then format('%I', expected.col_name)
      else format('null::%s as %I', expected.col_type, expected.col_name)
    end as expr
  ) resolved;

  execute users_view_sql;
end
$$;

create or replace view public.students as
select * from core.students;

create or replace view public.user_profiles as
select * from profiles.user_profiles;

create or replace view public.payment_types as
select * from billing.payment_types;

create or replace view public.payments as
select * from billing.payments;

create or replace view public.schedules as
select * from training.schedules;

create or replace view public.attendances as
select * from training.attendances;

create or replace view public.physical_tests as
select * from training.physical_tests;

create or replace view public.gamification_profiles
with (security_invoker = true) as
select * from gamification.student_profiles;

create or replace view public.gamification_reward_events
with (security_invoker = true) as
select * from gamification.reward_events;

create or replace view public.gamification_achievement_catalog
with (security_invoker = true) as
select * from gamification.achievement_catalog;

create or replace view public.gamification_student_achievements
with (security_invoker = true) as
select * from gamification.student_achievements;

create or replace view public.gamification_challenges_catalog
with (security_invoker = true) as
select * from gamification.challenges_catalog;

create or replace view public.gamification_student_challenge_progress
with (security_invoker = true) as
select * from gamification.student_challenge_progress;

create or replace view public.gamification_leaderboard_snapshots
with (security_invoker = true) as
select * from gamification.leaderboard_snapshots;

create or replace view public.gamification_leaderboard_public
with (security_invoker = true) as
select
  ls.student_id,
  ls.categoria,
  ls.age_band,
  ls.score,
  ls.current_level,
  ls.rank_position,
  ls.snapshot_date,
  upper(left(u.nombre, 1) || repeat('*', greatest(length(coalesce(u.nombre, '')) - 1, 0))) ||
    ' ' ||
    upper(left(coalesce(u.apellido, '?'), 1)) as public_alias
from gamification.leaderboard_snapshots ls
join core.students s on s.id = ls.student_id
join core.users u on u.id = s.user_id;

create or replace view public.training_categories as
select * from training.training_categories;

create or replace view public.announcements as
select * from public_content.announcements;

create or replace view public.announcements_with_creator as
select
  a.*,
  up.full_name as creator_name,
  up.role as creator_role
from public_content.announcements a
left join profiles.user_profiles up on up.id = a.created_by;

create or replace view public.payments_audit as
select * from audit.payments_audit;

create or replace view public.users_password_backup as
select * from security.users_password_backup;

-- Permisos para que PostgREST (anon/authenticated) pueda acceder a las vistas.
grant select, insert, update, delete on
  public.users,
  public.students,
  public.user_profiles,
  public.payment_types,
  public.payments,
  public.schedules,
  public.attendances,
  public.physical_tests,
  public.gamification_profiles,
  public.gamification_reward_events,
  public.gamification_achievement_catalog,
  public.gamification_student_achievements,
  public.gamification_challenges_catalog,
  public.gamification_student_challenge_progress,
  public.gamification_leaderboard_snapshots,
  public.gamification_leaderboard_public,
  public.training_categories,
  public.announcements,
  public.announcements_with_creator,
  public.payments_audit
to authenticated;

grant select on
  public.users,
  public.students,
  public.user_profiles,
  public.payment_types,
  public.payments,
  public.schedules,
  public.attendances,
  public.physical_tests,
  public.gamification_profiles,
  public.gamification_achievement_catalog,
  public.gamification_student_achievements,
  public.gamification_challenges_catalog,
  public.gamification_student_challenge_progress,
  public.gamification_leaderboard_snapshots,
  public.gamification_leaderboard_public,
  public.announcements,
  public.announcements_with_creator,
  public.payments_audit
to anon;

revoke all on public.users_password_backup from anon, authenticated;
grant select on public.users_password_backup to service_role;

grant select on
  gamification.student_profiles,
  gamification.reward_events,
  gamification.achievement_catalog,
  gamification.student_achievements,
  gamification.challenges_catalog,
  gamification.student_challenge_progress,
  gamification.leaderboard_snapshots
to authenticated;

grant insert, update, delete on
  gamification.student_profiles,
  gamification.reward_events,
  gamification.student_achievements,
  gamification.student_challenge_progress,
  gamification.leaderboard_snapshots
to authenticated;

grant select on
  gamification.achievement_catalog,
  gamification.challenges_catalog,
  gamification.leaderboard_snapshots
to anon;

commit;

-- Verificacion
 select table_schema, table_name
 from information_schema.views
 where table_schema = 'public'
   and table_name in (
     'users','students','user_profiles','payment_types','payments',
     'schedules','attendances','physical_tests','training_categories','announcements',
     'announcements_with_creator','payments_audit','users_password_backup'
   )
 order by table_name;
