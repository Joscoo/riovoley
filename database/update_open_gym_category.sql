-- ============================================
-- UPDATE: Cambiar categorías Juego Sábado/Domingo por Open Gym
-- ============================================
-- Problema: Cambio de modelo de negocio - unificar juegos de fin de semana
-- Solución: Actualizar constraint y migrar datos existentes

-- IMPORTANTE: Ejecuta PRIMERO disable_schedules_rls.sql

-- PASO 1: Ver categorías actuales en schedules
SELECT 
    'Categorías actuales en schedules' as info,
    categoria,
    COUNT(*) as cantidad
FROM public.schedules
GROUP BY categoria
ORDER BY categoria;

-- PASO 2: Actualizar registros existentes
-- Convertir juego_sabado y juego_domingo a open_gym
UPDATE public.schedules
SET categoria = 'open_gym'
WHERE categoria IN ('juego_sabado', 'juego_domingo');

-- PASO 3: Eliminar el constraint antiguo
ALTER TABLE public.schedules 
DROP CONSTRAINT IF EXISTS schedules_categoria_check;

-- PASO 4: Crear nuevo constraint con Open Gym
ALTER TABLE public.schedules
ADD CONSTRAINT schedules_categoria_check 
CHECK (categoria IN (
    'iniciacion_hombres',
    'iniciacion_mujeres',
    'perfeccionamiento_hombres',
    'perfeccionamiento_mujeres',
    'master_mujeres',
    'open_gym'
));

-- PASO 5: Verificar cambios
SELECT 
    'Categorías después de migración' as info,
    categoria,
    COUNT(*) as cantidad,
    ARRAY_AGG(DISTINCT dia_semana) as dias
FROM public.schedules
GROUP BY categoria
ORDER BY categoria;

-- PASO 6: Ver todos los horarios de Open Gym
SELECT 
    'Horarios Open Gym' as info,
    dia_semana,
    hora_inicio,
    hora_fin,
    categoria
FROM public.schedules
WHERE categoria = 'open_gym'
ORDER BY 
    CASE dia_semana
        WHEN 'lunes' THEN 1
        WHEN 'martes' THEN 2
        WHEN 'miercoles' THEN 3
        WHEN 'jueves' THEN 4
        WHEN 'viernes' THEN 5
        WHEN 'sabado' THEN 6
        WHEN 'domingo' THEN 7
    END;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- ✅ Constraint actualizado permitiendo solo: iniciacion_hombres, 
--    iniciacion_mujeres, perfeccionamiento_hombres,
--    perfeccionamiento_mujeres, master_mujeres, open_gym
-- ✅ Registros de juego_sabado y juego_domingo migrados a open_gym
-- ✅ Sistema listo para usar la nueva categoría Open Gym
-- ============================================
