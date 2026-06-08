begin;

create table if not exists gamification.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  source_type text not null,
  source_ref text,
  xp_delta integer not null,
  label text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists gamification_xp_ledger_student_id_occurred_at_idx
  on gamification.xp_ledger(student_id, occurred_at desc);

create table if not exists gamification.login_rewards (
  user_id uuid primary key references core.users(id) on delete cascade,
  reward_date date not null,
  reward_count integer not null default 1,
  updated_at timestamptz not null default now()
);

grant usage on schema gamification to authenticated;
grant usage on schema gamification to anon;

grant select, insert, update, delete on gamification.xp_ledger to authenticated;
grant select, insert, update on gamification.login_rewards to authenticated;

create or replace view public.gamification_xp_ledger
with (security_invoker = true) as
select * from gamification.xp_ledger;

create or replace view public.gamification_login_rewards
with (security_invoker = true) as
select * from gamification.login_rewards;

grant select on
  public.gamification_xp_ledger,
  public.gamification_login_rewards
to authenticated;

commit;
