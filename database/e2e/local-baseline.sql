-- SOLO PARA SUPABASE E2E LOCAL. Estructura sin datos institucionales.
-- Origen: SELECT de catálogos, 2026-10-28. No aplicar a producción.
BEGIN;
SET check_function_bodies = false;
SET search_path = public, extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS "audit";
CREATE SCHEMA IF NOT EXISTS "billing";
CREATE SCHEMA IF NOT EXISTS "core";
CREATE SCHEMA IF NOT EXISTS "gamification";
CREATE SCHEMA IF NOT EXISTS "profiles";
CREATE SCHEMA IF NOT EXISTS "public";
CREATE SCHEMA IF NOT EXISTS "public_content";
CREATE SCHEMA IF NOT EXISTS "reporting";
CREATE SCHEMA IF NOT EXISTS "security";
CREATE SCHEMA IF NOT EXISTS "training";
CREATE TYPE "public"."user_role_enum" AS ENUM ('administrador','entrenador','usuario','estudiante');
CREATE SEQUENCE "billing"."payment_types_id_seq" AS integer INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE "training"."schedules_id_seq" AS integer INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE "audit"."payments_audit_id_seq" AS bigint INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE "audit"."sql_executions_id_seq" AS bigint INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE SEQUENCE "audit"."sql_errors_id_seq" AS bigint INCREMENT 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE;
CREATE OR REPLACE FUNCTION public.soft_delete_payment(payment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE payments
  SET deleted_at = NOW()
  WHERE id = payment_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.restore_payment(payment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE payments
  SET deleted_at = NULL
  WHERE id = payment_id AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sync_first_login_on_password_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- encrypted_password cambia cuando el usuario actualiza su contraseña.
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    UPDATE core.users
    SET first_login = false
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sync_last_login_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Solo sincronizar si cambió el dato de último inicio de sesión
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE core.users
    SET last_login = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.audit_payments()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO payments_audit (payment_id, action, old_data, changed_by)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO payments_audit (payment_id, action, old_data, new_data, changed_by)
    VALUES (OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO payments_audit (payment_id, action, new_data, changed_by)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.sync_user_profile_on_user_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate date)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT DATE_PART('year', AGE(birthdate));
$function$;
CREATE OR REPLACE FUNCTION public.soft_delete_payment(payment_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE payments
  SET deleted_at = NOW()
  WHERE id = payment_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.restore_payment(payment_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE payments
  SET deleted_at = NULL
  WHERE id = payment_id AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$function$;
CREATE OR REPLACE FUNCTION public.check_login_allowed(p_email text)
 RETURNS TABLE(allowed boolean, retry_after_seconds integer, remaining_attempts integer, block_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION reporting.cleanup_old_report_runs(retention_months integer DEFAULT 24)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'reporting', 'public'
AS $function$
declare
  deleted_count integer;
begin
  delete from reporting.report_runs
  where created_at < (now() - make_interval(months => retention_months));

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$function$;
CREATE OR REPLACE FUNCTION public.admin_insert_user(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date DEFAULT NULL::date, p_telefono text DEFAULT NULL::text)
 RETURNS TABLE(id uuid, email text, role text, nombre text, apellido text, fecha_nacimiento date, telefono text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Verificar que el usuario actual es admin
    IF NOT EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('administrador', 'admin')
    ) THEN
        RAISE EXCEPTION 'Solo administradores pueden crear usuarios';
    END IF;

    -- Insertar el usuario (esta función tiene SECURITY DEFINER, bypasea RLS)
    RETURN QUERY
    INSERT INTO public.users (
        id, 
        email, 
        role, 
        nombre, 
        apellido, 
        fecha_nacimiento, 
        telefono
    )
    VALUES (
        p_id,
        p_email,
        p_role,
        p_nombre,
        p_apellido,
        p_fecha_nacimiento,
        p_telefono
    )
    RETURNING 
        users.id,
        users.email,
        users.role,
        users.nombre,
        users.apellido,
        users.fecha_nacimiento,
        users.telefono,
        users.created_at;
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_admin_or_trainer()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    select 1
    from core.users u
    where u.id = auth.uid()
      and u.role in ('administrador', 'admin', 'entrenador')
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email text, p_success boolean, p_error_code text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  return exists (
    select 1
    from core.users u
    where u.id = auth.uid()
      and u.role in ('administrador', 'admin')
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.update_modified_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION training.enforce_physical_test_age()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  birth_date date;
  test_date date;
  age_years int;
begin
  if (new.student_id is null) then
    raise exception 'physical_tests.student_id is required';
  end if;

  select fecha_nacimiento into birth_date
  from core.students
  where id = new.student_id;

  if birth_date is null then
    raise exception 'student % has no fecha_nacimiento', new.student_id;
  end if;

  test_date := coalesce(new.fecha_test, now()::date);
  age_years := date_part('year', age(test_date, birth_date));

  if age_years < 5 then
    raise exception 'student % is % years old at test_date; minimum allowed is 5', new.student_id, age_years;
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.touch_mobile_device_registration_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION profiles.touch_mobile_device_registration_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS user_role_enum
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$function$;
CREATE OR REPLACE FUNCTION public.policy_exists(p_table text, p_policy text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM pg_policy pol
    JOIN pg_class c ON pol.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = split_part(p_table, '.', 1)
      AND c.relname = split_part(p_table, '.', 2)
      AND pol.polname = p_policy
  );
$function$;
CREATE OR REPLACE FUNCTION reporting.touch_scheduler_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION reporting.invoke_generate_scheduled_reports()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'reporting', 'public'
AS $function$
declare
  cfg reporting.scheduler_config%rowtype;
  request_id bigint;
begin
  select * into cfg
  from reporting.scheduler_config
  where id = 1;

  if not found then
    raise exception 'scheduler_config no configurado';
  end if;

  if cfg.is_active is not true then
    raise notice 'Scheduler de reportes inactivo. No se ejecuta llamada HTTP.';
    return null;
  end if;

  if cfg.function_url is null or cfg.auth_token is null then
    raise exception 'scheduler_config incompleto: function_url/auth_token requeridos';
  end if;

  select net.http_post(
    url := cfg.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || cfg.auth_token,
      'apikey', cfg.auth_token
    ),
    body := cfg.default_payload
  ) into request_id;

  return request_id;
end;
$function$;
CREATE OR REPLACE FUNCTION profiles.touch_user_notification_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION reporting.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION training.touch_training_categories_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.calculate_membership_payment_period(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(fecha_inicio date, fecha_fin date)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_last_end date;
  v_start date;
BEGIN
  SELECT MAX(p.fecha_fin)
  INTO v_last_end
  FROM billing.payments p
  WHERE p.student_id = p_student_id
    AND p.deleted_at IS NULL
    AND p.id IS DISTINCT FROM p_exclude_payment_id;

  v_start := COALESCE(v_last_end + 1, COALESCE(p_fecha_pago, CURRENT_DATE));

  RETURN QUERY
  SELECT
    v_start,
    (v_start + INTERVAL '1 month' - INTERVAL '1 day')::date;
END;
$function$;
CREATE OR REPLACE FUNCTION public.calculate_payment_state(p_fecha_fin date)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_diff integer;
BEGIN
  IF p_fecha_fin IS NULL THEN
    RETURN 'activo';
  END IF;

  v_diff := p_fecha_fin - CURRENT_DATE;

  IF v_diff < 0 THEN
    RETURN 'vencido';
  END IF;

  IF v_diff <= 5 THEN
    RETURN 'proximo_a_vencer';
  END IF;

  RETURN 'activo';
END;
$function$;
CREATE OR REPLACE FUNCTION public.apply_payment_membership_rules()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'billing', 'pg_temp'
AS $function$
DECLARE
  v_cost numeric(10,2);
  v_should_recompute_period boolean;
  v_start date;
  v_end date;
BEGIN
  IF NEW.student_id IS NULL THEN
    RAISE EXCEPTION 'student_id es obligatorio para registrar pagos';
  END IF;

  IF NEW.membership_type_id IS NULL THEN
    RAISE EXCEPTION 'membership_type_id es obligatorio para registrar pagos';
  END IF;

  NEW.fecha_pago := COALESCE(NEW.fecha_pago, CURRENT_DATE);

  SELECT mt.costo
  INTO v_cost
  FROM billing.membership_types mt
  WHERE mt.id = NEW.membership_type_id
    AND mt.active = true;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'El tipo de mensualidad % no existe o esta inactivo', NEW.membership_type_id;
  END IF;

  NEW.monto := COALESCE(NEW.monto, v_cost);

  IF TG_OP = 'INSERT' THEN
    -- Si el cliente envia explicitamente ambas fechas, respetarlas
    IF NEW.fecha_inicio IS NOT NULL AND NEW.fecha_fin IS NOT NULL THEN
      v_should_recompute_period := false;
    ELSE
      v_should_recompute_period := true;
    END IF;
  ELSE
    -- En UPDATE recomputar si cambian los factores, o si anulan las fechas
    v_should_recompute_period :=
      NEW.student_id IS DISTINCT FROM OLD.student_id
      OR NEW.membership_type_id IS DISTINCT FROM OLD.membership_type_id
      OR NEW.fecha_inicio IS NULL
      OR NEW.fecha_fin IS NULL;
  END IF;

  IF v_should_recompute_period THEN
    SELECT p.fecha_inicio, p.fecha_fin
    INTO v_start, v_end
    FROM public.calculate_membership_payment_period(
      NEW.student_id,
      NEW.fecha_pago,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) p;

    NEW.fecha_inicio := v_start;
    NEW.fecha_fin := v_end;
  END IF;

  IF NEW.fecha_fin IS NOT NULL AND NEW.fecha_inicio IS NOT NULL AND NEW.fecha_fin < NEW.fecha_inicio THEN
    RAISE EXCEPTION 'fecha_fin no puede ser menor a fecha_inicio';
  END IF;

  NEW.estado := public.calculate_payment_state(NEW.fecha_fin);

  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION gamification.skip_duplicate_daily_login_xp_ledger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.source_type = 'daily_login' and exists (
    select 1
    from gamification.xp_ledger existing
    where existing.student_id = new.student_id
      and existing.source_type = new.source_type
      and coalesce(existing.source_ref, '') = coalesce(new.source_ref, '')
  ) then
    return null;
  end if;

  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.touch_user_notification_inbox_state_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.purchase_gamification_item(p_student_id uuid, p_item_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'gamification', 'core'
AS $function$
declare
  v_owner uuid;
  v_item gamification.cosmetic_items_catalog%rowtype;
  v_wallet gamification.currency_wallets%rowtype;
  v_entry gamification.currency_ledger%rowtype;
  v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select user_id into v_owner from core.students where id = p_student_id;
  if not found then raise exception 'student_not_found'; end if;
  if not (coalesce(public.is_admin_or_trainer(), false) or coalesce(v_owner = auth.uid(), false)) then
    raise exception 'not_allowed';
  end if;

  select * into v_item from gamification.cosmetic_items_catalog
  where slug = p_item_slug and is_active = true for share;
  if not found then raise exception 'item_not_found'; end if;
  if v_item.category not in ('frame', 'background', 'badge', 'effect') then
    raise exception 'unsupported_category';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gamification-shop:' || p_student_id::text, 0));
  insert into gamification.currency_wallets(student_id, balance, total_earned, total_spent, last_synced_at, updated_at)
  values (p_student_id, 0, 0, 0, v_now, v_now) on conflict (student_id) do nothing;
  select * into v_wallet from gamification.currency_wallets where student_id = p_student_id for update;

  if exists(select 1 from gamification.student_cosmetic_items where student_id = p_student_id and item_slug = p_item_slug) then
    raise exception 'item_already_owned';
  end if;
  if v_wallet.balance < v_item.price_coins then raise exception 'insufficient_coins'; end if;

  update gamification.currency_wallets
  set balance = balance - v_item.price_coins, total_spent = total_spent + v_item.price_coins,
      updated_at = v_now, last_synced_at = v_now
  where student_id = p_student_id returning * into v_wallet;

  insert into gamification.currency_ledger(student_id, source_type, source_ref, coins_delta, label, description, metadata, occurred_at, created_at)
  values(p_student_id, 'cosmetic_purchase', p_item_slug, -v_item.price_coins, 'Compra cosmetica',
    format('Compraste %s para tu perfil.', v_item.name),
    jsonb_build_object('itemSlug', v_item.slug, 'category', v_item.category), v_now, v_now)
  returning * into v_entry;

  insert into gamification.student_cosmetic_items(student_id, item_slug, source_type, metadata, acquired_at)
  values(p_student_id, p_item_slug, 'purchase', jsonb_build_object('priceCoins', v_item.price_coins), v_now);

  return jsonb_build_object('ok', true, 'itemSlug', v_item.slug, 'priceCoins', v_item.price_coins,
    'wallet', jsonb_build_object('balance', v_wallet.balance, 'totalEarned', v_wallet.total_earned, 'totalSpent', v_wallet.total_spent),
    'ledgerEntry', jsonb_build_object('id', v_entry.id, 'sourceType', v_entry.source_type, 'sourceRef', v_entry.source_ref,
      'coinsDelta', v_entry.coins_delta, 'label', v_entry.label, 'description', v_entry.description, 'occurredAt', v_entry.occurred_at));
end;
$function$;
CREATE OR REPLACE FUNCTION public.equip_gamification_item(p_student_id uuid, p_item_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'gamification', 'core'
AS $function$
declare
  v_student_owner uuid;
  v_item gamification.cosmetic_items_catalog%rowtype;
  v_owned boolean;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select s.user_id
  into v_student_owner
  from core.students s
  where s.id = p_student_id;

  if v_student_owner is null then
    raise exception 'student_not_found';
  end if;

  if not (coalesce(public.is_admin_or_trainer(), false) or coalesce(v_student_owner = auth.uid(), false)) then
    raise exception 'not_allowed';
  end if;

  select *
  into v_item
  from gamification.cosmetic_items_catalog
  where slug = p_item_slug
    and is_active = true;

  if v_item.slug is null then
    raise exception 'item_not_found';
  end if;

  select exists (
    select 1
    from gamification.student_cosmetic_items sci
    where sci.student_id = p_student_id
      and sci.item_slug = p_item_slug
  )
  into v_owned;

  if not v_owned then
    raise exception 'item_not_owned';
  end if;

  insert into gamification.student_cosmetic_equipment (
    student_id,
    updated_at
  ) values (
    p_student_id,
    v_now
  )
  on conflict (student_id) do nothing;

  if v_item.category = 'frame' then
    update gamification.student_cosmetic_equipment
    set frame_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  elsif v_item.category = 'background' then
    update gamification.student_cosmetic_equipment
    set background_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  elsif v_item.category = 'badge' then
    update gamification.student_cosmetic_equipment
    set badge_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  elsif v_item.category = 'effect' then
    update gamification.student_cosmetic_equipment
    set effect_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  else
    raise exception 'unsupported_category';
  end if;

  return jsonb_build_object(
    'ok', true,
    'itemSlug', v_item.slug,
    'category', v_item.category
  );
end;
$function$;
CREATE OR REPLACE FUNCTION public.unequip_gamification_item(p_student_id uuid, p_category text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'gamification', 'core'
AS $function$
declare
  v_student_owner uuid;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select s.user_id
  into v_student_owner
  from core.students s
  where s.id = p_student_id;

  if v_student_owner is null then
    raise exception 'student_not_found';
  end if;

  if not (coalesce(public.is_admin_or_trainer(), false) or coalesce(v_student_owner = auth.uid(), false)) then
    raise exception 'not_allowed';
  end if;

  insert into gamification.student_cosmetic_equipment (
    student_id,
    updated_at
  ) values (
    p_student_id,
    v_now
  )
  on conflict (student_id) do nothing;

  if p_category = 'frame' then
    update gamification.student_cosmetic_equipment
    set frame_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  elsif p_category = 'background' then
    update gamification.student_cosmetic_equipment
    set background_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  elsif p_category = 'badge' then
    update gamification.student_cosmetic_equipment
    set badge_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  elsif p_category = 'effect' then
    update gamification.student_cosmetic_equipment
    set effect_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  else
    raise exception 'unsupported_category';
  end if;

  return jsonb_build_object(
    'ok', true,
    'category', p_category
  );
end;
$function$;
CREATE OR REPLACE FUNCTION core.guard_client_user_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if row(new.id, new.role, new.created_at)
       is distinct from row(old.id, old.role, old.created_at) then
      raise exception 'No autorizado para cambiar identidad o rol' using errcode = '42501';
    end if;
    if not (public.is_admin_or_trainer() and old.role = 'estudiante')
       and row(new.suspended, new.suspension_reason, new.suspension_until, new.suspended_at)
           is distinct from
           row(old.suspended, old.suspension_reason, old.suspension_until, old.suspended_at) then
      raise exception 'No autorizado para cambiar suspension' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION profiles.guard_client_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  trusted_role text;
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'UPDATE' then
      if row(new.id, new.organization_id, new.created_at)
         is distinct from row(old.id, old.organization_id, old.created_at) then
        raise exception 'No autorizado para cambiar identidad u organizacion' using errcode = '42501';
      end if;
    elsif new.organization_id is not null then
      raise exception 'No autorizado para asignar organizacion' using errcode = '42501';
    end if;
    select u.role into trusted_role from core.users u where u.id = new.id;
    if new.role::text is distinct from coalesce(trusted_role, 'usuario') then
      raise exception 'El rol del perfil debe coincidir con el usuario' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;
ALTER FUNCTION "public"."calculate_age"(birthdate date) IMMUTABLE;
CREATE TABLE "training"."training_categories" (
"code" text NOT NULL,
"label" text NOT NULL,
"default_description" text,
"for_schedules" boolean DEFAULT true NOT NULL,
"for_students" boolean DEFAULT true NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "billing"."payment_types" (
"id" integer DEFAULT nextval('billing.payment_types_id_seq'::regclass) NOT NULL,
"nombre" text NOT NULL,
"descripcion" text,
"precio" numeric(10,2)
);
CREATE TABLE "billing"."payments" (
"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
"student_id" uuid,
"payment_type_id" integer,
"monto" numeric(10,2) NOT NULL,
"fecha_pago" date DEFAULT CURRENT_DATE NOT NULL,
"fecha_inicio" date,
"fecha_fin" date,
"estado" text,
"deleted_at" timestamp with time zone,
"membership_type_id" bigint NOT NULL
);
CREATE TABLE "training"."schedules" (
"id" integer DEFAULT nextval('training.schedules_id_seq'::regclass) NOT NULL,
"dia_semana" text,
"hora_inicio" time without time zone NOT NULL,
"hora_fin" time without time zone NOT NULL,
"categoria" text,
"descripcion" text
);
CREATE TABLE "training"."attendances" (
"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
"student_id" uuid,
"schedule_id" integer,
"fecha" date DEFAULT CURRENT_DATE,
"metodo_pago_id" integer,
"hora_entrada" timestamp with time zone DEFAULT now()
);
CREATE TABLE "training"."physical_tests" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid,
"estatura" numeric(5,2),
"peso" numeric(5,2),
"brazo_extend_inicial" numeric(5,2),
"brazo_extend_sin_impulso" numeric(5,2),
"brazo_extend_con_impulso" numeric(5,2),
"fuerza_explosiva_salto_largo" numeric(5,2),
"envergadura_brazos_extendidos_lateral" numeric(5,2),
"fecha_test" date DEFAULT CURRENT_DATE,
"observaciones" text,
"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
"modified_at" timestamp with time zone DEFAULT now(),
"fuerza_abdomen" integer,
"fuerza_brazos" integer,
"fuerza_piernas" integer,
"elevaciones_barra" integer
);
CREATE TABLE "core"."students" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_id" uuid,
"categoria" text,
"fecha_ingreso" date DEFAULT CURRENT_DATE,
"fecha_nacimiento" date NOT NULL,
"edad" integer GENERATED ALWAYS AS (calculate_age(fecha_nacimiento)) STORED
);
CREATE TABLE "profiles"."user_profiles" (
"id" uuid NOT NULL,
"full_name" text,
"role" user_role_enum DEFAULT 'usuario'::user_role_enum NOT NULL,
"organization_id" uuid,
"created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "billing"."membership_types" (
"id" bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
"code" text NOT NULL,
"nombre" text NOT NULL,
"detalle" text,
"costo" numeric(10,2) NOT NULL,
"active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "gamification"."student_campaign_progress" (
"student_id" uuid NOT NULL,
"campaign_slug" text NOT NULL,
"progress_value" integer DEFAULT 0 NOT NULL,
"is_completed" boolean DEFAULT false NOT NULL,
"completed_at" timestamp with time zone,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "public_content"."announcements" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"title" character varying(255) NOT NULL,
"content" text NOT NULL,
"priority" character varying(20) DEFAULT 'normal'::character varying,
"target_audience" character varying(50)[] DEFAULT ARRAY['all'::text],
"is_active" boolean DEFAULT true,
"created_by" uuid,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"expires_at" timestamp with time zone,
"image_url" text,
"attachment_url" text
);
CREATE TABLE "gamification"."campaigns_catalog" (
"slug" text NOT NULL,
"name" text NOT NULL,
"description" text NOT NULL,
"focus_area" text NOT NULL,
"window_type" text DEFAULT 'weekly'::text NOT NULL,
"target_metric" text NOT NULL,
"target_value" integer NOT NULL,
"reward_label" text NOT NULL,
"reward_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
"hint" text,
"is_secret" boolean DEFAULT false NOT NULL,
"start_date" date NOT NULL,
"end_date" date NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "profiles"."mobile_device_registrations" (
"id" bigint GENERATED BY DEFAULT AS IDENTITY NOT NULL,
"user_id" uuid NOT NULL,
"platform" text NOT NULL,
"device_token" text NOT NULL,
"device_name" text,
"app_version" text,
"notifications_enabled" boolean DEFAULT true NOT NULL,
"last_seen_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"device_id" text,
"native_version" text,
"native_build" text,
"bundle_version" text,
"bundle_id" text,
"builtin_version" text,
"ota_channel" text,
"updater_plugin_version" text,
"last_delivery_status" text,
"last_delivery_error" text,
"last_delivery_attempt_at" timestamp with time zone,
"last_delivery_success_at" timestamp with time zone,
"invalidated_at" timestamp with time zone
);
CREATE TABLE "gamification"."cosmetic_items_catalog" (
"slug" text NOT NULL,
"name" text NOT NULL,
"description" text NOT NULL,
"rarity" text DEFAULT 'common'::text NOT NULL,
"category" text NOT NULL,
"price_coins" integer DEFAULT 0 NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"sort_order" integer DEFAULT 0 NOT NULL,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."achievement_catalog" (
"slug" text NOT NULL,
"title" text NOT NULL,
"description" text NOT NULL,
"core_driver" text NOT NULL,
"xp_reward" integer DEFAULT 0 NOT NULL,
"sort_order" integer DEFAULT 0 NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."challenges_catalog" (
"slug" text NOT NULL,
"title" text NOT NULL,
"description" text NOT NULL,
"core_driver" text NOT NULL,
"target_metric" text NOT NULL,
"target_value" numeric DEFAULT 0 NOT NULL,
"window_type" text DEFAULT 'rolling'::text NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"start_date" date,
"end_date" date,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."student_stage_history" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"stage_slug" text NOT NULL,
"awarded_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"awarded_reason" text NOT NULL,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "audit"."payments_audit" (
"id" bigint DEFAULT nextval('audit.payments_audit_id_seq'::regclass) NOT NULL,
"payment_id" uuid,
"action" character varying(10),
"old_data" jsonb,
"new_data" jsonb,
"changed_by" uuid,
"changed_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE "gamification"."student_profiles" (
"student_id" uuid NOT NULL,
"current_level" integer DEFAULT 1 NOT NULL,
"current_xp" integer DEFAULT 0 NOT NULL,
"total_xp" integer DEFAULT 0 NOT NULL,
"active_streak" integer DEFAULT 0 NOT NULL,
"longest_streak" integer DEFAULT 0 NOT NULL,
"last_test_date" date,
"last_synced_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."reward_events" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"source_type" text NOT NULL,
"source_id" uuid,
"event_type" text NOT NULL,
"xp_awarded" integer DEFAULT 0 NOT NULL,
"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."student_achievements" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"achievement_slug" text NOT NULL,
"source_test_id" uuid,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"earned_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."student_challenge_progress" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"challenge_slug" text NOT NULL,
"progress_value" numeric DEFAULT 0 NOT NULL,
"is_completed" boolean DEFAULT false NOT NULL,
"completed_at" timestamp with time zone,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."currency_wallets" (
"student_id" uuid NOT NULL,
"balance" integer DEFAULT 0 NOT NULL,
"total_earned" integer DEFAULT 0 NOT NULL,
"total_spent" integer DEFAULT 0 NOT NULL,
"last_synced_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."currency_ledger" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"source_type" text NOT NULL,
"source_ref" text,
"coins_delta" integer NOT NULL,
"label" text NOT NULL,
"description" text,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "gamification"."student_cosmetic_items" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"item_slug" text NOT NULL,
"source_type" text DEFAULT 'purchase'::text NOT NULL,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"acquired_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."leaderboard_snapshots" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"categoria" text NOT NULL,
"age_band" text DEFAULT 'sin-dato'::text NOT NULL,
"score" integer DEFAULT 0 NOT NULL,
"current_level" integer DEFAULT 1 NOT NULL,
"rank_position" integer DEFAULT 0 NOT NULL,
"snapshot_date" date DEFAULT CURRENT_DATE NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "security"."login_attempts" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"user_email" text NOT NULL,
"attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
"success" boolean NOT NULL,
"error_code" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "security"."login_blocks" (
"user_email" text NOT NULL,
"blocked_at" timestamp with time zone DEFAULT now() NOT NULL,
"locked_until" timestamp with time zone NOT NULL,
"reason" text,
"failed_attempts_count" integer DEFAULT 0 NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "gamification"."student_identity" (
"student_id" uuid NOT NULL,
"nickname" text,
"selected_title_slug" text,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"nickname_updated_at" timestamp with time zone,
"avatar_style" text DEFAULT 'adventurer-neutral'::text NOT NULL,
"profile_image_mode" text DEFAULT 'avatar'::text NOT NULL,
"profile_photo_path" text,
"profile_photo_updated_at" timestamp with time zone,
"avatar_model_slug" text
);
CREATE TABLE "gamification"."hidden_rewards_catalog" (
"slug" text NOT NULL,
"name" text NOT NULL,
"teaser" text NOT NULL,
"description" text NOT NULL,
"hint" text NOT NULL,
"target_metric" text NOT NULL,
"target_value" integer NOT NULL,
"reward_label" text NOT NULL,
"reward_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."student_hidden_rewards" (
"student_id" uuid NOT NULL,
"reward_slug" text NOT NULL,
"progress_value" integer DEFAULT 0 NOT NULL,
"discovered_at" timestamp with time zone,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "public"."user_notification_inbox_state" (
"user_id" uuid NOT NULL,
"notification_key" text NOT NULL,
"notification_category" text NOT NULL,
"read_at" timestamp with time zone,
"dismissed_at" timestamp with time zone,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."login_rewards" (
"user_id" uuid NOT NULL,
"reward_date" date NOT NULL,
"reward_count" integer DEFAULT 1 NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "gamification"."xp_ledger" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"student_id" uuid NOT NULL,
"source_type" text NOT NULL,
"source_ref" text,
"xp_delta" integer NOT NULL,
"label" text NOT NULL,
"description" text,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "audit"."sql_executions" (
"id" bigint DEFAULT nextval('audit.sql_executions_id_seq'::regclass) NOT NULL,
"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
"description" text,
"executed_ip" inet,
"sql_text" text NOT NULL,
"status" text DEFAULT 'success'::text NOT NULL,
"request_id" text,
"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE "audit"."sql_errors" (
"id" bigint DEFAULT nextval('audit.sql_errors_id_seq'::regclass) NOT NULL,
"errored_at" timestamp with time zone DEFAULT now() NOT NULL,
"description" text,
"errored_ip" inet,
"sql_text" text,
"error_code" text,
"error_message" text,
"status" text DEFAULT 'error'::text NOT NULL,
"request_id" text,
"details" jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE "gamification"."student_cosmetic_equipment" (
"student_id" uuid NOT NULL,
"frame_item_slug" text,
"background_item_slug" text,
"badge_item_slug" text,
"effect_item_slug" text,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "reporting"."report_definitions" (
"code" text NOT NULL,
"name" text NOT NULL,
"description" text,
"renderer" text NOT NULL,
"source_kind" text NOT NULL,
"schedule_time" time without time zone,
"timezone" text DEFAULT 'America/Guayaquil'::text NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "reporting"."report_runs" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"report_code" text NOT NULL,
"period_start" date NOT NULL,
"period_end" date NOT NULL,
"trigger" text NOT NULL,
"status" text DEFAULT 'pending'::text NOT NULL,
"snapshot_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
"summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
"requested_by" uuid,
"error_message" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL,
"finished_at" timestamp with time zone
);
CREATE TABLE "reporting"."report_artifacts" (
"id" uuid DEFAULT gen_random_uuid() NOT NULL,
"run_id" uuid NOT NULL,
"format" text NOT NULL,
"storage_bucket" text NOT NULL,
"storage_path" text NOT NULL,
"file_size" bigint,
"checksum" text,
"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "core"."users" (
"id" uuid DEFAULT uuid_generate_v4() NOT NULL,
"email" text NOT NULL,
"role" text,
"nombre" text NOT NULL,
"apellido" text NOT NULL,
"fecha_nacimiento" date,
"telefono" text,
"created_at" timestamp with time zone DEFAULT now(),
"last_login" timestamp with time zone,
"first_login" boolean DEFAULT false,
"suspended" boolean DEFAULT false,
"suspension_reason" text,
"suspension_until" timestamp with time zone,
"suspended_at" timestamp with time zone,
"email_ciphertext" text,
"email_search_exact" text,
"email_search_partial" text[],
"email_masked" text,
"telefono_ciphertext" text,
"telefono_search_exact" text,
"telefono_search_partial" text[],
"telefono_masked" text
);
CREATE TABLE "reporting"."scheduler_config" (
"id" integer DEFAULT 1 NOT NULL,
"function_url" text,
"auth_token" text,
"default_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
"is_active" boolean DEFAULT false NOT NULL,
"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "profiles"."user_notification_preferences" (
"user_id" uuid NOT NULL,
"announcement_enabled" boolean DEFAULT true NOT NULL,
"payment_reminders_enabled" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
"payment_registered_enabled" boolean DEFAULT true NOT NULL,
"payment_overdue_enabled" boolean DEFAULT true NOT NULL,
"attendance_enabled" boolean DEFAULT true NOT NULL,
"gamification_enabled" boolean DEFAULT true NOT NULL
);
CREATE TABLE "gamification"."athlete_stages_catalog" (
"slug" text NOT NULL,
"name" text NOT NULL,
"description" text NOT NULL,
"progress_hint_template" text NOT NULL,
"sort_order" integer NOT NULL,
"min_level" integer DEFAULT 1 NOT NULL,
"min_tests" integer DEFAULT 0 NOT NULL,
"min_attendances" integer DEFAULT 0 NOT NULL,
"min_payments" integer DEFAULT 0 NOT NULL,
"min_achievements" integer DEFAULT 0 NOT NULL,
"requires_leaderboard_presence" boolean DEFAULT false NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "security"."users_password_backup" (
"id" uuid,
"email" text,
"password" text,
"created_at" timestamp with time zone
);
CREATE TABLE "gamification"."student_current_stage" (
"student_id" uuid NOT NULL,
"current_stage_slug" text NOT NULL,
"progress_hint" text NOT NULL,
"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
"updated_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE "gamification"."titles_catalog" (
"slug" text NOT NULL,
"name" text NOT NULL,
"description" text NOT NULL,
"rarity" text DEFAULT 'common'::text NOT NULL,
"sort_order" integer DEFAULT 0 NOT NULL,
"is_active" boolean DEFAULT true NOT NULL,
"criteria" jsonb DEFAULT '{}'::jsonb NOT NULL,
"created_at" timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate date)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT DATE_PART('year', AGE(birthdate));
$function$;
ALTER TABLE "training"."training_categories" ADD CONSTRAINT "training_categories_code_not_blank" CHECK ((length(TRIM(BOTH FROM code)) > 0));
ALTER TABLE "training"."training_categories" ADD CONSTRAINT "training_categories_pkey" PRIMARY KEY (code);
ALTER TABLE "billing"."payment_types" ADD CONSTRAINT "payment_types_nombre_key" UNIQUE (nombre);
ALTER TABLE "billing"."payment_types" ADD CONSTRAINT "payment_types_pkey" PRIMARY KEY (id);
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_estado_check" CHECK ((estado = ANY (ARRAY['activo'::text, 'vencido'::text, 'proximo_a_vencer'::text])));
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_period_valid_check" CHECK (((fecha_inicio IS NULL) OR (fecha_fin IS NULL) OR (fecha_fin >= fecha_inicio)));
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_pkey" PRIMARY KEY (id);
ALTER TABLE "training"."schedules" ADD CONSTRAINT "schedules_dia_semana_check" CHECK ((dia_semana = ANY (ARRAY['lunes'::text, 'martes'::text, 'miercoles'::text, 'jueves'::text, 'viernes'::text, 'sabado'::text, 'domingo'::text])));
ALTER TABLE "training"."schedules" ADD CONSTRAINT "schedules_pkey" PRIMARY KEY (id);
ALTER TABLE "training"."attendances" ADD CONSTRAINT "attendances_pkey" PRIMARY KEY (id);
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "check_elevaciones_barra" CHECK (((elevaciones_barra IS NULL) OR ((elevaciones_barra >= 0) AND (elevaciones_barra <= 300))));
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "check_fuerza_abdomen" CHECK (((fuerza_abdomen IS NULL) OR ((fuerza_abdomen >= 0) AND (fuerza_abdomen <= 400))));
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "check_fuerza_brazos" CHECK (((fuerza_brazos IS NULL) OR ((fuerza_brazos >= 0) AND (fuerza_brazos <= 400))));
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "check_fuerza_piernas" CHECK (((fuerza_piernas IS NULL) OR ((fuerza_piernas >= 0) AND (fuerza_piernas <= 600))));
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "physical_tests_estatura_check" CHECK (((estatura > (0)::numeric) AND (estatura < (3)::numeric)));
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "physical_tests_peso_check" CHECK (((peso > (0)::numeric) AND (peso < (300)::numeric)));
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "physical_tests_pkey" PRIMARY KEY (id);
ALTER TABLE "core"."students" ADD CONSTRAINT "students_fecha_nacimiento_min_5_check" CHECK (((fecha_nacimiento IS NOT NULL) AND (fecha_nacimiento <= CURRENT_DATE) AND (fecha_nacimiento <= (CURRENT_DATE - '5 years'::interval))));
ALTER TABLE "core"."students" ADD CONSTRAINT "students_pkey" PRIMARY KEY (id);
ALTER TABLE "profiles"."user_profiles" ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY (id);
ALTER TABLE "billing"."membership_types" ADD CONSTRAINT "membership_types_code_key" UNIQUE (code);
ALTER TABLE "billing"."membership_types" ADD CONSTRAINT "membership_types_costo_check" CHECK ((costo > (0)::numeric));
ALTER TABLE "billing"."membership_types" ADD CONSTRAINT "membership_types_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_campaign_progress" ADD CONSTRAINT "student_campaign_progress_pkey" PRIMARY KEY (student_id, campaign_slug);
ALTER TABLE "public_content"."announcements" ADD CONSTRAINT "announcements_pkey" PRIMARY KEY (id);
ALTER TABLE "public_content"."announcements" ADD CONSTRAINT "announcements_priority_check" CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])));
ALTER TABLE "gamification"."campaigns_catalog" ADD CONSTRAINT "campaigns_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "gamification"."campaigns_catalog" ADD CONSTRAINT "campaigns_catalog_window_type_check" CHECK ((window_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'flash'::text])));
ALTER TABLE "profiles"."mobile_device_registrations" ADD CONSTRAINT "mobile_device_registrations_device_token_key" UNIQUE (device_token);
ALTER TABLE "profiles"."mobile_device_registrations" ADD CONSTRAINT "mobile_device_registrations_pkey" PRIMARY KEY (id);
ALTER TABLE "profiles"."mobile_device_registrations" ADD CONSTRAINT "mobile_device_registrations_platform_check" CHECK ((platform = ANY (ARRAY['android'::text, 'ios'::text, 'web'::text])));
ALTER TABLE "gamification"."cosmetic_items_catalog" ADD CONSTRAINT "cosmetic_items_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "gamification"."cosmetic_items_catalog" ADD CONSTRAINT "cosmetic_items_catalog_price_coins_check" CHECK ((price_coins >= 0));
ALTER TABLE "gamification"."achievement_catalog" ADD CONSTRAINT "achievement_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "gamification"."challenges_catalog" ADD CONSTRAINT "challenges_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "gamification"."student_stage_history" ADD CONSTRAINT "student_stage_history_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_stage_history" ADD CONSTRAINT "student_stage_history_student_id_stage_slug_key" UNIQUE (student_id, stage_slug);
ALTER TABLE "audit"."payments_audit" ADD CONSTRAINT "payments_audit_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_active_streak_check" CHECK ((active_streak >= 0));
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_current_level_check" CHECK ((current_level >= 1));
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_current_xp_check" CHECK ((current_xp >= 0));
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_longest_streak_check" CHECK ((longest_streak >= 0));
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_pkey" PRIMARY KEY (student_id);
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_total_xp_check" CHECK ((total_xp >= 0));
ALTER TABLE "gamification"."reward_events" ADD CONSTRAINT "reward_events_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."reward_events" ADD CONSTRAINT "reward_events_student_id_source_type_source_id_event_type_key" UNIQUE (student_id, source_type, source_id, event_type);
ALTER TABLE "gamification"."student_achievements" ADD CONSTRAINT "student_achievements_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_achievements" ADD CONSTRAINT "student_achievements_student_id_achievement_slug_key" UNIQUE (student_id, achievement_slug);
ALTER TABLE "gamification"."student_challenge_progress" ADD CONSTRAINT "student_challenge_progress_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_challenge_progress" ADD CONSTRAINT "student_challenge_progress_student_id_challenge_slug_key" UNIQUE (student_id, challenge_slug);
ALTER TABLE "gamification"."currency_wallets" ADD CONSTRAINT "currency_wallets_balance_check" CHECK ((balance >= 0));
ALTER TABLE "gamification"."currency_wallets" ADD CONSTRAINT "currency_wallets_pkey" PRIMARY KEY (student_id);
ALTER TABLE "gamification"."currency_wallets" ADD CONSTRAINT "currency_wallets_total_earned_check" CHECK ((total_earned >= 0));
ALTER TABLE "gamification"."currency_wallets" ADD CONSTRAINT "currency_wallets_total_spent_check" CHECK ((total_spent >= 0));
ALTER TABLE "gamification"."currency_ledger" ADD CONSTRAINT "currency_ledger_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_cosmetic_items" ADD CONSTRAINT "student_cosmetic_items_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_cosmetic_items" ADD CONSTRAINT "student_cosmetic_items_student_id_item_slug_key" UNIQUE (student_id, item_slug);
ALTER TABLE "gamification"."leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_student_id_categoria_age_band_snapsho_key" UNIQUE (student_id, categoria, age_band, snapshot_date);
ALTER TABLE "security"."login_attempts" ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY (id);
ALTER TABLE "security"."login_blocks" ADD CONSTRAINT "login_blocks_pkey" PRIMARY KEY (user_email);
ALTER TABLE "gamification"."student_identity" ADD CONSTRAINT "gamification_student_identity_profile_image_mode_check" CHECK ((profile_image_mode = ANY (ARRAY['avatar'::text, 'photo'::text])));
ALTER TABLE "gamification"."student_identity" ADD CONSTRAINT "student_identity_nickname_check" CHECK (((nickname IS NULL) OR ((length(TRIM(BOTH FROM nickname)) >= 3) AND (length(TRIM(BOTH FROM nickname)) <= 24))));
ALTER TABLE "gamification"."student_identity" ADD CONSTRAINT "student_identity_pkey" PRIMARY KEY (student_id);
ALTER TABLE "gamification"."hidden_rewards_catalog" ADD CONSTRAINT "hidden_rewards_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "gamification"."student_hidden_rewards" ADD CONSTRAINT "student_hidden_rewards_pkey" PRIMARY KEY (student_id, reward_slug);
ALTER TABLE "public"."user_notification_inbox_state" ADD CONSTRAINT "user_notification_inbox_state_notification_category_check" CHECK ((notification_category = ANY (ARRAY['mensualidades'::text, 'anuncios'::text, 'gamificacion'::text, 'general'::text])));
ALTER TABLE "public"."user_notification_inbox_state" ADD CONSTRAINT "user_notification_inbox_state_pkey" PRIMARY KEY (user_id, notification_key);
ALTER TABLE "gamification"."login_rewards" ADD CONSTRAINT "login_rewards_pkey" PRIMARY KEY (user_id);
ALTER TABLE "gamification"."xp_ledger" ADD CONSTRAINT "xp_ledger_pkey" PRIMARY KEY (id);
ALTER TABLE "audit"."sql_executions" ADD CONSTRAINT "sql_executions_pkey" PRIMARY KEY (id);
ALTER TABLE "audit"."sql_errors" ADD CONSTRAINT "sql_errors_pkey" PRIMARY KEY (id);
ALTER TABLE "gamification"."student_cosmetic_equipment" ADD CONSTRAINT "student_cosmetic_equipment_pkey" PRIMARY KEY (student_id);
ALTER TABLE "reporting"."report_definitions" ADD CONSTRAINT "report_definitions_code_check" CHECK ((code ~ '^[a-z0-9_]+$'::text));
ALTER TABLE "reporting"."report_definitions" ADD CONSTRAINT "report_definitions_pkey" PRIMARY KEY (code);
ALTER TABLE "reporting"."report_definitions" ADD CONSTRAINT "report_definitions_renderer_check" CHECK ((renderer = ANY (ARRAY['pdf'::text, 'csv'::text, 'json'::text])));
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_check" CHECK ((period_end >= period_start));
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_pkey" PRIMARY KEY (id);
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_report_code_period_start_period_end_trigger_key" UNIQUE (report_code, period_start, period_end, trigger);
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'ready'::text, 'failed'::text])));
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_trigger_check" CHECK ((trigger = ANY (ARRAY['scheduled'::text, 'manual'::text])));
ALTER TABLE "reporting"."report_artifacts" ADD CONSTRAINT "report_artifacts_format_check" CHECK ((format = ANY (ARRAY['pdf'::text, 'csv'::text, 'json'::text])));
ALTER TABLE "reporting"."report_artifacts" ADD CONSTRAINT "report_artifacts_pkey" PRIMARY KEY (id);
ALTER TABLE "reporting"."report_artifacts" ADD CONSTRAINT "report_artifacts_run_id_format_key" UNIQUE (run_id, format);
ALTER TABLE "core"."users" ADD CONSTRAINT "users_email_key" UNIQUE (email);
ALTER TABLE "core"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY (id);
ALTER TABLE "core"."users" ADD CONSTRAINT "users_role_check" CHECK ((role = ANY (ARRAY['administrador'::text, 'entrenador'::text, 'estudiante'::text])));
ALTER TABLE "reporting"."scheduler_config" ADD CONSTRAINT "scheduler_config_id_check" CHECK ((id = 1));
ALTER TABLE "reporting"."scheduler_config" ADD CONSTRAINT "scheduler_config_pkey" PRIMARY KEY (id);
ALTER TABLE "profiles"."user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY (user_id);
ALTER TABLE "gamification"."athlete_stages_catalog" ADD CONSTRAINT "athlete_stages_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "gamification"."student_current_stage" ADD CONSTRAINT "student_current_stage_pkey" PRIMARY KEY (student_id);
ALTER TABLE "gamification"."titles_catalog" ADD CONSTRAINT "titles_catalog_pkey" PRIMARY KEY (slug);
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_membership_type_id_fkey" FOREIGN KEY (membership_type_id) REFERENCES billing.membership_types(id);
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_payment_type_id_fkey" FOREIGN KEY (payment_type_id) REFERENCES billing.payment_types(id);
ALTER TABLE "billing"."payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id);
ALTER TABLE "training"."schedules" ADD CONSTRAINT "schedules_categoria_fkey" FOREIGN KEY (categoria) REFERENCES training.training_categories(code) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "training"."attendances" ADD CONSTRAINT "attendances_metodo_pago_id_fkey" FOREIGN KEY (metodo_pago_id) REFERENCES billing.payment_types(id);
ALTER TABLE "training"."attendances" ADD CONSTRAINT "attendances_schedule_id_fkey" FOREIGN KEY (schedule_id) REFERENCES training.schedules(id);
ALTER TABLE "training"."attendances" ADD CONSTRAINT "attendances_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id);
ALTER TABLE "training"."physical_tests" ADD CONSTRAINT "physical_tests_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "core"."students" ADD CONSTRAINT "students_categoria_fkey" FOREIGN KEY (categoria) REFERENCES training.training_categories(code) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "core"."students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY (user_id) REFERENCES core.users(id);
ALTER TABLE "profiles"."user_profiles" ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_campaign_progress" ADD CONSTRAINT "student_campaign_progress_campaign_slug_fkey" FOREIGN KEY (campaign_slug) REFERENCES gamification.campaigns_catalog(slug) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_campaign_progress" ADD CONSTRAINT "student_campaign_progress_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "public_content"."announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE "profiles"."mobile_device_registrations" ADD CONSTRAINT "mobile_device_registrations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_stage_history" ADD CONSTRAINT "student_stage_history_stage_slug_fkey" FOREIGN KEY (stage_slug) REFERENCES gamification.athlete_stages_catalog(slug) ON DELETE RESTRICT;
ALTER TABLE "gamification"."student_stage_history" ADD CONSTRAINT "student_stage_history_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "audit"."payments_audit" ADD CONSTRAINT "payments_audit_changed_by_fkey" FOREIGN KEY (changed_by) REFERENCES auth.users(id);
ALTER TABLE "gamification"."student_profiles" ADD CONSTRAINT "student_profiles_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."reward_events" ADD CONSTRAINT "reward_events_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_achievements" ADD CONSTRAINT "student_achievements_achievement_slug_fkey" FOREIGN KEY (achievement_slug) REFERENCES gamification.achievement_catalog(slug) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_achievements" ADD CONSTRAINT "student_achievements_source_test_id_fkey" FOREIGN KEY (source_test_id) REFERENCES training.physical_tests(id) ON DELETE SET NULL;
ALTER TABLE "gamification"."student_achievements" ADD CONSTRAINT "student_achievements_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_challenge_progress" ADD CONSTRAINT "student_challenge_progress_challenge_slug_fkey" FOREIGN KEY (challenge_slug) REFERENCES gamification.challenges_catalog(slug) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_challenge_progress" ADD CONSTRAINT "student_challenge_progress_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."currency_wallets" ADD CONSTRAINT "currency_wallets_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."currency_ledger" ADD CONSTRAINT "currency_ledger_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_cosmetic_items" ADD CONSTRAINT "student_cosmetic_items_item_slug_fkey" FOREIGN KEY (item_slug) REFERENCES gamification.cosmetic_items_catalog(slug) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_cosmetic_items" ADD CONSTRAINT "student_cosmetic_items_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."leaderboard_snapshots" ADD CONSTRAINT "leaderboard_snapshots_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_identity" ADD CONSTRAINT "student_identity_selected_title_slug_fkey" FOREIGN KEY (selected_title_slug) REFERENCES gamification.titles_catalog(slug) ON DELETE SET NULL;
ALTER TABLE "gamification"."student_identity" ADD CONSTRAINT "student_identity_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_hidden_rewards" ADD CONSTRAINT "student_hidden_rewards_reward_slug_fkey" FOREIGN KEY (reward_slug) REFERENCES gamification.hidden_rewards_catalog(slug) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_hidden_rewards" ADD CONSTRAINT "student_hidden_rewards_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "public"."user_notification_inbox_state" ADD CONSTRAINT "user_notification_inbox_state_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."login_rewards" ADD CONSTRAINT "login_rewards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."xp_ledger" ADD CONSTRAINT "xp_ledger_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_cosmetic_equipment" ADD CONSTRAINT "student_cosmetic_equipment_background_item_slug_fkey" FOREIGN KEY (background_item_slug) REFERENCES gamification.cosmetic_items_catalog(slug) ON DELETE SET NULL;
ALTER TABLE "gamification"."student_cosmetic_equipment" ADD CONSTRAINT "student_cosmetic_equipment_badge_item_slug_fkey" FOREIGN KEY (badge_item_slug) REFERENCES gamification.cosmetic_items_catalog(slug) ON DELETE SET NULL;
ALTER TABLE "gamification"."student_cosmetic_equipment" ADD CONSTRAINT "student_cosmetic_equipment_effect_item_slug_fkey" FOREIGN KEY (effect_item_slug) REFERENCES gamification.cosmetic_items_catalog(slug) ON DELETE SET NULL;
ALTER TABLE "gamification"."student_cosmetic_equipment" ADD CONSTRAINT "student_cosmetic_equipment_frame_item_slug_fkey" FOREIGN KEY (frame_item_slug) REFERENCES gamification.cosmetic_items_catalog(slug) ON DELETE SET NULL;
ALTER TABLE "gamification"."student_cosmetic_equipment" ADD CONSTRAINT "student_cosmetic_equipment_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_report_code_fkey" FOREIGN KEY (report_code) REFERENCES reporting.report_definitions(code) ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE "reporting"."report_runs" ADD CONSTRAINT "report_runs_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id);
ALTER TABLE "reporting"."report_artifacts" ADD CONSTRAINT "report_artifacts_run_id_fkey" FOREIGN KEY (run_id) REFERENCES reporting.report_runs(id) ON DELETE CASCADE;
ALTER TABLE "profiles"."user_notification_preferences" ADD CONSTRAINT "user_notification_preferences_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "gamification"."student_current_stage" ADD CONSTRAINT "student_current_stage_current_stage_slug_fkey" FOREIGN KEY (current_stage_slug) REFERENCES gamification.athlete_stages_catalog(slug) ON DELETE RESTRICT;
ALTER TABLE "gamification"."student_current_stage" ADD CONSTRAINT "student_current_stage_student_id_fkey" FOREIGN KEY (student_id) REFERENCES core.students(id) ON DELETE CASCADE;
CREATE INDEX gamification_student_hidden_rewards_student_id_updated_at_idx ON gamification.student_hidden_rewards USING btree (student_id, updated_at DESC);
CREATE INDEX idx_announcements_is_active ON public_content.announcements USING btree (is_active);
CREATE INDEX idx_login_attempts_email_time ON security.login_attempts USING btree (user_email, attempt_at DESC);
CREATE INDEX idx_mobile_device_registrations_user_id ON profiles.mobile_device_registrations USING btree (user_id);
CREATE INDEX ix_core_users_telefono_search_partial ON core.users USING gin (telefono_search_partial);
CREATE INDEX idx_user_profiles_org ON profiles.user_profiles USING btree (organization_id);
CREATE INDEX idx_core_students_categoria ON core.students USING btree (categoria);
CREATE INDEX idx_users_suspended ON core.users USING btree (suspended);
CREATE INDEX idx_announcements_created_by ON public_content.announcements USING btree (created_by);
CREATE INDEX idx_payments_deleted_at ON billing.payments USING btree (deleted_at) WHERE (deleted_at IS NULL);
CREATE INDEX report_runs_report_code_created_at_idx ON reporting.report_runs USING btree (report_code, created_at DESC);
CREATE INDEX idx_user_profiles_role ON profiles.user_profiles USING btree (role);
CREATE INDEX idx_announcements_created_at ON public_content.announcements USING btree (created_at DESC);
CREATE INDEX idx_payments_membership_type_id ON billing.payments USING btree (membership_type_id);
CREATE INDEX idx_physical_tests_student_id ON training.physical_tests USING btree (student_id);
CREATE INDEX physical_tests_student_id_idx ON training.physical_tests USING btree (student_id);
CREATE INDEX idx_login_attempts_recent_failed ON security.login_attempts USING btree (user_email, attempt_at DESC) WHERE (success = false);
CREATE INDEX ix_core_users_email_search_partial ON core.users USING gin (email_search_partial);
CREATE UNIQUE INDEX gamification_student_identity_nickname_unique_idx ON gamification.student_identity USING btree (lower(TRIM(BOTH FROM nickname))) WHERE ((nickname IS NOT NULL) AND (length(TRIM(BOTH FROM nickname)) > 0));
CREATE INDEX idx_login_blocks_locked_until ON security.login_blocks USING btree (locked_until);
CREATE INDEX idx_announcements_priority ON public_content.announcements USING btree (priority);
CREATE INDEX report_runs_status_created_at_idx ON reporting.report_runs USING btree (status, created_at DESC);
CREATE INDEX gamification_student_stage_history_student_id_awarded_at_idx ON gamification.student_stage_history USING btree (student_id, awarded_at DESC);
CREATE INDEX idx_physical_tests_fecha_test ON training.physical_tests USING btree (fecha_test);
CREATE INDEX idx_payments_audit_payment_id ON audit.payments_audit USING btree (payment_id);
CREATE INDEX idx_mobile_device_registrations_enabled ON profiles.mobile_device_registrations USING btree (notifications_enabled);
CREATE INDEX idx_mobile_device_registrations_last_delivery_status ON profiles.mobile_device_registrations USING btree (last_delivery_status);
CREATE UNIQUE INDEX ux_core_users_email_search_exact ON core.users USING btree (email_search_exact) WHERE (email_search_exact IS NOT NULL);
CREATE INDEX gamification_xp_ledger_student_id_occurred_at_idx ON gamification.xp_ledger USING btree (student_id, occurred_at DESC);
CREATE INDEX idx_training_schedules_categoria ON training.schedules USING btree (categoria);
CREATE INDEX idx_mobile_device_registrations_device_id ON profiles.mobile_device_registrations USING btree (user_id, platform, device_id);
CREATE INDEX gamification_student_campaign_progress_student_id_updated_at_id ON gamification.student_campaign_progress USING btree (student_id, updated_at DESC);
CREATE INDEX idx_payments_student_fecha_fin_active ON billing.payments USING btree (student_id, fecha_fin DESC) WHERE (deleted_at IS NULL);
CREATE INDEX ix_core_users_telefono_search_exact ON core.users USING btree (telefono_search_exact) WHERE (telefono_search_exact IS NOT NULL);
CREATE INDEX gamification_currency_ledger_student_id_occurred_at_idx ON gamification.currency_ledger USING btree (student_id, occurred_at DESC);
CREATE INDEX idx_payments_audit_changed_at ON audit.payments_audit USING btree (changed_at DESC);
CREATE INDEX report_artifacts_run_id_idx ON reporting.report_artifacts USING btree (run_id);
CREATE VIEW "public"."membership_types" WITH (security_invoker=true) AS  SELECT id,
    code,
    nombre,
    detalle,
    costo,
    active,
    created_at,
    updated_at
   FROM billing.membership_types;
CREATE VIEW "public"."gamification_cosmetic_items_catalog" WITH (security_invoker=true) AS  SELECT slug,
    name,
    description,
    rarity,
    category,
    price_coins,
    is_active,
    sort_order,
    metadata,
    created_at
   FROM gamification.cosmetic_items_catalog;
CREATE VIEW "public"."gamification_student_cosmetic_items" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    item_slug,
    source_type,
    metadata,
    acquired_at
   FROM gamification.student_cosmetic_items;
CREATE VIEW "public"."gamification_campaigns_catalog" WITH (security_invoker=true) AS  SELECT slug,
    name,
    description,
    focus_area,
    window_type,
    target_metric,
    target_value,
    reward_label,
    reward_payload,
    hint,
    is_secret,
    start_date,
    end_date,
    is_active,
    created_at
   FROM gamification.campaigns_catalog;
CREATE VIEW "public"."gamification_student_campaign_progress" WITH (security_invoker=true) AS  SELECT student_id,
    campaign_slug,
    progress_value,
    is_completed,
    completed_at,
    metadata,
    updated_at
   FROM gamification.student_campaign_progress;
CREATE VIEW "public"."announcements" WITH (security_invoker=true) AS  SELECT id,
    title,
    content,
    priority,
    target_audience,
    is_active,
    created_by,
    created_at,
    updated_at,
    expires_at,
    image_url,
    attachment_url
   FROM public_content.announcements;
CREATE VIEW "public"."training_categories" WITH (security_invoker=true) AS  SELECT code,
    label,
    default_description,
    for_schedules,
    for_students,
    is_active,
    created_at,
    updated_at
   FROM training.training_categories;
CREATE VIEW "public"."announcements_with_creator" WITH (security_invoker=true) AS  SELECT a.id,
    a.title,
    a.content,
    a.priority,
    a.target_audience,
    a.is_active,
    a.created_by,
    a.created_at,
    a.updated_at,
    a.expires_at,
    a.image_url,
    a.attachment_url,
    up.full_name AS creator_name,
    up.role AS creator_role
   FROM public_content.announcements a
     LEFT JOIN profiles.user_profiles up ON up.id = a.created_by;
CREATE VIEW "public"."users_password_backup" WITH (security_invoker=true) AS  SELECT id,
    email,
    password,
    created_at
   FROM security.users_password_backup;
CREATE VIEW "public"."gamification_achievement_catalog" WITH (security_invoker=true) AS  SELECT slug,
    title,
    description,
    core_driver,
    xp_reward,
    sort_order,
    is_active,
    criteria,
    created_at
   FROM gamification.achievement_catalog;
CREATE VIEW "public"."gamification_reward_events" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    source_type,
    source_id,
    event_type,
    xp_awarded,
    payload,
    created_at
   FROM gamification.reward_events;
CREATE VIEW "public"."gamification_profiles" WITH (security_invoker=true) AS  SELECT student_id,
    current_level,
    current_xp,
    total_xp,
    active_streak,
    longest_streak,
    last_test_date,
    last_synced_at,
    summary,
    created_at,
    updated_at
   FROM gamification.student_profiles;
CREATE VIEW "public"."gamification_student_achievements" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    achievement_slug,
    source_test_id,
    metadata,
    earned_at
   FROM gamification.student_achievements;
CREATE VIEW "public"."gamification_student_challenge_progress" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    challenge_slug,
    progress_value,
    is_completed,
    completed_at,
    updated_at
   FROM gamification.student_challenge_progress;
CREATE VIEW "public"."gamification_leaderboard_snapshots" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    categoria,
    age_band,
    score,
    current_level,
    rank_position,
    snapshot_date,
    updated_at
   FROM gamification.leaderboard_snapshots;
CREATE VIEW "public"."gamification_currency_wallets" WITH (security_invoker=true) AS  SELECT student_id,
    balance,
    total_earned,
    total_spent,
    last_synced_at,
    created_at,
    updated_at
   FROM gamification.currency_wallets;
CREATE VIEW "public"."gamification_currency_ledger" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    source_type,
    source_ref,
    coins_delta,
    label,
    description,
    metadata,
    occurred_at,
    created_at
   FROM gamification.currency_ledger;
CREATE VIEW "public"."gamification_student_cosmetic_equipment" WITH (security_invoker=true) AS  SELECT student_id,
    frame_item_slug,
    background_item_slug,
    badge_item_slug,
    effect_item_slug,
    updated_at
   FROM gamification.student_cosmetic_equipment;
CREATE VIEW "public"."gamification_leaderboard_public" WITH (security_invoker=true) AS  SELECT ls.student_id,
    ls.categoria,
    ls.age_band,
    ls.score,
    ls.current_level,
    ls.rank_position,
    ls.snapshot_date,
    (upper("left"(u.nombre, 1) || repeat('*'::text, GREATEST(length(COALESCE(u.nombre, ''::text)) - 1, 0))) || ' '::text) || upper("left"(COALESCE(u.apellido, '?'::text), 1)) AS public_alias
   FROM gamification.leaderboard_snapshots ls
     JOIN core.students s ON s.id = ls.student_id
     JOIN core.users u ON u.id = s.user_id;
CREATE VIEW "public"."gamification_challenges_catalog" WITH (security_invoker=true) AS  SELECT slug,
    title,
    description,
    core_driver,
    target_metric,
    target_value,
    window_type,
    is_active,
    start_date,
    end_date,
    created_at
   FROM gamification.challenges_catalog;
CREATE VIEW "public"."gamification_titles_catalog" WITH (security_invoker=true) AS  SELECT slug,
    name,
    description,
    rarity,
    sort_order,
    is_active,
    criteria,
    created_at
   FROM gamification.titles_catalog;
CREATE VIEW "public"."payments_audit" WITH (security_invoker=true) AS  SELECT id,
    payment_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_at
   FROM audit.payments_audit;
CREATE VIEW "public"."users" WITH (security_invoker=true) AS  SELECT id,
    email,
    role,
    nombre,
    apellido,
    NULL::text AS cedula,
    fecha_nacimiento,
    telefono,
    email_ciphertext,
    email_search_exact,
    email_search_partial,
    email_masked,
    telefono_ciphertext,
    telefono_search_exact,
    telefono_search_partial,
    telefono_masked,
    first_login,
    suspended,
    suspension_reason,
    suspension_until,
    suspended_at,
    last_login,
    created_at
   FROM core.users;
CREATE VIEW "public"."attendances" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    schedule_id,
    fecha,
    metodo_pago_id,
    hora_entrada
   FROM training.attendances;
CREATE VIEW "public"."gamification_xp_ledger" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    source_type,
    source_ref,
    xp_delta,
    label,
    description,
    metadata,
    occurred_at,
    created_at
   FROM gamification.xp_ledger;
CREATE VIEW "public"."gamification_login_rewards" WITH (security_invoker=true) AS  SELECT user_id,
    reward_date,
    reward_count,
    updated_at
   FROM gamification.login_rewards;
CREATE VIEW "public"."gamification_hidden_rewards_catalog" WITH (security_invoker=true) AS  SELECT slug,
    name,
    teaser,
    description,
    hint,
    target_metric,
    target_value,
    reward_label,
    reward_payload,
    is_active,
    created_at
   FROM gamification.hidden_rewards_catalog;
CREATE VIEW "public"."mobile_device_registrations" WITH (security_invoker=true) AS  SELECT id,
    user_id,
    platform,
    device_token,
    device_name,
    app_version,
    notifications_enabled,
    last_seen_at,
    created_at,
    updated_at,
    device_id,
    native_version,
    native_build,
    bundle_version,
    bundle_id,
    builtin_version,
    ota_channel,
    updater_plugin_version,
    last_delivery_status,
    last_delivery_error,
    last_delivery_attempt_at,
    last_delivery_success_at,
    invalidated_at
   FROM profiles.mobile_device_registrations;
CREATE VIEW "public"."schedules" WITH (security_invoker=true) AS  SELECT id,
    dia_semana,
    hora_inicio,
    hora_fin,
    categoria,
    descripcion
   FROM training.schedules;
CREATE VIEW "public"."physical_tests" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    estatura,
    peso,
    brazo_extend_inicial,
    brazo_extend_sin_impulso,
    brazo_extend_con_impulso,
    fuerza_explosiva_salto_largo,
    envergadura_brazos_extendidos_lateral,
    fecha_test,
    observaciones,
    created_at,
    updated_at,
    modified_at,
    fuerza_abdomen,
    fuerza_brazos,
    fuerza_piernas,
    elevaciones_barra
   FROM training.physical_tests;
CREATE VIEW "public"."user_profiles" WITH (security_invoker=true) AS  SELECT id,
    full_name,
    role,
    organization_id,
    created_at
   FROM profiles.user_profiles;
CREATE VIEW "public"."payment_types" WITH (security_invoker=true) AS  SELECT id,
    nombre,
    descripcion,
    precio
   FROM billing.payment_types;
CREATE VIEW "public"."payments" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    payment_type_id,
    monto,
    fecha_pago,
    fecha_inicio,
    fecha_fin,
    estado,
    deleted_at,
    membership_type_id
   FROM billing.payments;
CREATE VIEW "public"."gamification_student_hidden_rewards" WITH (security_invoker=true) AS  SELECT student_id,
    reward_slug,
    progress_value,
    discovered_at,
    metadata,
    updated_at
   FROM gamification.student_hidden_rewards;
CREATE VIEW "public"."students" WITH (security_invoker=true) AS  SELECT id,
    user_id,
    categoria,
    fecha_ingreso,
    fecha_nacimiento,
    edad
   FROM core.students;
CREATE VIEW "public"."payments_active" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    payment_type_id,
    monto,
    fecha_pago,
    fecha_inicio,
    fecha_fin,
    estado,
    deleted_at,
    membership_type_id
   FROM billing.payments
  WHERE deleted_at IS NULL;
CREATE VIEW "public"."report_runs" WITH (security_invoker=true) AS  SELECT id,
    report_code,
    period_start,
    period_end,
    trigger,
    status,
    snapshot_json,
    summary_json,
    requested_by,
    error_message,
    created_at,
    finished_at
   FROM reporting.report_runs;
CREATE VIEW "public"."report_artifacts" WITH (security_invoker=true) AS  SELECT id,
    run_id,
    format,
    storage_bucket,
    storage_path,
    file_size,
    checksum,
    created_at
   FROM reporting.report_artifacts;
CREATE VIEW "public"."report_definitions" WITH (security_invoker=true) AS  SELECT code,
    name,
    description,
    renderer,
    source_kind,
    schedule_time,
    timezone,
    is_active,
    created_at,
    updated_at
   FROM reporting.report_definitions;
CREATE VIEW "public"."user_notification_preferences" WITH (security_invoker=true) AS  SELECT user_id,
    announcement_enabled,
    payment_reminders_enabled,
    created_at,
    updated_at,
    payment_registered_enabled,
    payment_overdue_enabled,
    attendance_enabled,
    gamification_enabled
   FROM profiles.user_notification_preferences;
CREATE VIEW "public"."gamification_student_identity" WITH (security_invoker=true) AS  SELECT student_id,
    nickname,
    selected_title_slug,
    created_at,
    updated_at,
    nickname_updated_at,
    avatar_style,
    profile_image_mode,
    profile_photo_path,
    profile_photo_updated_at,
    avatar_model_slug
   FROM gamification.student_identity;
CREATE VIEW "public"."gamification_student_current_stage" WITH (security_invoker=true) AS  SELECT student_id,
    current_stage_slug,
    progress_hint,
    metadata,
    updated_at
   FROM gamification.student_current_stage;
CREATE VIEW "public"."gamification_student_stage_history" WITH (security_invoker=true) AS  SELECT id,
    student_id,
    stage_slug,
    awarded_at,
    awarded_reason,
    metadata,
    created_at
   FROM gamification.student_stage_history;
CREATE VIEW "public"."gamification_athlete_stages_catalog" WITH (security_invoker=true) AS  SELECT slug,
    name,
    description,
    progress_hint_template,
    sort_order,
    min_level,
    min_tests,
    min_attendances,
    min_payments,
    min_achievements,
    requires_leaderboard_presence,
    is_active,
    created_at
   FROM gamification.athlete_stages_catalog;
ALTER TABLE "training"."training_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing"."payment_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing"."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training"."schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training"."attendances" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "training"."physical_tests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"."user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "billing"."membership_types" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_campaign_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public_content"."announcements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."campaigns_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"."mobile_device_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."cosmetic_items_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."achievement_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."challenges_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_stage_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit"."payments_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."reward_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_challenge_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."currency_wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."currency_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_cosmetic_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."leaderboard_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_identity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."hidden_rewards_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_hidden_rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_notification_inbox_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."login_rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."xp_ledger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_cosmetic_equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reporting"."report_definitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reporting"."report_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reporting"."report_artifacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "core"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles"."user_notification_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."athlete_stages_catalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."student_current_stage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gamification"."titles_catalog" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training categories can be read" ON "training"."training_categories" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
CREATE POLICY "rls_training_categories_delete" ON "training"."training_categories" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_training_categories_insert" ON "training"."training_categories" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_training_categories_update" ON "training"."training_categories" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_payment_types_delete" ON "billing"."payment_types" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_payment_types_insert" ON "billing"."payment_types" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_payment_types_select" ON "billing"."payment_types" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
CREATE POLICY "rls_payment_types_update" ON "billing"."payment_types" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_payments_delete" ON "billing"."payments" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_payments_insert" ON "billing"."payments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_payments_select" ON "billing"."payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_payments_update" ON "billing"."payments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_schedules_delete" ON "training"."schedules" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_schedules_insert" ON "training"."schedules" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_schedules_select" ON "training"."schedules" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
CREATE POLICY "rls_schedules_update" ON "training"."schedules" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_attendances_delete" ON "training"."attendances" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_attendances_insert" ON "training"."attendances" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_attendances_select" ON "training"."attendances" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_attendances_update" ON "training"."attendances" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_physical_tests_delete" ON "training"."physical_tests" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_physical_tests_insert" ON "training"."physical_tests" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_physical_tests_select" ON "training"."physical_tests" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_physical_tests_update" ON "training"."physical_tests" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_students_delete" ON "core"."students" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "rls_students_insert" ON "core"."students" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "rls_students_select" ON "core"."students" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "rls_students_update" ON "core"."students" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT auth.uid() AS uid) = user_id))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "rls_user_profiles_delete" ON "profiles"."user_profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (id = ( SELECT auth.uid() AS uid)) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (EXISTS ( SELECT 1
   FROM core.users u
  WHERE ((u.id = user_profiles.id) AND (u.role = 'estudiante'::text)))))));
CREATE POLICY "rls_user_profiles_insert" ON "profiles"."user_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin() AS is_admin) OR (id = ( SELECT auth.uid() AS uid)) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (EXISTS ( SELECT 1
   FROM core.users u
  WHERE ((u.id = user_profiles.id) AND (u.role = 'estudiante'::text)))))));
CREATE POLICY "rls_user_profiles_select" ON "profiles"."user_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "rls_user_profiles_update" ON "profiles"."user_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (id = ( SELECT auth.uid() AS uid)) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (EXISTS ( SELECT 1
   FROM core.users u
  WHERE ((u.id = user_profiles.id) AND (u.role = 'estudiante'::text))))))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR (id = ( SELECT auth.uid() AS uid)) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (EXISTS ( SELECT 1
   FROM core.users u
  WHERE ((u.id = user_profiles.id) AND (u.role = 'estudiante'::text)))))));
CREATE POLICY "rls_membership_types_delete" ON "billing"."membership_types" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_membership_types_insert" ON "billing"."membership_types" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_membership_types_select" ON "billing"."membership_types" AS PERMISSIVE FOR SELECT TO "anon","authenticated" USING (true);
CREATE POLICY "rls_membership_types_update" ON "billing"."membership_types" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "gamification_student_campaign_progress_insert" ON "gamification"."student_campaign_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_campaign_progress_read" ON "gamification"."student_campaign_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_campaign_progress_update" ON "gamification"."student_campaign_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "Admins y entrenadores pueden crear anuncios" ON "public_content"."announcements" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "Creador, admins y entrenadores pueden actualizar anuncios" ON "public_content"."announcements" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((created_by = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer))) WITH CHECK (((created_by = ( SELECT auth.uid() AS uid)) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "Solo admins pueden eliminar anuncios" ON "public_content"."announcements" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "Todos pueden ver anuncios activos" ON "public_content"."announcements" AS PERMISSIVE FOR SELECT TO PUBLIC USING (((is_active = true) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_campaigns_catalog_delete" ON "gamification"."campaigns_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_campaigns_catalog_insert" ON "gamification"."campaigns_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_campaigns_catalog_select" ON "gamification"."campaigns_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_campaigns_catalog_update" ON "gamification"."campaigns_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "mobile_device_registrations_delete_own" ON "profiles"."mobile_device_registrations" AS PERMISSIVE FOR DELETE TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "mobile_device_registrations_insert_own" ON "profiles"."mobile_device_registrations" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "mobile_device_registrations_select_own" ON "profiles"."mobile_device_registrations" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "mobile_device_registrations_update_own" ON "profiles"."mobile_device_registrations" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "rls_cosmetic_items_catalog_delete" ON "gamification"."cosmetic_items_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_cosmetic_items_catalog_insert" ON "gamification"."cosmetic_items_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_cosmetic_items_catalog_select" ON "gamification"."cosmetic_items_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_cosmetic_items_catalog_update" ON "gamification"."cosmetic_items_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_achievement_catalog_delete" ON "gamification"."achievement_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_achievement_catalog_insert" ON "gamification"."achievement_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_achievement_catalog_select" ON "gamification"."achievement_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_achievement_catalog_update" ON "gamification"."achievement_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_challenges_catalog_delete" ON "gamification"."challenges_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_challenges_catalog_insert" ON "gamification"."challenges_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_challenges_catalog_select" ON "gamification"."challenges_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_challenges_catalog_update" ON "gamification"."challenges_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "gamification_student_stage_history_insert" ON "gamification"."student_stage_history" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_stage_history.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_stage_history_read" ON "gamification"."student_stage_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_stage_history.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_payments_audit_select" ON "audit"."payments_audit" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "rls_student_profiles_delete" ON "gamification"."student_profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_profiles_insert" ON "gamification"."student_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_profiles_select" ON "gamification"."student_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_profiles_update" ON "gamification"."student_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_reward_events_delete" ON "gamification"."reward_events" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_reward_events_insert" ON "gamification"."reward_events" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_reward_events_select" ON "gamification"."reward_events" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_reward_events_update" ON "gamification"."reward_events" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_achievements_delete" ON "gamification"."student_achievements" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_achievements_insert" ON "gamification"."student_achievements" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_achievements_select" ON "gamification"."student_achievements" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_achievements_update" ON "gamification"."student_achievements" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_challenge_progress_delete" ON "gamification"."student_challenge_progress" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_challenge_progress_insert" ON "gamification"."student_challenge_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_challenge_progress_select" ON "gamification"."student_challenge_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_challenge_progress_update" ON "gamification"."student_challenge_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_wallets_delete" ON "gamification"."currency_wallets" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_wallets_insert" ON "gamification"."currency_wallets" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_wallets_select" ON "gamification"."currency_wallets" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_wallets_update" ON "gamification"."currency_wallets" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_ledger_delete" ON "gamification"."currency_ledger" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_ledger_insert" ON "gamification"."currency_ledger" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_ledger_select" ON "gamification"."currency_ledger" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_currency_ledger_update" ON "gamification"."currency_ledger" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_cosmetic_items_delete" ON "gamification"."student_cosmetic_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "rls_student_cosmetic_items_insert" ON "gamification"."student_cosmetic_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "rls_student_cosmetic_items_select" ON "gamification"."student_cosmetic_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_cosmetic_items.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))));
CREATE POLICY "rls_student_cosmetic_items_update" ON "gamification"."student_cosmetic_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer)) WITH CHECK (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "rls_leaderboard_snapshots_delete" ON "gamification"."leaderboard_snapshots" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_leaderboard_snapshots_insert" ON "gamification"."leaderboard_snapshots" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "rls_leaderboard_snapshots_select" ON "gamification"."leaderboard_snapshots" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_leaderboard_snapshots_update" ON "gamification"."leaderboard_snapshots" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT is_admin_or_trainer() AS is_admin_or_trainer)));
CREATE POLICY "gamification_student_identity_insert" ON "gamification"."student_identity" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_identity_read" ON "gamification"."student_identity" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_identity_update" ON "gamification"."student_identity" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_hidden_rewards_catalog_delete" ON "gamification"."hidden_rewards_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_hidden_rewards_catalog_insert" ON "gamification"."hidden_rewards_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_hidden_rewards_catalog_select" ON "gamification"."hidden_rewards_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_hidden_rewards_catalog_update" ON "gamification"."hidden_rewards_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "gamification_student_hidden_rewards_insert" ON "gamification"."student_hidden_rewards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_hidden_rewards_read" ON "gamification"."student_hidden_rewards" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_hidden_rewards_update" ON "gamification"."student_hidden_rewards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "user_notification_inbox_state_delete_own" ON "public"."user_notification_inbox_state" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "user_notification_inbox_state_insert_own" ON "public"."user_notification_inbox_state" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "user_notification_inbox_state_select_own" ON "public"."user_notification_inbox_state" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "user_notification_inbox_state_update_own" ON "public"."user_notification_inbox_state" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "rls_login_rewards_owner" ON "gamification"."login_rewards" AS PERMISSIVE FOR ALL TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "rls_xp_ledger_owner" ON "gamification"."xp_ledger" AS PERMISSIVE FOR ALL TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = xp_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = xp_ledger.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_student_cosmetic_equipment_delete" ON "gamification"."student_cosmetic_equipment" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "rls_student_cosmetic_equipment_insert" ON "gamification"."student_cosmetic_equipment" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "rls_student_cosmetic_equipment_select" ON "gamification"."student_cosmetic_equipment" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_cosmetic_equipment.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))));
CREATE POLICY "rls_student_cosmetic_equipment_update" ON "gamification"."student_cosmetic_equipment" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer)) WITH CHECK (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "report_definitions_admin_trainer_read" ON "reporting"."report_definitions" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "report_runs_admin_trainer_read" ON "reporting"."report_runs" AS PERMISSIVE FOR SELECT TO "authenticated" USING (( SELECT is_admin_or_trainer() AS is_admin_or_trainer));
CREATE POLICY "report_artifacts_admin_trainer_read" ON "reporting"."report_artifacts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (EXISTS ( SELECT 1
   FROM reporting.report_runs rr
  WHERE (rr.id = report_artifacts.run_id)))));
CREATE POLICY "rls_users_delete" ON "core"."users" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (role = 'estudiante'::text))));
CREATE POLICY "rls_users_insert" ON "core"."users" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin() AS is_admin) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (role = 'estudiante'::text))));
CREATE POLICY "rls_users_select" ON "core"."users" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "rls_users_update" ON "core"."users" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin() AS is_admin) OR (id = ( SELECT auth.uid() AS uid)) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (role = 'estudiante'::text)))) WITH CHECK ((( SELECT is_admin() AS is_admin) OR (id = ( SELECT auth.uid() AS uid)) OR (( SELECT is_admin_or_trainer() AS is_admin_or_trainer) AND (role = 'estudiante'::text))));
CREATE POLICY "user_notification_preferences_insert_own" ON "profiles"."user_notification_preferences" AS PERMISSIVE FOR INSERT TO PUBLIC WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "user_notification_preferences_select_own" ON "profiles"."user_notification_preferences" AS PERMISSIVE FOR SELECT TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "user_notification_preferences_update_own" ON "profiles"."user_notification_preferences" AS PERMISSIVE FOR UPDATE TO PUBLIC USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "rls_athlete_stages_catalog_delete" ON "gamification"."athlete_stages_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_athlete_stages_catalog_insert" ON "gamification"."athlete_stages_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_athlete_stages_catalog_select" ON "gamification"."athlete_stages_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_athlete_stages_catalog_update" ON "gamification"."athlete_stages_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "gamification_student_current_stage_insert" ON "gamification"."student_current_stage" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_current_stage_read" ON "gamification"."student_current_stage" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "gamification_student_current_stage_update" ON "gamification"."student_current_stage" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid))))))) WITH CHECK ((( SELECT is_admin_or_trainer() AS is_admin_or_trainer) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "rls_titles_catalog_delete" ON "gamification"."titles_catalog" AS PERMISSIVE FOR DELETE TO "authenticated" USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_titles_catalog_insert" ON "gamification"."titles_catalog" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "rls_titles_catalog_select" ON "gamification"."titles_catalog" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);
CREATE POLICY "rls_titles_catalog_update" ON "gamification"."titles_catalog" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (( SELECT is_admin() AS is_admin)) WITH CHECK (( SELECT is_admin() AS is_admin));
DROP TRIGGER IF EXISTS "update_physical_test_modtime" ON "training"."physical_tests";
CREATE TRIGGER update_physical_test_modtime BEFORE UPDATE ON training.physical_tests FOR EACH ROW EXECUTE FUNCTION update_modified_column();
DROP TRIGGER IF EXISTS "trigger_update_announcements_updated_at" ON "public_content"."announcements";
CREATE TRIGGER trigger_update_announcements_updated_at BEFORE UPDATE ON public_content.announcements FOR EACH ROW EXECUTE FUNCTION update_announcements_updated_at();
DROP TRIGGER IF EXISTS "payments_audit_trigger" ON "billing"."payments";
CREATE TRIGGER payments_audit_trigger AFTER INSERT OR DELETE OR UPDATE ON billing.payments FOR EACH ROW EXECUTE FUNCTION audit_payments();
DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
DROP TRIGGER IF EXISTS "trigger_sync_last_login_from_auth" ON "auth"."users";
CREATE TRIGGER trigger_sync_last_login_from_auth AFTER UPDATE OF last_sign_in_at ON auth.users FOR EACH ROW WHEN ((old.last_sign_in_at IS DISTINCT FROM new.last_sign_in_at)) EXECUTE FUNCTION sync_last_login_from_auth();
DROP TRIGGER IF EXISTS "trigger_sync_first_login_on_password_change" ON "auth"."users";
CREATE TRIGGER trigger_sync_first_login_on_password_change AFTER UPDATE OF encrypted_password ON auth.users FOR EACH ROW WHEN (((old.encrypted_password)::text IS DISTINCT FROM (new.encrypted_password)::text)) EXECUTE FUNCTION sync_first_login_on_password_change();
DROP TRIGGER IF EXISTS "trigger_sync_user_profile" ON "core"."users";
CREATE TRIGGER trigger_sync_user_profile AFTER UPDATE ON core.users FOR EACH ROW WHEN ((old.role IS DISTINCT FROM new.role)) EXECUTE FUNCTION sync_user_profile_on_user_update();
DROP TRIGGER IF EXISTS "trg_enforce_physical_test_age" ON "training"."physical_tests";
CREATE TRIGGER trg_enforce_physical_test_age BEFORE INSERT OR UPDATE ON training.physical_tests FOR EACH ROW EXECUTE FUNCTION training.enforce_physical_test_age();
DROP TRIGGER IF EXISTS "trg_report_definitions_updated_at" ON "reporting"."report_definitions";
CREATE TRIGGER trg_report_definitions_updated_at BEFORE UPDATE ON reporting.report_definitions FOR EACH ROW EXECUTE FUNCTION reporting.set_updated_at();
DROP TRIGGER IF EXISTS "trg_scheduler_config_updated_at" ON "reporting"."scheduler_config";
CREATE TRIGGER trg_scheduler_config_updated_at BEFORE UPDATE ON reporting.scheduler_config FOR EACH ROW EXECUTE FUNCTION reporting.touch_scheduler_config_updated_at();
DROP TRIGGER IF EXISTS "payments_membership_rules_trigger" ON "billing"."payments";
CREATE TRIGGER payments_membership_rules_trigger BEFORE INSERT OR UPDATE ON billing.payments FOR EACH ROW EXECUTE FUNCTION apply_payment_membership_rules();
DROP TRIGGER IF EXISTS "trg_training_categories_updated_at" ON "training"."training_categories";
CREATE TRIGGER trg_training_categories_updated_at BEFORE UPDATE ON training.training_categories FOR EACH ROW EXECUTE FUNCTION training.touch_training_categories_updated_at();
DROP TRIGGER IF EXISTS "trg_mobile_device_registrations_updated_at" ON "profiles"."mobile_device_registrations";
CREATE TRIGGER trg_mobile_device_registrations_updated_at BEFORE UPDATE ON profiles.mobile_device_registrations FOR EACH ROW EXECUTE FUNCTION profiles.touch_mobile_device_registration_updated_at();
DROP TRIGGER IF EXISTS "trg_user_notification_preferences_updated_at" ON "profiles"."user_notification_preferences";
CREATE TRIGGER trg_user_notification_preferences_updated_at BEFORE UPDATE ON profiles.user_notification_preferences FOR EACH ROW EXECUTE FUNCTION profiles.touch_user_notification_preferences_updated_at();
DROP TRIGGER IF EXISTS "trg_skip_duplicate_daily_login_xp_ledger" ON "gamification"."xp_ledger";
CREATE TRIGGER trg_skip_duplicate_daily_login_xp_ledger BEFORE INSERT ON gamification.xp_ledger FOR EACH ROW EXECUTE FUNCTION gamification.skip_duplicate_daily_login_xp_ledger();
DROP TRIGGER IF EXISTS "trg_user_notification_inbox_state_updated_at" ON "public"."user_notification_inbox_state";
CREATE TRIGGER trg_user_notification_inbox_state_updated_at BEFORE UPDATE ON public.user_notification_inbox_state FOR EACH ROW EXECUTE FUNCTION touch_user_notification_inbox_state_updated_at();
DROP TRIGGER IF EXISTS "guard_client_user_fields" ON "core"."users";
CREATE TRIGGER guard_client_user_fields BEFORE UPDATE ON core.users FOR EACH ROW EXECUTE FUNCTION core.guard_client_user_fields();
DROP TRIGGER IF EXISTS "guard_client_profile_fields" ON "profiles"."user_profiles";
CREATE TRIGGER guard_client_profile_fields BEFORE INSERT OR UPDATE ON profiles.user_profiles FOR EACH ROW EXECUTE FUNCTION profiles.guard_client_profile_fields();
ALTER SEQUENCE "billing"."payment_types_id_seq" OWNED BY "billing"."payment_types"."id";
ALTER SEQUENCE "training"."schedules_id_seq" OWNED BY "training"."schedules"."id";
ALTER SEQUENCE "audit"."payments_audit_id_seq" OWNED BY "audit"."payments_audit"."id";
ALTER SEQUENCE "audit"."sql_executions_id_seq" OWNED BY "audit"."sql_executions"."id";
ALTER SEQUENCE "audit"."sql_errors_id_seq" OWNED BY "audit"."sql_errors"."id";
REVOKE ALL ON TABLE "training"."training_categories" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "billing"."payment_types" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "billing"."payments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "training"."schedules" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "training"."attendances" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "training"."physical_tests" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "core"."students" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "profiles"."user_profiles" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "billing"."membership_types" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_campaign_progress" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public_content"."announcements" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."campaigns_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "profiles"."mobile_device_registrations" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."cosmetic_items_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."achievement_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."challenges_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_stage_history" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "audit"."payments_audit" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_profiles" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."reward_events" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_achievements" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_challenge_progress" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."currency_wallets" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."currency_ledger" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_cosmetic_items" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."leaderboard_snapshots" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "security"."login_attempts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "security"."login_blocks" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_identity" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."hidden_rewards_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_hidden_rewards" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."user_notification_inbox_state" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."login_rewards" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."xp_ledger" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "audit"."sql_executions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "audit"."sql_errors" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_cosmetic_equipment" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "reporting"."report_definitions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "reporting"."report_runs" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "reporting"."report_artifacts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "core"."users" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "reporting"."scheduler_config" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "profiles"."user_notification_preferences" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."athlete_stages_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "security"."users_password_backup" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."student_current_stage" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "gamification"."titles_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."membership_types" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_cosmetic_items_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_cosmetic_items" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_campaigns_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_campaign_progress" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."announcements" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."training_categories" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."announcements_with_creator" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."users_password_backup" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_achievement_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_reward_events" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_profiles" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_achievements" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_challenge_progress" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_leaderboard_snapshots" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_currency_wallets" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_currency_ledger" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_cosmetic_equipment" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_leaderboard_public" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_challenges_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_titles_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."payments_audit" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."users" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."attendances" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_xp_ledger" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_login_rewards" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_hidden_rewards_catalog" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."mobile_device_registrations" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."schedules" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."physical_tests" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."user_profiles" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."payment_types" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."payments" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_hidden_rewards" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."students" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."payments_active" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."report_runs" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."report_artifacts" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."report_definitions" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."user_notification_preferences" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_identity" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_current_stage" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_student_stage_history" FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE "public"."gamification_athlete_stages_catalog" FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA "core" TO "authenticated";
GRANT USAGE ON SCHEMA "core" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "gamification" TO "authenticated";
GRANT USAGE ON SCHEMA "gamification" TO "anon";
GRANT USAGE ON SCHEMA "gamification" TO "service_role";
GRANT USAGE ON SCHEMA "billing" TO "authenticated";
GRANT USAGE ON SCHEMA "billing" TO "service_role";
GRANT USAGE ON SCHEMA "billing" TO "anon";
GRANT USAGE ON SCHEMA "training" TO "authenticated";
GRANT USAGE ON SCHEMA "training" TO "service_role";
GRANT USAGE ON SCHEMA "training" TO "anon";
GRANT USAGE ON SCHEMA "profiles" TO "service_role";
GRANT USAGE ON SCHEMA "profiles" TO "authenticated";
GRANT USAGE ON SCHEMA "profiles" TO "anon";
GRANT USAGE ON SCHEMA "public_content" TO "authenticated";
GRANT USAGE ON SCHEMA "public_content" TO "service_role";
GRANT USAGE ON SCHEMA "public_content" TO "anon";
GRANT USAGE ON SCHEMA "audit" TO "anon";
GRANT USAGE ON SCHEMA "audit" TO "authenticated";
GRANT USAGE ON SCHEMA "audit" TO "service_role";
GRANT USAGE ON SCHEMA "reporting" TO "authenticated";
GRANT USAGE ON SCHEMA "reporting" TO "service_role";
GRANT USAGE ON SCHEMA "security" TO "service_role";
GRANT INSERT ON TABLE "public"."membership_types" TO "anon";
GRANT SELECT ON TABLE "public"."membership_types" TO "anon";
GRANT UPDATE ON TABLE "public"."membership_types" TO "anon";
GRANT DELETE ON TABLE "public"."membership_types" TO "anon";
GRANT TRUNCATE ON TABLE "public"."membership_types" TO "anon";
GRANT REFERENCES ON TABLE "public"."membership_types" TO "anon";
GRANT TRIGGER ON TABLE "public"."membership_types" TO "anon";
GRANT MAINTAIN ON TABLE "public"."membership_types" TO "anon";
GRANT INSERT ON TABLE "public"."membership_types" TO "authenticated";
GRANT SELECT ON TABLE "public"."membership_types" TO "authenticated";
GRANT UPDATE ON TABLE "public"."membership_types" TO "authenticated";
GRANT DELETE ON TABLE "public"."membership_types" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."membership_types" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."membership_types" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."membership_types" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."membership_types" TO "authenticated";
GRANT INSERT ON TABLE "public"."membership_types" TO "service_role";
GRANT SELECT ON TABLE "public"."membership_types" TO "service_role";
GRANT UPDATE ON TABLE "public"."membership_types" TO "service_role";
GRANT DELETE ON TABLE "public"."membership_types" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."membership_types" TO "service_role";
GRANT REFERENCES ON TABLE "public"."membership_types" TO "service_role";
GRANT TRIGGER ON TABLE "public"."membership_types" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."membership_types" TO "service_role";
GRANT SELECT ON TABLE "training"."training_categories" TO "anon";
GRANT INSERT ON TABLE "training"."training_categories" TO "authenticated";
GRANT SELECT ON TABLE "training"."training_categories" TO "authenticated";
GRANT UPDATE ON TABLE "training"."training_categories" TO "authenticated";
GRANT DELETE ON TABLE "training"."training_categories" TO "authenticated";
GRANT INSERT ON TABLE "billing"."payment_types" TO "anon";
GRANT SELECT ON TABLE "billing"."payment_types" TO "anon";
GRANT UPDATE ON TABLE "billing"."payment_types" TO "anon";
GRANT DELETE ON TABLE "billing"."payment_types" TO "anon";
GRANT REFERENCES ON TABLE "billing"."payment_types" TO "anon";
GRANT TRIGGER ON TABLE "billing"."payment_types" TO "anon";
GRANT MAINTAIN ON TABLE "billing"."payment_types" TO "anon";
GRANT INSERT ON TABLE "billing"."payment_types" TO "authenticated";
GRANT SELECT ON TABLE "billing"."payment_types" TO "authenticated";
GRANT UPDATE ON TABLE "billing"."payment_types" TO "authenticated";
GRANT DELETE ON TABLE "billing"."payment_types" TO "authenticated";
GRANT REFERENCES ON TABLE "billing"."payment_types" TO "authenticated";
GRANT TRIGGER ON TABLE "billing"."payment_types" TO "authenticated";
GRANT MAINTAIN ON TABLE "billing"."payment_types" TO "authenticated";
GRANT INSERT ON TABLE "billing"."payment_types" TO "service_role";
GRANT SELECT ON TABLE "billing"."payment_types" TO "service_role";
GRANT UPDATE ON TABLE "billing"."payment_types" TO "service_role";
GRANT DELETE ON TABLE "billing"."payment_types" TO "service_role";
GRANT TRUNCATE ON TABLE "billing"."payment_types" TO "service_role";
GRANT REFERENCES ON TABLE "billing"."payment_types" TO "service_role";
GRANT TRIGGER ON TABLE "billing"."payment_types" TO "service_role";
GRANT MAINTAIN ON TABLE "billing"."payment_types" TO "service_role";
GRANT INSERT ON TABLE "billing"."payments" TO "anon";
GRANT SELECT ON TABLE "billing"."payments" TO "anon";
GRANT UPDATE ON TABLE "billing"."payments" TO "anon";
GRANT DELETE ON TABLE "billing"."payments" TO "anon";
GRANT REFERENCES ON TABLE "billing"."payments" TO "anon";
GRANT TRIGGER ON TABLE "billing"."payments" TO "anon";
GRANT MAINTAIN ON TABLE "billing"."payments" TO "anon";
GRANT INSERT ON TABLE "billing"."payments" TO "authenticated";
GRANT SELECT ON TABLE "billing"."payments" TO "authenticated";
GRANT UPDATE ON TABLE "billing"."payments" TO "authenticated";
GRANT DELETE ON TABLE "billing"."payments" TO "authenticated";
GRANT REFERENCES ON TABLE "billing"."payments" TO "authenticated";
GRANT TRIGGER ON TABLE "billing"."payments" TO "authenticated";
GRANT MAINTAIN ON TABLE "billing"."payments" TO "authenticated";
GRANT INSERT ON TABLE "billing"."payments" TO "service_role";
GRANT SELECT ON TABLE "billing"."payments" TO "service_role";
GRANT UPDATE ON TABLE "billing"."payments" TO "service_role";
GRANT DELETE ON TABLE "billing"."payments" TO "service_role";
GRANT TRUNCATE ON TABLE "billing"."payments" TO "service_role";
GRANT REFERENCES ON TABLE "billing"."payments" TO "service_role";
GRANT TRIGGER ON TABLE "billing"."payments" TO "service_role";
GRANT MAINTAIN ON TABLE "billing"."payments" TO "service_role";
GRANT SELECT ON SEQUENCE "training"."schedules_id_seq" TO "anon";
GRANT UPDATE ON SEQUENCE "training"."schedules_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "training"."schedules_id_seq" TO "anon";
GRANT SELECT ON SEQUENCE "training"."schedules_id_seq" TO "authenticated";
GRANT UPDATE ON SEQUENCE "training"."schedules_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "training"."schedules_id_seq" TO "authenticated";
GRANT SELECT ON SEQUENCE "training"."schedules_id_seq" TO "service_role";
GRANT UPDATE ON SEQUENCE "training"."schedules_id_seq" TO "service_role";
GRANT USAGE ON SEQUENCE "training"."schedules_id_seq" TO "service_role";
GRANT INSERT ON TABLE "training"."schedules" TO "anon";
GRANT SELECT ON TABLE "training"."schedules" TO "anon";
GRANT UPDATE ON TABLE "training"."schedules" TO "anon";
GRANT DELETE ON TABLE "training"."schedules" TO "anon";
GRANT REFERENCES ON TABLE "training"."schedules" TO "anon";
GRANT TRIGGER ON TABLE "training"."schedules" TO "anon";
GRANT MAINTAIN ON TABLE "training"."schedules" TO "anon";
GRANT INSERT ON TABLE "training"."schedules" TO "authenticated";
GRANT SELECT ON TABLE "training"."schedules" TO "authenticated";
GRANT UPDATE ON TABLE "training"."schedules" TO "authenticated";
GRANT DELETE ON TABLE "training"."schedules" TO "authenticated";
GRANT REFERENCES ON TABLE "training"."schedules" TO "authenticated";
GRANT TRIGGER ON TABLE "training"."schedules" TO "authenticated";
GRANT MAINTAIN ON TABLE "training"."schedules" TO "authenticated";
GRANT INSERT ON TABLE "training"."schedules" TO "service_role";
GRANT SELECT ON TABLE "training"."schedules" TO "service_role";
GRANT UPDATE ON TABLE "training"."schedules" TO "service_role";
GRANT DELETE ON TABLE "training"."schedules" TO "service_role";
GRANT TRUNCATE ON TABLE "training"."schedules" TO "service_role";
GRANT REFERENCES ON TABLE "training"."schedules" TO "service_role";
GRANT TRIGGER ON TABLE "training"."schedules" TO "service_role";
GRANT MAINTAIN ON TABLE "training"."schedules" TO "service_role";
GRANT INSERT ON TABLE "training"."attendances" TO "anon";
GRANT SELECT ON TABLE "training"."attendances" TO "anon";
GRANT UPDATE ON TABLE "training"."attendances" TO "anon";
GRANT DELETE ON TABLE "training"."attendances" TO "anon";
GRANT REFERENCES ON TABLE "training"."attendances" TO "anon";
GRANT TRIGGER ON TABLE "training"."attendances" TO "anon";
GRANT MAINTAIN ON TABLE "training"."attendances" TO "anon";
GRANT INSERT ON TABLE "training"."attendances" TO "authenticated";
GRANT SELECT ON TABLE "training"."attendances" TO "authenticated";
GRANT UPDATE ON TABLE "training"."attendances" TO "authenticated";
GRANT DELETE ON TABLE "training"."attendances" TO "authenticated";
GRANT REFERENCES ON TABLE "training"."attendances" TO "authenticated";
GRANT TRIGGER ON TABLE "training"."attendances" TO "authenticated";
GRANT MAINTAIN ON TABLE "training"."attendances" TO "authenticated";
GRANT INSERT ON TABLE "training"."attendances" TO "service_role";
GRANT SELECT ON TABLE "training"."attendances" TO "service_role";
GRANT UPDATE ON TABLE "training"."attendances" TO "service_role";
GRANT DELETE ON TABLE "training"."attendances" TO "service_role";
GRANT TRUNCATE ON TABLE "training"."attendances" TO "service_role";
GRANT REFERENCES ON TABLE "training"."attendances" TO "service_role";
GRANT TRIGGER ON TABLE "training"."attendances" TO "service_role";
GRANT MAINTAIN ON TABLE "training"."attendances" TO "service_role";
GRANT INSERT ON TABLE "training"."physical_tests" TO "anon";
GRANT SELECT ON TABLE "training"."physical_tests" TO "anon";
GRANT UPDATE ON TABLE "training"."physical_tests" TO "anon";
GRANT DELETE ON TABLE "training"."physical_tests" TO "anon";
GRANT REFERENCES ON TABLE "training"."physical_tests" TO "anon";
GRANT TRIGGER ON TABLE "training"."physical_tests" TO "anon";
GRANT MAINTAIN ON TABLE "training"."physical_tests" TO "anon";
GRANT INSERT ON TABLE "training"."physical_tests" TO "authenticated";
GRANT SELECT ON TABLE "training"."physical_tests" TO "authenticated";
GRANT UPDATE ON TABLE "training"."physical_tests" TO "authenticated";
GRANT DELETE ON TABLE "training"."physical_tests" TO "authenticated";
GRANT REFERENCES ON TABLE "training"."physical_tests" TO "authenticated";
GRANT TRIGGER ON TABLE "training"."physical_tests" TO "authenticated";
GRANT MAINTAIN ON TABLE "training"."physical_tests" TO "authenticated";
GRANT INSERT ON TABLE "training"."physical_tests" TO "service_role";
GRANT SELECT ON TABLE "training"."physical_tests" TO "service_role";
GRANT UPDATE ON TABLE "training"."physical_tests" TO "service_role";
GRANT DELETE ON TABLE "training"."physical_tests" TO "service_role";
GRANT TRUNCATE ON TABLE "training"."physical_tests" TO "service_role";
GRANT REFERENCES ON TABLE "training"."physical_tests" TO "service_role";
GRANT TRIGGER ON TABLE "training"."physical_tests" TO "service_role";
GRANT MAINTAIN ON TABLE "training"."physical_tests" TO "service_role";
GRANT INSERT ON TABLE "core"."students" TO "anon";
GRANT SELECT ON TABLE "core"."students" TO "anon";
GRANT UPDATE ON TABLE "core"."students" TO "anon";
GRANT DELETE ON TABLE "core"."students" TO "anon";
GRANT REFERENCES ON TABLE "core"."students" TO "anon";
GRANT TRIGGER ON TABLE "core"."students" TO "anon";
GRANT MAINTAIN ON TABLE "core"."students" TO "anon";
GRANT INSERT ON TABLE "core"."students" TO "authenticated";
GRANT SELECT ON TABLE "core"."students" TO "authenticated";
GRANT UPDATE ON TABLE "core"."students" TO "authenticated";
GRANT DELETE ON TABLE "core"."students" TO "authenticated";
GRANT REFERENCES ON TABLE "core"."students" TO "authenticated";
GRANT TRIGGER ON TABLE "core"."students" TO "authenticated";
GRANT MAINTAIN ON TABLE "core"."students" TO "authenticated";
GRANT INSERT ON TABLE "core"."students" TO "service_role";
GRANT SELECT ON TABLE "core"."students" TO "service_role";
GRANT UPDATE ON TABLE "core"."students" TO "service_role";
GRANT DELETE ON TABLE "core"."students" TO "service_role";
GRANT TRUNCATE ON TABLE "core"."students" TO "service_role";
GRANT REFERENCES ON TABLE "core"."students" TO "service_role";
GRANT TRIGGER ON TABLE "core"."students" TO "service_role";
GRANT MAINTAIN ON TABLE "core"."students" TO "service_role";
GRANT INSERT ON TABLE "profiles"."user_profiles" TO "anon";
GRANT SELECT ON TABLE "profiles"."user_profiles" TO "anon";
GRANT UPDATE ON TABLE "profiles"."user_profiles" TO "anon";
GRANT DELETE ON TABLE "profiles"."user_profiles" TO "anon";
GRANT REFERENCES ON TABLE "profiles"."user_profiles" TO "anon";
GRANT TRIGGER ON TABLE "profiles"."user_profiles" TO "anon";
GRANT MAINTAIN ON TABLE "profiles"."user_profiles" TO "anon";
GRANT INSERT ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT SELECT ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT UPDATE ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT DELETE ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT REFERENCES ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT TRIGGER ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT MAINTAIN ON TABLE "profiles"."user_profiles" TO "authenticated";
GRANT INSERT ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT SELECT ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT UPDATE ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT DELETE ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT TRUNCATE ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT REFERENCES ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT TRIGGER ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT MAINTAIN ON TABLE "profiles"."user_profiles" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_cosmetic_items_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_cosmetic_items_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_cosmetic_items_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_cosmetic_items" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_cosmetic_items" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_cosmetic_items" TO "service_role";
GRANT SELECT ON TABLE "billing"."membership_types" TO "authenticated";
GRANT SELECT ON TABLE "billing"."membership_types" TO "anon";
GRANT INSERT ON TABLE "gamification"."student_campaign_progress" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_campaign_progress" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_campaign_progress" TO "authenticated";
GRANT INSERT ON TABLE "public_content"."announcements" TO "anon";
GRANT SELECT ON TABLE "public_content"."announcements" TO "anon";
GRANT UPDATE ON TABLE "public_content"."announcements" TO "anon";
GRANT DELETE ON TABLE "public_content"."announcements" TO "anon";
GRANT REFERENCES ON TABLE "public_content"."announcements" TO "anon";
GRANT TRIGGER ON TABLE "public_content"."announcements" TO "anon";
GRANT MAINTAIN ON TABLE "public_content"."announcements" TO "anon";
GRANT INSERT ON TABLE "public_content"."announcements" TO "authenticated";
GRANT SELECT ON TABLE "public_content"."announcements" TO "authenticated";
GRANT UPDATE ON TABLE "public_content"."announcements" TO "authenticated";
GRANT DELETE ON TABLE "public_content"."announcements" TO "authenticated";
GRANT REFERENCES ON TABLE "public_content"."announcements" TO "authenticated";
GRANT TRIGGER ON TABLE "public_content"."announcements" TO "authenticated";
GRANT MAINTAIN ON TABLE "public_content"."announcements" TO "authenticated";
GRANT INSERT ON TABLE "public_content"."announcements" TO "service_role";
GRANT SELECT ON TABLE "public_content"."announcements" TO "service_role";
GRANT UPDATE ON TABLE "public_content"."announcements" TO "service_role";
GRANT DELETE ON TABLE "public_content"."announcements" TO "service_role";
GRANT TRUNCATE ON TABLE "public_content"."announcements" TO "service_role";
GRANT REFERENCES ON TABLE "public_content"."announcements" TO "service_role";
GRANT TRIGGER ON TABLE "public_content"."announcements" TO "service_role";
GRANT MAINTAIN ON TABLE "public_content"."announcements" TO "service_role";
GRANT INSERT ON TABLE "gamification"."campaigns_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."campaigns_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."campaigns_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."campaigns_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_campaigns_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_campaigns_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_campaigns_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_campaign_progress" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_campaign_progress" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_campaign_progress" TO "service_role";
GRANT INSERT ON TABLE "public"."announcements" TO "service_role";
GRANT SELECT ON TABLE "public"."announcements" TO "service_role";
GRANT UPDATE ON TABLE "public"."announcements" TO "service_role";
GRANT DELETE ON TABLE "public"."announcements" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."announcements" TO "service_role";
GRANT REFERENCES ON TABLE "public"."announcements" TO "service_role";
GRANT TRIGGER ON TABLE "public"."announcements" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."announcements" TO "service_role";
GRANT SELECT ON TABLE "public"."announcements" TO "anon";
GRANT INSERT ON TABLE "public"."announcements" TO "authenticated";
GRANT SELECT ON TABLE "public"."announcements" TO "authenticated";
GRANT UPDATE ON TABLE "public"."announcements" TO "authenticated";
GRANT DELETE ON TABLE "public"."announcements" TO "authenticated";
GRANT INSERT ON TABLE "public"."training_categories" TO "authenticated";
GRANT SELECT ON TABLE "public"."training_categories" TO "authenticated";
GRANT UPDATE ON TABLE "public"."training_categories" TO "authenticated";
GRANT DELETE ON TABLE "public"."training_categories" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."training_categories" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."training_categories" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."training_categories" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."training_categories" TO "authenticated";
GRANT INSERT ON TABLE "public"."training_categories" TO "service_role";
GRANT SELECT ON TABLE "public"."training_categories" TO "service_role";
GRANT UPDATE ON TABLE "public"."training_categories" TO "service_role";
GRANT DELETE ON TABLE "public"."training_categories" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."training_categories" TO "service_role";
GRANT REFERENCES ON TABLE "public"."training_categories" TO "service_role";
GRANT TRIGGER ON TABLE "public"."training_categories" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."training_categories" TO "service_role";
GRANT SELECT ON TABLE "public"."training_categories" TO "anon";
GRANT INSERT ON TABLE "profiles"."mobile_device_registrations" TO "service_role";
GRANT SELECT ON TABLE "profiles"."mobile_device_registrations" TO "service_role";
GRANT UPDATE ON TABLE "profiles"."mobile_device_registrations" TO "service_role";
GRANT DELETE ON TABLE "profiles"."mobile_device_registrations" TO "service_role";
GRANT INSERT ON TABLE "gamification"."cosmetic_items_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."cosmetic_items_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."cosmetic_items_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."cosmetic_items_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."cosmetic_items_catalog" TO "anon";
GRANT INSERT ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT SELECT ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT DELETE ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."cosmetic_items_catalog" TO "service_role";
GRANT INSERT ON TABLE "gamification"."achievement_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."achievement_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."achievement_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."achievement_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."achievement_catalog" TO "anon";
GRANT INSERT ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT SELECT ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT DELETE ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."achievement_catalog" TO "service_role";
GRANT INSERT ON TABLE "gamification"."challenges_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."challenges_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."challenges_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."challenges_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."challenges_catalog" TO "anon";
GRANT INSERT ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT SELECT ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT DELETE ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."challenges_catalog" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_stage_history" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_stage_history" TO "authenticated";
GRANT INSERT ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT SELECT ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT UPDATE ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT DELETE ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT REFERENCES ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT TRIGGER ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."announcements_with_creator" TO "service_role";
GRANT SELECT ON TABLE "public"."announcements_with_creator" TO "anon";
GRANT INSERT ON TABLE "public"."announcements_with_creator" TO "authenticated";
GRANT SELECT ON TABLE "public"."announcements_with_creator" TO "authenticated";
GRANT UPDATE ON TABLE "public"."announcements_with_creator" TO "authenticated";
GRANT DELETE ON TABLE "public"."announcements_with_creator" TO "authenticated";
GRANT INSERT ON TABLE "public"."users_password_backup" TO "service_role";
GRANT SELECT ON TABLE "public"."users_password_backup" TO "service_role";
GRANT UPDATE ON TABLE "public"."users_password_backup" TO "service_role";
GRANT DELETE ON TABLE "public"."users_password_backup" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."users_password_backup" TO "service_role";
GRANT REFERENCES ON TABLE "public"."users_password_backup" TO "service_role";
GRANT TRIGGER ON TABLE "public"."users_password_backup" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."users_password_backup" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_achievement_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_achievement_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_achievement_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_reward_events" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_reward_events" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_reward_events" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_profiles" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_profiles" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_profiles" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_profiles" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_profiles" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_profiles" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_profiles" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_profiles" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_profiles" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_profiles" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_achievements" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_achievements" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_achievements" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_challenge_progress" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_challenge_progress" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_challenge_progress" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_leaderboard_snapshots" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_leaderboard_snapshots" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_leaderboard_snapshots" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_currency_wallets" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_currency_wallets" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_currency_wallets" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_currency_ledger" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_currency_ledger" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_currency_ledger" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_cosmetic_equipment" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_cosmetic_equipment" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_cosmetic_equipment" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_leaderboard_public" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_leaderboard_public" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_leaderboard_public" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_challenges_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_challenges_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_challenges_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_titles_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_titles_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_titles_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."payments_audit" TO "service_role";
GRANT SELECT ON TABLE "public"."payments_audit" TO "service_role";
GRANT UPDATE ON TABLE "public"."payments_audit" TO "service_role";
GRANT DELETE ON TABLE "public"."payments_audit" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."payments_audit" TO "service_role";
GRANT REFERENCES ON TABLE "public"."payments_audit" TO "service_role";
GRANT TRIGGER ON TABLE "public"."payments_audit" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."payments_audit" TO "service_role";
GRANT INSERT ON TABLE "public"."payments_audit" TO "authenticated";
GRANT SELECT ON TABLE "public"."payments_audit" TO "authenticated";
GRANT UPDATE ON TABLE "public"."payments_audit" TO "authenticated";
GRANT DELETE ON TABLE "public"."payments_audit" TO "authenticated";
GRANT SELECT ON TABLE "public"."payments_audit" TO "anon";
GRANT INSERT ON TABLE "public"."users" TO "anon";
GRANT SELECT ON TABLE "public"."users" TO "anon";
GRANT UPDATE ON TABLE "public"."users" TO "anon";
GRANT DELETE ON TABLE "public"."users" TO "anon";
GRANT TRUNCATE ON TABLE "public"."users" TO "anon";
GRANT REFERENCES ON TABLE "public"."users" TO "anon";
GRANT TRIGGER ON TABLE "public"."users" TO "anon";
GRANT MAINTAIN ON TABLE "public"."users" TO "anon";
GRANT INSERT ON TABLE "public"."users" TO "authenticated";
GRANT SELECT ON TABLE "public"."users" TO "authenticated";
GRANT UPDATE ON TABLE "public"."users" TO "authenticated";
GRANT DELETE ON TABLE "public"."users" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."users" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."users" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."users" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."users" TO "authenticated";
GRANT INSERT ON TABLE "public"."users" TO "service_role";
GRANT SELECT ON TABLE "public"."users" TO "service_role";
GRANT UPDATE ON TABLE "public"."users" TO "service_role";
GRANT DELETE ON TABLE "public"."users" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."users" TO "service_role";
GRANT REFERENCES ON TABLE "public"."users" TO "service_role";
GRANT TRIGGER ON TABLE "public"."users" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."users" TO "service_role";
GRANT INSERT ON TABLE "public"."attendances" TO "service_role";
GRANT SELECT ON TABLE "public"."attendances" TO "service_role";
GRANT UPDATE ON TABLE "public"."attendances" TO "service_role";
GRANT DELETE ON TABLE "public"."attendances" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."attendances" TO "service_role";
GRANT REFERENCES ON TABLE "public"."attendances" TO "service_role";
GRANT TRIGGER ON TABLE "public"."attendances" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."attendances" TO "service_role";
GRANT INSERT ON TABLE "public"."attendances" TO "authenticated";
GRANT SELECT ON TABLE "public"."attendances" TO "authenticated";
GRANT UPDATE ON TABLE "public"."attendances" TO "authenticated";
GRANT DELETE ON TABLE "public"."attendances" TO "authenticated";
GRANT SELECT ON TABLE "public"."attendances" TO "anon";
GRANT INSERT ON TABLE "audit"."payments_audit" TO "anon";
GRANT SELECT ON TABLE "audit"."payments_audit" TO "anon";
GRANT UPDATE ON TABLE "audit"."payments_audit" TO "anon";
GRANT DELETE ON TABLE "audit"."payments_audit" TO "anon";
GRANT REFERENCES ON TABLE "audit"."payments_audit" TO "anon";
GRANT TRIGGER ON TABLE "audit"."payments_audit" TO "anon";
GRANT MAINTAIN ON TABLE "audit"."payments_audit" TO "anon";
GRANT INSERT ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT SELECT ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT UPDATE ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT DELETE ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT REFERENCES ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT TRIGGER ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT MAINTAIN ON TABLE "audit"."payments_audit" TO "authenticated";
GRANT INSERT ON TABLE "audit"."payments_audit" TO "service_role";
GRANT SELECT ON TABLE "audit"."payments_audit" TO "service_role";
GRANT UPDATE ON TABLE "audit"."payments_audit" TO "service_role";
GRANT DELETE ON TABLE "audit"."payments_audit" TO "service_role";
GRANT TRUNCATE ON TABLE "audit"."payments_audit" TO "service_role";
GRANT REFERENCES ON TABLE "audit"."payments_audit" TO "service_role";
GRANT TRIGGER ON TABLE "audit"."payments_audit" TO "service_role";
GRANT MAINTAIN ON TABLE "audit"."payments_audit" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_profiles" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_profiles" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_profiles" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."student_profiles" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT SELECT ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT DELETE ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."student_profiles" TO "service_role";
GRANT INSERT ON TABLE "gamification"."reward_events" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."reward_events" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."reward_events" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."reward_events" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."reward_events" TO "service_role";
GRANT SELECT ON TABLE "gamification"."reward_events" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."reward_events" TO "service_role";
GRANT DELETE ON TABLE "gamification"."reward_events" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."reward_events" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."reward_events" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."reward_events" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."reward_events" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_achievements" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_achievements" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_achievements" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."student_achievements" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT SELECT ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT DELETE ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."student_achievements" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_challenge_progress" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_challenge_progress" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_challenge_progress" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."student_challenge_progress" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT SELECT ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT DELETE ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."student_challenge_progress" TO "service_role";
GRANT INSERT ON TABLE "gamification"."currency_wallets" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."currency_wallets" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."currency_wallets" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."currency_wallets" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT SELECT ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT DELETE ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."currency_wallets" TO "service_role";
GRANT INSERT ON TABLE "gamification"."currency_ledger" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."currency_ledger" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."currency_ledger" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."currency_ledger" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT SELECT ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT DELETE ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."currency_ledger" TO "service_role";
GRANT SELECT ON SEQUENCE "audit"."payments_audit_id_seq" TO "anon";
GRANT UPDATE ON SEQUENCE "audit"."payments_audit_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "audit"."payments_audit_id_seq" TO "anon";
GRANT SELECT ON SEQUENCE "audit"."payments_audit_id_seq" TO "authenticated";
GRANT UPDATE ON SEQUENCE "audit"."payments_audit_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "audit"."payments_audit_id_seq" TO "authenticated";
GRANT SELECT ON SEQUENCE "audit"."payments_audit_id_seq" TO "service_role";
GRANT UPDATE ON SEQUENCE "audit"."payments_audit_id_seq" TO "service_role";
GRANT USAGE ON SEQUENCE "audit"."payments_audit_id_seq" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_cosmetic_items" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_cosmetic_items" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_cosmetic_items" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."student_cosmetic_items" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT SELECT ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT DELETE ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."student_cosmetic_items" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_xp_ledger" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_xp_ledger" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_xp_ledger" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_login_rewards" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_login_rewards" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_login_rewards" TO "service_role";
GRANT INSERT ON TABLE "gamification"."leaderboard_snapshots" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."leaderboard_snapshots" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."leaderboard_snapshots" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."leaderboard_snapshots" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."leaderboard_snapshots" TO "anon";
GRANT INSERT ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT SELECT ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT DELETE ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."leaderboard_snapshots" TO "service_role";
GRANT INSERT ON TABLE "security"."login_attempts" TO "service_role";
GRANT SELECT ON TABLE "security"."login_attempts" TO "service_role";
GRANT UPDATE ON TABLE "security"."login_attempts" TO "service_role";
GRANT DELETE ON TABLE "security"."login_attempts" TO "service_role";
GRANT INSERT ON TABLE "security"."login_blocks" TO "service_role";
GRANT SELECT ON TABLE "security"."login_blocks" TO "service_role";
GRANT UPDATE ON TABLE "security"."login_blocks" TO "service_role";
GRANT DELETE ON TABLE "security"."login_blocks" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_identity" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_identity" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_identity" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."student_identity" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_identity" TO "service_role";
GRANT SELECT ON TABLE "gamification"."student_identity" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."student_identity" TO "service_role";
GRANT DELETE ON TABLE "gamification"."student_identity" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."student_identity" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."student_identity" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."student_identity" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."student_identity" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_hidden_rewards_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_hidden_rewards_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_hidden_rewards_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT SELECT ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT UPDATE ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT DELETE ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT REFERENCES ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT TRIGGER ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."mobile_device_registrations" TO "service_role";
GRANT INSERT ON TABLE "public"."schedules" TO "service_role";
GRANT SELECT ON TABLE "public"."schedules" TO "service_role";
GRANT UPDATE ON TABLE "public"."schedules" TO "service_role";
GRANT DELETE ON TABLE "public"."schedules" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."schedules" TO "service_role";
GRANT REFERENCES ON TABLE "public"."schedules" TO "service_role";
GRANT TRIGGER ON TABLE "public"."schedules" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."schedules" TO "service_role";
GRANT SELECT ON TABLE "public"."schedules" TO "anon";
GRANT INSERT ON TABLE "public"."schedules" TO "authenticated";
GRANT SELECT ON TABLE "public"."schedules" TO "authenticated";
GRANT UPDATE ON TABLE "public"."schedules" TO "authenticated";
GRANT DELETE ON TABLE "public"."schedules" TO "authenticated";
GRANT INSERT ON TABLE "public"."physical_tests" TO "service_role";
GRANT SELECT ON TABLE "public"."physical_tests" TO "service_role";
GRANT UPDATE ON TABLE "public"."physical_tests" TO "service_role";
GRANT DELETE ON TABLE "public"."physical_tests" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."physical_tests" TO "service_role";
GRANT REFERENCES ON TABLE "public"."physical_tests" TO "service_role";
GRANT TRIGGER ON TABLE "public"."physical_tests" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."physical_tests" TO "service_role";
GRANT INSERT ON TABLE "public"."physical_tests" TO "authenticated";
GRANT SELECT ON TABLE "public"."physical_tests" TO "authenticated";
GRANT UPDATE ON TABLE "public"."physical_tests" TO "authenticated";
GRANT DELETE ON TABLE "public"."physical_tests" TO "authenticated";
GRANT SELECT ON TABLE "public"."physical_tests" TO "anon";
GRANT INSERT ON TABLE "public"."user_profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."user_profiles" TO "service_role";
GRANT UPDATE ON TABLE "public"."user_profiles" TO "service_role";
GRANT DELETE ON TABLE "public"."user_profiles" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."user_profiles" TO "service_role";
GRANT REFERENCES ON TABLE "public"."user_profiles" TO "service_role";
GRANT TRIGGER ON TABLE "public"."user_profiles" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."user_profiles" TO "service_role";
GRANT INSERT ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_profiles" TO "authenticated";
GRANT UPDATE ON TABLE "public"."user_profiles" TO "authenticated";
GRANT DELETE ON TABLE "public"."user_profiles" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_profiles" TO "anon";
GRANT INSERT ON TABLE "public"."payment_types" TO "service_role";
GRANT SELECT ON TABLE "public"."payment_types" TO "service_role";
GRANT UPDATE ON TABLE "public"."payment_types" TO "service_role";
GRANT DELETE ON TABLE "public"."payment_types" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."payment_types" TO "service_role";
GRANT REFERENCES ON TABLE "public"."payment_types" TO "service_role";
GRANT TRIGGER ON TABLE "public"."payment_types" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."payment_types" TO "service_role";
GRANT INSERT ON TABLE "public"."payment_types" TO "authenticated";
GRANT SELECT ON TABLE "public"."payment_types" TO "authenticated";
GRANT UPDATE ON TABLE "public"."payment_types" TO "authenticated";
GRANT DELETE ON TABLE "public"."payment_types" TO "authenticated";
GRANT SELECT ON TABLE "public"."payment_types" TO "anon";
GRANT INSERT ON TABLE "public"."payments" TO "service_role";
GRANT SELECT ON TABLE "public"."payments" TO "service_role";
GRANT UPDATE ON TABLE "public"."payments" TO "service_role";
GRANT DELETE ON TABLE "public"."payments" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."payments" TO "service_role";
GRANT REFERENCES ON TABLE "public"."payments" TO "service_role";
GRANT TRIGGER ON TABLE "public"."payments" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."payments" TO "service_role";
GRANT INSERT ON TABLE "public"."payments" TO "authenticated";
GRANT SELECT ON TABLE "public"."payments" TO "authenticated";
GRANT UPDATE ON TABLE "public"."payments" TO "authenticated";
GRANT DELETE ON TABLE "public"."payments" TO "authenticated";
GRANT SELECT ON TABLE "public"."payments" TO "anon";
GRANT INSERT ON TABLE "gamification"."hidden_rewards_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."hidden_rewards_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."hidden_rewards_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."hidden_rewards_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_hidden_rewards" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_hidden_rewards" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_hidden_rewards" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_hidden_rewards" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_hidden_rewards" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_hidden_rewards" TO "authenticated";
GRANT INSERT ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT SELECT ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT UPDATE ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT DELETE ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT REFERENCES ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT TRIGGER ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT MAINTAIN ON TABLE "public"."user_notification_inbox_state" TO "anon";
GRANT INSERT ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT SELECT ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT UPDATE ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT DELETE ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."user_notification_inbox_state" TO "authenticated";
GRANT INSERT ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT SELECT ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT UPDATE ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT DELETE ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT REFERENCES ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT TRIGGER ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."user_notification_inbox_state" TO "service_role";
GRANT INSERT ON TABLE "public"."students" TO "service_role";
GRANT SELECT ON TABLE "public"."students" TO "service_role";
GRANT UPDATE ON TABLE "public"."students" TO "service_role";
GRANT DELETE ON TABLE "public"."students" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."students" TO "service_role";
GRANT REFERENCES ON TABLE "public"."students" TO "service_role";
GRANT TRIGGER ON TABLE "public"."students" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."students" TO "service_role";
GRANT INSERT ON TABLE "public"."students" TO "authenticated";
GRANT SELECT ON TABLE "public"."students" TO "authenticated";
GRANT UPDATE ON TABLE "public"."students" TO "authenticated";
GRANT DELETE ON TABLE "public"."students" TO "authenticated";
GRANT SELECT ON TABLE "public"."students" TO "anon";
GRANT INSERT ON TABLE "gamification"."login_rewards" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."login_rewards" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."login_rewards" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT SELECT ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT DELETE ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."login_rewards" TO "service_role";
GRANT SELECT ON SEQUENCE "audit"."sql_executions_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "audit"."sql_executions_id_seq" TO "anon";
GRANT SELECT ON SEQUENCE "audit"."sql_executions_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "audit"."sql_executions_id_seq" TO "authenticated";
GRANT SELECT ON SEQUENCE "audit"."sql_errors_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "audit"."sql_errors_id_seq" TO "anon";
GRANT SELECT ON SEQUENCE "audit"."sql_errors_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "audit"."sql_errors_id_seq" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."xp_ledger" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."xp_ledger" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."xp_ledger" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."xp_ledger" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT SELECT ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT DELETE ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."xp_ledger" TO "service_role";
GRANT INSERT ON TABLE "audit"."sql_executions" TO "anon";
GRANT INSERT ON TABLE "audit"."sql_executions" TO "authenticated";
GRANT INSERT ON TABLE "audit"."sql_errors" TO "anon";
GRANT INSERT ON TABLE "audit"."sql_errors" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_cosmetic_equipment" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_cosmetic_equipment" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_cosmetic_equipment" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."student_cosmetic_equipment" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT SELECT ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT DELETE ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."student_cosmetic_equipment" TO "service_role";
GRANT INSERT ON TABLE "public"."payments_active" TO "anon";
GRANT SELECT ON TABLE "public"."payments_active" TO "anon";
GRANT UPDATE ON TABLE "public"."payments_active" TO "anon";
GRANT DELETE ON TABLE "public"."payments_active" TO "anon";
GRANT TRUNCATE ON TABLE "public"."payments_active" TO "anon";
GRANT REFERENCES ON TABLE "public"."payments_active" TO "anon";
GRANT TRIGGER ON TABLE "public"."payments_active" TO "anon";
GRANT MAINTAIN ON TABLE "public"."payments_active" TO "anon";
GRANT INSERT ON TABLE "public"."payments_active" TO "authenticated";
GRANT SELECT ON TABLE "public"."payments_active" TO "authenticated";
GRANT UPDATE ON TABLE "public"."payments_active" TO "authenticated";
GRANT DELETE ON TABLE "public"."payments_active" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."payments_active" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."payments_active" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."payments_active" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."payments_active" TO "authenticated";
GRANT INSERT ON TABLE "public"."payments_active" TO "service_role";
GRANT SELECT ON TABLE "public"."payments_active" TO "service_role";
GRANT UPDATE ON TABLE "public"."payments_active" TO "service_role";
GRANT DELETE ON TABLE "public"."payments_active" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."payments_active" TO "service_role";
GRANT REFERENCES ON TABLE "public"."payments_active" TO "service_role";
GRANT TRIGGER ON TABLE "public"."payments_active" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."payments_active" TO "service_role";
GRANT INSERT ON TABLE "public"."report_runs" TO "anon";
GRANT SELECT ON TABLE "public"."report_runs" TO "anon";
GRANT UPDATE ON TABLE "public"."report_runs" TO "anon";
GRANT DELETE ON TABLE "public"."report_runs" TO "anon";
GRANT TRUNCATE ON TABLE "public"."report_runs" TO "anon";
GRANT REFERENCES ON TABLE "public"."report_runs" TO "anon";
GRANT TRIGGER ON TABLE "public"."report_runs" TO "anon";
GRANT MAINTAIN ON TABLE "public"."report_runs" TO "anon";
GRANT INSERT ON TABLE "public"."report_runs" TO "authenticated";
GRANT SELECT ON TABLE "public"."report_runs" TO "authenticated";
GRANT UPDATE ON TABLE "public"."report_runs" TO "authenticated";
GRANT DELETE ON TABLE "public"."report_runs" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."report_runs" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."report_runs" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."report_runs" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."report_runs" TO "authenticated";
GRANT INSERT ON TABLE "public"."report_runs" TO "service_role";
GRANT SELECT ON TABLE "public"."report_runs" TO "service_role";
GRANT UPDATE ON TABLE "public"."report_runs" TO "service_role";
GRANT DELETE ON TABLE "public"."report_runs" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."report_runs" TO "service_role";
GRANT REFERENCES ON TABLE "public"."report_runs" TO "service_role";
GRANT TRIGGER ON TABLE "public"."report_runs" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."report_runs" TO "service_role";
GRANT INSERT ON TABLE "public"."report_artifacts" TO "anon";
GRANT SELECT ON TABLE "public"."report_artifacts" TO "anon";
GRANT UPDATE ON TABLE "public"."report_artifacts" TO "anon";
GRANT DELETE ON TABLE "public"."report_artifacts" TO "anon";
GRANT TRUNCATE ON TABLE "public"."report_artifacts" TO "anon";
GRANT REFERENCES ON TABLE "public"."report_artifacts" TO "anon";
GRANT TRIGGER ON TABLE "public"."report_artifacts" TO "anon";
GRANT MAINTAIN ON TABLE "public"."report_artifacts" TO "anon";
GRANT INSERT ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT SELECT ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT UPDATE ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT DELETE ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."report_artifacts" TO "authenticated";
GRANT INSERT ON TABLE "public"."report_artifacts" TO "service_role";
GRANT SELECT ON TABLE "public"."report_artifacts" TO "service_role";
GRANT UPDATE ON TABLE "public"."report_artifacts" TO "service_role";
GRANT DELETE ON TABLE "public"."report_artifacts" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."report_artifacts" TO "service_role";
GRANT REFERENCES ON TABLE "public"."report_artifacts" TO "service_role";
GRANT TRIGGER ON TABLE "public"."report_artifacts" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."report_artifacts" TO "service_role";
GRANT INSERT ON TABLE "public"."report_definitions" TO "anon";
GRANT SELECT ON TABLE "public"."report_definitions" TO "anon";
GRANT UPDATE ON TABLE "public"."report_definitions" TO "anon";
GRANT DELETE ON TABLE "public"."report_definitions" TO "anon";
GRANT TRUNCATE ON TABLE "public"."report_definitions" TO "anon";
GRANT REFERENCES ON TABLE "public"."report_definitions" TO "anon";
GRANT TRIGGER ON TABLE "public"."report_definitions" TO "anon";
GRANT MAINTAIN ON TABLE "public"."report_definitions" TO "anon";
GRANT INSERT ON TABLE "public"."report_definitions" TO "authenticated";
GRANT SELECT ON TABLE "public"."report_definitions" TO "authenticated";
GRANT UPDATE ON TABLE "public"."report_definitions" TO "authenticated";
GRANT DELETE ON TABLE "public"."report_definitions" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."report_definitions" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."report_definitions" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."report_definitions" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."report_definitions" TO "authenticated";
GRANT INSERT ON TABLE "public"."report_definitions" TO "service_role";
GRANT SELECT ON TABLE "public"."report_definitions" TO "service_role";
GRANT UPDATE ON TABLE "public"."report_definitions" TO "service_role";
GRANT DELETE ON TABLE "public"."report_definitions" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."report_definitions" TO "service_role";
GRANT REFERENCES ON TABLE "public"."report_definitions" TO "service_role";
GRANT TRIGGER ON TABLE "public"."report_definitions" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."report_definitions" TO "service_role";
GRANT INSERT ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT SELECT ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT UPDATE ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT DELETE ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT REFERENCES ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT TRIGGER ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."user_notification_preferences" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_identity" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_identity" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_identity" TO "service_role";
GRANT SELECT ON TABLE "reporting"."report_definitions" TO "authenticated";
GRANT SELECT ON TABLE "reporting"."report_runs" TO "authenticated";
GRANT SELECT ON TABLE "reporting"."report_artifacts" TO "authenticated";
GRANT INSERT ON TABLE "core"."users" TO "anon";
GRANT SELECT ON TABLE "core"."users" TO "anon";
GRANT UPDATE ON TABLE "core"."users" TO "anon";
GRANT DELETE ON TABLE "core"."users" TO "anon";
GRANT REFERENCES ON TABLE "core"."users" TO "anon";
GRANT TRIGGER ON TABLE "core"."users" TO "anon";
GRANT MAINTAIN ON TABLE "core"."users" TO "anon";
GRANT INSERT ON TABLE "core"."users" TO "authenticated";
GRANT SELECT ON TABLE "core"."users" TO "authenticated";
GRANT UPDATE ON TABLE "core"."users" TO "authenticated";
GRANT DELETE ON TABLE "core"."users" TO "authenticated";
GRANT REFERENCES ON TABLE "core"."users" TO "authenticated";
GRANT TRIGGER ON TABLE "core"."users" TO "authenticated";
GRANT MAINTAIN ON TABLE "core"."users" TO "authenticated";
GRANT INSERT ON TABLE "core"."users" TO "service_role";
GRANT SELECT ON TABLE "core"."users" TO "service_role";
GRANT UPDATE ON TABLE "core"."users" TO "service_role";
GRANT DELETE ON TABLE "core"."users" TO "service_role";
GRANT TRUNCATE ON TABLE "core"."users" TO "service_role";
GRANT REFERENCES ON TABLE "core"."users" TO "service_role";
GRANT TRIGGER ON TABLE "core"."users" TO "service_role";
GRANT MAINTAIN ON TABLE "core"."users" TO "service_role";
GRANT INSERT ON TABLE "profiles"."user_notification_preferences" TO "service_role";
GRANT SELECT ON TABLE "profiles"."user_notification_preferences" TO "service_role";
GRANT UPDATE ON TABLE "profiles"."user_notification_preferences" TO "service_role";
GRANT DELETE ON TABLE "profiles"."user_notification_preferences" TO "service_role";
GRANT SELECT ON SEQUENCE "billing"."payment_types_id_seq" TO "anon";
GRANT UPDATE ON SEQUENCE "billing"."payment_types_id_seq" TO "anon";
GRANT USAGE ON SEQUENCE "billing"."payment_types_id_seq" TO "anon";
GRANT SELECT ON SEQUENCE "billing"."payment_types_id_seq" TO "authenticated";
GRANT UPDATE ON SEQUENCE "billing"."payment_types_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "billing"."payment_types_id_seq" TO "authenticated";
GRANT SELECT ON SEQUENCE "billing"."payment_types_id_seq" TO "service_role";
GRANT UPDATE ON SEQUENCE "billing"."payment_types_id_seq" TO "service_role";
GRANT USAGE ON SEQUENCE "billing"."payment_types_id_seq" TO "service_role";
GRANT INSERT ON TABLE "gamification"."athlete_stages_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."athlete_stages_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."athlete_stages_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."athlete_stages_catalog" TO "authenticated";
GRANT INSERT ON TABLE "security"."users_password_backup" TO "service_role";
GRANT SELECT ON TABLE "security"."users_password_backup" TO "service_role";
GRANT UPDATE ON TABLE "security"."users_password_backup" TO "service_role";
GRANT DELETE ON TABLE "security"."users_password_backup" TO "service_role";
GRANT TRUNCATE ON TABLE "security"."users_password_backup" TO "service_role";
GRANT REFERENCES ON TABLE "security"."users_password_backup" TO "service_role";
GRANT TRIGGER ON TABLE "security"."users_password_backup" TO "service_role";
GRANT MAINTAIN ON TABLE "security"."users_password_backup" TO "service_role";
GRANT INSERT ON TABLE "gamification"."student_current_stage" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."student_current_stage" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."student_current_stage" TO "authenticated";
GRANT INSERT ON TABLE "gamification"."titles_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."titles_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "gamification"."titles_catalog" TO "authenticated";
GRANT DELETE ON TABLE "gamification"."titles_catalog" TO "authenticated";
GRANT SELECT ON TABLE "gamification"."titles_catalog" TO "anon";
GRANT INSERT ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT SELECT ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT UPDATE ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT DELETE ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "gamification"."titles_catalog" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_current_stage" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_current_stage" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_current_stage" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_student_stage_history" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_student_stage_history" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_student_stage_history" TO "service_role";
GRANT INSERT ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT SELECT ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT UPDATE ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT DELETE ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT TRUNCATE ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT REFERENCES ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT TRIGGER ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT MAINTAIN ON TABLE "public"."gamification_athlete_stages_catalog" TO "anon";
GRANT INSERT ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT SELECT ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT UPDATE ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT DELETE ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT TRUNCATE ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT REFERENCES ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT TRIGGER ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT MAINTAIN ON TABLE "public"."gamification_athlete_stages_catalog" TO "authenticated";
GRANT INSERT ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT SELECT ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT UPDATE ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT DELETE ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT TRUNCATE ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT REFERENCES ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT TRIGGER ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
GRANT MAINTAIN ON TABLE "public"."gamification_athlete_stages_catalog" TO "service_role";
REVOKE ALL ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "service_role";
REVOKE ALL ON FUNCTION "public"."restore_payment"(payment_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "service_role";
REVOKE ALL ON FUNCTION "public"."sync_first_login_on_password_change"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."sync_last_login_from_auth"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."audit_payments"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."sync_user_profile_on_user_update"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."calculate_age"(birthdate date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "service_role";
REVOKE ALL ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "service_role";
REVOKE ALL ON FUNCTION "public"."restore_payment"(payment_id bigint) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "service_role";
REVOKE ALL ON FUNCTION "public"."check_login_allowed"(p_email text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "service_role";
REVOKE ALL ON FUNCTION "reporting"."cleanup_old_report_runs"(retention_months integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "reporting"."cleanup_old_report_runs"(retention_months integer) TO "service_role";
REVOKE ALL ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."is_admin_or_trainer"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."update_modified_column"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."update_announcements_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "service_role";
REVOKE ALL ON FUNCTION "training"."enforce_physical_test_age"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "training"."enforce_physical_test_age"() TO PUBLIC;
REVOKE ALL ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "service_role";
REVOKE ALL ON FUNCTION "profiles"."touch_mobile_device_registration_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "profiles"."touch_mobile_device_registration_updated_at"() TO PUBLIC;
REVOKE ALL ON FUNCTION "public"."get_user_role"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_user_role"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "service_role";
REVOKE ALL ON FUNCTION "reporting"."touch_scheduler_config_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "reporting"."touch_scheduler_config_updated_at"() TO PUBLIC;
REVOKE ALL ON FUNCTION "reporting"."invoke_generate_scheduled_reports"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "reporting"."invoke_generate_scheduled_reports"() TO "service_role";
REVOKE ALL ON FUNCTION "profiles"."touch_user_notification_preferences_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "profiles"."touch_user_notification_preferences_updated_at"() TO PUBLIC;
REVOKE ALL ON FUNCTION "reporting"."set_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "reporting"."set_updated_at"() TO PUBLIC;
REVOKE ALL ON FUNCTION "training"."touch_training_categories_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "training"."touch_training_categories_updated_at"() TO PUBLIC;
REVOKE ALL ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "service_role";
REVOKE ALL ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "service_role";
REVOKE ALL ON FUNCTION "public"."apply_payment_membership_rules"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "service_role";
REVOKE ALL ON FUNCTION "gamification"."skip_duplicate_daily_login_xp_ledger"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "gamification"."skip_duplicate_daily_login_xp_ledger"() TO PUBLIC;
REVOKE ALL ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "service_role";
REVOKE ALL ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) TO "service_role";
REVOKE ALL ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) TO "service_role";
REVOKE ALL ON FUNCTION "core"."guard_client_user_fields"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "core"."guard_client_user_fields"() TO PUBLIC;
REVOKE ALL ON FUNCTION "profiles"."guard_client_profile_fields"() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION "profiles"."guard_client_profile_fields"() TO PUBLIC;
NOTIFY pgrst, 'reload schema';
COMMIT;
