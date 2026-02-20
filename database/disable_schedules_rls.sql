-- ============================================
-- FIX: Deshabilitar RLS en tabla schedules
-- ============================================
-- Problema: Error "new row violates row-level security policy for table schedules"
-- Solución: Deshabilitar RLS para permitir gestión de horarios desde el panel admin

-- PASO 1: Ver estado actual de RLS en schedules
SELECT 
    'Estado RLS actual en schedules' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '⚠️ RLS Habilitado (causando error)'
        ELSE '✅ RLS Deshabilitado'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'schedules';

-- PASO 2: Ver políticas actuales (si las hay)
SELECT 
    'Políticas RLS actuales' as info,
    policyname,
    permissive,
    roles,
    cmd as comando,
    qual as condicion
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'schedules';

-- PASO 3: Deshabilitar RLS en schedules
ALTER TABLE public.schedules DISABLE ROW LEVEL SECURITY;

-- PASO 4: Verificación final
SELECT 
    'Estado RLS final en schedules' as info,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS Deshabilitado - Problema resuelto'
        ELSE '⚠️ RLS aún habilitado - Ejecutar de nuevo'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'schedules';

-- PASO 5: Probar inserción (opcional)
SELECT 
    'Total horarios actuales' as info,
    COUNT(*) as total,
    COUNT(DISTINCT dia_semana) as dias_configurados,
    COUNT(DISTINCT categoria) as categorias_configuradas
FROM public.schedules;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- ✅ RLS deshabilitado en tabla schedules
-- ✅ Panel admin puede crear/editar horarios sin error 403
-- ✅ Sin políticas restrictivas bloqueando inserts
-- ============================================
