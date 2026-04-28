-- Migración: Validaciones para training.physical_tests
-- Fecha: 2026-04-28
-- Objetivos:
-- 1) Asegurar que el alumno tenga al menos 5 años en la fecha del test
-- 2) Ajustar rangos razonables de medidas (mínimos coherentes, máximos por encima
--    de registros profesionales) mediante CHECK constraints

begin;

-- 1) Función que valida la edad del estudiante referente al test
create or replace function training.enforce_physical_test_age()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  birth_date date;
  test_date date;
  age_years int;
begin
  if (new.student_id is null) then
    raise exception 'physical_tests.student_id is required';
  end if;

  select fecha_nacimiento into birth_date
  from core.students
  where id = new.student_id;

  if birth_date is null then
    raise exception 'student % has no fecha_nacimiento', new.student_id;
  end if;

  test_date := coalesce(new.fecha_test, now()::date);
  age_years := date_part('year', age(test_date, birth_date));

  if age_years < 5 then
    raise exception 'student % is % years old at test_date; minimum allowed is 5', new.student_id, age_years;
  end if;

  return new;
end;
$$;

-- 2) Trigger que ejecuta la función antes de insertar o actualizar
drop trigger if exists trg_enforce_physical_test_age on training.physical_tests;
create trigger trg_enforce_physical_test_age
before insert or update on training.physical_tests
for each row execute function training.enforce_physical_test_age();

-- 3) Ajustar constraints de fuerza/métrica: elevar límites superiores
alter table if exists training.physical_tests
  drop constraint if exists check_fuerza_abdomen,
  drop constraint if exists check_fuerza_brazos,
  drop constraint if exists check_fuerza_piernas,
  drop constraint if exists check_elevaciones_barra;

alter table if exists training.physical_tests
  add constraint check_fuerza_abdomen check (fuerza_abdomen is null or (fuerza_abdomen >= 0 and fuerza_abdomen <= 400)),
  add constraint check_fuerza_brazos check (fuerza_brazos is null or (fuerza_brazos >= 0 and fuerza_brazos <= 400)),
  add constraint check_fuerza_piernas check (fuerza_piernas is null or (fuerza_piernas >= 0 and fuerza_piernas <= 600)),
  add constraint check_elevaciones_barra check (elevaciones_barra is null or (elevaciones_barra >= 0 and elevaciones_barra <= 300));

-- 4) Asegurar índice sobre student_id para joins de validación
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'training' and tablename = 'physical_tests' and indexname = 'physical_tests_student_id_idx'
  ) then
    execute 'create index physical_tests_student_id_idx on training.physical_tests (student_id)';
  end if;
end;
$$;

commit;
