begin;

create table if not exists gamification.currency_wallets (
  student_id uuid primary key references core.students(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0),
  total_earned integer not null default 0 check (total_earned >= 0),
  total_spent integer not null default 0 check (total_spent >= 0),
  last_synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.currency_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  source_type text not null,
  source_ref text,
  coins_delta integer not null,
  label text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gamification_currency_ledger_student_id_occurred_at_idx
  on gamification.currency_ledger(student_id, occurred_at desc);

alter table gamification.currency_wallets enable row level security;
alter table gamification.currency_ledger enable row level security;

drop policy if exists gamification_currency_wallets_read on gamification.currency_wallets;
create policy gamification_currency_wallets_read
on gamification.currency_wallets
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = currency_wallets.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_currency_wallets_write on gamification.currency_wallets;
create policy gamification_currency_wallets_write
on gamification.currency_wallets
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

drop policy if exists gamification_currency_ledger_read on gamification.currency_ledger;
create policy gamification_currency_ledger_read
on gamification.currency_ledger
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = currency_ledger.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_currency_ledger_write on gamification.currency_ledger;
create policy gamification_currency_ledger_write
on gamification.currency_ledger
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

grant usage on schema gamification to authenticated;
grant select on gamification.currency_wallets, gamification.currency_ledger to authenticated;
grant insert, update, delete on gamification.currency_wallets, gamification.currency_ledger to authenticated;

create or replace view public.gamification_currency_wallets
with (security_invoker = true) as
select * from gamification.currency_wallets;

create or replace view public.gamification_currency_ledger
with (security_invoker = true) as
select * from gamification.currency_ledger;

grant select on public.gamification_currency_wallets, public.gamification_currency_ledger to authenticated;

commit;
