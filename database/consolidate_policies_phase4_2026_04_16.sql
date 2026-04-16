-- Fase P3 - Consolidacion de policies redundantes
-- Fecha: 2026-04-16
-- Objetivo:
--   Eliminar policies duplicadas o solapadas que no agregan proteccion adicional,
--   manteniendo el comportamiento de autorizacion.
--
-- Criterio:
--   Donde existe policy FOR ALL con mismo predicado, se elimina policy FOR SELECT redundante.
--   Donde existen policies duplicadas de ownership con mismo predicado, se conserva nomenclatura "Users can ...".

begin;

-- =========================
-- core.students
-- =========================
-- Duplicadas de ownership (mismo predicado que Users can ...)
drop policy if exists "Students can be read" on core.students;
drop policy if exists "Students can be inserted" on core.students;
drop policy if exists "Students can be updated" on core.students;
drop policy if exists "Students can be deleted" on core.students;

-- Admin/trainer FOR SELECT redundantes frente a FOR ALL
drop policy if exists "Admins can view all students" on core.students;
drop policy if exists "Admins can manage all students" on core.students;
drop policy if exists "Trainers can view all students" on core.students;

-- =========================
-- billing.payments
-- =========================
-- FOR SELECT redundantes frente a FOR ALL
 drop policy if exists "Admins can view all payments" on billing.payments;
drop policy if exists "Trainers can view all payments" on billing.payments;

-- =========================
-- training.attendances
-- =========================
-- FOR SELECT redundantes frente a FOR ALL
 drop policy if exists "Admins can view all attendances" on training.attendances;
drop policy if exists "Trainers can view all attendances" on training.attendances;

-- =========================
-- training.physical_tests
-- =========================
-- FOR SELECT redundantes frente a FOR ALL
 drop policy if exists "Admins can view all physical_tests" on training.physical_tests;
drop policy if exists "Trainers can view all physical_tests" on training.physical_tests;

commit;

-- Verificacion sugerida post-ejecucion
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname in ('core','billing','training')
--   and tablename in ('students','payments','attendances','physical_tests')
-- order by schemaname, tablename, policyname;
