-- Run after the migration, or inside a transaction containing the migration.
-- All test rows/claims are rolled back. No Auth account is created or changed.
begin;

do $$
begin
  if has_table_privilege('anon', 'training.training_categories', 'INSERT') then
    raise exception 'Anonymous callers must not insert training categories';
  end if;
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
end $$;

set local role authenticated;
do $$
begin
  perform code from public.training_categories limit 1;
  begin
    insert into public.training_categories (code, label)
      values ('__e2e_category_access__', 'Category access regression');
    raise exception 'Non-admin insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

do $$
declare admin_id uuid;
begin
  select id into strict admin_id from core.users
    where role in ('administrador', 'admin') limit 1;
  perform set_config('request.jwt.claims', jsonb_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
end $$;

set local role authenticated;
insert into public.training_categories (code, label)
  values ('__e2e_category_access__', 'Category access regression');
update public.training_categories set label = 'Updated access regression'
  where code = '__e2e_category_access__';
do $$
begin
  if not exists (select 1 from public.training_categories
    where code = '__e2e_category_access__' and label = 'Updated access regression') then
    raise exception 'Admin update did not persist';
  end if;
end $$;
delete from public.training_categories where code = '__e2e_category_access__';
reset role;

rollback;
