-- SQL para agregar campo first_login a la tabla users
-- Ejecutar este script en el SQL Editor de Supabase

-- Agregar la columna first_login a la tabla users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN DEFAULT false;

-- Actualizar usuarios existentes para que no tengan first_login true
UPDATE public.users 
SET first_login = false 
WHERE first_login IS NULL;

-- Comentario: Los nuevos usuarios creados desde AtletasManager 
-- tendrán first_login = true automáticamente