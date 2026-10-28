-- PROPUESTA PARA REVISIÓN. NO APLICADA A NINGÚN BACKEND EN ESTA AUDITORÍA.
-- Requiere autorización explícita para cambios de funciones/permisos.
-- Base observada: billing.payments.id UUID; revisar definiciones/ACL actuales antes de aplicar.
-- No sustituye el tratamiento separado de la integridad de XP, wallet y recompensas.
-- Tampoco cierra UPDATE directo/REST de pagos: requiere revisión coordinada de RLS y callers.
-- BORRADOR NO LISTO PARA APLICAR: validar/resolver ambigüedad PostgREST UUID/bigint.
BEGIN;

CREATE OR REPLACE FUNCTION public.soft_delete_payment(payment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $body$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM core.users u WHERE u.id = auth.uid()
      AND u.role IN ('administrador', 'entrenador')
      AND NOT COALESCE(u.suspended, false)
  ) THEN RAISE EXCEPTION 'Operación reservada al personal autorizado' USING ERRCODE = '42501'; END IF;
  UPDATE billing.payments p SET deleted_at = pg_catalog.now()
    WHERE p.id = payment_id AND p.deleted_at IS NULL;
  RETURN FOUND;
END;
$body$;

CREATE OR REPLACE FUNCTION public.restore_payment(payment_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $body$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM core.users u WHERE u.id = auth.uid()
      AND u.role IN ('administrador', 'entrenador')
      AND NOT COALESCE(u.suspended, false)
  ) THEN RAISE EXCEPTION 'Operación reservada al personal autorizado' USING ERRCODE = '42501'; END IF;
  UPDATE billing.payments p SET deleted_at = NULL
    WHERE p.id = payment_id AND p.deleted_at IS NOT NULL;
  RETURN FOUND;
END;
$body$;

-- Las firmas bigint de la instantánea comparaban bigint con una PK UUID.
-- Se conserva la firma, pero se rechaza expresamente el identificador obsoleto.
CREATE OR REPLACE FUNCTION public.soft_delete_payment(payment_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $body$
BEGIN
  RAISE EXCEPTION 'Identificador legado no admitido; utilizar la firma UUID' USING ERRCODE = '22023';
END;
$body$;
CREATE OR REPLACE FUNCTION public.restore_payment(payment_id bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $body$
BEGIN
  RAISE EXCEPTION 'Identificador legado no admitido; utilizar la firma UUID' USING ERRCODE = '22023';
END;
$body$;

REVOKE EXECUTE ON FUNCTION public.soft_delete_payment(uuid), public.restore_payment(uuid),
  public.soft_delete_payment(bigint), public.restore_payment(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_payment(uuid), public.restore_payment(uuid) TO authenticated;

COMMIT;
