-- Adaptacion post-migracion por esquemas
-- Origen legacy: enable_rls_all_tables.sql
-- Fecha: 2026-04-27
-- Nota: RLS se aplica en tablas reales, no en vistas public.*.

begin;

alter table if exists core.users enable row level security;
alter table if exists core.students enable row level security;

alter table if exists billing.payments enable row level security;
alter table if exists billing.payment_types enable row level security;

alter table if exists profiles.user_profiles enable row level security;

alter table if exists training.physical_tests enable row level security;
alter table if exists training.attendances enable row level security;
alter table if exists training.schedules enable row level security;
alter table if exists training.training_cards enable row level security;
alter table if exists training.workouts enable row level security;

alter table if exists public_content.announcements enable row level security;

commit;

-- Verificacion de estado RLS en tablas objetivo
select schemaname, tablename, rowsecurity as rls_habilitado
from pg_tables
where (schemaname, tablename) in (
  ('core', 'users'),
  ('core', 'students'),
  ('billing', 'payments'),
  ('billing', 'payment_types'),
  ('profiles', 'user_profiles'),
  ('training', 'physical_tests'),
  ('training', 'attendances'),
  ('training', 'schedules'),
  ('training', 'training_cards'),
  ('training', 'workouts'),
  ('public_content', 'announcements')
)
order by schemaname, tablename;

-- Verificacion de politicas por esquemas reales
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname in ('core', 'billing', 'profiles', 'training', 'public_content')
order by schemaname, tablename, policyname;
