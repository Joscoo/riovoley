-- ============================================================================
-- SCRIPT DE CORRECCIÓN DE FECHAS EN ASISTENCIAS
-- ============================================================================
-- 
-- Problema: Los registros de asistencia se guardaron con fechas incorrectas
-- debido al uso de UTC en lugar de zona horaria de Ecuador (UTC-5).
-- 
-- Este script identifica y corrige registros donde:
-- - La fecha almacenada en 'fecha' no coincide con la fecha real en Ecuador
-- - La hora_entrada (timestamptz) muestra la hora correcta con zona horaria
-- 
-- Autor: Sistema Riovoley
-- Fecha: 2026-02-20
-- ============================================================================

-- PASO 1: IDENTIFICAR REGISTROS CON FECHAS INCORRECTAS
-- ============================================================================

SELECT 
    '📊 ANÁLISIS DE REGISTROS CON FECHAS INCORRECTAS' as titulo;

-- Ver registros donde la fecha no coincide con la fecha real en Ecuador
SELECT 
    a.id,
    s.id as student_id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha as fecha_guardada,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_correcta_ecuador,
    a.hora_entrada,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::time as hora_ecuador,
    CASE 
        WHEN a.fecha != (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date 
        THEN '❌ FECHA INCORRECTA'
        ELSE '✅ Correcta'
    END as estado
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE 
    -- Solo registros donde la fecha no coincide con la fecha en zona horaria Ecuador
    a.fecha != (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date
ORDER BY a.fecha DESC, a.hora_entrada DESC
LIMIT 20;

-- Contar cuántos registros tienen este problema
SELECT 
    '📈 RESUMEN DE REGISTROS AFECTADOS' as titulo,
    COUNT(*) as total_registros_incorrectos,
    MIN(fecha) as fecha_mas_antigua_afectada,
    MAX(fecha) as fecha_mas_reciente_afectada
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;


-- PASO 2: VER EJEMPLOS ESPECÍFICOS POR DÍA
-- ============================================================================

SELECT 
    '📅 REGISTROS INCORRECTOS AGRUPADOS POR FECHA' as titulo;

SELECT 
    fecha as fecha_incorrecta_guardada,
    COUNT(*) as cantidad_registros,
    MIN((hora_entrada AT TIME ZONE 'America/Guayaquil')::time) as primera_hora_real,
    MAX((hora_entrada AT TIME ZONE 'America/Guayaquil')::time) as ultima_hora_real
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
GROUP BY fecha
ORDER BY fecha DESC;


-- PASO 3: CORRECCIÓN DE FECHAS
-- ============================================================================
-- 
-- ⚠️ IMPORTANTE: Revisa los resultados de los PASO 1 y 2 antes de ejecutar esto
-- 
-- Este comando actualizará las fechas incorrectas con la fecha correcta
-- basada en la hora_entrada convertida a zona horaria de Ecuador
-- ============================================================================

/*
-- DESCOMENTAR PARA EJECUTAR LA CORRECCIÓN:

BEGIN;

-- Mostrar lo que se va a actualizar
SELECT 
    '🔧 REGISTROS QUE SERÁN CORREGIDOS' as titulo;

SELECT 
    a.id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha as fecha_actual_incorrecta,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_nueva_correcta,
    a.hora_entrada,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::time as hora_real_ecuador
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.fecha != (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date
ORDER BY a.fecha DESC;

-- Ejecutar la corrección
UPDATE attendances
SET fecha = (hora_entrada AT TIME ZONE 'America/Guayaquil')::date
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Mostrar cuántos registros fueron actualizados
SELECT 
    '✅ CORRECCIÓN COMPLETADA' as resultado,
    COUNT(*) as registros_corregidos
FROM attendances
WHERE fecha = (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Si todo está correcto, confirmar los cambios
COMMIT;

-- Si algo salió mal, deshacer los cambios:
-- ROLLBACK;
*/


-- PASO 4: VERIFICACIÓN POST-CORRECCIÓN
-- ============================================================================
-- Ejecutar esto DESPUÉS de aplicar la corrección para verificar
-- ============================================================================

/*
-- DESCOMENTAR PARA VERIFICAR:

SELECT 
    '🔍 VERIFICACIÓN POST-CORRECCIÓN' as titulo;

-- Debe retornar 0 registros si la corrección fue exitosa
SELECT 
    COUNT(*) as registros_aun_incorrectos
FROM attendances
WHERE fecha != (hora_entrada AT TIME ZONE 'America/Guayaquil')::date;

-- Ver algunos ejemplos de registros corregidos
SELECT 
    a.id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha as fecha_corregida,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date as fecha_ecuador,
    a.hora_entrada,
    (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::time as hora_ecuador,
    '✅ CORRECTO' as estado
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.fecha = (a.hora_entrada AT TIME ZONE 'America/Guayaquil')::date
ORDER BY a.fecha DESC
LIMIT 10;
*/


-- PASO 5: CASOS ESPECIALES - Registros sin hora_entrada
-- ============================================================================
-- Si hay registros sin hora_entrada, necesitan tratamiento especial
-- ============================================================================

SELECT 
    '⚠️ REGISTROS SIN HORA_ENTRADA' as titulo;

SELECT 
    a.id,
    u.nombre || ' ' || u.apellido as atleta,
    a.fecha,
    a.hora_entrada,
    '⚠️ Sin timestamp - no se puede corregir automáticamente' as estado
FROM attendances a
JOIN students s ON a.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE a.hora_entrada IS NULL
ORDER BY a.fecha DESC;


-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Este script IDENTIFICA el problema pero NO corrige automáticamente
--    Debes descomentar la sección de CORRECCIÓN para aplicar los cambios
-- 
-- 2. Se usa BEGIN/COMMIT/ROLLBACK para poder deshacer si algo sale mal
-- 
-- 3. La corrección se basa en convertir hora_entrada a zona horaria Ecuador
--    y extraer solo la fecha
-- 
-- 4. Solo corrige registros donde fecha != fecha_correcta_ecuador
-- 
-- 5. Registros sin hora_entrada (NULL) no pueden ser corregidos automáticamente
--    y requieren revisión manual
-- 
-- ============================================================================

SELECT 
    '✨ SCRIPT COMPLETADO' as resultado,
    'Revisa los resultados antes de ejecutar la corrección' as nota;
