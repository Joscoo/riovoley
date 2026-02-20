-- Sistema de SOFT DELETE y Protección de Datos
-- Ejecuta esto para proteger tus datos en el futuro

-- ============================================
-- 1. Añadir campo deleted_at para soft delete
-- ============================================

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- ============================================
-- 2. Crear índice para consultas eficientes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_deleted_at 
ON payments(deleted_at) 
WHERE deleted_at IS NULL;

-- ============================================
-- 3. Crear tabla de auditoría
-- ============================================

CREATE TABLE IF NOT EXISTS payments_audit (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT,
  action VARCHAR(10), -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_payments_audit_payment_id 
ON payments_audit(payment_id);

CREATE INDEX IF NOT EXISTS idx_payments_audit_changed_at 
ON payments_audit(changed_at DESC);

-- ============================================
-- 4. Crear función de auditoría
-- ============================================

CREATE OR REPLACE FUNCTION audit_payments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO payments_audit (payment_id, action, old_data, changed_by)
    VALUES (OLD.id, 'DELETE', to_jsonb(OLD), auth.uid());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO payments_audit (payment_id, action, old_data, new_data, changed_by)
    VALUES (OLD.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO payments_audit (payment_id, action, new_data, changed_by)
    VALUES (NEW.id, 'INSERT', to_jsonb(NEW), auth.uid());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Activar trigger de auditoría
-- ============================================

DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;

CREATE TRIGGER payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION audit_payments();

-- ============================================
-- 6. Crear vista para pagos activos (no eliminados)
-- ============================================

CREATE OR REPLACE VIEW payments_active AS
SELECT * FROM payments
WHERE deleted_at IS NULL;

-- ============================================
-- 7. Crear función para soft delete
-- ============================================

CREATE OR REPLACE FUNCTION soft_delete_payment(payment_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments
  SET deleted_at = NOW()
  WHERE id = payment_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Crear función para restaurar pagos
-- ============================================

CREATE OR REPLACE FUNCTION restore_payment(payment_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payments
  SET deleted_at = NULL
  WHERE id = payment_id AND deleted_at IS NOT NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. Otorgar permisos
-- ============================================

GRANT SELECT ON payments_audit TO authenticated;
GRANT SELECT ON payments_active TO authenticated;

-- ============================================
-- 10. Verificación
-- ============================================

-- Ver estructura actualizada de payments
\d payments

-- Ver que el trigger está activo
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'payments';

-- Verificar tabla de auditoría
SELECT COUNT(*) as audit_records FROM payments_audit;
