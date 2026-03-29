-- Hotfix para error 500 en login: "Database error granting user"
-- Contexto: tras migrar tablas fuera de public, algunos triggers sobre auth.users
-- seguian actualizando public.users/public.user_profiles, causando fallos en auth.

begin;

-- 1) Sincronizacion de last_login -> core.users
create or replace function public.sync_last_login_from_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update core.users
    set last_login = new.last_sign_in_at
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_sync_last_login_from_auth on auth.users;
create trigger trigger_sync_last_login_from_auth
after update of last_sign_in_at on auth.users
for each row
when (old.last_sign_in_at is distinct from new.last_sign_in_at)
execute function public.sync_last_login_from_auth();

-- 2) Sincronizacion de first_login -> core.users
create or replace function public.sync_first_login_on_password_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update core.users
    set first_login = false
    where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_sync_first_login_on_password_change on auth.users;
create trigger trigger_sync_first_login_on_password_change
after update of encrypted_password on auth.users
for each row
when (old.encrypted_password is distinct from new.encrypted_password)
execute function public.sync_first_login_on_password_change();

-- 3) Alta automatica de perfil -> profiles.user_profiles
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into profiles.user_profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'usuario'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

commit;

-- Verificacion rapida post-fix
-- select trigger_name, event_object_schema, event_object_table, action_statement
-- from information_schema.triggers
-- where event_object_schema = 'auth'
--   and event_object_table = 'users'
-- order by trigger_name;
