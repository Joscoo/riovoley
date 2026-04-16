-- Fase P5 - Lockout de login por intentos fallidos
-- Fecha: 2026-04-16
-- Objetivo:
--   Bloquear temporalmente por email durante 60s despues de 5 intentos fallidos en ventana de 60s.
--
-- Diseno:
--   - Tablas en esquema security (auditoria y bloqueos)
--   - RPCs en schema public para consumo desde frontend (Supabase rpc)
--   - Funciones SECURITY DEFINER con search_path seguro

begin;

create schema if not exists security;

create table if not exists security.login_attempts (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  attempt_at timestamptz not null default now(),
  success boolean not null,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists security.login_blocks (
  user_email text primary key,
  blocked_at timestamptz not null default now(),
  locked_until timestamptz not null,
  reason text,
  failed_attempts_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_login_attempts_email_time
  on security.login_attempts (user_email, attempt_at desc);

create index if not exists idx_login_attempts_recent_failed
  on security.login_attempts (user_email, attempt_at desc)
  where success = false;

create index if not exists idx_login_blocks_locked_until
  on security.login_blocks (locked_until);

-- Endurecer acceso directo a tablas
revoke all on security.login_attempts from anon, authenticated;
revoke all on security.login_blocks from anon, authenticated;

grant select, insert, update, delete on security.login_attempts to service_role;
grant select, insert, update, delete on security.login_blocks to service_role;

-- RPC de pre-check: bloquea intento si existe lock activo
create or replace function public.check_login_allowed(p_email text)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining_attempts integer,
  block_reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_locked_until timestamptz;
  v_failed_count integer := 0;
  v_retry integer := 0;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if v_email = '' then
    return query select false, 0, 0, 'Email invalido';
    return;
  end if;

  select lb.locked_until
    into v_locked_until
  from security.login_blocks lb
  where lb.user_email = v_email
    and lb.locked_until > now();

  if v_locked_until is not null then
    v_retry := greatest(0, ceil(extract(epoch from (v_locked_until - now())))::integer);
    return query
      select false, v_retry, 0, 'Demasiados intentos fallidos. Bloqueo temporal activo.';
    return;
  end if;

  select count(*)::integer
    into v_failed_count
  from security.login_attempts la
  where la.user_email = v_email
    and la.success = false
    and la.attempt_at > now() - interval '60 seconds';

  return query
    select true, 0, greatest(0, 5 - v_failed_count), null::text;
end;
$$;

-- RPC de registro: persiste intento y aplica/limpia lock
create or replace function public.record_login_attempt(
  p_email text,
  p_success boolean,
  p_error_code text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_failed_count integer := 0;
begin
  v_email := lower(trim(coalesce(p_email, '')));

  if v_email = '' then
    return;
  end if;

  insert into security.login_attempts (user_email, success, error_code)
  values (v_email, coalesce(p_success, false), p_error_code);

  if coalesce(p_success, false) then
    delete from security.login_blocks where user_email = v_email;
    return;
  end if;

  select count(*)::integer
    into v_failed_count
  from security.login_attempts la
  where la.user_email = v_email
    and la.success = false
    and la.attempt_at > now() - interval '60 seconds';

  if v_failed_count >= 5 then
    insert into security.login_blocks (
      user_email, blocked_at, locked_until, reason, failed_attempts_count, updated_at
    )
    values (
      v_email,
      now(),
      now() + interval '1 minute',
      'max_failed_attempts_5_in_60s',
      v_failed_count,
      now()
    )
    on conflict (user_email)
    do update set
      blocked_at = excluded.blocked_at,
      locked_until = excluded.locked_until,
      reason = excluded.reason,
      failed_attempts_count = excluded.failed_attempts_count,
      updated_at = excluded.updated_at;
  end if;
end;
$$;

-- Permitir RPC desde frontend (anon/authenticated)
revoke all on function public.check_login_allowed(text) from public;
revoke all on function public.record_login_attempt(text, boolean, text) from public;

grant execute on function public.check_login_allowed(text) to anon, authenticated, service_role;
grant execute on function public.record_login_attempt(text, boolean, text) to anon, authenticated, service_role;

commit;

-- Verificacion sugerida post-ejecucion
-- select to_regclass('security.login_attempts') as login_attempts_table,
--        to_regclass('security.login_blocks') as login_blocks_table,
--        to_regproc('public.check_login_allowed') as check_login_allowed_fn,
--        to_regproc('public.record_login_attempt') as record_login_attempt_fn;
