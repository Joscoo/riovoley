-- Fase 4C - Hardening quirurgico tras auditoria real
-- Fecha: 2026-04-27
-- Entrada esperada de Fase 4B:
--   - 1 policy redundante detectada en profiles.user_profiles
--   - policies de public_content.announcements con rol public en escritura
--
-- Objetivo:
--   1) Eliminar la redundancia confirmada.
--   2) Endurecer escritura de announcements a rol authenticated.
--   3) Mantener lectura publica de anuncios activos.

begin;

-- 1) Deduplicacion confirmada por auditoria 4B
-- Cubierta por: "Admins can manage all profiles" (FOR ALL)
drop policy if exists "Admins can view all profiles" on profiles.user_profiles;

-- 2) Endurecimiento de announcements
-- Mantener lectura publica (anon + authenticated) de anuncios activos.
-- Restringir INSERT/UPDATE/DELETE a authenticated con reglas RBAC canonicas.

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

-- Verificacion 1: announcements con cmd y roles esperados
select schemaname, tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public_content'
  and tablename = 'announcements'
order by policyname;

-- Verificacion 2: no debe existir policy redundante en profiles.user_profiles
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'profiles'
  and tablename = 'user_profiles'
  and policyname = 'Admins can view all profiles';
