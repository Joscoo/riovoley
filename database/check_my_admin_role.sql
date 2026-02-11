-- Verificar el rol del usuario actual
SELECT 
  id,
  email,
  role,
  nombre,
  apellido
FROM users
WHERE id = auth.uid();

-- Ver todos los admins
SELECT 
  id,
  email,
  role,
  nombre,
  apellido
FROM users
WHERE role = 'admin';
