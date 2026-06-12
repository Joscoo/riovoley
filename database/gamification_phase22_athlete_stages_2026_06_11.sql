begin;

create table if not exists gamification.athlete_stages_catalog (
  slug text primary key,
  name text not null,
  description text not null,
  progress_hint_template text not null,
  sort_order integer not null,
  min_level integer not null default 1,
  min_tests integer not null default 0,
  min_attendances integer not null default 0,
  min_payments integer not null default 0,
  min_achievements integer not null default 0,
  requires_leaderboard_presence boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_current_stage (
  student_id uuid primary key references core.students(id) on delete cascade,
  current_stage_slug text not null references gamification.athlete_stages_catalog(slug) on delete restrict,
  progress_hint text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_stage_history (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  stage_slug text not null references gamification.athlete_stages_catalog(slug) on delete restrict,
  awarded_at timestamptz not null default timezone('utc', now()),
  awarded_reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  unique (student_id, stage_slug)
);

create index if not exists gamification_student_stage_history_student_id_awarded_at_idx
  on gamification.student_stage_history(student_id, awarded_at desc);

insert into gamification.athlete_stages_catalog (
  slug,
  name,
  description,
  progress_hint_template,
  sort_order,
  min_level,
  min_tests,
  min_attendances,
  min_payments,
  min_achievements,
  requires_leaderboard_presence
)
values
  ('semilla', 'Semilla', 'Estas construyendo tu base inicial.', 'Completa tus primeras acciones verificadas para dejar de estar en blanco.', 10, 1, 0, 0, 0, 0, false),
  ('en_marcha', 'En Marcha', 'Ya tienes actividad real en el sistema.', 'Te falta consolidar constancia para alcanzar la siguiente etapa.', 20, 1, 1, 4, 1, 0, false),
  ('constante', 'Constante', 'Tu progreso ya no es aislado.', 'Sostener asistencia, tests y logros te acercara a competir visiblemente.', 30, 2, 2, 8, 1, 1, false),
  ('competidor', 'Competidor', 'Ya entraste en la pelea visible.', 'Sube tu impacto con mas logros y presencia competitiva.', 40, 3, 3, 12, 2, 3, true),
  ('impacto', 'Impacto', 'Tu presencia ya influye en el entorno.', 'Te falta consolidar una base fuerte para convertirte en referente.', 50, 4, 4, 18, 3, 5, true),
  ('referente', 'Referente', 'Tu progreso ya sirve de referencia para otros.', 'Sigue defendiendo tu presencia para sostener tu lugar.', 60, 5, 5, 24, 4, 8, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  progress_hint_template = excluded.progress_hint_template,
  sort_order = excluded.sort_order,
  min_level = excluded.min_level,
  min_tests = excluded.min_tests,
  min_attendances = excluded.min_attendances,
  min_payments = excluded.min_payments,
  min_achievements = excluded.min_achievements,
  requires_leaderboard_presence = excluded.requires_leaderboard_presence,
  is_active = true;

alter table gamification.athlete_stages_catalog enable row level security;
alter table gamification.student_current_stage enable row level security;
alter table gamification.student_stage_history enable row level security;

drop policy if exists gamification_athlete_stages_catalog_read on gamification.athlete_stages_catalog;
create policy gamification_athlete_stages_catalog_read
on gamification.athlete_stages_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_athlete_stages_catalog_admin_write on gamification.athlete_stages_catalog;
create policy gamification_athlete_stages_catalog_admin_write
on gamification.athlete_stages_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_current_stage_read on gamification.student_current_stage;
create policy gamification_student_current_stage_read
on gamification.student_current_stage
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_current_stage.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_current_stage_insert on gamification.student_current_stage;
create policy gamification_student_current_stage_insert
on gamification.student_current_stage
for insert
to authenticated
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_current_stage.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_current_stage_update on gamification.student_current_stage;
create policy gamification_student_current_stage_update
on gamification.student_current_stage
for update
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_current_stage.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_current_stage.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_stage_history_read on gamification.student_stage_history;
create policy gamification_student_stage_history_read
on gamification.student_stage_history
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_stage_history.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_stage_history_insert on gamification.student_stage_history;
create policy gamification_student_stage_history_insert
on gamification.student_stage_history
for insert
to authenticated
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_stage_history.student_id
      and s.user_id = auth.uid()
  )
);

grant usage on schema gamification to authenticated;
grant select on gamification.athlete_stages_catalog to authenticated;
grant select, insert, update on gamification.student_current_stage to authenticated;
grant select, insert on gamification.student_stage_history to authenticated;

create or replace view public.gamification_athlete_stages_catalog
with (security_invoker = true) as
select * from gamification.athlete_stages_catalog;

create or replace view public.gamification_student_current_stage
with (security_invoker = true) as
select * from gamification.student_current_stage;

create or replace view public.gamification_student_stage_history
with (security_invoker = true) as
select * from gamification.student_stage_history;

grant select on
  public.gamification_athlete_stages_catalog,
  public.gamification_student_current_stage,
  public.gamification_student_stage_history
to authenticated;

commit;
