-- RETORNO DE ESQUEMA: no borra XP, recompensas ni datos generados tras el avance.
-- Restituye permisos anteriores: requiere decision y ventana propias, no retorno automatico.
BEGIN;
SET LOCAL search_path=public,extensions;
DO $local_gate_guard$
  DECLARE actual text;
  BEGIN
    IF current_database() <> 'riovoley_gatepacket_20261109142059_bb0d7d' OR (SELECT shobj_description(oid,'pg_database') FROM pg_database WHERE datname=current_database()) IS DISTINCT FROM 'RIOVOLEY synthetic catalog maintenance integration only' THEN RAISE EXCEPTION 'LOCAL_PACKET_ONLY'; END IF;
    IF current_user <> 'postgres' OR session_user <> 'postgres' OR current_setting('role') <> 'none' THEN RAISE EXCEPTION 'LOCAL_PACKET_ADMIN_REQUIRED'; END IF;
    SELECT fingerprint INTO actual FROM (SELECT md5(COALESCE(string_agg(item,E'
' ORDER BY item),'')) AS fingerprint FROM (
 SELECT 'schema:'||n.nspname||':'||pg_get_userbyid(n.nspowner)||':'||COALESCE(n.nspacl::text,'DEFAULT') AS item FROM pg_namespace n WHERE n.nspname='gate_guard'
 UNION ALL SELECT 'function:'||p.proname||':'||pg_get_function_identity_arguments(p.oid)||':'||pg_get_userbyid(p.proowner)||':'||pg_get_functiondef(p.oid)||':'||COALESCE(p.proacl::text,'DEFAULT') FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='gate_guard'
 UNION ALL SELECT 'trigger:'||n.nspname||'.'||c.relname||':'||t.tgenabled::text||':'||pg_get_triggerdef(t.oid) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE t.tgname='riovoley_packet_write_gate'
 UNION ALL SELECT 'inventory:'||n.nspname||'.'||c.relname||':'||c.relkind::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN('information_schema','extensions')
) items) gate_catalog;
    IF actual IS DISTINCT FROM '1913de36e2f47a13337d7e2e797c2f54' THEN RAISE EXCEPTION 'LOCAL_GATE_CATALOG_DRIFT'; END IF;
  END $local_gate_guard$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
SET LOCAL search_path=public,extensions;
DO $release_guard$
DECLARE actual text;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Ejecutar como postgres para conservar propietarios y ACL previstas'; END IF;
 IF current_setting('riovoley.release.approval',true) IS DISTINCT FROM 'reviewed-maintenance:mayvvlkvheagkojunzzb' OR current_setting('riovoley.release.window',true) IS DISTINCT FROM 'closed-to-clients' THEN
 RAISE EXCEPTION 'Paquete pendiente de autorizacion expresa, respaldo y ventana sin clientes';
 END IF;
 SELECT fingerprint INTO actual FROM (SELECT md5(string_agg(item,E'\n' ORDER BY item)) AS fingerprint
FROM (
 SELECT 'function:'||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||
 pg_get_userbyid(p.proowner)||':'||pg_get_functiondef(p.oid)||':'||COALESCE((
 SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable)
 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a),'') AS item
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.prokind='f' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
 UNION ALL
 SELECT 'policy:'||schemaname||'.'||tablename||':'||policyname||':'||permissive||':'||roles::text||':'||cmd||':'||COALESCE(qual,'')||':'||COALESCE(with_check,'')
 FROM pg_policies WHERE schemaname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'trigger:'||n.nspname||'.'||c.relname||':'||t.tgname||':'||t.tgenabled::text||':'||pg_get_triggerdef(t.oid)
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND (n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 OR (n.nspname='auth' AND t.tgname IN ('on_auth_user_created','trigger_sync_first_login_on_password_change','trigger_sync_last_login_from_auth')))
 UNION ALL
 SELECT 'relation:'||n.nspname||'.'||c.relname||':'||c.relkind::text||':'||c.relrowsecurity||':'||c.relforcerowsecurity||':'||COALESCE(c.reloptions::text,'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p','v') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull||':'||a.attidentity::text||':'||a.attgenerated::text||':'||COALESCE(pg_get_expr(d.adbin,d.adrelid),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'index:'||i.indisvalid||':'||i.indisready||':'||pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'view:'||n.nspname||'.'||c.relname||':'||pg_get_viewdef(c.oid,true)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='v' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 -- Exact compatibility pair: PG 17.11 distributes the varchar[] -> text[] cast
 -- when restoring this PG 17.4 CHECK. Both forms compare the same four literals.
 -- Every other expression, table or constraint remains byte sensitive.
 SELECT 'constraint:'||n.nspname||'.'||c.relname||':'||k.conname||':'||CASE
 WHEN n.nspname='public_content' AND c.relname='announcements' AND k.conname='announcements_priority_check'
 AND pg_get_constraintdef(k.oid)=$compat$CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('normal'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text])))$compat$
 THEN $compat$CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))$compat$
 ELSE pg_get_constraintdef(k.oid) END
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'relation_acl:'||n.nspname||'.'||c.relname||':'||pg_get_userbyid(c.relowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner))) a),'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','v','S') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'schema_acl:'||n.nspname||':'||pg_get_userbyid(n.nspowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a),'')
 FROM pg_namespace n WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'default_function_acl:'||pg_get_userbyid(d.defaclrole)||':'||COALESCE(n.nspname,'GLOBAL')||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(d.defaclacl) a),'')
 FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclobjtype='f' AND pg_get_userbyid(d.defaclrole)='postgres' AND (d.defaclnamespace=0 OR n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training'))
 UNION ALL
 SELECT 'enum:'||n.nspname||'.'||t.typname||':'||(SELECT string_agg(e.enumlabel,',' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid)
 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typtype='e' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'sequence:'||n.nspname||'.'||c.relname||':'||format_type(s.seqtypid,NULL)||':'||s.seqstart||':'||s.seqincrement||':'||s.seqmin||':'||s.seqmax||':'||s.seqcache||':'||s.seqcycle||':'||COALESCE((SELECT rn.nspname||'.'||r.relname||'.'||a.attname FROM pg_depend d JOIN pg_class r ON r.oid=d.refobjid JOIN pg_namespace rn ON rn.oid=r.relnamespace JOIN pg_attribute a ON a.attrelid=r.oid AND a.attnum=d.refobjsubid WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i')),'')
 FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column_acl:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||COALESCE((SELECT string_agg((CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END)||'/'||x.privilege_type||'/'||x.is_grantable::text,',' ORDER BY (CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END),x.privilege_type,x.is_grantable) FROM aclexplode(a.attacl) x),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
) objects) captured;
 IF actual IS DISTINCT FROM '102a88a3750d2c9c171f1b8940eb4893' THEN RAISE EXCEPTION 'Deriva del catalogo: abortar y reconstruir el paquete'; END IF;
END;
$release_guard$;

DO $remove$ DECLARE p record; BEGIN FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE left(policyname,4)='rio_' AND schemaname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training') LOOP EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename); END LOOP; END; $remove$;
DO $remove$ DECLARE item record; BEGIN FOR item IN SELECT n.nspname,c.relname,trg.tgname FROM pg_trigger trg JOIN pg_class c ON c.oid=trg.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT trg.tgisinternal AND left(trg.tgname,4)='rio_' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training') LOOP EXECUTE format('DROP TRIGGER %I ON %I.%I',item.tgname,item.nspname,item.relname); END LOOP; END; $remove$;
DROP FUNCTION public.claim_daily_login_reward();
DROP INDEX gamification.rio_daily_login_once;
DROP INDEX core.rio_student_user_identity;
ALTER FUNCTION public.soft_delete_payment_legacy_bigint(bigint) RENAME TO soft_delete_payment;
ALTER FUNCTION public.restore_payment_legacy_bigint(bigint) RENAME TO restore_payment;
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
ALTER FUNCTION "public"."soft_delete_payment"(payment_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id uuid) TO "service_role";
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
ALTER FUNCTION "public"."restore_payment"(payment_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."restore_payment"(payment_id uuid) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id uuid) TO "service_role";
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
ALTER FUNCTION "public"."sync_first_login_on_password_change"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."sync_first_login_on_password_change"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_first_login_on_password_change"() TO "service_role";
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
ALTER FUNCTION "public"."sync_last_login_from_auth"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."sync_last_login_from_auth"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_last_login_from_auth"() TO "service_role";
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
ALTER FUNCTION "public"."audit_payments"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."audit_payments"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."audit_payments"() TO "service_role";
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
ALTER FUNCTION "public"."sync_user_profile_on_user_update"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."sync_user_profile_on_user_update"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."sync_user_profile_on_user_update"() TO "service_role";
CREATE OR REPLACE FUNCTION public.calculate_age(birthdate date)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
    SELECT DATE_PART('year', AGE(birthdate));
$function$;
ALTER FUNCTION "public"."calculate_age"(birthdate date) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."calculate_age"(birthdate date) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_age"(birthdate date) TO "service_role";
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
ALTER FUNCTION "public"."soft_delete_payment"(payment_id bigint) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."soft_delete_payment"(payment_id bigint) TO "service_role";
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
ALTER FUNCTION "public"."restore_payment"(payment_id bigint) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."restore_payment"(payment_id bigint) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."restore_payment"(payment_id bigint) TO "service_role";
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
ALTER FUNCTION "public"."check_login_allowed"(p_email text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."check_login_allowed"(p_email text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."check_login_allowed"(p_email text) TO "service_role";
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
ALTER FUNCTION "reporting"."cleanup_old_report_runs"(retention_months integer) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "reporting"."cleanup_old_report_runs"(retention_months integer) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "reporting"."cleanup_old_report_runs"(retention_months integer) TO "postgres";
GRANT EXECUTE ON FUNCTION "reporting"."cleanup_old_report_runs"(retention_months integer) TO "service_role";
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
ALTER FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."admin_insert_user"(p_id uuid, p_email text, p_role text, p_nombre text, p_apellido text, p_fecha_nacimiento date, p_telefono text) TO "service_role";
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
ALTER FUNCTION "public"."is_admin_or_trainer"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."is_admin_or_trainer"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_admin_or_trainer"() TO "service_role";
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
ALTER FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."record_login_attempt"(p_email text, p_success boolean, p_error_code text) TO "service_role";
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
ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "service_role";
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
ALTER FUNCTION "public"."update_modified_column"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."update_modified_column"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_modified_column"() TO "service_role";
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
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO "service_role";
CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$function$;
ALTER FUNCTION "public"."update_announcements_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."update_announcements_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."update_announcements_updated_at"() TO "service_role";
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
ALTER FUNCTION "training"."enforce_physical_test_age"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "training"."enforce_physical_test_age"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "training"."enforce_physical_test_age"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "training"."enforce_physical_test_age"() TO "postgres";
CREATE OR REPLACE FUNCTION public.touch_mobile_device_registration_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$;
ALTER FUNCTION "public"."touch_mobile_device_registration_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."touch_mobile_device_registration_updated_at"() TO "service_role";
CREATE OR REPLACE FUNCTION profiles.touch_mobile_device_registration_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$;
ALTER FUNCTION "profiles"."touch_mobile_device_registration_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "profiles"."touch_mobile_device_registration_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "profiles"."touch_mobile_device_registration_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "profiles"."touch_mobile_device_registration_updated_at"() TO "postgres";
CREATE OR REPLACE FUNCTION public.get_user_role()
 RETURNS user_role_enum
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$function$;
ALTER FUNCTION "public"."get_user_role"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."get_user_role"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."get_user_role"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."get_user_role"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."get_user_role"() TO "service_role";
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
ALTER FUNCTION "public"."policy_exists"(p_table text, p_policy text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."policy_exists"(p_table text, p_policy text) TO "service_role";
CREATE OR REPLACE FUNCTION reporting.touch_scheduler_config_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
ALTER FUNCTION "reporting"."touch_scheduler_config_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "reporting"."touch_scheduler_config_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "reporting"."touch_scheduler_config_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "reporting"."touch_scheduler_config_updated_at"() TO "postgres";
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
ALTER FUNCTION "reporting"."invoke_generate_scheduled_reports"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "reporting"."invoke_generate_scheduled_reports"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "reporting"."invoke_generate_scheduled_reports"() TO "postgres";
GRANT EXECUTE ON FUNCTION "reporting"."invoke_generate_scheduled_reports"() TO "service_role";
CREATE OR REPLACE FUNCTION profiles.touch_user_notification_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$function$;
ALTER FUNCTION "profiles"."touch_user_notification_preferences_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "profiles"."touch_user_notification_preferences_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "profiles"."touch_user_notification_preferences_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "profiles"."touch_user_notification_preferences_updated_at"() TO "postgres";
CREATE OR REPLACE FUNCTION reporting.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
ALTER FUNCTION "reporting"."set_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "reporting"."set_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "reporting"."set_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "reporting"."set_updated_at"() TO "postgres";
CREATE OR REPLACE FUNCTION training.touch_training_categories_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;
ALTER FUNCTION "training"."touch_training_categories_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "training"."touch_training_categories_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "training"."touch_training_categories_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "training"."touch_training_categories_updated_at"() TO "postgres";
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
ALTER FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_membership_payment_period"(p_student_id uuid, p_fecha_pago date, p_exclude_payment_id uuid) TO "service_role";
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
ALTER FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."calculate_payment_state"(p_fecha_fin date) TO "service_role";
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
ALTER FUNCTION "public"."apply_payment_membership_rules"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."apply_payment_membership_rules"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."apply_payment_membership_rules"() TO "service_role";
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
ALTER FUNCTION "gamification"."skip_duplicate_daily_login_xp_ledger"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "gamification"."skip_duplicate_daily_login_xp_ledger"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "gamification"."skip_duplicate_daily_login_xp_ledger"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "gamification"."skip_duplicate_daily_login_xp_ledger"() TO "postgres";
CREATE OR REPLACE FUNCTION public.touch_user_notification_inbox_state_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$function$;
ALTER FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "anon";
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."touch_user_notification_inbox_state_updated_at"() TO "service_role";
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
ALTER FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."purchase_gamification_item"(p_student_id uuid, p_item_slug text) TO "service_role";
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
ALTER FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."equip_gamification_item"(p_student_id uuid, p_item_slug text) TO "service_role";
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
ALTER FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."unequip_gamification_item"(p_student_id uuid, p_category text) TO "service_role";
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
ALTER FUNCTION "core"."guard_client_user_fields"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "core"."guard_client_user_fields"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "core"."guard_client_user_fields"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "core"."guard_client_user_fields"() TO "postgres";
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
ALTER FUNCTION "profiles"."guard_client_profile_fields"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "profiles"."guard_client_profile_fields"() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE ON FUNCTION "profiles"."guard_client_profile_fields"() TO PUBLIC;
GRANT EXECUTE ON FUNCTION "profiles"."guard_client_profile_fields"() TO "postgres";
DROP FUNCTION security."guard_user_privileges"();
DROP FUNCTION security."preserve_wallet_spending"();
DROP FUNCTION security."guard_active_gamification_actor"();
DROP FUNCTION security."guard_staff_sources"();
DROP FUNCTION security."guard_cosmetic_unlock"();
DROP FUNCTION security."is_active_staff"();
DROP FUNCTION security."is_active_admin"();
DROP FUNCTION security."is_active_user"();
REVOKE USAGE ON SCHEMA security FROM authenticated;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
SET LOCAL search_path=public,extensions;
DO $release_guard$
DECLARE actual text;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Ejecutar como postgres para conservar propietarios y ACL previstas'; END IF;
 IF current_setting('riovoley.release.approval',true) IS DISTINCT FROM 'reviewed-maintenance:mayvvlkvheagkojunzzb' OR current_setting('riovoley.release.window',true) IS DISTINCT FROM 'closed-to-clients' THEN
 RAISE EXCEPTION 'Paquete pendiente de autorizacion expresa, respaldo y ventana sin clientes';
 END IF;
 SELECT fingerprint INTO actual FROM (SELECT md5(string_agg(item,E'\n' ORDER BY item)) AS fingerprint
FROM (
 SELECT 'function:'||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||
 pg_get_userbyid(p.proowner)||':'||pg_get_functiondef(p.oid)||':'||COALESCE((
 SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable)
 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a),'') AS item
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.prokind='f' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
 UNION ALL
 SELECT 'policy:'||schemaname||'.'||tablename||':'||policyname||':'||permissive||':'||roles::text||':'||cmd||':'||COALESCE(qual,'')||':'||COALESCE(with_check,'')
 FROM pg_policies WHERE schemaname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'trigger:'||n.nspname||'.'||c.relname||':'||t.tgname||':'||t.tgenabled::text||':'||pg_get_triggerdef(t.oid)
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND (n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 OR (n.nspname='auth' AND t.tgname IN ('on_auth_user_created','trigger_sync_first_login_on_password_change','trigger_sync_last_login_from_auth')))
 UNION ALL
 SELECT 'relation:'||n.nspname||'.'||c.relname||':'||c.relkind::text||':'||c.relrowsecurity||':'||c.relforcerowsecurity||':'||COALESCE(c.reloptions::text,'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p','v') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull||':'||a.attidentity::text||':'||a.attgenerated::text||':'||COALESCE(pg_get_expr(d.adbin,d.adrelid),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'index:'||i.indisvalid||':'||i.indisready||':'||pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'view:'||n.nspname||'.'||c.relname||':'||pg_get_viewdef(c.oid,true)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='v' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 -- Exact compatibility pair: PG 17.11 distributes the varchar[] -> text[] cast
 -- when restoring this PG 17.4 CHECK. Both forms compare the same four literals.
 -- Every other expression, table or constraint remains byte sensitive.
 SELECT 'constraint:'||n.nspname||'.'||c.relname||':'||k.conname||':'||CASE
 WHEN n.nspname='public_content' AND c.relname='announcements' AND k.conname='announcements_priority_check'
 AND pg_get_constraintdef(k.oid)=$compat$CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('normal'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text])))$compat$
 THEN $compat$CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))$compat$
 ELSE pg_get_constraintdef(k.oid) END
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'relation_acl:'||n.nspname||'.'||c.relname||':'||pg_get_userbyid(c.relowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner))) a),'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','v','S') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'schema_acl:'||n.nspname||':'||pg_get_userbyid(n.nspowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a),'')
 FROM pg_namespace n WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'default_function_acl:'||pg_get_userbyid(d.defaclrole)||':'||COALESCE(n.nspname,'GLOBAL')||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(d.defaclacl) a),'')
 FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclobjtype='f' AND pg_get_userbyid(d.defaclrole)='postgres' AND (d.defaclnamespace=0 OR n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training'))
 UNION ALL
 SELECT 'enum:'||n.nspname||'.'||t.typname||':'||(SELECT string_agg(e.enumlabel,',' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid)
 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typtype='e' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'sequence:'||n.nspname||'.'||c.relname||':'||format_type(s.seqtypid,NULL)||':'||s.seqstart||':'||s.seqincrement||':'||s.seqmin||':'||s.seqmax||':'||s.seqcache||':'||s.seqcycle||':'||COALESCE((SELECT rn.nspname||'.'||r.relname||'.'||a.attname FROM pg_depend d JOIN pg_class r ON r.oid=d.refobjid JOIN pg_namespace rn ON rn.oid=r.relnamespace JOIN pg_attribute a ON a.attrelid=r.oid AND a.attnum=d.refobjsubid WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i')),'')
 FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column_acl:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||COALESCE((SELECT string_agg((CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END)||'/'||x.privilege_type||'/'||x.is_grantable::text,',' ORDER BY (CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END),x.privilege_type,x.is_grantable) FROM aclexplode(a.attacl) x),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
) objects) captured;
 IF actual IS DISTINCT FROM '62c2560019fdf8f9c07ebdebbd1a08af' THEN RAISE EXCEPTION 'Deriva del catalogo: abortar y reconstruir el paquete'; END IF;
END;
$release_guard$;

NOTIFY pgrst,'reload schema';
COMMIT;

