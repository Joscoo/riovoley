-- Adaptacion post-migracion por esquemas
-- Origen legacy: update_open_gym_category.sql
-- Fecha: 2026-04-27

begin;

-- 1) Migrar datos historicos a la categoria vigente
update training.schedules
set categoria = 'open_gym'
where categoria in ('juego_sabado', 'juego_domingo');

-- 2) Reemplazar constraint de categoria en la tabla real
alter table if exists training.schedules
drop constraint if exists schedules_categoria_check;

alter table if exists training.schedules
add constraint schedules_categoria_check
check (categoria in (
  'iniciacion_hombres',
  'iniciacion_mujeres',
  'perfeccionamiento_hombres',
  'perfeccionamiento_mujeres',
  'master_mujeres',
  'open_gym'
));

commit;

-- Verificacion sugerida:
 select categoria, count(*) as cantidad
 from training.schedules
 group by categoria
 order by categoria;
