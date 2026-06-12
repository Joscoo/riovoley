create or replace view public.mobile_device_registrations as
select * from profiles.mobile_device_registrations;

create or replace view public.user_notification_preferences as
select * from profiles.user_notification_preferences;

grant select, insert, update, delete on public.mobile_device_registrations to service_role;
grant select, insert, update, delete on public.user_notification_preferences to service_role;

revoke all on public.mobile_device_registrations from anon, authenticated;
revoke all on public.user_notification_preferences from anon, authenticated;
