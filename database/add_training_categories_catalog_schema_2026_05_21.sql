-- Catalogo dinamico de categorias deportivas para horarios y atletas
-- Fecha: 2026-05-21
-- Objetivo:
-- 1) Reemplazar checks fijos por integridad referencial (FK)
-- 2) Habilitar altas de categorias via DB sin tocar DDL de checks
-- 3) Exponer vista de compatibilidad public.training_categories para PostgREST

begin;

create table if not exists training.training_categories (
  code text primary key,
  label text not null,
  default_description text,
  for_schedules boolean not null default true,
  for_students boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_categories_code_not_blank check (length(trim(code)) > 0)
);

create or replace function training.touch_training_categories_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_training_categories_updated_at on training.training_categories;
create trigger trg_training_categories_updated_at
before update on training.training_categories
for each row
execute function training.touch_training_categories_updated_at();

insert into training.training_categories (code, label, default_description, for_schedules, for_students, is_active)
values
  ('iniciacion_hombres', 'Iniciacion Hombres', 'Perfecto para quienes se inician en el voleibol. Aprende fundamentos basicos como recepcion, saque y posicionamiento.', true, true, true),
  ('iniciacion_mujeres', 'Iniciacion Mujeres', 'Ideal para principiantes que quieren aprender voleibol desde cero en un ambiente motivador.', true, true, true),
  ('perfeccionamiento_hombres', 'Perfeccionamiento Hombres', 'Para jugadores con experiencia que buscan mejorar tecnica y tactica de juego.', true, true, true),
  ('perfeccionamiento_mujeres', 'Perfeccionamiento Mujeres', 'Entrenamiento avanzado para jugadoras con bases solidas y enfoque competitivo.', true, true, true),
  ('master_mujeres', 'Master Mujeres', 'Categoria especial para atletas mayores de 18 anos con experiencia previa en voleibol.', true, true, true),
  ('open_gym', 'Open Gym', 'Sesion de juego libre para todos los niveles con enfoque recreativo y competitivo.', true, false, true)
on conflict (code) do update
set
  label = excluded.label,
  default_description = coalesce(training.training_categories.default_description, excluded.default_description),
  for_schedules = training.training_categories.for_schedules or excluded.for_schedules,
  for_students = training.training_categories.for_students or excluded.for_students;

with discovered as (
  select categoria as code, true as for_schedules, false as for_students
  from training.schedules
  where categoria is not null and trim(categoria) <> ''

  union all

  select categoria as code, false as for_schedules, true as for_students
  from core.students
  where categoria is not null and trim(categoria) <> ''
),
merged as (
  select
    code,
    bool_or(for_schedules) as for_schedules,
    bool_or(for_students) as for_students
  from discovered
  group by code
)
insert into training.training_categories (code, label, for_schedules, for_students, is_active)
select
  m.code,
  initcap(replace(m.code, '_', ' ')),
  m.for_schedules,
  m.for_students,
  true
from merged m
on conflict (code) do update
set
  for_schedules = training.training_categories.for_schedules or excluded.for_schedules,
  for_students = training.training_categories.for_students or excluded.for_students;

alter table if exists training.schedules
drop constraint if exists schedules_categoria_check;

alter table if exists core.students
drop constraint if exists students_categoria_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schedules_categoria_fkey'
      and conrelid = 'training.schedules'::regclass
  ) then
    alter table training.schedules
      add constraint schedules_categoria_fkey
      foreign key (categoria) references training.training_categories(code)
      on update cascade
      on delete restrict;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'students_categoria_fkey'
      and conrelid = 'core.students'::regclass
  ) then
    alter table core.students
      add constraint students_categoria_fkey
      foreign key (categoria) references training.training_categories(code)
      on update cascade
      on delete restrict;
  end if;
end $$;

create index if not exists idx_training_schedules_categoria on training.schedules (categoria);
create index if not exists idx_core_students_categoria on core.students (categoria);

create or replace view public.training_categories as
select
  code,
  label,
  default_description,
  for_schedules,
  for_students,
  is_active,
  created_at,
  updated_at
from training.training_categories;

alter table training.training_categories enable row level security;

drop policy if exists "Training categories can be read" on training.training_categories;
create policy "Training categories can be read"
  on training.training_categories
  for select
  to authenticated
  using (true);

drop policy if exists "Admins manage training categories" on training.training_categories;
create policy "Admins manage training categories"
  on training.training_categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update on public.training_categories to authenticated;
revoke all on public.training_categories from anon;

commit;

select pg_notify('pgrst', 'reload schema');

-- Verificacion sugerida:
select code, label, for_schedules, for_students, is_active from public.training_categories order by label;
select conname from pg_constraint where conrelid = 'training.schedules'::regclass and conname = 'schedules_categoria_fkey';
select conname from pg_constraint where conrelid = 'core.students'::regclass and conname = 'students_categoria_fkey';
