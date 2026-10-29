-- Reversión exclusiva del entorno local verificado. No usar en producción.
BEGIN;
DO $$ BEGIN IF current_setting('riovoley.audit.local_project',true) IS DISTINCT FROM 'riovoley-e2e-local' THEN RAISE EXCEPTION 'Solo local'; END IF; END $$;
DO $$ DECLARE p record; BEGIN FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE policyname LIKE 'rio_%' AND schemaname IN ('gamification','billing','training') LOOP EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename);END LOOP;END $$;
DROP TRIGGER IF EXISTS rio_guard_privileges ON core.users;
DROP TRIGGER IF EXISTS rio_guard_privileges ON profiles.user_profiles;
DROP TRIGGER IF EXISTS rio_preserve_spending ON gamification.currency_wallets;
DROP TRIGGER IF EXISTS rio_active_actor ON gamification.currency_wallets;
DROP TRIGGER IF EXISTS rio_active_actor ON gamification.currency_ledger;
DROP TRIGGER IF EXISTS rio_active_actor ON gamification.student_cosmetic_items;
DROP TRIGGER IF EXISTS rio_active_actor ON gamification.student_cosmetic_equipment;
DROP FUNCTION IF EXISTS public.claim_daily_login_reward();
DROP INDEX IF EXISTS gamification.rio_daily_login_once;
DROP FUNCTION IF EXISTS security.guard_user_privileges();
DROP FUNCTION IF EXISTS security.preserve_wallet_spending();
DROP FUNCTION IF EXISTS security.guard_active_gamification_actor();
DROP FUNCTION IF EXISTS security.is_active_staff();
DROP FUNCTION IF EXISTS security.is_active_admin();
DROP FUNCTION IF EXISTS security.is_active_user();
ALTER FUNCTION public.soft_delete_payment_legacy_bigint(bigint) RENAME TO soft_delete_payment;
ALTER FUNCTION public.restore_payment_legacy_bigint(bigint) RENAME TO restore_payment;
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
$function$
;
REVOKE ALL ON FUNCTION public.audit_payments() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.audit_payments() TO "postgres";
GRANT EXECUTE ON FUNCTION public.audit_payments() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_payments() TO "anon";
GRANT EXECUTE ON FUNCTION public.audit_payments() TO "authenticated";
GRANT EXECUTE ON FUNCTION public.audit_payments() TO "service_role";
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
$function$
;
REVOKE ALL ON FUNCTION public.restore_payment(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.restore_payment(uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION public.restore_payment(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_payment(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION public.restore_payment(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION public.restore_payment(uuid) TO "service_role";
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
$function$
;
REVOKE ALL ON FUNCTION public.restore_payment(bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.restore_payment(bigint) TO "postgres";
GRANT EXECUTE ON FUNCTION public.restore_payment(bigint) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_payment(bigint) TO "anon";
GRANT EXECUTE ON FUNCTION public.restore_payment(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION public.restore_payment(bigint) TO "service_role";
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
$function$
;
REVOKE ALL ON FUNCTION public.soft_delete_payment(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid) TO "postgres";
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid) TO "anon";
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid) TO "authenticated";
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid) TO "service_role";
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
$function$
;
REVOKE ALL ON FUNCTION public.soft_delete_payment(bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(bigint) TO "postgres";
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(bigint) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(bigint) TO "anon";
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(bigint) TO "authenticated";
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(bigint) TO "service_role";
REVOKE USAGE ON SCHEMA security FROM authenticated;
NOTIFY pgrst,'reload schema';COMMIT;
