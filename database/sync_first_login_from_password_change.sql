-- Sincroniza users.first_login cuando cambia la contraseña en auth.users
-- Ejecutar una vez en Supabase SQL Editor

-- 1) Función para marcar first_login=false al cambiar la contraseña en Auth
CREATE OR REPLACE FUNCTION public.sync_first_login_on_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- encrypted_password cambia cuando el usuario actualiza su contraseña.
  IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    UPDATE public.users
    SET first_login = false
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Trigger en auth.users
DROP TRIGGER IF EXISTS trigger_sync_first_login_on_password_change ON auth.users;

CREATE TRIGGER trigger_sync_first_login_on_password_change
AFTER UPDATE OF encrypted_password ON auth.users
FOR EACH ROW
WHEN (OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password)
EXECUTE FUNCTION public.sync_first_login_on_password_change();

-- 3) Verificación rápida
SELECT
  trigger_name,
  event_object_schema,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_first_login_on_password_change';
