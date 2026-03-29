-- Compatibilidad PostgREST cuando solo public/graphql_public estan expuestos.
-- Crea vistas en public que apuntan a las tablas reales migradas por esquema.

begin;

create or replace view public.users as
select * from core.users;

create or replace view public.students as
select * from core.students;

create or replace view public.user_profiles as
select * from profiles.user_profiles;

create or replace view public.payment_types as
select * from billing.payment_types;

create or replace view public.payments as
select * from billing.payments;

create or replace view public.schedules as
select * from training.schedules;

create or replace view public.attendances as
select * from training.attendances;

create or replace view public.physical_tests as
select * from training.physical_tests;

create or replace view public.announcements as
select * from public_content.announcements;

create or replace view public.payments_audit as
select * from audit.payments_audit;

create or replace view public.users_password_backup as
select * from security.users_password_backup;

-- Permisos para que PostgREST (anon/authenticated) pueda acceder a las vistas.
grant select, insert, update, delete on
  public.users,
  public.students,
  public.user_profiles,
  public.payment_types,
  public.payments,
  public.schedules,
  public.attendances,
  public.physical_tests,
  public.announcements,
  public.payments_audit,
  public.users_password_backup
to authenticated;

grant select on
  public.users,
  public.students,
  public.user_profiles,
  public.payment_types,
  public.payments,
  public.schedules,
  public.attendances,
  public.physical_tests,
  public.announcements,
  public.payments_audit,
  public.users_password_backup
to anon;

commit;

-- Verificacion
-- select table_schema, table_name
-- from information_schema.views
-- where table_schema = 'public'
--   and table_name in (
--     'users','students','user_profiles','payment_types','payments',
--     'schedules','attendances','physical_tests','announcements',
--     'payments_audit','users_password_backup'
--   )
-- order by table_name;
