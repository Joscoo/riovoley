begin;

create schema if not exists gamification;

grant usage on schema gamification to authenticated;
grant usage on schema gamification to anon;

create table if not exists gamification.student_profiles (
  student_id uuid primary key references core.students(id) on delete cascade,
  current_level integer not null default 1 check (current_level >= 1),
  current_xp integer not null default 0 check (current_xp >= 0),
  total_xp integer not null default 0 check (total_xp >= 0),
  active_streak integer not null default 0 check (active_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_test_date date,
  last_synced_at timestamptz not null default timezone('utc', now()),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.reward_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  event_type text not null,
  xp_awarded integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (student_id, source_type, source_id, event_type)
);

create table if not exists gamification.achievement_catalog (
  slug text primary key,
  title text not null,
  description text not null,
  core_driver text not null,
  xp_reward integer not null default 0,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_achievements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  achievement_slug text not null references gamification.achievement_catalog(slug) on delete cascade,
  source_test_id uuid references training.physical_tests(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  earned_at timestamptz not null default timezone('utc', now()),
  unique (student_id, achievement_slug)
);

create table if not exists gamification.challenges_catalog (
  slug text primary key,
  title text not null,
  description text not null,
  core_driver text not null,
  target_metric text not null,
  target_value numeric not null default 0,
  window_type text not null default 'rolling',
  is_active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  challenge_slug text not null references gamification.challenges_catalog(slug) on delete cascade,
  progress_value numeric not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_id, challenge_slug)
);

create table if not exists gamification.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  categoria text not null,
  age_band text not null default 'sin-dato',
  score integer not null default 0,
  current_level integer not null default 1,
  rank_position integer not null default 0,
  snapshot_date date not null default current_date,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_id, categoria, age_band, snapshot_date)
);

insert into gamification.achievement_catalog (slug, title, description, core_driver, xp_reward, sort_order, criteria)
values
  ('first_test', 'Primer paso', 'Completa tu primer test fisico registrado.', 'Epic Meaning & Calling', 100, 10, '{"type":"tests_count","min":1}'::jsonb),
  ('two_tests', 'Vuelves a medir', 'Registra al menos dos tests para comenzar a comparar tu evolucion.', 'Development & Accomplishment', 80, 20, '{"type":"tests_count","min":2}'::jsonb),
  ('jump_up_5', 'Salto en ascenso', 'Mejora al menos 5 cm en brazo con impulso respecto a tu linea base.', 'Development & Accomplishment', 140, 30, '{"type":"delta","metric":"brazo_extend_con_impulso","min":5}'::jsonb),
  ('strength_plus_10', 'Base de fuerza', 'Mejora 10 repeticiones en al menos una prueba de fuerza.', 'Ownership & Possession', 120, 40, '{"type":"strength_delta","min":10}'::jsonb),
  ('streak_3_months', 'Constancia de 3 meses', 'Mantiene tests fisicos en tres meses consecutivos.', 'Loss & Avoidance', 160, 50, '{"type":"monthly_streak","min":3}'::jsonb),
  ('five_tests', 'Historial serio', 'Acumula cinco tests fisicos registrados.', 'Scarcity & Impatience', 180, 60, '{"type":"tests_count","min":5}'::jsonb)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  core_driver = excluded.core_driver,
  xp_reward = excluded.xp_reward,
  sort_order = excluded.sort_order,
  criteria = excluded.criteria,
  is_active = true;

insert into gamification.challenges_catalog (slug, title, description, core_driver, target_metric, target_value, window_type, is_active)
values
  ('monthly_check_in', 'Check-in mensual', 'Registra al menos un test en el mes actual.', 'Loss & Avoidance', 'monthly_tests', 1, 'calendar-month', true),
  ('jump_next_level', 'Sube tu salto', 'Mejora 3 cm tu brazo con impulso respecto a tu linea base.', 'Development & Accomplishment', 'jump_delta', 3, 'rolling', true),
  ('strength_foundation', 'Activa tu fuerza', 'Mejora 5 repeticiones en alguna prueba de fuerza.', 'Empowerment of Creativity & Feedback', 'strength_delta', 5, 'rolling', true)
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  core_driver = excluded.core_driver,
  target_metric = excluded.target_metric,
  target_value = excluded.target_value,
  window_type = excluded.window_type,
  is_active = excluded.is_active;

alter table gamification.student_profiles enable row level security;
alter table gamification.reward_events enable row level security;
alter table gamification.achievement_catalog enable row level security;
alter table gamification.student_achievements enable row level security;
alter table gamification.challenges_catalog enable row level security;
alter table gamification.student_challenge_progress enable row level security;
alter table gamification.leaderboard_snapshots enable row level security;

drop policy if exists gamification_profiles_own_read on gamification.student_profiles;
create policy gamification_profiles_own_read
on gamification.student_profiles
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_profiles.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_profiles_admin_trainer_write on gamification.student_profiles;
create policy gamification_profiles_admin_trainer_write
on gamification.student_profiles
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

drop policy if exists gamification_reward_events_read on gamification.reward_events;
create policy gamification_reward_events_read
on gamification.reward_events
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = reward_events.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_reward_events_write on gamification.reward_events;
create policy gamification_reward_events_write
on gamification.reward_events
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

drop policy if exists gamification_achievement_catalog_read on gamification.achievement_catalog;
create policy gamification_achievement_catalog_read
on gamification.achievement_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_achievement_catalog_admin_write on gamification.achievement_catalog;
create policy gamification_achievement_catalog_admin_write
on gamification.achievement_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_achievements_read on gamification.student_achievements;
create policy gamification_student_achievements_read
on gamification.student_achievements
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_achievements.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_achievements_write on gamification.student_achievements;
create policy gamification_student_achievements_write
on gamification.student_achievements
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

drop policy if exists gamification_challenges_catalog_read on gamification.challenges_catalog;
create policy gamification_challenges_catalog_read
on gamification.challenges_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_challenges_catalog_admin_write on gamification.challenges_catalog;
create policy gamification_challenges_catalog_admin_write
on gamification.challenges_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_challenge_progress_read on gamification.student_challenge_progress;
create policy gamification_student_challenge_progress_read
on gamification.student_challenge_progress
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_challenge_progress.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_challenge_progress_write on gamification.student_challenge_progress;
create policy gamification_student_challenge_progress_write
on gamification.student_challenge_progress
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

drop policy if exists gamification_leaderboard_read on gamification.leaderboard_snapshots;
create policy gamification_leaderboard_read
on gamification.leaderboard_snapshots
for select
to authenticated
using (true);

drop policy if exists gamification_leaderboard_write on gamification.leaderboard_snapshots;
create policy gamification_leaderboard_write
on gamification.leaderboard_snapshots
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

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

grant select on
  public.gamification_profiles,
  public.gamification_reward_events,
  public.gamification_achievement_catalog,
  public.gamification_student_achievements,
  public.gamification_challenges_catalog,
  public.gamification_student_challenge_progress,
  public.gamification_leaderboard_snapshots,
  public.gamification_leaderboard_public
to authenticated;

grant insert, update, delete on
  public.gamification_profiles,
  public.gamification_reward_events,
  public.gamification_student_achievements,
  public.gamification_student_challenge_progress,
  public.gamification_leaderboard_snapshots
to authenticated;

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
