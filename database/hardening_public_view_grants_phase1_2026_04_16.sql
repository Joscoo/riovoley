-- Fase P0 - Hardening de grants en vistas de compatibilidad public.*
-- Fecha: 2026-04-16
-- Objetivo:
--   1) Quitar privilegios peligrosos a anon y authenticated.
--   2) Mantener funcionamiento actual de app con privilegios minimos necesarios.
--   3) Mantener users_password_backup restringida.
--
-- Nota:
--   Este script NO activa RLS ni modifica politicas.
--   Se recomienda ejecutar primero en staging y validar flujos por rol.

begin;

-- 1) Revocar todo sobre vistas de compatibilidad relevantes
revoke all on
  public.users,
  public.students,
  public.user_profiles,
  public.payment_types,
  public.payments,
  public.schedules,
  public.attendances,
  public.physical_tests,
  public.announcements,
  public.announcements_with_creator,
  public.payments_audit
from anon, authenticated;

-- 2) Reforzar objeto sensible
revoke all on public.users_password_backup from anon, authenticated;

-- 3) Permisos minimos para anon (solo lectura publica)
grant select on
  public.announcements,
  public.announcements_with_creator,
  public.schedules
to anon;

-- 4) Permisos para authenticated
-- Mantener CRUD en vistas de negocio usadas por paneles.
grant select, insert, update, delete on
  public.users,
  public.students,
  public.user_profiles,
  public.payment_types,
  public.payments,
  public.schedules,
  public.attendances,
  public.physical_tests,
  public.announcements
to authenticated;

-- Vista de lectura para anuncios con datos de creador.
grant select on public.announcements_with_creator to authenticated;

-- Auditoria de pagos: solo lectura para usuarios autenticados.
grant select on public.payments_audit to authenticated;

-- Backup sensible: solo service_role y postgres.
-- (si ya existe grant select para service_role, esta linea es idempotente)
grant select on public.users_password_backup to service_role;

commit;

-- Verificacion sugerida post-ejecucion
-- select table_name, grantee, privilege_type
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and table_name in (
--     'users','students','user_profiles','payment_types','payments',
--     'schedules','attendances','physical_tests','announcements',
--     'announcements_with_creator','payments_audit','users_password_backup'
--   )
-- order by table_name, grantee, privilege_type;
