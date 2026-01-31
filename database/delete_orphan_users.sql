-- ============================================
-- ELIMINAR Usuarios Huérfanos de Auth
-- ============================================
-- Estos usuarios existen en auth.users pero NO en public.users

-- Eliminar los 3 usuarios huérfanos identificados
DELETE FROM auth.users 
WHERE id IN (
    'b3b6b730-a127-4c56-8b21-a46796283ca5',
    'db599bf5-166b-460f-83cf-fe2699c6f4bc',
    '5f382a36-b6bf-44f8-8f4a-2e4f53f0ad67'
);

-- Verificar que se eliminaron
SELECT 
    'Usuarios huérfanos restantes' as tipo,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ORDER BY au.created_at DESC;
