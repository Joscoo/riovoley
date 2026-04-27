-- Auditoria Fase 1: verificar consistencia de vistas public.* con tablas migradas
-- Fecha: 2026-04-27

-- 1) Vistas de compatibilidad esperadas
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in (
    'users','students','user_profiles','payment_types','payments',
    'schedules','attendances','physical_tests','announcements',
    'announcements_with_creator','payments_audit','users_password_backup'
  )
order by table_name;

-- 2) Columna critica despues del fix de horarios
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'training'
    and table_name = 'schedules'
    and column_name = 'descripcion'
) as training_schedules_has_descripcion;

select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'schedules'
    and column_name = 'descripcion'
) as public_schedules_has_descripcion;

-- 3) Validar que la vista de anuncios enriquecida expone metadata de creador
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'announcements_with_creator'
    and column_name = 'creator_name'
) as announcements_with_creator_has_creator_name;

-- 4) Permisos de vistas public para anon/authenticated (resumen)
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in (
    'users','students','user_profiles','payment_types','payments',
    'schedules','attendances','physical_tests','announcements',
    'announcements_with_creator','payments_audit','users_password_backup'
  )
group by table_name, grantee
order by table_name, grantee;
