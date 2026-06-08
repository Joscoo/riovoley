begin;

create table if not exists gamification.titles_catalog (
  slug text primary key,
  name text not null,
  description text not null,
  rarity text not null default 'common',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  criteria jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_identity (
  student_id uuid primary key references core.students(id) on delete cascade,
  nickname text,
  selected_title_slug text references gamification.titles_catalog(slug) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  nickname_updated_at timestamptz,
  check (nickname is null or length(trim(nickname)) between 3 and 24)
);

create unique index if not exists gamification_student_identity_nickname_unique_idx
  on gamification.student_identity ((lower(trim(nickname))))
  where nickname is not null and length(trim(nickname)) > 0;

insert into gamification.titles_catalog (slug, name, description, rarity, sort_order, criteria)
values
  ('primer_impulso', 'Primer Impulso', 'Se desbloquea al completar tu primer test fisico.', 'common', 10, '{"type":"achievement","slug":"first_test"}'::jsonb),
  ('ritmo_firme', 'Ritmo Firme', 'Premia una base de constancia en asistencias.', 'common', 20, '{"type":"achievement","slug":"attendance_total_12"}'::jsonb),
  ('guardian_del_mes', 'Guardian del Mes', 'Reconoce una mensualidad vigente en tu progreso.', 'common', 30, '{"type":"achievement","slug":"payment_active_guard"}'::jsonb),
  ('salto_en_ascenso', 'Salto en Ascenso', 'Se obtiene al romper una mejora seria en tu salto.', 'rare', 40, '{"type":"achievement","slug":"jump_up_10"}'::jsonb),
  ('presencia_total', 'Presencia Total', 'Se obtiene con una constancia alta en entrenamientos.', 'rare', 50, '{"type":"achievement","slug":"attendance_total_24"}'::jsonb),
  ('motor_constante', 'Motor Constante', 'Se obtiene al alcanzar el nivel Constante.', 'rare', 60, '{"type":"level","min":3}'::jsonb),
  ('capitan_del_progreso', 'Capitan del Progreso', 'Reconoce a quienes ya compiten en progreso global.', 'epic', 70, '{"type":"level","min":4}'::jsonb),
  ('rey_del_salto', 'Rey del Salto', 'Premia liderar la tabla de salto con carrera.', 'epic', 80, '{"type":"leaderboard_top","board":"jump_approach"}'::jsonb),
  ('muro_del_equipo', 'Muro del Equipo', 'Premia liderar la tabla de asistencias.', 'epic', 90, '{"type":"leaderboard_top","board":"attendance_total"}'::jsonb),
  ('leyenda_riovoley', 'Leyenda Riovoley', 'Se obtiene al liderar el progreso general.', 'legendary', 100, '{"type":"leaderboard_top","board":"overall"}'::jsonb)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity,
  sort_order = excluded.sort_order,
  criteria = excluded.criteria,
  is_active = true;

alter table gamification.titles_catalog enable row level security;
alter table gamification.student_identity enable row level security;

drop policy if exists gamification_titles_catalog_read on gamification.titles_catalog;
create policy gamification_titles_catalog_read
on gamification.titles_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_titles_catalog_admin_write on gamification.titles_catalog;
create policy gamification_titles_catalog_admin_write
on gamification.titles_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_identity_read on gamification.student_identity;
create policy gamification_student_identity_read
on gamification.student_identity
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_identity.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_identity_insert on gamification.student_identity;
create policy gamification_student_identity_insert
on gamification.student_identity
for insert
to authenticated
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_identity.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_identity_update on gamification.student_identity;
create policy gamification_student_identity_update
on gamification.student_identity
for update
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_identity.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_identity.student_id
      and s.user_id = auth.uid()
  )
);

grant usage on schema gamification to authenticated;
grant select on gamification.titles_catalog to authenticated;
grant select, insert, update on gamification.student_identity to authenticated;

create or replace view public.gamification_titles_catalog
with (security_invoker = true) as
select * from gamification.titles_catalog;

create or replace view public.gamification_student_identity
with (security_invoker = true) as
select * from gamification.student_identity;

grant select on public.gamification_titles_catalog to authenticated;
grant select, insert, update on public.gamification_student_identity to authenticated;

commit;
