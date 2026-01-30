-- Script para sincronizar roles entre users y user_profiles
-- Fecha: 2026-01-29
-- Razón: Asegurar que todos los usuarios tengan su rol en user_profiles

-- NOTA: El enum user_role_enum tiene estos valores: 'administrador', 'entrenador', 'usuario'
-- Si en la tabla users existe 'estudiante', se mapeará a 'usuario'

-- 1. Crear/actualizar perfiles en user_profiles para todos los usuarios que tienen rol en users
INSERT INTO public.user_profiles (id, full_name, role, created_at)
SELECT 
    u.id,
    TRIM(CONCAT(u.nombre, ' ', u.apellido)) as full_name,
    -- Mapear 'estudiante' a 'usuario' si el enum no lo soporta
    CASE 
        WHEN u.role = 'estudiante' THEN 'usuario'::user_role_enum
        ELSE u.role::user_role_enum
    END as role,
    u.created_at
FROM public.users u
WHERE u.role IS NOT NULL
ON CONFLICT (id) 
DO UPDATE SET 
    role = EXCLUDED.role,
    full_name = CASE 
        WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name != '' 
        THEN EXCLUDED.full_name 
        ELSE public.user_profiles.full_name 
    END;

-- 2. Verificar que todos los perfiles se sincronizaron correctamente
SELECT 
    u.id,
    u.email,
    u.nombre,
    u.apellido,
    u.role as role_en_users,
    up.role::text as role_en_profiles,
    CASE 
        WHEN u.role = up.role::text THEN '✅ Sincronizado'
        WHEN u.role = 'estudiante' AND up.role::text = 'usuario' THEN '✅ Sincronizado (estudiante→usuario)'
        WHEN up.role IS NULL THEN '⚠️ Falta perfil'
        ELSE '❌ Roles diferentes'
    END as estado
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;

-- 3. Contar usuarios por estado de sincronización
SELECT 
    CASE 
        WHEN u.role = up.role::text THEN 'Sincronizados'
        WHEN u.role = 'estudiante' AND up.role::text = 'usuario' THEN 'Sincronizados'
        WHEN up.role IS NULL THEN 'Sin perfil'
        ELSE 'Roles diferentes'
    END as estado,
    COUNT(*) as cantidad
FROM public.users u
LEFT JOIN public.user_profiles up ON u.id = up.id
GROUP BY estado;
