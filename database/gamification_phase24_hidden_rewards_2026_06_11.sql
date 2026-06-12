begin;

create table if not exists gamification.hidden_rewards_catalog (
  slug text primary key,
  name text not null,
  teaser text not null,
  description text not null,
  hint text not null,
  target_metric text not null,
  target_value integer not null,
  reward_label text not null,
  reward_payload jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_hidden_rewards (
  student_id uuid not null references core.students(id) on delete cascade,
  reward_slug text not null references gamification.hidden_rewards_catalog(slug) on delete cascade,
  progress_value integer not null default 0,
  discovered_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (student_id, reward_slug)
);

create index if not exists gamification_student_hidden_rewards_student_id_updated_at_idx
  on gamification.student_hidden_rewards(student_id, updated_at desc);

insert into gamification.hidden_rewards_catalog (
  slug,
  name,
  teaser,
  description,
  hint,
  target_metric,
  target_value,
  reward_label,
  reward_payload
)
values
  (
    'secret_weekday_guard',
    'Guardian de la Semana',
    'Hay una recompensa para quien no deja caer el ritmo diario.',
    'Reconoce una cadena habil bien sostenida dentro del proceso real de entrenamiento.',
    'Relacionado con una constancia de dias habiles seguidos.',
    'weekday_attendance_streak',
    5,
    'Distintivo de disciplina semanal',
    '{"xp":30,"coins":8}'::jsonb
  ),
  (
    'secret_dual_focus',
    'Doble Enfoque',
    'Hay algo oculto cuando combinas progreso fisico y constancia mensual.',
    'Premia a quien no mejora solo una dimension, sino que sostiene trabajo y medicion al mismo tiempo.',
    'Se activa cuando entrenas con constancia y ya tienes base de mediciones.',
    'dual_focus_combo',
    2,
    'Huella de progreso mixto',
    '{"xp":45,"coins":12}'::jsonb
  ),
  (
    'secret_jump_hunter',
    'Cazador del Aire',
    'Una recompensa secreta espera a quienes rompen una barrera clara de salto.',
    'Premia una mejora seria de salto con carrera frente a tu propia linea base.',
    'Tiene que ver con romper una mejora importante en salto.',
    'jump_delta',
    10,
    'Prestigio oculto de salto',
    '{"xp":50,"coins":14}'::jsonb
  ),
  (
    'secret_payment_guard',
    'Guardian de Ciclo',
    'Existe una recompensa oculta para quien cuida continuidad y cobertura durante varios ciclos.',
    'Reconoce continuidad administrativa sostenida sin perder cobertura competitiva.',
    'Se relaciona con mantener varios meses cubiertos.',
    'payment_months',
    3,
    'Sello oculto de continuidad',
    '{"xp":35,"coins":10}'::jsonb
  )
on conflict (slug) do update
set
  name = excluded.name,
  teaser = excluded.teaser,
  description = excluded.description,
  hint = excluded.hint,
  target_metric = excluded.target_metric,
  target_value = excluded.target_value,
  reward_label = excluded.reward_label,
  reward_payload = excluded.reward_payload,
  is_active = true;

alter table gamification.hidden_rewards_catalog enable row level security;
alter table gamification.student_hidden_rewards enable row level security;

drop policy if exists gamification_hidden_rewards_catalog_read on gamification.hidden_rewards_catalog;
create policy gamification_hidden_rewards_catalog_read
on gamification.hidden_rewards_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_hidden_rewards_catalog_admin_write on gamification.hidden_rewards_catalog;
create policy gamification_hidden_rewards_catalog_admin_write
on gamification.hidden_rewards_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_hidden_rewards_read on gamification.student_hidden_rewards;
create policy gamification_student_hidden_rewards_read
on gamification.student_hidden_rewards
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_hidden_rewards.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_hidden_rewards_insert on gamification.student_hidden_rewards;
create policy gamification_student_hidden_rewards_insert
on gamification.student_hidden_rewards
for insert
to authenticated
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_hidden_rewards.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_hidden_rewards_update on gamification.student_hidden_rewards;
create policy gamification_student_hidden_rewards_update
on gamification.student_hidden_rewards
for update
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_hidden_rewards.student_id
      and s.user_id = auth.uid()
  )
)
with check (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_hidden_rewards.student_id
      and s.user_id = auth.uid()
  )
);

grant usage on schema gamification to authenticated;
grant select on gamification.hidden_rewards_catalog to authenticated;
grant select, insert, update on gamification.student_hidden_rewards to authenticated;

create or replace view public.gamification_hidden_rewards_catalog
with (security_invoker = true) as
select * from gamification.hidden_rewards_catalog;

create or replace view public.gamification_student_hidden_rewards
with (security_invoker = true) as
select * from gamification.student_hidden_rewards;

grant select on public.gamification_hidden_rewards_catalog to authenticated;
grant select, insert, update on public.gamification_student_hidden_rewards to authenticated;

commit;
