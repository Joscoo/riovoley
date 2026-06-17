-- ==========================================================
-- FIX: Permitir periodos personalizados en pagos manuales
-- Fecha: 2026-06-17
-- ==========================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.apply_payment_membership_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, billing, pg_temp
AS $$
DECLARE
  v_cost numeric(10,2);
  v_should_recompute_period boolean;
  v_start date;
  v_end date;
BEGIN
  IF NEW.student_id IS NULL THEN
    RAISE EXCEPTION 'student_id es obligatorio para registrar pagos';
  END IF;

  IF NEW.membership_type_id IS NULL THEN
    RAISE EXCEPTION 'membership_type_id es obligatorio para registrar pagos';
  END IF;

  NEW.fecha_pago := COALESCE(NEW.fecha_pago, CURRENT_DATE);

  SELECT mt.costo
  INTO v_cost
  FROM billing.membership_types mt
  WHERE mt.id = NEW.membership_type_id
    AND mt.active = true;

  IF v_cost IS NULL THEN
    RAISE EXCEPTION 'El tipo de mensualidad % no existe o esta inactivo', NEW.membership_type_id;
  END IF;

  NEW.monto := COALESCE(NEW.monto, v_cost);

  IF TG_OP = 'INSERT' THEN
    -- Si el cliente envia explicitamente ambas fechas, respetarlas
    IF NEW.fecha_inicio IS NOT NULL AND NEW.fecha_fin IS NOT NULL THEN
      v_should_recompute_period := false;
    ELSE
      v_should_recompute_period := true;
    END IF;
  ELSE
    -- En UPDATE recomputar si cambian los factores, o si anulan las fechas
    v_should_recompute_period :=
      NEW.student_id IS DISTINCT FROM OLD.student_id
      OR NEW.membership_type_id IS DISTINCT FROM OLD.membership_type_id
      OR NEW.fecha_inicio IS NULL
      OR NEW.fecha_fin IS NULL;
  END IF;

  IF v_should_recompute_period THEN
    SELECT p.fecha_inicio, p.fecha_fin
    INTO v_start, v_end
    FROM public.calculate_membership_payment_period(
      NEW.student_id,
      NEW.fecha_pago,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) p;

    NEW.fecha_inicio := v_start;
    NEW.fecha_fin := v_end;
  END IF;

  IF NEW.fecha_fin IS NOT NULL AND NEW.fecha_inicio IS NOT NULL AND NEW.fecha_fin < NEW.fecha_inicio THEN
    RAISE EXCEPTION 'fecha_fin no puede ser menor a fecha_inicio';
  END IF;

  NEW.estado := public.calculate_payment_state(NEW.fecha_fin);

  RETURN NEW;
END;
$$;

COMMIT;
