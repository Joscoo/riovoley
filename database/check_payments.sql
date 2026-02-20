-- Script para verificar los pagos en la base de datos
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Contar total de pagos
SELECT 
  'Total de pagos' as info,
  COUNT(*) as cantidad
FROM payments;

-- 2. Ver los últimos 20 pagos registrados
SELECT 
  p.id,
  p.student_id,
  u.nombre,
  u.apellido,
  p.monto,
  p.fecha_inicio,
  p.fecha_fin,
  p.fecha_pago,
  p.estado,
  p.created_at
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN users u ON s.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 3. Verificar pagos por estado
SELECT 
  estado,
  COUNT(*) as cantidad,
  SUM(monto) as total_monto
FROM payments
GROUP BY estado
ORDER BY cantidad DESC;

-- 4. Verificar si hay políticas RLS que podrían estar bloqueando la visualización
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'payments';

-- 5. Verificar permisos de la tabla payments
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'payments';
