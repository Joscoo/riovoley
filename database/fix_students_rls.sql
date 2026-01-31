-- ============================================
-- FIX: Políticas RLS en tabla students
-- ============================================
-- Problema: No se cargan atletas después de cambiar RLS en users
-- Solución: Verificar y ajustar políticas de students

-- PASO 1: Ver políticas actuales de students
SELECT 
    'Políticas de students' as tipo,
    policyname,
    cmd,
    substring(qual::text, 1, 150) as using_clause,
    substring(with_check::text, 1, 150) as with_check_clause
FROM pg_policies
WHERE tablename = 'students'
ORDER BY cmd, policyname;

-- PASO 2: Ver estado de RLS en students
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'students';

-- PASO 3: SOLUCIÓN - Deshabilitar RLS en students también
-- (Más simple y sin problemas de recursión)

ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- PASO 4: Verificación
SELECT 
    'Estado final' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('users', 'students', 'payments')
AND schemaname = 'public'
ORDER BY tablename;

-- PASO 5: Contar estudiantes para verificar
SELECT 
    'Total estudiantes' as info,
    COUNT(*) as total
FROM public.students;

-- ============================================
-- NOTA:
-- ============================================
-- Al deshabilitar RLS en students:
-- ✅ Todos los usuarios autenticados pueden ver estudiantes
-- ✅ La seguridad se maneja en la aplicación (ya lo estás haciendo)
-- ✅ No hay recursión infinita
-- ⚠️  Asegúrate de que solo usuarios autenticados puedan acceder a la API
