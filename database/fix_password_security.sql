-- Script URGENTE para proteger la columna password
-- Fecha: 2026-01-29
-- CRÍTICO: Las contraseñas NO deben estar accesibles via API

-- ========================================
-- IMPORTANTE: LEER ANTES DE EJECUTAR
-- ========================================
-- El código ha sido actualizado para NO depender de la columna password
-- La funcionalidad de "Reenviar Credenciales" ahora genera SIEMPRE una nueva contraseña
-- Es SEGURO eliminar la columna después de actualizar el código

-- ========================================
-- PASO 1: Verificar datos actuales
-- ========================================
SELECT 
    COUNT(*) as total_users,
    COUNT(password) as users_with_password,
    COUNT(DISTINCT password) as unique_passwords
FROM public.users;

-- ========================================
-- PASO 2: Backup de seguridad (OPCIONAL)
-- ========================================
-- Solo si quieres conservar un registro histórico
-- NO se usará para funcionalidad, solo para auditoría

CREATE TABLE IF NOT EXISTS users_password_backup AS
SELECT id, email, password, created_at, updated_at
FROM public.users
WHERE password IS NOT NULL;

-- Verificar backup
SELECT COUNT(*) as passwords_backed_up FROM users_password_backup;

-- ========================================
-- PASO 3: ELIMINAR la columna password (SEGURO)
-- ========================================
-- La funcionalidad de reenviar credenciales ahora:
-- 1. Genera una NUEVA contraseña temporal
-- 2. La actualiza en Supabase Auth (auth.users)
-- 3. NO necesita leer la contraseña anterior

ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- Verificar que se eliminó
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ========================================
-- OPCIÓN 2: Proteger con RLS (Si necesitas mantenerla)
-- ========================================
-- Solo si REALMENTE necesitas esta columna

/*
-- Crear política para que NADIE pueda leer el password via API
CREATE POLICY "Password never readable via API" ON public.users
FOR SELECT
TO authenticated
USING (false); -- Bloquea SELECT del password

-- O mejor aún, usar vistas que excluyan el password
CREATE OR REPLACE VIEW public.users_safe AS
SELECT 
    id,
    email,
    role,
    nombre,
    apellido,
    telefono,
    fecha_nacimiento,
    last_login,
    created_at,
    updated_at,
    suspended,
    suspension_reason,
    suspension_until,
    suspended_at
    -- NO incluir password
FROM public.users;

-- Revocar acceso directo a users
REVOKE ALL ON public.users FROM anon, authenticated;

-- Dar acceso a la vista segura
GRANT SELECT ON public.users_safe TO authenticated;
GRANT ALL ON public.users_safe TO service_role;
*/

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- 1. Verificar que password no está accesible
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 3. Test de seguridad (ejecutar como usuario autenticado, no como admin)
-- Esto NO debe mostrar passwords
-- SELECT password FROM public.users LIMIT 1;
