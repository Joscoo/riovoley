-- Script de Verificación de Roles
-- Ejecutar en Supabase SQL Editor para verificar el estado de los roles

-- 1. Ver todos los usuarios y sus roles en ambas tablas
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.apellido,
    u.role as "Rol en users",
    up.role::text as "Rol en user_profiles",
    CASE 
        WHEN u.role = up.role::text THEN '✅ Sincronizado'
        WHEN u.role = 'estudiante' AND up.role::text = 'usuario' THEN '✅ Sincronizado (estudiante→usuario)'
        WHEN up.role IS NULL THEN '⚠️ Sin perfil'
        WHEN u.role IS NULL THEN '⚠️ Sin rol en users'
        ELSE '❌ DIFERENTE'
    END as "Estado",
    u.created_at as "Fecha Creación"
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;

-- 2. Encontrar usuarios con roles diferentes entre tablas
SELECT 
    u.id,
    u.email,
    u.role as "users.role",
    up.role::text as "user_profiles.role"
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
WHERE (u.role != up.role::text AND NOT (u.role = 'estudiante' AND up.role::text = 'usuario'))
   OR (u.role IS NOT NULL AND up.role IS NULL)
ORDER BY u.email;

-- 3. Estadísticas de sincronización
SELECT 
    CASE 
        WHEN u.role = up.role::text THEN 'Sincronizados'
        WHEN u.role = 'estudiante' AND up.role::text = 'usuario' THEN 'Sincronizados (estudiante→usuario)'
        WHEN up.role IS NULL THEN 'Sin perfil en user_profiles'
        WHEN u.role IS NULL THEN 'Sin rol en users'
        ELSE 'Roles diferentes'
    END as estado,
    COUNT(*) as cantidad,
    ARRAY_AGG(u.email) as emails
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
GROUP BY estado
ORDER BY cantidad DESC;

-- 4. Ver historial de cambios recientes en users (si existe updated_at)
SELECT 
    u.id,
    u.email,
    u.role,
    u.updated_at,
    u.created_at
FROM public.users u
WHERE u.updated_at IS NOT NULL
ORDER BY u.updated_at DESC
LIMIT 10;

-- 5. Buscar un usuario específico por email (REEMPLAZA 'email@ejemplo.com')
-- Descomenta y reemplaza el email:
/*
SELECT 
    'users' as tabla,
    u.id,
    u.email,
    u.role,
    u.nombre,
    u.apellido
FROM public.users u
WHERE u.email = 'email@ejemplo.com'
UNION ALL
SELECT 
    'user_profiles' as tabla,
    up.id,
    (SELECT email FROM public.users WHERE id = up.id) as email,
    up.role,
    up.full_name as nombre,
    NULL as apellido
FROM public.user_profiles up
WHERE up.id = (SELECT id FROM public.users WHERE email = 'email@ejemplo.com');
*/

-- 6. Forzar sincronización de UN usuario específico (REEMPLAZA el email)
-- Descomenta y reemplaza el email:
/*
INSERT INTO public.user_profiles (id, full_name, role, created_at)
SELECT 
    u.id,
    TRIM(CONCAT(u.nombre, ' ', u.apellido)) as full_name,
    u.role::user_role_enum,
    NOW()
FROM public.users u
WHERE u.email = 'email@ejemplo.com'
ON CONFLICT (id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;
*/

-- 7. Ver si el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_sync_user_profile'
   OR event_object_table = 'users';
