-- ============================================
-- Crear registro en public.users para usuario admin
-- ============================================

-- PASO 1: Ver tu usuario en auth.users
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at ASC
LIMIT 5;

-- PASO 2: Insertar tu usuario admin en public.users
-- REEMPLAZA los valores con los datos de tu usuario
INSERT INTO public.users (
    id,              -- Copia el ID exacto de auth.users (PASO 1)
    email,           -- Tu email de admin
    role,            -- 'administrador'
    nombre,          -- Tu nombre
    apellido,        -- Tu apellido
    telefono,        -- Opcional
    cedula,          -- Opcional
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',  -- ⚠️ REEMPLAZA con el ID real de PASO 1
    'admin@example.com',                      -- ⚠️ REEMPLAZA con tu email
    'administrador',                          -- Rol de administrador
    'Admin',                                  -- ⚠️ Tu nombre
    'Sistema',                                -- ⚠️ Tu apellido
    NULL,                                     -- Teléfono (opcional)
    NULL,                                     -- Cédula (opcional)
    NOW(),
    NOW()
);

-- PASO 3: Verificar que se creó correctamente
SELECT 
    id,
    email,
    role,
    nombre,
    apellido
FROM public.users
WHERE role = 'administrador';

-- PASO 4: También crear registro en user_profiles (si no existe)
INSERT INTO public.user_profiles (
    id,
    role,
    full_name,
    organization_id
)
SELECT 
    u.id,
    'administrador'::user_role_enum,
    u.nombre || ' ' || u.apellido,
    NULL
FROM public.users u
WHERE u.role = 'administrador'
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = u.id
);

-- PASO 5: Verificar ambas tablas
SELECT 'users' as tabla, id, email, role::text as role 
FROM public.users 
WHERE role = 'administrador'
UNION ALL
SELECT 'user_profiles' as tabla, id, NULL as email, role::text as role 
FROM public.user_profiles 
WHERE role = 'administrador';

-- ============================================
-- INSTRUCCIONES:
-- ============================================
-- 1. Ejecuta PASO 1 para ver tu ID y email en auth.users
-- 2. Copia el ID exacto (UUID completo)
-- 3. Modifica PASO 2 con tus datos reales
-- 4. Ejecuta PASO 2, 3, 4 y 5
-- 5. Cierra sesión en la app y vuelve a iniciar sesión
-- 6. Los datos deberían cargar correctamente
-- ============================================
