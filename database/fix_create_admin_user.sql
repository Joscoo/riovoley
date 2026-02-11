-- Insertar el usuario actual en la tabla users con rol admin
-- EJECUTA ESTO DESPUÉS de verificar las consultas anteriores

INSERT INTO public.users (
  id,
  email,
  role,
  nombre,
  apellido,
  created_at
)
SELECT 
  au.id,
  au.email,
  'admin' as role,
  'Admin' as nombre,
  'Sistema' as apellido,
  NOW() as created_at
FROM auth.users au
WHERE au.id = auth.uid()
ON CONFLICT (id) DO UPDATE
SET 
  role = 'admin',
  updated_at = NOW();

-- Verifica que se creó correctamente
SELECT 
  id,
  email,
  role,
  nombre,
  apellido
FROM public.users
WHERE id = auth.uid();
