-- Adaptacion post-migracion por esquemas
-- Origen legacy: add_physical_test_strength_fields.sql
-- Fecha: 2026-04-27

begin;

alter table if exists training.physical_tests
add column if not exists fuerza_abdomen integer null,
add column if not exists fuerza_brazos integer null,
add column if not exists fuerza_piernas integer null,
add column if not exists elevaciones_barra integer null;

comment on column training.physical_tests.fuerza_abdomen is 'Cantidad de abdominales en un minuto';
comment on column training.physical_tests.fuerza_brazos is 'Cantidad de flexiones de brazo en un minuto';
comment on column training.physical_tests.fuerza_piernas is 'Cantidad de sentadillas en un minuto';
comment on column training.physical_tests.elevaciones_barra is 'Cantidad maxima de elevaciones en barra en un minuto';

alter table if exists training.physical_tests
drop constraint if exists check_fuerza_abdomen,
drop constraint if exists check_fuerza_brazos,
drop constraint if exists check_fuerza_piernas,
drop constraint if exists check_elevaciones_barra;

alter table if exists training.physical_tests
add constraint check_fuerza_abdomen check (fuerza_abdomen is null or (fuerza_abdomen >= 0 and fuerza_abdomen <= 200)),
add constraint check_fuerza_brazos check (fuerza_brazos is null or (fuerza_brazos >= 0 and fuerza_brazos <= 200)),
add constraint check_fuerza_piernas check (fuerza_piernas is null or (fuerza_piernas >= 0 and fuerza_piernas <= 300)),
add constraint check_elevaciones_barra check (elevaciones_barra is null or (elevaciones_barra >= 0 and elevaciones_barra <= 100));

commit;

-- Verificacion sugerida:
-- select column_name
-- from information_schema.columns
-- where table_schema = 'training'
--   and table_name = 'physical_tests'
--   and column_name in ('fuerza_abdomen','fuerza_brazos','fuerza_piernas','elevaciones_barra')
-- order by column_name;
