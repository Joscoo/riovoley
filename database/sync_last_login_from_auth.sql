-- Sincroniza core.users.last_login con auth.users.last_sign_in_at
-- Ejecutar una vez en Supabase SQL Editor

-- 1) Backfill inicial para usuarios existentes
UPDATE core.users u
SET last_login = au.last_sign_in_at
FROM auth.users au
WHERE au.id = u.id
  AND au.last_sign_in_at IS NOT NULL
  AND (u.last_login IS NULL OR u.last_login IS DISTINCT FROM au.last_sign_in_at);

-- 2) Función para mantener sincronización automática
CREATE OR REPLACE FUNCTION public.sync_last_login_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Solo sincronizar si cambió el dato de último inicio de sesión
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE core.users
    SET last_login = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Trigger en auth.users
DROP TRIGGER IF EXISTS trigger_sync_last_login_from_auth ON auth.users;

CREATE TRIGGER trigger_sync_last_login_from_auth
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION public.sync_last_login_from_auth();

-- 4) Verificación rápida
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_last_login_from_auth';
