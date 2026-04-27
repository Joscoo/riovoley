-- Fase 4B - Hardening de policies: baseline auditable + deduplicacion segura
-- Fecha: 2026-04-27
-- Objetivo:
--   1) Detectar policies potencialmente redundantes de forma objetiva.
--   2) Permitir eliminar solo redundancias comprobadas (mismo predicado/roles).
--   3) Reportar policies que usan rol public para revision.
--
-- Modo de uso:
--   - Por defecto NO aplica cambios (apply_changes = false).
--   - Primero revisar salidas de auditoria.
--   - Si estas conforme, cambiar apply_changes a true y re-ejecutar.

begin;

-- Canon RBAC: helpers basados en core.users
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
-- 1) Detectar redundancias comprobadas FOR ALL vs comando
-- ==========================================================

drop table if exists temp_policy_redundancy;
create temporary table temp_policy_redundancy as
with p as (
  select
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    coalesce(qual, '') as qual,
    coalesce(with_check, '') as with_check
  from pg_policies
  where schemaname in ('core', 'billing', 'training', 'profiles', 'public_content')
),
all_policies as (
  select *
  from p
  where cmd = 'ALL'
),
cmd_policies as (
  select *
  from p
  where cmd in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
)
select
  c.schemaname,
  c.tablename,
  c.policyname as redundant_policy,
  c.cmd as redundant_cmd,
  a.policyname as covering_all_policy,
  a.cmd as covering_cmd,
  c.roles,
  c.permissive,
  c.qual,
  c.with_check
from cmd_policies c
join all_policies a
  on a.schemaname = c.schemaname
 and a.tablename = c.tablename
 and a.permissive = c.permissive
 and a.roles::text = c.roles::text
 and (
   (c.cmd = 'SELECT' and a.qual = c.qual)
   or (c.cmd = 'INSERT' and a.with_check = c.with_check)
   or (c.cmd = 'DELETE' and a.qual = c.qual)
   or (c.cmd = 'UPDATE' and a.qual = c.qual and a.with_check = c.with_check)
 );

-- ==========================================================
-- 2) Aplicar deduplicacion segura (opcional)
-- ==========================================================

do $$
declare
  apply_changes boolean := false;
  rec record;
begin
  if apply_changes then
    for rec in
      select schemaname, tablename, redundant_policy
      from temp_policy_redundancy
    loop
      execute format(
        'drop policy if exists %I on %I.%I;',
        rec.redundant_policy,
        rec.schemaname,
        rec.tablename
      );
    end loop;
  end if;
end
$$;

commit;

-- ==========================================================
-- 3) Reportes de auditoria post-ejecucion
-- ==========================================================

-- 3.1 Policies detectadas como redundantes (si esta vacio, no hay dedupe segura)
select
  schemaname,
  tablename,
  redundant_policy,
  redundant_cmd,
  covering_all_policy
from temp_policy_redundancy
order by schemaname, tablename, redundant_policy;

-- 3.2 Policies que usan rol public (normalizacion sugerida)
select
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
from pg_policies
where schemaname in ('core', 'billing', 'training', 'profiles', 'public_content')
  and roles::text like '%public%'
order by schemaname, tablename, policyname;

-- 3.3 Estado final de policies por tabla
select
  schemaname,
  tablename,
  cmd,
  count(*) as total
from pg_policies
where schemaname in ('core', 'billing', 'training', 'profiles', 'public_content')
group by schemaname, tablename, cmd
order by schemaname, tablename, cmd;
