-- The compatibility view uses security_invoker: callers also need base-table
-- privileges. Categories are public; mutations remain restricted to admins.
grant usage on schema training to authenticated;
grant select, insert, update, delete on training.training_categories to authenticated;
grant select, insert, update, delete on public.training_categories to authenticated;

drop policy if exists "Admins manage training categories" on training.training_categories;
drop policy if exists rls_training_categories_insert on training.training_categories;
create policy rls_training_categories_insert on training.training_categories
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists rls_training_categories_update on training.training_categories;
create policy rls_training_categories_update on training.training_categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists rls_training_categories_delete on training.training_categories;
create policy rls_training_categories_delete on training.training_categories
  for delete to authenticated using ((select public.is_admin()));

-- Keep the existing single SELECT policy for anon and authenticated.
notify pgrst, 'reload schema';
