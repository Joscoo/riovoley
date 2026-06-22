-- Phase 33: definiciones adicionales para reportes persistidos
-- Agrega reportes financieros y snapshot de estudiantes al modulo de reporting.

insert into public.report_definitions (
  code,
  name,
  description,
  renderer,
  source_kind,
  timezone,
  schedule_time,
  is_active
)
values
  (
    'attendance_daily',
    'Reporte diario de asistencias',
    'PDF persistido con asistencias del dia, metodo de pago y estado de mensualidad.',
    'pdf',
    'attendances_daily',
    'America/Guayaquil',
    null,
    true
  ),
  (
    'financial_monthly_summary',
    'Reporte financiero mensual',
    'PDF persistido con ingresos por mensualidades, pagos diarios, tendencia y cartera vencida.',
    'pdf',
    'financial_monthly_summary',
    'America/Guayaquil',
    null,
    true
  ),
  (
    'student_roster_snapshot',
    'Snapshot de padron estudiantil',
    'PDF persistido con listado de estudiantes, categoria, contacto y estado administrativo.',
    'pdf',
    'student_roster_snapshot',
    'America/Guayaquil',
    null,
    true
  )
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  renderer = excluded.renderer,
  source_kind = excluded.source_kind,
  timezone = excluded.timezone,
  schedule_time = excluded.schedule_time,
  is_active = excluded.is_active;
