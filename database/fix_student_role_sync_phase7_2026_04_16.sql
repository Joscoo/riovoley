-- Fase P6 - Correccion de rol de atletas (estudiante)
-- Fecha: 2026-04-16
-- Objetivo:
--   1) Evitar que nuevos atletas queden en role=usuario en profiles.user_profiles.
--   2) Eliminar mapeo estudiante->usuario en sincronizacion de roles.
--   3) Corregir historicos: perfiles usuario que realmente son atletas.
--
-- Contexto:
--   - handle_new_user insertaba role='usuario' fijo.
--   - sync_user_profile_on_user_update convertia estudiante -> usuario.

begin;

-- 1) Corregir alta automatica de perfil desde auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role_text text;
  v_role profiles.user_profiles.role%TYPE;
begin
  v_role_text := lower(trim(coalesce(new.raw_user_meta_data->>'role', '')));

  v_role := case
    when v_role_text = 'administrador' then 'administrador'
    when v_role_text = 'entrenador' then 'entrenador'
    when v_role_text = 'estudiante' then 'estudiante'
    when v_role_text = 'usuario' then 'usuario'
    else 'usuario'
  end;

  insert into profiles.user_profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    v_role
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        role = excluded.role;

  return new;
end;
$$;

-- 2) Corregir sincronizacion de rol core.users -> profiles.user_profiles
create or replace function public.sync_user_profile_on_user_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_role profiles.user_profiles.role%TYPE;
begin
  if new.role is distinct from old.role then
    v_target_role := case
      when new.role = 'administrador' then 'administrador'
      when new.role = 'admin' then 'administrador'
      when new.role = 'entrenador' then 'entrenador'
      when new.role = 'estudiante' then 'estudiante'
      when new.role = 'usuario' then 'usuario'
      else 'usuario'
    end;

    insert into profiles.user_profiles (id, full_name, role, created_at)
    values (
      new.id,
      trim(concat(new.nombre, ' ', new.apellido)),
      v_target_role,
      new.created_at
    )
    on conflict (id)
    do update set
      role = excluded.role,
      full_name = excluded.full_name;
  end if;

  return new;
end;
$$;

-- 3) Reasegurar trigger de sincronizacion
DROP TRIGGER IF EXISTS trigger_sync_user_profile ON core.users;

CREATE TRIGGER trigger_sync_user_profile
  AFTER UPDATE ON core.users
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_user_profile_on_user_update();

-- 4) Backfill historico: atletas en perfil usuario -> estudiante
update profiles.user_profiles up
set role = 'estudiante'
where up.role::text = 'usuario'
  and exists (
    select 1
    from core.students s
    join core.users u on u.id = s.user_id
    where s.user_id = up.id
      and u.role = 'estudiante'
  );

commit;

-- Verificacion sugerida post-ejecucion
-- 1) Definicion de funciones
-- select n.nspname as schema_name, p.proname as function_name, pg_get_functiondef(p.oid)
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('handle_new_user','sync_user_profile_on_user_update')
-- order by p.proname;
--
-- 2) Conteo de atletas con perfil estudiante vs usuario
-- select up.role::text as profile_role, count(*)
-- from profiles.user_profiles up
-- join core.students s on s.user_id = up.id
-- group by up.role
-- order by up.role;
