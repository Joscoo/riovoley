-- PLAN DE EMERGENCIA: Reconstruir datos de pagos
-- Ejecuta cada sección paso a paso

-- ============================================
-- PASO 1: Verificar si quedan datos en caché o históricos
-- ============================================

-- Buscar en logs de Supabase (últimas 24-48 horas si está disponible)
-- Ve a: Dashboard > Logs > Database

-- ============================================
-- PASO 2: Reconstruir desde información existente
-- ============================================

-- Ver todos los estudiantes activos
SELECT 
  s.id as student_id,
  u.nombre,
  u.apellido,
  u.email,
  s.categoria,
  s.created_at as fecha_registro_estudiante
FROM students s
JOIN users u ON s.user_id = u.id
ORDER BY u.apellido, u.nombre;

-- ============================================
-- PASO 3: Template para recrear pagos manualmente
-- ============================================

-- Usa este template para cada estudiante que pagó
-- Ajusta las fechas y montos según tus registros (recibos, mensajes, etc.)

INSERT INTO payments (
  student_id,
  monto,
  fecha_inicio,
  fecha_fin,
  fecha_pago,
  estado,
  observaciones
) VALUES
  -- Ejemplo: Pago de enero 2026 (ajusta según tus datos reales)
  -- (1, 50.00, '2026-01-01', '2026-01-31', '2026-01-05', 'activo', 'Pago mensualidad enero'),
  -- (2, 50.00, '2026-01-01', '2026-01-31', NULL, 'vencido', 'Pendiente de pago'),
  -- Agrega más filas según tus registros
  (NULL, 0, '2026-01-01', '2026-01-31', NULL, 'activo', 'TEMPLATE - CAMBIAR VALORES');

-- ============================================
-- PASO 4: Si tienes cuotas estándar, generación masiva
-- ============================================

-- Si todos pagan lo mismo mensualmente, puedes generar pagos automáticamente
-- AJUSTA el monto según tu realidad

-- Generar pagos del mes actual para todos los estudiantes activos
INSERT INTO payments (student_id, monto, fecha_inicio, fecha_fin, estado, observaciones)
SELECT 
  s.id,
  50.00 as monto, -- AJUSTA ESTE MONTO
  '2026-02-01'::date as fecha_inicio,
  '2026-02-28'::date as fecha_fin,
  'activo' as estado,
  'Pago mensual febrero 2026' as observaciones
FROM students s
WHERE s.id NOT IN (
  -- Evitar duplicados si ya existen algunos pagos
  SELECT DISTINCT student_id FROM payments WHERE fecha_inicio >= '2026-02-01'
);

-- ============================================
-- PASO 5: Verificación
-- ============================================

-- Verificar pagos insertados
SELECT 
  COUNT(*) as total_pagos,
  estado,
  SUM(monto) as total_monto
FROM payments
GROUP BY estado;

SELECT 
  p.id,
  u.nombre,
  u.apellido,
  p.monto,
  p.fecha_inicio,
  p.fecha_fin,
  p.estado
FROM payments p
JOIN students s ON p.student_id = s.id
JOIN users u ON s.user_id = u.id
ORDER BY p.fecha_inicio DESC
LIMIT 20;
