-- ============================================
-- FIX: Usuario Creado Incompleto en Auth
-- ============================================
-- Problema: Usuario existe en auth.users pero no en public.users
-- Solución: Identificar y eliminar el usuario de auth.users

-- PASO 1: Ver usuarios en auth.users que NO están en public.users
SELECT 
    'Usuarios huérfanos en auth' as tipo,
    au.id,
    au.email,
    au.created_at,
    au.confirmed_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;

-- PASO 2: Ver el último usuario creado en auth.users
SELECT 
    'Últimos usuarios en auth' as tipo,
    id,
    email,
    created_at,
    confirmed_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- PASO 3: ELIMINAR un usuario específico de auth.users
-- IMPORTANTE: Reemplaza 'EMAIL_AQUI@ejemplo.com' con el email del usuario problemático
-- Descomenta las siguientes líneas y ejecuta:

/*
DELETE FROM auth.users 
WHERE email = 'EMAIL_AQUI@ejemplo.com';
*/

-- O si sabes el ID del usuario:
/*
DELETE FROM auth.users 
WHERE id = 'UUID_AQUI';
*/

-- PASO 4: Verificar que se eliminó
SELECT 
    'Verificación' as tipo,
    email,
    id
FROM auth.users
WHERE email = 'EMAIL_AQUI@ejemplo.com';

-- ============================================
-- ALTERNATIVA: Completar la creación (si prefieres)
-- ============================================
-- Si prefieres completar la creación en lugar de eliminar:

/*
-- 1. Primero encuentra el ID del usuario en auth
SELECT id, email FROM auth.users WHERE email = 'EMAIL_AQUI@ejemplo.com';

-- 2. Luego inserta manualmente en public.users con ese ID
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
    'UUID_DEL_USUARIO',  -- ID obtenido del paso 1
    'EMAIL_AQUI@ejemplo.com',
    'entrenador',  -- o 'estudiante', 'administrador'
    'Nombre',
    'Apellido',
    NULL,  -- fecha_nacimiento (opcional)
    NULL   -- telefono (opcional)
);
*/

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta PASO 1 para ver usuarios huérfanos
-- 2. Identifica el email del usuario problemático
-- 3. Descomenta y ejecuta PASO 3 con el email correcto
-- 4. Intenta crear el usuario nuevamente desde el panel
