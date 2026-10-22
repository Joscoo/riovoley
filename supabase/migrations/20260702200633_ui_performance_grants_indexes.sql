-- RioVoley UI performance and Data API compatibility.
-- Safe to run repeatedly: only grants and concurrent-read indexes are added.

-- Public schedules and student/admin screens depend on the compatibility view.
-- The catalog does not contain PII; expose SELECT explicitly for the Supabase
-- Data API grant model introduced in 2026.
grant select on public.training_categories to anon, authenticated;

-- Keep direct table grants explicit as well. The table is in the training
-- schema, so this does not expose it through the Data API unless the schema is
-- configured as exposed.
grant usage on schema training to anon, authenticated;
grant select on training.training_categories to anon, authenticated;

drop policy if exists "Training categories can be read" on training.training_categories;
create policy "Training categories can be read"
  on training.training_categories
  for select
  to anon, authenticated
  using (true);

-- Dashboard, payments and student profile payment coverage.
create index if not exists idx_billing_payments_student_dates_active
  on billing.payments (student_id, fecha_inicio desc, fecha_fin desc)
  where deleted_at is null;

create index if not exists idx_billing_payments_fecha_pago_active
  on billing.payments (fecha_pago desc)
  where deleted_at is null and fecha_pago is not null;

create index if not exists idx_billing_payments_estado_active
  on billing.payments (estado, fecha_fin desc)
  where deleted_at is null;

-- Attendance reports, dashboards and student monthly attendance summaries.
create index if not exists idx_training_attendances_student_fecha
  on training.attendances (student_id, fecha desc);

create index if not exists idx_training_attendances_fecha_payment_type
  on training.attendances (fecha desc, metodo_pago_id);

-- User management filters and sorting.
create index if not exists idx_core_users_role_suspended_apellido
  on core.users (role, suspended, apellido);

create index if not exists idx_core_users_apellido_nombre
  on core.users (apellido, nombre);

-- Public schedule listing and management filters.
create index if not exists idx_training_schedules_day_time_category
  on training.schedules (dia_semana, hora_inicio, categoria);

select pg_notify('pgrst', 'reload schema');
