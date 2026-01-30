-- Script para agregar 'estudiante' al enum user_role_enum
-- O para normalizar todos los roles de 'estudiante' a 'usuario'

-- OPCIÓN 1: Agregar 'estudiante' al enum (RECOMENDADO)
-- Esto permite mantener la distinción entre estudiante y usuario
ALTER TYPE user_role_enum ADD VALUE IF NOT EXISTS 'estudiante';

-- Verificar que se agregó correctamente
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role_enum')
ORDER BY enumsortorder;

-- NOTA: Si prefieres OPCIÓN 2 (normalizar todo a 'usuario'), 
-- comenta la línea de ALTER TYPE arriba y descomenta las siguientes:

/*
-- OPCIÓN 2: Convertir todos los 'estudiante' a 'usuario' en la tabla users
UPDATE public.users 
SET role = 'usuario' 
WHERE role = 'estudiante';

-- Verificar el cambio
SELECT role, COUNT(*) as cantidad
FROM public.users
GROUP BY role
ORDER BY role;
*/
