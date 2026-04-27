-- Fix: asegurar vista public.announcements_with_creator tras migracion por esquemas
-- Fecha: 2026-04-27

begin;

create or replace view public.announcements_with_creator as
select
  a.*,
  up.full_name as creator_name,
  up.role as creator_role
from public_content.announcements a
left join profiles.user_profiles up on up.id = a.created_by;

grant select on public.announcements_with_creator to anon, authenticated;

commit;

select pg_notify('pgrst', 'reload schema');

-- Verificacion sugerida:
-- select table_schema, table_name
-- from information_schema.views
-- where table_schema = 'public'
--   and table_name = 'announcements_with_creator';
