-- Script SQL para depurar pagos vencidos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Ver pagos vencidos según el cálculo manual
SELECT 
  id,
  student_id,
  fecha_inicio,
  fecha_fin,
  estado,
  fecha_pago,
  monto,
  CASE 
    WHEN fecha_pago IS NOT NULL THEN '✅ YA PAGADO'
    WHEN fecha_fin IS NULL THEN '⚠️ SIN FECHA FIN'
    WHEN DATE(fecha_fin) < CURRENT_DATE THEN '🔴 VENCIDO'
    WHEN DATE(fecha_fin) - CURRENT_DATE <= 5 THEN '🟡 PRÓXIMO A VENCER'
    ELSE '🟢 ACTIVO'
  END AS estado_calculado,
  CASE 
    WHEN fecha_fin IS NOT NULL THEN DATE(fecha_fin) - CURRENT_DATE
    ELSE NULL
  END AS dias_restantes
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL  -- Sin pagar
ORDER BY fecha_fin ASC
LIMIT 20;

-- 2. Contar pagos por estado (según la BD)
SELECT 
  estado,
  COUNT(*) as cantidad,
  SUM(monto) as monto_total
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL
GROUP BY estado;

-- 3. Contar pagos vencidos que necesitan actualización
SELECT 
  COUNT(*) as pagos_necesitan_actualizacion
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL
  AND fecha_fin IS NOT NULL
  AND DATE(fecha_fin) < CURRENT_DATE
  AND (estado IS NULL OR estado != 'vencido');

-- 4. Ver detalles de pagos con estados inconsistentes
SELECT 
  id,
  student_id,
  fecha_fin,
  estado as estado_bd,
  CASE 
    WHEN DATE(fecha_fin) < CURRENT_DATE THEN 'vencido'
    WHEN DATE(fecha_fin) - CURRENT_DATE <= 5 THEN 'proximo_a_vencer'
    ELSE 'activo'
  END AS estado_correcto,
  DATE(fecha_fin) - CURRENT_DATE as dias_restantes
FROM payments
WHERE deleted_at IS NULL
  AND fecha_pago IS NULL
  AND fecha_fin IS NOT NULL
  AND estado != CASE 
    WHEN DATE(fecha_fin) < CURRENT_DATE THEN 'vencido'
    WHEN DATE(fecha_fin) - CURRENT_DATE <= 5 THEN 'proximo_a_vencer'
    ELSE 'activo'
  END
LIMIT 10;

-- 5. Actualizar manualmente los estados (SOLO SI ES NECESARIO)
-- DESCOMENTAR PARA EJECUTAR:
-- UPDATE payments
-- SET estado = CASE 
--   WHEN DATE(fecha_fin) < CURRENT_DATE THEN 'vencido'
--   WHEN DATE(fecha_fin) - CURRENT_DATE <= 5 THEN 'proximo_a_vencer'
--   ELSE 'activo'
-- END
-- WHERE deleted_at IS NULL
--   AND fecha_pago IS NULL
--   AND fecha_fin IS NOT NULL;
