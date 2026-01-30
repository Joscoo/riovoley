-- ============================================
-- FIX: Quitar restricción NOT NULL de password antes de eliminarla
-- ============================================

-- PASO 1: Quitar restricción NOT NULL de la columna password
ALTER TABLE public.users 
ALTER COLUMN password DROP NOT NULL;

-- PASO 2: Ahora insertar tu usuario admin (con password NULL)
INSERT INTO public.users (
    id,
    email,
    role,
    nombre,
    apellido,
    telefono,
    cedula,
    created_at,
    updated_at
) VALUES (
    'ed007c47-be26-4df4-9395-0b67664b66a4',
    'jose.bo2002@outlook.com',
    'administrador',
    'Jose',
    'Bonilla',
    '0960680788',
    NULL,
    NOW(),
    NOW()
);

-- PASO 3: Verificar que se creó
SELECT 
    id,
    email,
    role,
    nombre,
    apellido
FROM public.users
WHERE id = 'ed007c47-be26-4df4-9395-0b67664b66a4';

-- PASO 4: Crear en user_profiles también
INSERT INTO public.user_profiles (
    id,
    role,
    full_name,
    organization_id
)
VALUES (
    'ed007c47-be26-4df4-9395-0b67664b66a4',
    'administrador'::user_role_enum,
    'Jose Bonilla',
    NULL
)
ON CONFLICT (id) DO UPDATE
SET role = 'administrador'::user_role_enum;

-- PASO 5: Ahora ELIMINAR la columna password completamente (seguridad)
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- PASO 6: Verificar que se eliminó
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'password';
-- Debe retornar 0 filas

-- PASO 7: Verificar que tu usuario está completo
SELECT 'users' as tabla, id, email, role::text as role 
FROM public.users 
WHERE id = 'ed007c47-be26-4df4-9395-0b67664b66a4'
UNION ALL
SELECT 'user_profiles' as tabla, id, NULL as email, role::text as role 
FROM public.user_profiles 
WHERE id = 'ed007c47-be26-4df4-9395-0b67664b66a4';
