-- Agregar nuevos campos de fuerza a la tabla physical_tests
-- Migración para tests físicos existentes
-- Fecha: 2026-01-21

-- Agregar campos de fuerza muscular
ALTER TABLE public.physical_tests
ADD COLUMN IF NOT EXISTS fuerza_abdomen INTEGER NULL,
ADD COLUMN IF NOT EXISTS fuerza_brazos INTEGER NULL,
ADD COLUMN IF NOT EXISTS fuerza_piernas INTEGER NULL,
ADD COLUMN IF NOT EXISTS elevaciones_barra INTEGER NULL;

-- Agregar comentarios para documentar los campos
COMMENT ON COLUMN public.physical_tests.fuerza_abdomen IS 'Cantidad de abdominales en un minuto';
COMMENT ON COLUMN public.physical_tests.fuerza_brazos IS 'Cantidad de flexiones de brazo en un minuto';
COMMENT ON COLUMN public.physical_tests.fuerza_piernas IS 'Cantidad de sentadillas en un minuto';
COMMENT ON COLUMN public.physical_tests.elevaciones_barra IS 'Cantidad máxima de elevaciones en barra en un minuto';

-- Agregar restricciones de validación (valores razonables)
ALTER TABLE public.physical_tests
ADD CONSTRAINT check_fuerza_abdomen CHECK (fuerza_abdomen IS NULL OR (fuerza_abdomen >= 0 AND fuerza_abdomen <= 200)),
ADD CONSTRAINT check_fuerza_brazos CHECK (fuerza_brazos IS NULL OR (fuerza_brazos >= 0 AND fuerza_brazos <= 200)),
ADD CONSTRAINT check_fuerza_piernas CHECK (fuerza_piernas IS NULL OR (fuerza_piernas >= 0 AND fuerza_piernas <= 300)),
ADD CONSTRAINT check_elevaciones_barra CHECK (elevaciones_barra IS NULL OR (elevaciones_barra >= 0 AND elevaciones_barra <= 100));
