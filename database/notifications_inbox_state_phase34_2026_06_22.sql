create table if not exists public.user_notification_inbox_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null,
  notification_category text not null check (notification_category in ('mensualidades', 'anuncios', 'gamificacion', 'general')),
  read_at timestamptz null,
  dismissed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, notification_key)
);

alter table public.user_notification_inbox_state enable row level security;

drop policy if exists "user_notification_inbox_state_select_own" on public.user_notification_inbox_state;
create policy "user_notification_inbox_state_select_own"
on public.user_notification_inbox_state
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_notification_inbox_state_insert_own" on public.user_notification_inbox_state;
create policy "user_notification_inbox_state_insert_own"
on public.user_notification_inbox_state
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_notification_inbox_state_update_own" on public.user_notification_inbox_state;
create policy "user_notification_inbox_state_update_own"
on public.user_notification_inbox_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "user_notification_inbox_state_delete_own" on public.user_notification_inbox_state;
create policy "user_notification_inbox_state_delete_own"
on public.user_notification_inbox_state
for delete
to authenticated
using (auth.uid() = user_id);

create or replace function public.touch_user_notification_inbox_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_notification_inbox_state_updated_at on public.user_notification_inbox_state;
create trigger trg_user_notification_inbox_state_updated_at
before update on public.user_notification_inbox_state
for each row
execute function public.touch_user_notification_inbox_state_updated_at();
