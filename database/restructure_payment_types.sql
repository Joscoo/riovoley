-- ===================================================
-- REESTRUCTURACIÓN DE PAYMENT_TYPES
-- ===================================================
-- Objetivo: Simplificar payment_types para que sea 
-- únicamente un catálogo de MÉTODOS DE PAGO
-- (no tipos de membresía con precio)
-- ===================================================

-- PASO 1: Verificar estructura actual
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payment_types'
ORDER BY ordinal_position;

-- PASO 2: Verificar relaciones existentes
SELECT 
  COUNT(*) as total_pagos_con_tipo,
  payment_type_id
FROM payments
WHERE payment_type_id IS NOT NULL
GROUP BY payment_type_id;

SELECT 
  COUNT(*) as total_asistencias_con_metodo,
  metodo_pago_id
FROM attendances
WHERE metodo_pago_id IS NOT NULL
GROUP BY metodo_pago_id;

-- PASO 3: Limpiar datos existentes en payment_types
-- (ADVERTENCIA: ejecutar con precaución)
TRUNCATE TABLE payment_types RESTART IDENTITY CASCADE;

-- PASO 4: Modificar estructura - hacer precio opcional
-- ya que ahora solo son métodos de pago, no planes con precio fijo
ALTER TABLE payment_types 
ALTER COLUMN precio DROP NOT NULL;

-- Agregar comentario para documentar el propósito
COMMENT ON TABLE payment_types IS 'Catálogo de métodos de pago disponibles (pago diario, mensualidad, tarjeta)';
COMMENT ON COLUMN payment_types.nombre IS 'Nombre del método de pago';
COMMENT ON COLUMN payment_types.descripcion IS 'Descripción del método de pago';
COMMENT ON COLUMN payment_types.precio IS 'Precio de referencia (opcional, puede variar)';

-- PASO 5: Insertar los 3 métodos de pago estándar
INSERT INTO payment_types (nombre, descripcion, precio) VALUES
  ('pago_diario', 'Pago por sesión individual', NULL),
  ('mensualidad', 'Pago mensual', NULL),
  ('tarjeta', 'Pago con tarjeta de entrenamiento', NULL)
ON CONFLICT (nombre) DO NOTHING;

-- PASO 6: Verificar inserción
SELECT * FROM payment_types ORDER BY id;

-- PASO 7: Verificar que las relaciones sigan funcionando
SELECT 
  pt.nombre as metodo_pago,
  COUNT(a.id) as total_asistencias
FROM payment_types pt
LEFT JOIN attendances a ON a.metodo_pago_id = pt.id
GROUP BY pt.id, pt.nombre
ORDER BY pt.id;

-- ===================================================
-- RESULTADO ESPERADO:
-- - payment_types con 3 registros fijos
-- - Campo precio ahora NULL (opcional)
-- - Listo para usar en registro de asistencias
-- ===================================================

-- PASO 8 (OPCIONAL): Si quieres que precio sea completamente removido
-- Descomentar las siguientes líneas:
-- ALTER TABLE payment_types DROP COLUMN IF EXISTS precio;
