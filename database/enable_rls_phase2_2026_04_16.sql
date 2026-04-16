-- Fase P1 - Activacion controlada de RLS en tablas criticas
-- Fecha: 2026-04-16
-- Objetivo:
--   Activar RLS donde ya existen politicas pero hoy esta desactivado.
--
-- Tablas objetivo:
--   public_content.announcements
--   billing.payments
--   core.students
--   training.physical_tests
--   training.schedules
--
-- Recomendacion operativa:
--   Ejecutar por bloque (una tabla por vez), validar app por rol y continuar.
--
-- IMPORTANTE:
--   Si una policy depende de claims no presentes en JWT, puede bloquear acceso esperado.
--   Validar especialmente reglas con user_role/admin vs role/administrador.

begin;

-- Bloque A: Publicacion de anuncios
alter table public_content.announcements enable row level security;

commit;

-- Validacion sugerida Bloque A
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where schemaname = 'public_content' and tablename = 'announcements';


begin;

-- Bloque B: Pagos
alter table billing.payments enable row level security;

commit;

-- Validacion sugerida Bloque B
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where schemaname = 'billing' and tablename = 'payments';


begin;

-- Bloque C: Estudiantes
alter table core.students enable row level security;

commit;

-- Validacion sugerida Bloque C
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where schemaname = 'core' and tablename = 'students';


begin;

-- Bloque D: Tests fisicos
alter table training.physical_tests enable row level security;

commit;

-- Validacion sugerida Bloque D
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where schemaname = 'training' and tablename = 'physical_tests';


begin;

-- Bloque E: Horarios
alter table training.schedules enable row level security;

commit;

-- Validacion sugerida Bloque E
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where schemaname = 'training' and tablename = 'schedules';


-- Verificacion final consolidada
-- select schemaname, tablename, rowsecurity as rls_enabled
-- from pg_tables
-- where (schemaname, tablename) in (
--   ('public_content','announcements'),
--   ('billing','payments'),
--   ('core','students'),
--   ('training','physical_tests'),
--   ('training','schedules')
-- )
-- order by schemaname, tablename;
