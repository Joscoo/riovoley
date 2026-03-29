-- Migracion idempotente de tablas a nuevos esquemas.
-- Fecha: 2026-03-29
-- Nota: esta migracion refleja la estructura objetivo definida en MIGRACION_ESQUEMAS.MD.

begin;

create schema if not exists core;
create schema if not exists billing;
create schema if not exists training;
create schema if not exists profiles;
create schema if not exists public_content;
create schema if not exists audit;
create schema if not exists security;

-- Mover tablas desde public al esquema destino si existen.
alter table if exists public.users set schema core;
alter table if exists public.students set schema core;

alter table if exists public.payment_types set schema billing;
alter table if exists public.payments set schema billing;

alter table if exists public.schedules set schema training;
alter table if exists public.attendances set schema training;
alter table if exists public.physical_tests set schema training;

alter table if exists public.user_profiles set schema profiles;
alter table if exists public.announcements set schema public_content;
alter table if exists public.payments_audit set schema audit;
alter table if exists public.users_password_backup set schema security;

-- Secuencias reportadas en la migracion original.
alter sequence if exists public.payment_types_id_seq set schema billing;
alter sequence if exists public.schedules_id_seq set schema training;

-- Uso minimo de esquemas para roles de Supabase.
grant usage on schema core, billing, training, profiles, public_content, audit, security to anon, authenticated, service_role;

-- Service role debe poder operar en todos los objetos de negocio.
grant all privileges on all tables in schema core, billing, training, profiles, public_content, audit, security to service_role;
grant all privileges on all sequences in schema core, billing, training, profiles, public_content, audit, security to service_role;

commit;

-- Validacion rapida post-migracion.
-- Ejecutar manualmente si quieres auditar:
-- select schemaname, tablename
-- from pg_tables
-- where tablename in ('users','students','user_profiles','payment_types','payments','schedules','attendances','physical_tests','announcements','payments_audit','users_password_backup')
-- order by schemaname, tablename;
