-- PASO 1: Ver todos los usuarios para identificar quién debería ser admin
SELECT 
    id,
    email,
    role,
    nombre,
    apellido,
    created_at
FROM public.users
ORDER BY created_at ASC
LIMIT 10;

-- PASO 2: Actualizar el rol del usuario que debe ser administrador
-- REEMPLAZA 'tu-email@gmail.com' con el email del usuario que debe ser admin
UPDATE public.users 
SET role = 'administrador' 
WHERE email = 'tu-email@gmail.com';

-- PASO 3: Verificar que se actualizó correctamente
SELECT 
    id,
    email,
    role,
    nombre,
    apellido
FROM public.users
WHERE role = 'administrador';

-- PASO 4: Después de actualizar, cierra sesión en la app y vuelve a iniciar sesión
-- Luego verifica que is_admin() retorna TRUE ejecutando en la app (no aquí):
-- SELECT public.is_admin() as soy_admin;
