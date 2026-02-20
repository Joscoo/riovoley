-- ============================================================================
-- CORRECCIÓN RÁPIDA DE FECHAS EN ASISTENCIAS
-- ============================================================================
-- Script simplificado para corregir fechas de asistencias en una sola ejecución
-- ============================================================================

-- OPCIÓN 1: SOLO VER EL PROBLEMA (Sin hacer cambios)
-- ============================================================================
-- Ejecuta esto primero para ver cuántos registros están afectados

SELECT 
    '📊 RESUMEN DE REGISTROS AFECTADOS' as titulo;

SELECT 
    COUNT(*) as total_incorrectos,
    COUNT(*) FILTER (WHERE (hora_entrada AT TIME ZONE 'America/Guayaquil')::time >= '19:00:00') as registros_despues_7pm
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Ver algunos ejemplos
SELECT 
    fecha as fecha_incorrecta,
    (hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_correcta,
    (hora_entrada AT TIME ZONE 'America/Guayaquil')::time as hora_real,
    COUNT(*) as cantidad
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
GROUP BY fecha, (hora_entrada AT TIME ZONE 'America/Guayaquil')::date, (hora_entrada AT TIME ZONE 'America/Guayaquil')::time
ORDER BY fecha DESC
LIMIT 10;


-- ============================================================================
-- OPCIÓN 2: CORREGIR TODO (Ejecutar después de revisar Opción 1)
-- ============================================================================
-- ⚠️ DESCOMENTAR TODO ESTE BLOQUE PARA EJECUTAR LA CORRECCIÓN:

/*
DO $$ 
DECLARE 
    v_count integer;
BEGIN
    -- Hacer la corrección
    UPDATE attendances
    SET fecha = (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
    WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;
    
    -- Obtener cuántos fueron actualizados
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Mostrar resultado
    RAISE NOTICE '✅ Corrección completada: % registros actualizados', v_count;
END $$;

-- Verificar que todo está correcto (debe retornar 0)
SELECT 
    '🔍 VERIFICACIÓN' as titulo,
    COUNT(*) as registros_aun_incorrectos
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Mostrar algunos ejemplos corregidos
SELECT 
    '✅ EJEMPLOS DE REGISTROS CORREGIDOS' as titulo;

SELECT 
    a.fecha,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_ecuador,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::time as hora_real,
    COUNT(*) as cantidad
FROM attendances a
WHERE a.fecha = (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date
  AND a.fecha >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY a.fecha, (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date, (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::time
ORDER BY a.fecha DESC
LIMIT 10;
*/
