create or replace function gamification.skip_duplicate_daily_login_xp_ledger()
returns trigger
language plpgsql
as $$
begin
  if new.source_type = 'daily_login' and exists (
    select 1
    from gamification.xp_ledger existing
    where existing.student_id = new.student_id
      and existing.source_type = new.source_type
      and coalesce(existing.source_ref, '') = coalesce(new.source_ref, '')
  ) then
    return null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_skip_duplicate_daily_login_xp_ledger on gamification.xp_ledger;
create trigger trg_skip_duplicate_daily_login_xp_ledger
before insert on gamification.xp_ledger
for each row
execute function gamification.skip_duplicate_daily_login_xp_ledger();
