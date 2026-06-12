alter table profiles.mobile_device_registrations
  add column if not exists last_delivery_status text null,
  add column if not exists last_delivery_error text null,
  add column if not exists last_delivery_attempt_at timestamptz null,
  add column if not exists last_delivery_success_at timestamptz null,
  add column if not exists invalidated_at timestamptz null;

alter table profiles.user_notification_preferences
  add column if not exists payment_registered_enabled boolean not null default true,
  add column if not exists payment_overdue_enabled boolean not null default true,
  add column if not exists attendance_enabled boolean not null default true,
  add column if not exists gamification_enabled boolean not null default true;

create index if not exists idx_mobile_device_registrations_last_delivery_status
  on profiles.mobile_device_registrations(last_delivery_status);
