-- Fase P4 - Verificacion de matriz de seguridad (post hardening/RLS/RBAC/policies)
-- Fecha: 2026-04-16
-- Objetivo:
--   Confirmar estado final tecnico antes de iniciar implementacion de lockout de login.
--
-- Nota:
--   Script solo lectura.

-- 1) Estado RLS en tablas criticas
select schemaname, tablename, rowsecurity as rls_enabled
from pg_tables
where (schemaname, tablename) in (
  ('public_content','announcements'),
  ('billing','payments'),
  ('core','students'),
  ('training','physical_tests'),
  ('training','schedules'),
  ('training','attendances'),
  ('profiles','user_profiles'),
  ('billing','payment_types')
)
order by schemaname, tablename;

-- 2) Policies activas en tablas funcionales
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname in ('billing','core','training','profiles','public_content')
  and tablename in (
    'payment_types','payments','students','attendances','physical_tests','schedules','user_profiles','announcements'
  )
order by schemaname, tablename, policyname;

-- 3) Grants efectivos en vistas public consumidas por app
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'users','students','user_profiles','payment_types','payments','schedules',
    'attendances','physical_tests','announcements','announcements_with_creator',
    'payments_audit','users_password_backup'
  )
order by table_name, grantee, privilege_type;

-- 4) Helpers RBAC
select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_admin','is_admin_or_trainer')
order by p.proname;

-- 5) Triggers criticos de auth/sync/auditoria
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where (event_object_schema, event_object_table) in (
  ('auth','users'),
  ('core','users'),
  ('billing','payments'),
  ('public_content','announcements'),
  ('training','physical_tests')
)
order by event_object_schema, event_object_table, trigger_name;

-- 6) Objetos minimos para iniciar lockout de login (aun no implementados)
select
  to_regclass('security.login_attempts') as login_attempts_table,
  to_regclass('security.login_blocks') as login_blocks_table,
  to_regproc('security.check_login_allowed') as check_login_allowed_fn,
  to_regproc('security.record_login_attempt') as record_login_attempt_fn;
