-- Script de Diagnóstico Rápido
-- Verificar por qué no cargan datos en la aplicación

-- 1. Verificar si hay datos en las tablas
SELECT 'users' as tabla, COUNT(*) as registros FROM public.users
UNION ALL
SELECT 'students' as tabla, COUNT(*) as registros FROM public.students
UNION ALL
SELECT 'user_profiles' as tabla, COUNT(*) as registros FROM public.user_profiles;

-- 2. Verificar estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'students', 'user_profiles')
ORDER BY tablename;

-- 3. Ver ejemplo de datos en users
SELECT id, email, role, nombre, apellido 
FROM public.users 
LIMIT 5;

-- 4. Ver ejemplo de datos en students
SELECT id, user_id, categoria 
FROM public.students 
LIMIT 5;

-- 5. Verificar relación entre users y students
SELECT 
    s.id as student_id,
    s.user_id,
    u.email,
    u.nombre,
    u.apellido,
    s.categoria
FROM public.students s
LEFT JOIN public.users u ON s.user_id = u.id
LIMIT 5;

-- 6. Verificar políticas RLS activas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('users', 'students')
ORDER BY tablename, policyname;

-- 7. IMPORTANTE: Verificar si la columna password existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
AND column_name = 'password';

-- Si retorna 1 fila, la columna AÚN existe (y puede estar causando problemas)
-- Si retorna 0 filas, la columna fue eliminada correctamente
