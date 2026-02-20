-- Script para intentar recuperar datos de pagos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Verificar si hay triggers que podrían haber eliminado datos
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'payments';

-- 2. Verificar logs de actividad reciente (si tienes extensión pgaudit)
-- Esto solo funciona si tienes logging habilitado

-- 3. Ver estructura actual de la tabla payments
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'payments'
ORDER BY ordinal_position;

-- 4. Verificar si hay puntos de restauración disponibles
-- En Supabase, ve a Database > Backups para restaurar desde un backup

-- 5. Si tienes datos de respaldo, usa este template para insertar:
-- TEMPLATE - NO EJECUTAR TODAVÍA
/*
INSERT INTO payments (
  student_id,
  monto,
  fecha_inicio,
  fecha_fin,
  fecha_pago,
  estado,
  observaciones,
  created_at
) VALUES
  -- Agrega tus datos aquí
  (1, 50.00, '2026-01-01', '2026-01-31', NULL, 'activo', 'Pago enero', NOW());
*/

-- 6. Verificar si hay datos en otras tablas relacionadas que permitan reconstruir
SELECT 
  'students' as tabla,
  COUNT(*) as registros
FROM students
UNION ALL
SELECT 
  'users' as tabla,
  COUNT(*) as registros
FROM users
UNION ALL
SELECT 
  'attendances' as tabla,
  COUNT(*) as registros
FROM attendances;
