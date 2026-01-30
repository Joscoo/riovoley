-- Verificar el rol del usuario actual
SELECT 
    id,
    email,
    role,
    nombre,
    apellido
FROM public.users
WHERE id = auth.uid();

-- Si la consulta anterior no retorna nada, intenta esto:
SELECT 
    auth.uid() as mi_user_id,
    auth.email() as mi_email;

-- Luego busca tu usuario en la tabla
SELECT 
    id,
    email,
    role,
    nombre,
    apellido
FROM public.users
WHERE email = auth.email();
