begin;

create table if not exists gamification.campaigns_catalog (
  slug text primary key,
  name text not null,
  description text not null,
  focus_area text not null,
  window_type text not null default 'weekly',
  target_metric text not null,
  target_value integer not null,
  reward_label text not null,
  reward_payload jsonb not null default '{}'::jsonb,
  hint text,
  is_secret boolean not null default false,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  check (window_type in ('weekly', 'monthly', 'flash'))
);

create table if not exists gamification.student_campaign_progress (
  student_id uuid not null references core.students(id) on delete cascade,
  campaign_slug text not null references gamification.campaigns_catalog(slug) on delete cascade,
  progress_value integer not null default 0,
  is_completed boolean not null default false,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (student_id, campaign_slug)
);

create index if not exists gamification_student_campaign_progress_student_id_updated_at_idx
  on gamification.student_campaign_progress(student_id, updated_at desc);

insert into gamification.campaigns_catalog (
  slug,
  name,
  description,
  focus_area,
  window_type,
  target_metric,
  target_value,
  reward_label,
  reward_payload,
  hint,
  is_secret,
  start_date,
  end_date
)
values
  (
    'weekly_attendance_burst',
    'Semana de presencia',
    'Suma 3 asistencias en esta semana para mantener el ritmo bien alto.',
    'Constancia',
    'weekly',
    'attendance_window',
    3,
    'Impulso extra de presencia',
    '{"xp":35,"coins":10}'::jsonb,
    'Te conviene cerrar este bloque antes de que acabe la semana.',
    false,
    '2026-06-08',
    '2026-06-14'
  ),
  (
    'weekly_test_spotlight',
    'Semana de medicion',
    'Registra al menos 1 test esta semana para renovar tu referencia competitiva.',
    'Medicion',
    'weekly',
    'tests_window',
    1,
    'Ventana de medicion activada',
    '{"xp":30,"coins":8}'::jsonb,
    'Una medicion esta semana empuja varias recompensas a la vez.',
    false,
    '2026-06-08',
    '2026-06-14'
  ),
  (
    'june_combo_flash',
    'Combo de junio',
    'Combina test, asistencia fuerte y cobertura activa dentro del mismo mes.',
    'Combo',
    'monthly',
    'monthly_combo_window',
    3,
    'Combo mensual de alto impacto',
    '{"xp":70,"coins":20}'::jsonb,
    'Si cierras los tres frentes este mes, abres una de las recompensas mas fuertes.',
    false,
    '2026-06-01',
    '2026-06-30'
  ),
  (
    'overall_top3_push',
    'Asalto al top 3',
    'Entra al top 3 general antes de que cierre junio.',
    'Competencia',
    'monthly',
    'overall_rank_top',
    3,
    'Prestigio competitivo general',
    '{"title":"top3-general","cosmetic":"badge_top3_general"}'::jsonb,
    'Cada puesto ganado aqui cambia tu visibilidad competitiva.',
    false,
    '2026-06-01',
    '2026-06-30'
  ),
  (
    'attendance_podium_push',
    'Podio de asistencia',
    'Metete al top 3 del ranking mensual de asistencias.',
    'Competencia',
    'monthly',
    'attendance_rank_top',
    3,
    'Presencia visible en el podio',
    '{"title":"attendance-podium"}'::jsonb,
    'Esta campaña premia una constancia que otros pueden ver.',
    false,
    '2026-06-01',
    '2026-06-30'
  ),
  (
    'coverage_flash_guard',
    'Cobertura viva',
    'Mantén cobertura activa antes de que termine el ciclo actual.',
    'Cobertura',
    'flash',
    'active_coverage_window',
    1,
    'Proteccion de continuidad',
    '{"xp":20,"coins":6}'::jsonb,
    'Si dejas pasar esta ventana, enfrías varias rutas a la vez.',
    false,
    '2026-06-01',
    '2026-06-30'
  )
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  focus_area = excluded.focus_area,
  window_type = excluded.window_type,
  target_metric = excluded.target_metric,
  target_value = excluded.target_value,
  reward_label = excluded.reward_label,
  reward_payload = excluded.reward_payload,
  hint = excluded.hint,
  is_secret = excluded.is_secret,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  is_active = true;

alter table gamification.campaigns_catalog enable row level security;
alter table gamification.student_campaign_progress enable row level security;

drop policy if exists gamification_campaigns_catalog_read on gamification.campaigns_catalog;
create policy gamification_campaigns_catalog_read
on gamification.campaigns_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_campaigns_catalog_admin_write on gamification.campaigns_catalog;
create policy gamification_campaigns_catalog_admin_write
on gamification.campaigns_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_campaign_progress_read on gamification.student_campaign_progress;
create policy gamification_student_campaign_progress_read
on gamification.student_campaign_progress
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_campaign_progress.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_campaign_progress_insert on gamification.student_campaign_progress;
create policy gamification_student_campaign_progress_insert
on gamification.student_campaign_progress
for insert
to authenticated
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_campaign_progress.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_campaign_progress_update on gamification.student_campaign_progress;
create policy gamification_student_campaign_progress_update
on gamification.student_campaign_progress
for update
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_campaign_progress.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_campaign_progress.student_id
      and s.user_id = auth.uid()
  )
);

grant usage on schema gamification to authenticated;
grant select on gamification.campaigns_catalog to authenticated;
grant select, insert, update on gamification.student_campaign_progress to authenticated;

create or replace view public.gamification_campaigns_catalog
with (security_invoker = true) as
select * from gamification.campaigns_catalog;

create or replace view public.gamification_student_campaign_progress
with (security_invoker = true) as
select * from gamification.student_campaign_progress;

grant select on public.gamification_campaigns_catalog to authenticated;
grant select, insert, update on public.gamification_student_campaign_progress to authenticated;

commit;
