alter table profiles.mobile_device_registrations
  add column if not exists device_id text null,
  add column if not exists native_version text null,
  add column if not exists native_build text null,
  add column if not exists bundle_version text null,
  add column if not exists bundle_id text null,
  add column if not exists builtin_version text null,
  add column if not exists ota_channel text null,
  add column if not exists updater_plugin_version text null;

create index if not exists idx_mobile_device_registrations_device_id
  on profiles.mobile_device_registrations(user_id, platform, device_id);

create table if not exists profiles.user_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  announcement_enabled boolean not null default true,
  payment_reminders_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace view public.user_notification_preferences as
select * from profiles.user_notification_preferences;

alter table profiles.user_notification_preferences enable row level security;

drop policy if exists "user_notification_preferences_select_own" on profiles.user_notification_preferences;
create policy "user_notification_preferences_select_own"
on profiles.user_notification_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "user_notification_preferences_insert_own" on profiles.user_notification_preferences;
create policy "user_notification_preferences_insert_own"
on profiles.user_notification_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "user_notification_preferences_update_own" on profiles.user_notification_preferences;
create policy "user_notification_preferences_update_own"
on profiles.user_notification_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function profiles.touch_user_notification_preferences_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_user_notification_preferences_updated_at on profiles.user_notification_preferences;
create trigger trg_user_notification_preferences_updated_at
before update on profiles.user_notification_preferences
for each row
execute function profiles.touch_user_notification_preferences_updated_at();

grant select, insert, update, delete on profiles.user_notification_preferences to service_role;
grant select on public.user_notification_preferences to service_role;
revoke all on public.user_notification_preferences from anon, authenticated;
