-- Trigger para mantener sincronizados los roles entre users y user_profiles
-- Fecha: 2026-01-29
-- Propósito: Actualizar automáticamente user_profiles cuando cambie el rol en users

-- 1. Crear la función que se ejecutará cuando se actualice un usuario
CREATE OR REPLACE FUNCTION sync_user_profile_on_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el rol cambió
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Actualizar o crear el perfil en user_profiles
        -- Mapear 'estudiante' a 'usuario' si es necesario
        INSERT INTO public.user_profiles (id, full_name, role, created_at)
        VALUES (
            NEW.id,
            TRIM(CONCAT(NEW.nombre, ' ', NEW.apellido)),
            CASE 
                WHEN NEW.role = 'estudiante' THEN 'usuario'::user_role_enum
                ELSE NEW.role::user_role_enum
            END,
            NEW.created_at
        )
        ON CONFLICT (id) 
        DO UPDATE SET 
            role = CASE 
                WHEN NEW.role = 'estudiante' THEN 'usuario'::user_role_enum
                ELSE NEW.role::user_role_enum
            END,
            full_name = TRIM(CONCAT(NEW.nombre, ' ', NEW.apellido));
        
        RAISE NOTICE 'Rol sincronizado en user_profiles para usuario %', NEW.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el trigger
DROP TRIGGER IF EXISTS trigger_sync_user_profile ON public.users;

CREATE TRIGGER trigger_sync_user_profile
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION sync_user_profile_on_user_update();

-- 3. Comentarios
COMMENT ON FUNCTION sync_user_profile_on_user_update() IS 
'Sincroniza automáticamente el rol en user_profiles cuando se actualiza en users';

COMMENT ON TRIGGER trigger_sync_user_profile ON public.users IS 
'Mantiene sincronizados los roles entre users y user_profiles';

-- 4. Verificación
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_user_profile';
