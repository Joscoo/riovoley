-- Baseline canonico post-migracion por esquemas
-- Fecha: 2026-04-27
-- Objetivo: dejar un entorno en estado funcional y seguro validado en fase 1..4C.
-- Nota: script idempotente en la mayor parte de operaciones.

begin;

-- ==========================================================
-- 1) Esquemas y migracion base
-- ==========================================================

create schema if not exists core;
create schema if not exists billing;
create schema if not exists training;
create schema if not exists profiles;
create schema if not exists public_content;
create schema if not exists audit;
create schema if not exists security;

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

alter sequence if exists public.payment_types_id_seq set schema billing;
alter sequence if exists public.schedules_id_seq set schema training;

grant usage on schema core, billing, training, profiles, public_content, audit, security to anon, authenticated, service_role;
grant all privileges on all tables in schema core, billing, training, profiles, public_content, audit, security to service_role;
grant all privileges on all sequences in schema core, billing, training, profiles, public_content, audit, security to service_role;

-- ==========================================================
-- 2) Ajustes de modelo de datos post-migracion
-- ==========================================================

-- schedules.descripcion
alter table if exists training.schedules
add column if not exists descripcion text;

update training.schedules
set descripcion = case categoria
  when 'iniciacion_hombres' then 'Perfecto para quienes se inician en el voleibol. Aprende los fundamentos basicos: recepcion, saque, golpe de dedos, antebrazo y posicionamiento en cancha. Entrenamiento progresivo y didactico.'
  when 'iniciacion_mujeres' then 'Ideal para principiantes que quieren aprender voleibol desde cero. Desarrolla tecnica basica, coordinacion y trabajo en equipo en un ambiente motivador y de apoyo constante.'
  when 'perfeccionamiento_hombres' then 'Para jugadores con experiencia que buscan mejorar su tecnica y tactica de juego. Enfoque en remates, bloqueos, sistemas defensivos y estrategias avanzadas de competicion.'
  when 'perfeccionamiento_mujeres' then 'Entrenamiento avanzado para jugadoras con bases solidas. Perfecciona tus habilidades tecnicas, lee el juego rival, mejora tu tactica individual y colectiva para competir al maximo nivel.'
  when 'master_mujeres' then 'Categoria especial para atletas mayores de 18 anos con experiencia previa en voleibol. Manten tu nivel competitivo, mejora tu condicion fisica y disfruta del juego con companeras de tu edad y experiencia.'
  when 'open_gym' then 'Sesion de juego libre para todos los niveles. Practica lo aprendido, conoce jugadores de diferentes categorias y disfruta partidos recreativos en un ambiente divertido y competitivo.'
  else null
end
where descripcion is null;

-- open_gym como categoria canonica
update training.schedules
set categoria = 'open_gym'
where categoria in ('juego_sabado', 'juego_domingo');

alter table if exists training.schedules
drop constraint if exists schedules_categoria_check;

alter table if exists training.schedules
add constraint schedules_categoria_check
check (categoria in (
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'master_mujeres',
  'open_gym'
));

-- Campos de fuerza en tests fisicos
alter table if exists training.physical_tests
add column if not exists fuerza_abdomen integer null,
add column if not exists fuerza_brazos integer null,
add column if not exists fuerza_piernas integer null,
add column if not exists elevaciones_barra integer null;

comment on column training.physical_tests.fuerza_abdomen is 'Cantidad de abdominales en un minuto';
comment on column training.physical_tests.fuerza_brazos is 'Cantidad de flexiones de brazo en un minuto';
comment on column training.physical_tests.fuerza_piernas is 'Cantidad de sentadillas en un minuto';
comment on column training.physical_tests.elevaciones_barra is 'Cantidad maxima de elevaciones en barra en un minuto';

alter table if exists training.physical_tests
drop constraint if exists check_fuerza_abdomen,
drop constraint if exists check_fuerza_brazos,
drop constraint if exists check_fuerza_piernas,
drop constraint if exists check_elevaciones_barra;

alter table if exists training.physical_tests
add constraint check_fuerza_abdomen check (fuerza_abdomen is null or (fuerza_abdomen >= 0 and fuerza_abdomen <= 200)),
add constraint check_fuerza_brazos check (fuerza_brazos is null or (fuerza_brazos >= 0 and fuerza_brazos <= 200)),
add constraint check_fuerza_piernas check (fuerza_piernas is null or (fuerza_piernas >= 0 and fuerza_piernas <= 300)),
add constraint check_elevaciones_barra check (elevaciones_barra is null or (elevaciones_barra >= 0 and elevaciones_barra <= 100));

-- Limpieza de columnas legacy en students
alter table if exists core.students
drop column if exists altura,
drop column if exists peso;

-- ==========================================================
-- 3) Helpers RBAC canonicos
-- ==========================================================

create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from core.users u
    where u.id = auth.uid()
      and u.role in ('administrador', 'admin')
  );
end;
$$;

create or replace function public.is_admin_or_trainer()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return exists (
    select 1
    from core.users u
    where u.id = auth.uid()
      and u.role in ('administrador', 'admin', 'entrenador')
  );
end;
$$;

-- ==========================================================
-- 4) Vistas de compatibilidad public.* y grants
-- ==========================================================

do $$
declare
  users_view_sql text;
begin
  execute 'drop view if exists public.users';

  select
    'create view public.users as select ' ||
    string_agg(expr, ', ' order by ord) ||
    ' from core.users'
  into users_view_sql
  from (
    values
      (1,  'id',               'uuid'),
      (2,  'email',            'text'),
      (3,  'role',             'text'),
      (4,  'nombre',           'text'),
      (5,  'apellido',         'text'),
      (6,  'cedula',           'text'),
      (7,  'fecha_nacimiento', 'date'),
      (8,  'telefono',         'text'),
      (9,  'email_ciphertext', 'text'),
      (10, 'email_search_exact', 'text'),
      (11, 'email_search_partial', 'text[]'),
      (12, 'email_masked', 'text'),
      (13, 'telefono_ciphertext', 'text'),
      (14, 'telefono_search_exact', 'text'),
      (15, 'telefono_search_partial', 'text[]'),
      (16, 'telefono_masked', 'text'),
      (17, 'first_login',      'boolean'),
      (18, 'suspended',        'boolean'),
      (19, 'suspension_reason','text'),
      (20, 'suspension_until', 'timestamptz'),
      (21, 'suspended_at',     'timestamptz'),
      (22, 'last_login',       'timestamptz'),
      (23, 'created_at',       'timestamptz')
  ) as expected(ord, col_name, col_type)
  cross join lateral (
    select case
      when exists (
        select 1
        from information_schema.columns c
        where c.table_schema = 'core'
          and c.table_name = 'users'
          and c.column_name = expected.col_name
      ) then format('%I', expected.col_name)
      else format('null::%s as %I', expected.col_type, expected.col_name)
    end as expr
  ) resolved;

  execute users_view_sql;
end
$$;

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

create or replace view public.announcements_with_creator as
select
  a.*,
  up.full_name as creator_name,
  up.role as creator_role
from public_content.announcements a
left join profiles.user_profiles up on up.id = a.created_by;

create or replace view public.payments_audit as
select * from audit.payments_audit;

create or replace view public.users_password_backup as
select * from security.users_password_backup;

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
  public.announcements_with_creator,
  public.payments_audit
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
  public.announcements_with_creator,
  public.payments_audit
to anon;

revoke all on public.users_password_backup from anon, authenticated;
grant select on public.users_password_backup to service_role;

-- ==========================================================
-- 5) RLS en tablas reales
-- ==========================================================

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

-- ==========================================================
-- 6) Hardening puntual de policies (Fase 4C)
-- ==========================================================

drop policy if exists "Admins can view all profiles" on profiles.user_profiles;

drop policy if exists "Admins y entrenadores pueden crear anuncios" on public_content.announcements;
drop policy if exists "Creador, admins y entrenadores pueden actualizar anuncios" on public_content.announcements;
drop policy if exists "Solo admins pueden eliminar anuncios" on public_content.announcements;
drop policy if exists "Todos pueden ver anuncios activos" on public_content.announcements;

create policy "Todos pueden ver anuncios activos"
on public_content.announcements
for select
to public
using (is_active = true or public.is_admin_or_trainer());

create policy "Admins y entrenadores pueden crear anuncios"
on public_content.announcements
for insert
to authenticated
with check (public.is_admin_or_trainer());

create policy "Creador, admins y entrenadores pueden actualizar anuncios"
on public_content.announcements
for update
to authenticated
using (created_by = auth.uid() or public.is_admin_or_trainer())
with check (created_by = auth.uid() or public.is_admin_or_trainer());

create policy "Solo admins pueden eliminar anuncios"
on public_content.announcements
for delete
to authenticated
using (public.is_admin());

commit;

-- Refrescar cache PostgREST
select pg_notify('pgrst', 'reload schema');

-- ==========================================================
-- 7) Verificacion rapida
-- ==========================================================

-- Vistas de compatibilidad
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in (
    'users','students','user_profiles','payment_types','payments',
    'schedules','attendances','physical_tests','announcements',
    'announcements_with_creator','payments_audit','users_password_backup'
  )
order by table_name;

-- schedules.descripcion
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

-- announcements_with_creator
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'announcements_with_creator'
    and column_name = 'creator_name'
) as announcements_with_creator_has_creator_name;

-- grants public.* anon/authenticated
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
