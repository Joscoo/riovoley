-- Fase P2 - Normalizacion RBAC (claims y helpers)
-- Fecha: 2026-04-16
-- Objetivo:
--   1) Estandarizar funciones helper de autorizacion.
--   2) Reducir dependencia de claims JWT inconsistentes (user_role/admin vs role/administrador).
--   3) Reemplazar politicas puntuales que aun dependen de auth.jwt()->>'user_role' = 'admin'.
--
-- Alcance de esta fase:
--   - Actualiza public.is_admin() y public.is_admin_or_trainer() para usar tabla canonica core.users.
--   - Reemplaza policies legacy en billing.payment_types, core.students y training.schedules.
--
-- Nota:
--   Este script no elimina todas las politicas duplicadas del sistema. Eso se aborda en una fase posterior.

begin;

-- 1) Helpers RBAC canonicos
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

-- 2) Reemplazo de policies legacy basadas en user_role/admin

-- billing.payment_types
-- Antes: auth.jwt()->>'user_role' = 'admin'
drop policy if exists "Admins manage payment types" on billing.payment_types;
create policy "Admins manage payment types"
on billing.payment_types
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- core.students
-- Antes: auth.jwt()->>'user_role' = 'admin'
drop policy if exists "Admins can manage all student records" on core.students;
create policy "Admins can manage all student records"
on core.students
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- training.schedules
-- Antes: auth.jwt()->>'user_role' = 'admin'
drop policy if exists "Admins manage schedules" on training.schedules;
create policy "Admins manage schedules"
on training.schedules
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

commit;

-- Verificacion sugerida post-ejecucion
-- 1) Funciones
-- select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid)
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('is_admin','is_admin_or_trainer');
--
-- 2) Policies normalizadas
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where (schemaname, tablename, policyname) in (
--   ('billing','payment_types','Admins manage payment types'),
--   ('core','students','Admins can manage all student records'),
--   ('training','schedules','Admins manage schedules')
-- )
-- order by schemaname, tablename, policyname;
