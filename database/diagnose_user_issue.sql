-- 1. Ver tu usuario actual de Auth
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE id = auth.uid();

-- 2. Ver TODOS los usuarios en la tabla public.users
SELECT 
  id,
  email,
  role,
  nombre,
  apellido
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver si existe algún admin
SELECT 
  id,
  email,
  role,
  nombre,
  apellido
FROM public.users
WHERE role = 'admin';
