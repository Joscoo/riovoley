-- ============================================
-- ADD: Agregar columna descripción a schedules
-- ============================================
-- Problema: Los horarios necesitan descripciones informativas
-- Solución: Agregar columna descripcion y poblarla según categoría

-- PASO 1: Ver estructura actual de schedules
SELECT 
    'Estructura actual de schedules' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'schedules'
ORDER BY ordinal_position;

-- PASO 2: Agregar columna descripcion
ALTER TABLE public.schedules
ADD COLUMN IF NOT EXISTS descripcion text NULL;

-- PASO 3: Poblar descripciones por categoría
UPDATE public.schedules
SET descripcion = CASE categoria
    WHEN 'iniciacion_hombres' THEN 'Perfecto para quienes se inician en el voleibol. Aprende los fundamentos básicos: recepción, saque, golpe de dedos, antebrazo y posicionamiento en cancha. Entrenamiento progresivo y didáctico.'
    WHEN 'iniciacion_mujeres' THEN 'Ideal para principiantes que quieren aprender voleibol desde cero. Desarrolla técnica básica, coordinación y trabajo en equipo en un ambiente motivador y de apoyo constante.'
    WHEN 'perfeccionamiento_hombres' THEN 'Para jugadores con experiencia que buscan mejorar su técnica y táctica de juego. Enfoque en remates, bloqueos, sistemas defensivos y estrategias avanzadas de competición.'
    WHEN 'perfeccionamiento_mujeres' THEN 'Entrenamiento avanzado para jugadoras con bases sólidas. Perfecciona tus habilidades técnicas, lee el juego rival, mejora tu táctica individual y colectiva para competir al máximo nivel.'
    WHEN 'master_mujeres' THEN 'Categoría especial para atletas mayores de 18 años con experiencia previa en voleibol. Mantén tu nivel competitivo, mejora tu condición física y disfruta del juego con compañeras de tu edad y experiencia.'
    WHEN 'open_gym' THEN 'Sesión de juego libre para todos los niveles. Practica lo aprendido, conoce jugadores de diferentes categorías y disfruta partidos recreativos en un ambiente divertido y competitivo.'
    ELSE NULL
END
WHERE descripcion IS NULL;

-- PASO 4: Verificar cambios
SELECT 
    'Horarios con descripción' as info,
    categoria,
    dia_semana,
    hora_inicio,
    hora_fin,
    LEFT(descripcion, 80) as descripcion_preview
FROM public.schedules
ORDER BY categoria, dia_semana;

-- PASO 5: Verificar que todas las categorías tienen descripción
SELECT 
    'Resumen de descripciones' as info,
    categoria,
    COUNT(*) as total_horarios,
    COUNT(descripcion) as con_descripcion,
    CASE 
        WHEN COUNT(*) = COUNT(descripcion) THEN '✅ Todas con descripción'
        ELSE '⚠️ Faltan descripciones'
    END as estado
FROM public.schedules
GROUP BY categoria
ORDER BY categoria;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- ✅ Columna 'descripcion' agregada a tabla schedules
-- ✅ Todas las categorías tienen descripción informativa
-- ✅ Descripciones personalizadas por nivel y objetivo
-- ============================================
