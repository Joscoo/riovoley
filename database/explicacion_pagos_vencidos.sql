-- ═══════════════════════════════════════════════════════════════════════════
-- EXPLICACIÓN: ¿Por qué no aparecen pagos vencidos en el dashboard?
-- ═══════════════════════════════════════════════════════════════════════════

-- La fecha actual es: 2026-03-10

-- CONCEPTO IMPORTANTE:
-- Un "pago vencido" solo aplica a pagos que NO han sido pagados todavía.
-- Si un pago tiene fecha_pago (ya fue pagado), NO se muestra como vencido,
-- sin importar si la fecha_fin ya pasó.

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. VER TODOS LOS PAGOS (PAGADOS Y NO PAGADOS)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  id,
  student_id,
  fecha_inicio,
  fecha_fin,
  fecha_pago,
  estado,
  monto,
  CASE 
    WHEN fecha_pago IS NOT NULL THEN '✅ YA PAGADO (no cuenta como vencido)'
    WHEN fecha_fin IS NULL THEN '⚠️ SIN FECHA FIN (no se puede determinar vencimiento)'
    WHEN DATE(fecha_fin) < CURRENT_DATE THEN '🔴 VENCIDO (sin pagar)'
    WHEN DATE(fecha_fin) - CURRENT_DATE <= 5 THEN '🟡 PRÓXIMO A VENCER (sin pagar)'
    ELSE '🟢 ACTIVO (sin pagar)'
  END AS situacion_actual,
  CASE 
    WHEN fecha_fin IS NOT NULL THEN DATE(fecha_fin) - CURRENT_DATE
    ELSE NULL
  END AS dias_restantes_o_vencidos
FROM payments
WHERE deleted_at IS NULL
ORDER BY 
  CASE WHEN fecha_pago IS NULL THEN 0 ELSE 1 END,  -- Sin pagar primero
  fecha_fin ASC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. RESUMEN DE LA SITUACIÓN
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  'Total de pagos' as categoria,
  COUNT(*) as cantidad
FROM payments
WHERE deleted_at IS NULL

UNION ALL

SELECT 
  '✅ Ya pagados (con fecha_pago)' as categoria,
  COUNT(*) as cantidad
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NOT NULL

UNION ALL

SELECT 
  '💰 Sin pagar (fecha_pago NULL)' as categoria,
  COUNT(*) as cantidad
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL

UNION ALL

SELECT 
  '🔴 Sin pagar Y vencidos (fecha_fin vencida)' as categoria,
  COUNT(*) as cantidad
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL
  AND fecha_fin IS NOT NULL
  AND DATE(fecha_fin) < CURRENT_DATE

UNION ALL

SELECT 
  '🟡 Sin pagar Y próximos a vencer (≤5 días)' as categoria,
  COUNT(*) as cantidad
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL
  AND fecha_fin IS NOT NULL
  AND DATE(fecha_fin) >= CURRENT_DATE
  AND DATE(fecha_fin) - CURRENT_DATE <= 5;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. PAGOS QUE SÍ APARECERÍAN COMO VENCIDOS (sin fecha_pago, fecha_fin vencida)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT 
  p.id,
  p.student_id,
  s.categoria,
  u.nombre || ' ' || u.apellido as atleta,
  p.fecha_inicio,
  p.fecha_fin,
  p.monto,
  p.estado,
  CURRENT_DATE - DATE(p.fecha_fin) as dias_vencido
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN users u ON s.user_id = u.id
WHERE p.deleted_at IS NULL
  AND p.fecha_pago IS NULL  -- SIN PAGAR
  AND p.fecha_fin IS NOT NULL
  AND DATE(p.fecha_fin) < CURRENT_DATE  -- VENCIDO
ORDER BY p.fecha_fin ASC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. PARA PROBAR EL SISTEMA: Crear pagos de prueba sin pagar con fechas vencidas
-- ═══════════════════════════════════════════════════════════════════════════

-- IMPORTANTE: Descomenta solo si quieres crear pagos de prueba

-- Ejemplo: Crear un pago vencido hace 5 días (sin fecha_pago)
/*
INSERT INTO payments (student_id, monto, fecha_inicio, fecha_fin, estado, fecha_pago)
SELECT 
  id as student_id,
  35.00 as monto,
  CURRENT_DATE - INTERVAL '35 days' as fecha_inicio,
  CURRENT_DATE - INTERVAL '5 days' as fecha_fin,
  'vencido' as estado,
  NULL as fecha_pago  -- IMPORTANTE: NULL para que aparezca como vencido
FROM students
LIMIT 1;
*/

-- Ejemplo: Crear un pago próximo a vencer en 2 días (sin fecha_pago)
/*
INSERT INTO payments (student_id, monto, fecha_inicio, fecha_fin, estado, fecha_pago)
SELECT 
  id as student_id,
  35.00 as monto,
  CURRENT_DATE - INTERVAL '28 days' as fecha_inicio,
  CURRENT_DATE + INTERVAL '2 days' as fecha_fin,
  'proximo_a_vencer' as estado,
  NULL as fecha_pago  -- IMPORTANTE: NULL para que aparezca como próximo a vencer
FROM students
LIMIT 1;
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- CONCLUSIÓN:
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Si no ves pagos vencidos en el dashboard, es porque actualmente TODOS los 
-- pagos en la base de datos tienen fecha_pago (ya fueron pagados).
--
-- Un pago solo se considera "vencido" si:
-- 1. NO tiene fecha_pago (fecha_pago IS NULL)
-- 2. Tiene fecha_fin vencida (fecha_fin < CURRENT_DATE)
-- 3. NO está eliminado (deleted_at IS NULL)
--
-- Esto es el comportamiento correcto del sistema.
-- ═══════════════════════════════════════════════════════════════════════════
