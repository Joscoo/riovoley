-- Generada inicialmente con Supabase CLI migration new; validación SOLO local.
-- No pertenece a supabase/migrations y no se aplica automáticamente al desplegar.
BEGIN;
DO $guard$
BEGIN
 IF current_setting('riovoley.audit.local_project',true) IS DISTINCT FROM 'riovoley-e2e-local' THEN
  RAISE EXCEPTION 'Usar exclusivamente el aplicador local con identidad verificada';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   WHERE c.relkind='r' AND (n.nspname='gamification' OR (n.nspname='core' AND c.relname IN ('users','students')) OR (n.nspname='billing' AND c.relname='payments') OR (n.nspname='profiles' AND c.relname='user_profiles') OR (n.nspname='training' AND c.relname IN ('attendances','physical_tests'))) AND NOT c.relrowsecurity) THEN
  RAISE EXCEPTION 'Precondición: revisar y habilitar RLS antes de aplicar este cambio';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='v' AND (c.relname LIKE 'gamification_%' OR c.relname IN ('users','students','payments','user_profiles','attendances','physical_tests')) AND NOT COALESCE(c.reloptions @> ARRAY['security_invoker=true'],false)) THEN
  RAISE EXCEPTION 'Precondición: las vistas deben respetar permisos del invocador';
 END IF;
END;
$guard$;

CREATE OR REPLACE FUNCTION security.is_active_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM core.users u WHERE u.id=auth.uid() AND NOT COALESCE(u.suspended,false)) $$;
CREATE OR REPLACE FUNCTION security.is_active_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM core.users u WHERE u.id=auth.uid() AND u.role IN ('administrador','admin','entrenador') AND NOT COALESCE(u.suspended,false)) $$;
CREATE OR REPLACE FUNCTION security.is_active_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM core.users u WHERE u.id=auth.uid() AND u.role IN ('administrador','admin') AND NOT COALESCE(u.suspended,false)) $$;
REVOKE ALL ON FUNCTION security.is_active_user(),security.is_active_staff(),security.is_active_admin() FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA security TO authenticated;
GRANT EXECUTE ON FUNCTION security.is_active_user(),security.is_active_staff(),security.is_active_admin() TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT security.is_active_admin() $$;
CREATE OR REPLACE FUNCTION public.is_admin_or_trainer() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT security.is_active_staff() $$;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE role_value profiles.user_profiles.role%TYPE;
BEGIN
 role_value:=COALESCE((SELECT CASE WHEN u.role='admin' THEN 'administrador' ELSE u.role END FROM core.users u WHERE u.id=NEW.id),'usuario');
 INSERT INTO profiles.user_profiles(id,full_name,role)
 VALUES(NEW.id,NEW.raw_user_meta_data->>'full_name',role_value)
 ON CONFLICT(id) DO UPDATE SET full_name=EXCLUDED.full_name,role=EXCLUDED.role;
 RETURN NEW;
END;
$body$;

CREATE OR REPLACE FUNCTION security.guard_user_privileges()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $body$
BEGIN
 IF auth.role() IS NULL OR auth.role() NOT IN ('authenticated','anon') THEN
  IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
 END IF;
 IF TG_TABLE_SCHEMA='core' THEN
  IF TG_OP='INSERT' AND NOT security.is_active_staff() THEN RAISE EXCEPTION 'Alta reservada al personal activo' USING ERRCODE='42501'; END IF;
  IF TG_OP='DELETE' THEN
   IF NOT (security.is_active_admin() OR (security.is_active_staff() AND OLD.role='estudiante' AND OLD.id<>auth.uid())) THEN RAISE EXCEPTION 'Baja reservada al personal autorizado' USING ERRCODE='42501'; END IF;
   RETURN OLD;
  END IF;
  IF TG_OP='UPDATE' AND NEW.role IS DISTINCT FROM OLD.role AND NOT security.is_active_admin() THEN
   RAISE EXCEPTION 'Solo un administrador activo puede cambiar roles' USING ERRCODE='42501';
  END IF;
  IF TG_OP='UPDATE' AND NEW.suspended IS DISTINCT FROM OLD.suspended
     AND NOT (security.is_active_admin() OR (security.is_active_staff() AND OLD.role='estudiante' AND OLD.id<>auth.uid() AND NEW.role=OLD.role)) THEN
   RAISE EXCEPTION 'No tiene autorización para cambiar esta suspensión' USING ERRCODE='42501';
  END IF;
 ELSE
  IF NEW.role::text IS DISTINCT FROM COALESCE((SELECT u.role FROM core.users u WHERE u.id=NEW.id),'usuario')
     AND NOT security.is_active_admin() THEN
   RAISE EXCEPTION 'El perfil no puede autoasignarse un rol' USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END;
$body$;
DROP TRIGGER IF EXISTS rio_guard_privileges ON core.users;
CREATE TRIGGER rio_guard_privileges BEFORE INSERT OR UPDATE OR DELETE ON core.users FOR EACH ROW EXECUTE FUNCTION security.guard_user_privileges();
DROP TRIGGER IF EXISTS rio_guard_privileges ON profiles.user_profiles;
CREATE TRIGGER rio_guard_privileges BEFORE INSERT OR UPDATE ON profiles.user_profiles FOR EACH ROW EXECUTE FUNCTION security.guard_user_privileges();

-- Las políticas restrictivas se combinan con las políticas existentes; no se
-- suprimen sus restricciones de propiedad ni las lecturas del propietario.
DO $policies$
DECLARE t record; action text; predicate text; policy_name text;
BEGIN
 FOR t IN SELECT schemaname,tablename FROM pg_catalog.pg_tables WHERE schemaname='gamification'
  UNION ALL SELECT 'billing','payments'
  UNION ALL SELECT 'training','attendances'
  UNION ALL SELECT 'training','physical_tests'
  UNION ALL SELECT 'core','users'
  UNION ALL SELECT 'core','students'
  UNION ALL SELECT 'profiles','user_profiles'
 LOOP
  FOR action IN SELECT unnest(ARRAY['INSERT','UPDATE','DELETE']) LOOP
   policy_name:='rio_active_'||lower(action);
   EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',policy_name,t.schemaname,t.tablename);
   predicate:=CASE WHEN action='INSERT' THEN 'WITH CHECK (security.is_active_user())'
     WHEN action='UPDATE' THEN 'USING (security.is_active_user()) WITH CHECK (security.is_active_user())'
     ELSE 'USING (security.is_active_user())' END;
   EXECUTE format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO authenticated %s',policy_name,t.schemaname,t.tablename,action,predicate);
  END LOOP;
 END LOOP;
 FOR t IN SELECT 'gamification'::text AS schemaname,unnest(ARRAY[
  'xp_ledger','currency_wallets','currency_ledger','student_profiles','reward_events',
  'student_achievements','student_challenge_progress','student_campaign_progress',
  'student_hidden_rewards','student_current_stage','student_stage_history',
  'leaderboard_snapshots','student_cosmetic_items','student_cosmetic_equipment']) AS tablename
  UNION ALL SELECT 'billing','payments'
  UNION ALL SELECT 'training','attendances'
  UNION ALL SELECT 'training','physical_tests'
  UNION ALL SELECT 'core','students'
 LOOP
  FOR action IN SELECT unnest(ARRAY['INSERT','UPDATE','DELETE']) LOOP
   policy_name:='rio_staff_'||lower(action);
   EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',policy_name,t.schemaname,t.tablename);
   predicate:=CASE WHEN action='INSERT' THEN 'WITH CHECK (security.is_active_staff())'
     WHEN action='UPDATE' THEN 'USING (security.is_active_staff()) WITH CHECK (security.is_active_staff())'
     ELSE 'USING (security.is_active_staff())' END;
   EXECUTE format('CREATE POLICY %I ON %I.%I AS RESTRICTIVE FOR %s TO authenticated %s',policy_name,t.schemaname,t.tablename,action,predicate);
  END LOOP;
 END LOOP;
 FOR action IN SELECT unnest(ARRAY['INSERT','UPDATE','DELETE']) LOOP
  policy_name:='rio_rpc_only_'||lower(action);
  EXECUTE format('DROP POLICY IF EXISTS %I ON gamification.login_rewards',policy_name);
  predicate:=CASE WHEN action='INSERT' THEN 'WITH CHECK (false)' WHEN action='UPDATE' THEN 'USING (false) WITH CHECK (false)' ELSE 'USING (false)' END;
  EXECUTE format('CREATE POLICY %I ON gamification.login_rewards AS RESTRICTIVE FOR %s TO authenticated %s',policy_name,action,predicate);
 END LOOP;
END;
$policies$;

-- Permitir al entrenador las operaciones administrativas previstas, siempre
-- sujetas también a las políticas restrictivas anteriores.
DROP POLICY IF EXISTS rio_payments_staff_all ON billing.payments;
CREATE POLICY rio_payments_staff_all ON billing.payments FOR ALL TO authenticated
 USING(security.is_active_staff()) WITH CHECK(security.is_active_staff());

CREATE OR REPLACE FUNCTION public.audit_payments()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
BEGIN
 IF TG_OP='DELETE' THEN
  INSERT INTO audit.payments_audit(payment_id,action,old_data,changed_by) VALUES(OLD.id,'DELETE',to_jsonb(OLD),auth.uid());RETURN OLD;
 ELSIF TG_OP='UPDATE' THEN
  INSERT INTO audit.payments_audit(payment_id,action,old_data,new_data,changed_by) VALUES(OLD.id,'UPDATE',to_jsonb(OLD),to_jsonb(NEW),auth.uid());RETURN NEW;
 ELSE
  INSERT INTO audit.payments_audit(payment_id,action,new_data,changed_by) VALUES(NEW.id,'INSERT',to_jsonb(NEW),auth.uid());RETURN NEW;
 END IF;
END;
$body$;

-- Conservar las funciones bigint bajo nombres diferenciados y sin acceso web;
-- así no compiten con las firmas UUID al resolver una llamada PostgREST.
DO $legacy$
BEGIN
 IF to_regprocedure('public.soft_delete_payment(bigint)') IS NOT NULL THEN
  ALTER FUNCTION public.soft_delete_payment(bigint) RENAME TO soft_delete_payment_legacy_bigint;
 END IF;
 IF to_regprocedure('public.restore_payment(bigint)') IS NOT NULL THEN
  ALTER FUNCTION public.restore_payment(bigint) RENAME TO restore_payment_legacy_bigint;
 END IF;
END;
$legacy$;
REVOKE ALL ON FUNCTION public.soft_delete_payment_legacy_bigint(bigint),public.restore_payment_legacy_bigint(bigint) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.soft_delete_payment(payment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $body$
BEGIN
 IF NOT security.is_active_staff() THEN RAISE EXCEPTION 'Personal activo requerido' USING ERRCODE='42501'; END IF;
 UPDATE billing.payments p SET deleted_at=now() WHERE p.id=payment_id AND p.deleted_at IS NULL;
 RETURN FOUND;
END;
$body$;
CREATE OR REPLACE FUNCTION public.restore_payment(payment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=''
AS $body$
BEGIN
 IF NOT security.is_active_staff() THEN RAISE EXCEPTION 'Personal activo requerido' USING ERRCODE='42501'; END IF;
 UPDATE billing.payments p SET deleted_at=NULL WHERE p.id=payment_id AND p.deleted_at IS NOT NULL;
 RETURN FOUND;
END;
$body$;
REVOKE ALL ON FUNCTION public.soft_delete_payment(uuid),public.restore_payment(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid),public.restore_payment(uuid) TO authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS rio_daily_login_once ON gamification.xp_ledger(student_id,source_ref) WHERE source_type='daily_login';
CREATE UNIQUE INDEX IF NOT EXISTS rio_student_user_identity ON core.students(user_id) WHERE user_id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.claim_daily_login_reward()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE actor uuid:=auth.uid(); student uuid; today date:=(now() AT TIME ZONE 'America/Guayaquil')::date; inserted integer;
BEGIN
 IF actor IS NULL OR NOT security.is_active_user() THEN RAISE EXCEPTION 'Usuario activo requerido' USING ERRCODE='42501'; END IF;
 SELECT s.id INTO student FROM core.students s JOIN core.users u ON u.id=s.user_id WHERE s.user_id=actor AND u.role='estudiante';
 IF student IS NULL THEN RETURN jsonb_build_object('awarded',false,'skipped',true,'xpDelta',0,'rewardDate',NULL,'studentId',NULL); END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('riovoley-daily:'||actor::text,0));
 IF EXISTS(SELECT 1 FROM gamification.login_rewards r WHERE r.user_id=actor AND r.reward_date=today) THEN
  RETURN jsonb_build_object('awarded',false,'xpDelta',0,'rewardDate',today,'studentId',student);
 END IF;
 INSERT INTO gamification.xp_ledger(student_id,source_type,source_ref,xp_delta,label,description,metadata)
 VALUES(student,'daily_login',today::text,8,'Ingreso diario','Recompensa minima por volver hoy a la aplicacion.',jsonb_build_object('rewardDate',today))
 ON CONFLICT(student_id,source_ref) WHERE source_type='daily_login' DO NOTHING;
 GET DIAGNOSTICS inserted=ROW_COUNT;
 INSERT INTO gamification.login_rewards(user_id,reward_date,reward_count,updated_at) VALUES(actor,today,1,now())
 ON CONFLICT(user_id) DO UPDATE SET reward_date=EXCLUDED.reward_date,reward_count=1,updated_at=EXCLUDED.updated_at;
 RETURN jsonb_build_object('awarded',inserted=1,'xpDelta',CASE WHEN inserted=1 THEN 8 ELSE 0 END,'rewardDate',today,'studentId',student);
END;
$body$;
REVOKE ALL ON FUNCTION public.claim_daily_login_reward() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_login_reward() TO authenticated;

-- Una resincronización de personal puede traer un total_spent leído antes de
-- una compra. El UPDATE conserva el gasto que ya está bloqueado en esta fila.
CREATE OR REPLACE FUNCTION security.preserve_wallet_spending()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $body$
BEGIN
 IF current_user='authenticated' THEN
  NEW.total_spent:=OLD.total_spent;
  NEW.balance:=greatest(0,NEW.total_earned-OLD.total_spent);
 END IF;
 RETURN NEW;
END;
$body$;
DROP TRIGGER IF EXISTS rio_preserve_spending ON gamification.currency_wallets;
CREATE TRIGGER rio_preserve_spending BEFORE UPDATE ON gamification.currency_wallets FOR EACH ROW EXECUTE FUNCTION security.preserve_wallet_spending();

-- Los SECURITY DEFINER de tienda siguen siendo la vía de compra/equipamiento,
-- pero tampoco pueden mutar resultados si el actor fue suspendido.
CREATE OR REPLACE FUNCTION security.guard_active_gamification_actor()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $body$
BEGIN
 IF auth.role()='authenticated' AND NOT security.is_active_user() THEN RAISE EXCEPTION 'Usuario suspendido' USING ERRCODE='42501'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$body$;
DO $triggers$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['currency_wallets','currency_ledger','student_cosmetic_items','student_cosmetic_equipment'] LOOP
  EXECUTE format('DROP TRIGGER IF EXISTS rio_active_actor ON gamification.%I',t);
  EXECUTE format('CREATE TRIGGER rio_active_actor BEFORE INSERT OR UPDATE OR DELETE ON gamification.%I FOR EACH ROW EXECUTE FUNCTION security.guard_active_gamification_actor()',t);
 END LOOP;
 DROP TRIGGER IF EXISTS rio_active_actor ON core.users;
 CREATE TRIGGER rio_active_actor BEFORE INSERT OR UPDATE OR DELETE ON core.users FOR EACH ROW EXECUTE FUNCTION security.guard_active_gamification_actor();
 DROP TRIGGER IF EXISTS rio_active_actor ON profiles.user_profiles;
 CREATE TRIGGER rio_active_actor BEFORE INSERT OR UPDATE OR DELETE ON profiles.user_profiles FOR EACH ROW EXECUTE FUNCTION security.guard_active_gamification_actor();
END;
$triggers$;
CREATE OR REPLACE FUNCTION security.guard_staff_sources()
RETURNS trigger LANGUAGE plpgsql SET search_path=''
AS $body$
BEGIN
 IF auth.role() IN ('authenticated','anon') AND NOT security.is_active_staff() THEN RAISE EXCEPTION 'Solo personal activo modifica fuentes deportivas' USING ERRCODE='42501'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$body$;
DROP TRIGGER IF EXISTS rio_staff_source ON core.students;
CREATE TRIGGER rio_staff_source BEFORE INSERT OR UPDATE OR DELETE ON core.students FOR EACH ROW EXECUTE FUNCTION security.guard_staff_sources();
DROP TRIGGER IF EXISTS rio_staff_source ON training.attendances;
CREATE TRIGGER rio_staff_source BEFORE INSERT OR UPDATE OR DELETE ON training.attendances FOR EACH ROW EXECUTE FUNCTION security.guard_staff_sources();
DROP TRIGGER IF EXISTS rio_staff_source ON training.physical_tests;
CREATE TRIGGER rio_staff_source BEFORE INSERT OR UPDATE OR DELETE ON training.physical_tests FOR EACH ROW EXECUTE FUNCTION security.guard_staff_sources();

CREATE OR REPLACE FUNCTION security.guard_cosmetic_unlock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $body$
DECLARE meta jsonb; unlock_type text; target numeric; unlocked boolean:=false; level_value integer; streak_value integer; rank_value bigint; category_value text;
BEGIN
 IF auth.role() IS NULL OR auth.role() NOT IN ('authenticated','anon') THEN RETURN NEW; END IF;
 IF NOT security.is_active_user() THEN RAISE EXCEPTION 'Usuario activo requerido' USING ERRCODE='42501'; END IF;
 SELECT c.metadata INTO meta FROM gamification.cosmetic_items_catalog c WHERE c.slug=NEW.item_slug AND c.is_active;
 IF meta IS NULL THEN RAISE EXCEPTION 'Cosmético no disponible' USING ERRCODE='42501'; END IF;
 unlock_type:=COALESCE(meta->>'unlockType','purchase');target:=COALESCE(NULLIF(meta->>'unlockTarget',''),NULLIF(meta->>'unlockLevel',''),'0')::numeric;
 SELECT p.current_level,p.longest_streak INTO level_value,streak_value FROM gamification.student_profiles p WHERE p.student_id=NEW.student_id;
 -- La lectura React incorpora los XP diarios del ledger aunque el personal aún
 -- no haya resincronizado el perfil. Derivar también aquí ese umbral evita
 -- rechazar una compra válida al cruzar de nivel con el ingreso diario.
 SELECT greatest(COALESCE(level_value,1),CASE WHEN COALESCE(sum(x.xp_delta),0)>=1100 THEN 5 WHEN COALESCE(sum(x.xp_delta),0)>=750 THEN 4 WHEN COALESCE(sum(x.xp_delta),0)>=450 THEN 3 WHEN COALESCE(sum(x.xp_delta),0)>=200 THEN 2 ELSE 1 END)
 INTO level_value FROM gamification.xp_ledger x WHERE x.student_id=NEW.student_id;
 CASE unlock_type
  WHEN 'purchase' THEN unlocked:=true;
  WHEN 'level' THEN unlocked:=target>0 AND COALESCE(level_value,0)>=target;
  WHEN 'achievement_count' THEN unlocked:=target>0 AND (SELECT count(*) FROM gamification.student_achievements a WHERE a.student_id=NEW.student_id)>=target;
  WHEN 'streak' THEN unlocked:=target>0 AND COALESCE(streak_value,0)>=target;
  WHEN 'leaderboard_top' THEN
   SELECT s.categoria INTO category_value FROM core.students s WHERE s.id=NEW.student_id;
   IF COALESCE(meta->>'boardType','overall')='overall' THEN
    SELECT l.rank_position INTO rank_value FROM gamification.leaderboard_snapshots l WHERE l.student_id=NEW.student_id AND l.categoria=category_value ORDER BY l.snapshot_date DESC LIMIT 1;
   ELSIF meta->>'boardType'='jump_approach' THEN
    WITH ranked AS (
     SELECT s.id,row_number() OVER(ORDER BY p.brazo_extend_con_impulso DESC,COALESCE(g.current_level,1) DESC,s.id::text) AS position
     FROM core.students s JOIN LATERAL(SELECT t.brazo_extend_con_impulso FROM training.physical_tests t WHERE t.student_id=s.id ORDER BY t.fecha_test DESC,t.created_at DESC,t.id DESC LIMIT 1) p ON p.brazo_extend_con_impulso IS NOT NULL
     LEFT JOIN gamification.student_profiles g ON g.student_id=s.id WHERE s.categoria=category_value
    ) SELECT r.position INTO rank_value FROM ranked r WHERE r.id=NEW.student_id;
   END IF;
   unlocked:=COALESCE(rank_value,0)>0 AND rank_value<=CASE WHEN target>0 THEN target ELSE 3 END;
  ELSE unlocked:=false;
 END CASE;
 IF NOT COALESCE(unlocked,false) THEN RAISE EXCEPTION 'Cosmético todavía bloqueado' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$body$;
DROP TRIGGER IF EXISTS rio_cosmetic_unlock ON gamification.student_cosmetic_items;
CREATE TRIGGER rio_cosmetic_unlock BEFORE INSERT OR UPDATE ON gamification.student_cosmetic_items FOR EACH ROW EXECUTE FUNCTION security.guard_cosmetic_unlock();
REVOKE ALL ON FUNCTION security.guard_staff_sources(),security.guard_cosmetic_unlock() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION security.guard_user_privileges(),security.preserve_wallet_spending(),security.guard_active_gamification_actor() FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
