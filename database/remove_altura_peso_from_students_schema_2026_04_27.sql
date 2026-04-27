-- Adaptacion post-migracion por esquemas
-- Origen legacy: remove_altura_peso_from_students.sql
-- Fecha: 2026-04-27

begin;

alter table if exists core.students
drop column if exists altura,
drop column if exists peso;

commit;

-- Verificacion sugerida:
 select column_name
 from information_schema.columns
 where table_schema = 'core'
   and table_name = 'students'
   and column_name in ('altura','peso');
