-- Fase 9 (2026-04-20)
-- Objetivo: reforzar fecha_nacimiento en students para evitar fechas futuras
-- y asegurar edad minima de 5 anos para nuevos registros/actualizaciones.
--
-- Fuente de verdad operativa: README_DATABASE.md
-- Prioridad de tabla: core.students (esquema migrado)
-- Fallback: public.students (si no existe core.students en otro entorno)

-- 1) Diagnostico de filas fuera de regla (ejecutar antes de VALIDATE).
-- SELECT id, user_id, fecha_nacimiento
-- FROM core.students
-- WHERE fecha_nacimiento IS NULL
--    OR fecha_nacimiento > CURRENT_DATE
--    OR fecha_nacimiento > (CURRENT_DATE - INTERVAL '5 years');

DO $$
BEGIN
  IF to_regclass('core.students') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE core.students DROP CONSTRAINT IF EXISTS students_fecha_nacimiento_min_5_check';
    EXECUTE '
      ALTER TABLE core.students
      ADD CONSTRAINT students_fecha_nacimiento_min_5_check
      CHECK (
        fecha_nacimiento IS NOT NULL
        AND fecha_nacimiento <= CURRENT_DATE
        AND fecha_nacimiento <= (CURRENT_DATE - INTERVAL ''5 years'')
      ) NOT VALID
    ';
  ELSIF to_regclass('public.students') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public'
         AND c.relname = 'students'
         AND c.relkind = 'r'
     ) THEN
    EXECUTE 'ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_fecha_nacimiento_min_5_check';
    EXECUTE '
      ALTER TABLE public.students
      ADD CONSTRAINT students_fecha_nacimiento_min_5_check
      CHECK (
        fecha_nacimiento IS NOT NULL
        AND fecha_nacimiento <= CURRENT_DATE
        AND fecha_nacimiento <= (CURRENT_DATE - INTERVAL ''5 years'')
      ) NOT VALID
    ';
  ELSE
    RAISE NOTICE 'No se encontro una tabla base students en core/public. No se aplico constraint.';
  END IF;
END
$$;

-- 2) Validar constraint cuando no haya datos fuera de regla.
-- ALTER TABLE core.students VALIDATE CONSTRAINT students_fecha_nacimiento_min_5_check;
