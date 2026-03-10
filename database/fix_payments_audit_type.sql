-- Corrección: Cambiar tipo de payment_id de BIGINT a UUID en payments_audit
-- Este script corrige el error de tipos al guardar pagos

-- ============================================
-- 1. Deshabilitar el trigger temporalmente
-- ============================================

DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;

-- ============================================
-- 2. Cambiar el tipo de la columna payment_id
-- ============================================

ALTER TABLE payments_audit 
ALTER COLUMN payment_id TYPE UUID USING payment_id::text::uuid;

-- ============================================
-- 3. Actualizar las funciones con el tipo correcto
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_payment(payment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments
  SET deleted_at = NOW()
  WHERE id = payment_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION restore_payment(payment_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments
  SET deleted_at = NULL
  WHERE id = payment_id AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Reactivar el trigger de auditoría
-- ============================================

CREATE TRIGGER payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION audit_payments();

-- ============================================
-- 5. Verificación
-- ============================================

SELECT 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'payments_audit' 
  AND column_name = 'payment_id';

-- Debe mostrar: payment_id | uuid
