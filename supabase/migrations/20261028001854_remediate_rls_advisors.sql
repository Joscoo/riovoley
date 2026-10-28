-- RioVoley RLS advisor remediation.
-- Reviewed against the live schema. No application rows are deleted or rewritten.
-- Keep compatibility views, enforce their callers' RLS, and preserve the OR
-- semantics of existing policies when splitting FOR ALL into individual commands.

-- Authenticated clients need privileges on the relations behind invoker views.
grant usage on schema core, billing, training, profiles, public_content, audit, reporting
  to authenticated, service_role;
grant usage on schema billing, training, profiles, public_content to anon;

-- core.users previously had RLS enabled with no policies. These policies are
-- required before public.users starts applying the caller's RLS.
create policy rls_users_select on core.users for select to authenticated
  using ((select public.is_admin_or_trainer()) or id = (select auth.uid()));
create policy rls_users_insert on core.users for insert to authenticated
  with check ((select public.is_admin()) or
    ((select public.is_admin_or_trainer()) and role = 'estudiante'));
create policy rls_users_update on core.users for update to authenticated
  using ((select public.is_admin()) or id = (select auth.uid()) or
    ((select public.is_admin_or_trainer()) and role = 'estudiante'))
  with check ((select public.is_admin()) or id = (select auth.uid()) or
    ((select public.is_admin_or_trainer()) and role = 'estudiante'));
create policy rls_users_delete on core.users for delete to authenticated
  using ((select public.is_admin()) or
    ((select public.is_admin_or_trainer()) and role = 'estudiante'));

-- RLS controls rows, not columns. Allow ordinary profile/login edits while
-- preventing a client from promoting themselves or clearing their suspension.
-- Invoker triggers also run for direct table writes; server-owned auth/sync
-- triggers continue to run with their existing trusted database role.
create function core.guard_client_user_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if row(new.id, new.role, new.created_at)
       is distinct from row(old.id, old.role, old.created_at) then
      raise exception 'No autorizado para cambiar identidad o rol' using errcode = '42501';
    end if;
    if not (public.is_admin_or_trainer() and old.role = 'estudiante')
       and row(new.suspended, new.suspension_reason, new.suspension_until, new.suspended_at)
           is distinct from
           row(old.suspended, old.suspension_reason, old.suspension_until, old.suspended_at) then
      raise exception 'No autorizado para cambiar suspension' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;
create trigger guard_client_user_fields
  before update on core.users
  for each row execute function core.guard_client_user_fields();

-- Replace duplicated JWT "role=administrador" policies with canonical RBAC.
-- Supabase's top-level JWT role is the database role ("authenticated").
drop policy "Admins can manage all profiles" on profiles.user_profiles;
drop policy "profiles_admin_full_access" on profiles.user_profiles;
drop policy "profiles_delete_owner" on profiles.user_profiles;
drop policy "profiles_insert_owner_or_admin" on profiles.user_profiles;
drop policy "profiles_select_owner" on profiles.user_profiles;
drop policy "profiles_update_owner" on profiles.user_profiles;
create policy rls_user_profiles_select on profiles.user_profiles for select to authenticated
  using ((select public.is_admin_or_trainer()) or id = (select auth.uid()));
create policy rls_user_profiles_insert on profiles.user_profiles for insert to authenticated
  with check ((select public.is_admin()) or id = (select auth.uid()) or
    ((select public.is_admin_or_trainer()) and exists (
      select 1 from core.users u where u.id = user_profiles.id and u.role = 'estudiante')));
create policy rls_user_profiles_update on profiles.user_profiles for update to authenticated
  using ((select public.is_admin()) or id = (select auth.uid()) or
    ((select public.is_admin_or_trainer()) and exists (
      select 1 from core.users u where u.id = user_profiles.id and u.role = 'estudiante')))
  with check ((select public.is_admin()) or id = (select auth.uid()) or
    ((select public.is_admin_or_trainer()) and exists (
      select 1 from core.users u where u.id = user_profiles.id and u.role = 'estudiante')));
create policy rls_user_profiles_delete on profiles.user_profiles for delete to authenticated
  using ((select public.is_admin()) or id = (select auth.uid()) or
    ((select public.is_admin_or_trainer()) and exists (
      select 1 from core.users u where u.id = user_profiles.id and u.role = 'estudiante')));

create function profiles.guard_client_profile_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  trusted_role text;
begin
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    if tg_op = 'UPDATE' then
      if row(new.id, new.organization_id, new.created_at)
         is distinct from row(old.id, old.organization_id, old.created_at) then
        raise exception 'No autorizado para cambiar identidad u organizacion' using errcode = '42501';
      end if;
    elsif new.organization_id is not null then
      raise exception 'No autorizado para asignar organizacion' using errcode = '42501';
    end if;
    select u.role into trusted_role from core.users u where u.id = new.id;
    if new.role::text is distinct from coalesce(trusted_role, 'usuario') then
      raise exception 'El rol del perfil debe coincidir con el usuario' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$function$;
create trigger guard_client_profile_fields
  before insert or update on profiles.user_profiles
  for each row execute function profiles.guard_client_profile_fields();

-- Evaluate session/role helpers once per statement, not once per row.
-- Consolidate billing.membership_types; retain the OR of existing permissions.
drop policy "Admins manage membership types" on "billing"."membership_types";
drop policy "Membership types can be read" on "billing"."membership_types";
create policy "rls_membership_types_select" on "billing"."membership_types"
  for select to "authenticated"
  using (true);
create policy "rls_membership_types_insert" on "billing"."membership_types"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_membership_types_update" on "billing"."membership_types"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_membership_types_delete" on "billing"."membership_types"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate billing.payment_types; retain the OR of existing permissions.
drop policy "Admins manage payment types" on "billing"."payment_types";
drop policy "Payment types can be read" on "billing"."payment_types";
create policy "rls_payment_types_select" on "billing"."payment_types"
  for select to "authenticated"
  using (true);
create policy "rls_payment_types_insert" on "billing"."payment_types"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_payment_types_update" on "billing"."payment_types"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_payment_types_delete" on "billing"."payment_types"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate billing.payments; retain the OR of existing permissions.
drop policy "Admins can manage all payments" on "billing"."payments";
drop policy "Payments can be deleted" on "billing"."payments";
drop policy "Payments can be inserted" on "billing"."payments";
drop policy "Payments can be read" on "billing"."payments";
drop policy "Payments can be updated" on "billing"."payments";
drop policy "Trainers can manage all payments" on "billing"."payments";
create policy "rls_payments_select" on "billing"."payments"
  for select to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_payments_insert" on "billing"."payments"
  for insert to "authenticated"
  with check (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_payments_update" on "billing"."payments"
  for update to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())))
  with check (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_payments_delete" on "billing"."payments"
  for delete to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = payments.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));

-- Consolidate core.students; retain the OR of existing permissions.
drop policy "Admins can manage all student records" on "core"."students";
drop policy "Trainers can manage all students" on "core"."students";
drop policy "Users can delete own student records" on "core"."students";
drop policy "Users can insert own student records" on "core"."students";
drop policy "Users can update own student records" on "core"."students";
drop policy "Users can view own student records" on "core"."students";
create policy "rls_students_select" on "core"."students"
  for select to "authenticated"
  using (((select public.is_admin())) or ((select public.is_admin_or_trainer())) or (((select auth.uid()) = user_id)));
create policy "rls_students_insert" on "core"."students"
  for insert to "authenticated"
  with check (((select public.is_admin())) or ((select public.is_admin_or_trainer())) or (((select auth.uid()) = user_id)));
create policy "rls_students_update" on "core"."students"
  for update to "authenticated"
  using (((select public.is_admin())) or ((select public.is_admin_or_trainer())) or (((select auth.uid()) = user_id)))
  with check (((select public.is_admin())) or ((select public.is_admin_or_trainer())) or (((select auth.uid()) = user_id)));
create policy "rls_students_delete" on "core"."students"
  for delete to "authenticated"
  using (((select public.is_admin())) or ((select public.is_admin_or_trainer())) or (((select auth.uid()) = user_id)));

-- Consolidate gamification.achievement_catalog; retain the OR of existing permissions.
drop policy "gamification_achievement_catalog_admin_write" on "gamification"."achievement_catalog";
drop policy "gamification_achievement_catalog_read" on "gamification"."achievement_catalog";
create policy "rls_achievement_catalog_select" on "gamification"."achievement_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_achievement_catalog_insert" on "gamification"."achievement_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_achievement_catalog_update" on "gamification"."achievement_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_achievement_catalog_delete" on "gamification"."achievement_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate gamification.athlete_stages_catalog; retain the OR of existing permissions.
drop policy "gamification_athlete_stages_catalog_admin_write" on "gamification"."athlete_stages_catalog";
drop policy "gamification_athlete_stages_catalog_read" on "gamification"."athlete_stages_catalog";
create policy "rls_athlete_stages_catalog_select" on "gamification"."athlete_stages_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_athlete_stages_catalog_insert" on "gamification"."athlete_stages_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_athlete_stages_catalog_update" on "gamification"."athlete_stages_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_athlete_stages_catalog_delete" on "gamification"."athlete_stages_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate gamification.campaigns_catalog; retain the OR of existing permissions.
drop policy "gamification_campaigns_catalog_admin_write" on "gamification"."campaigns_catalog";
drop policy "gamification_campaigns_catalog_read" on "gamification"."campaigns_catalog";
create policy "rls_campaigns_catalog_select" on "gamification"."campaigns_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_campaigns_catalog_insert" on "gamification"."campaigns_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_campaigns_catalog_update" on "gamification"."campaigns_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_campaigns_catalog_delete" on "gamification"."campaigns_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate gamification.challenges_catalog; retain the OR of existing permissions.
drop policy "gamification_challenges_catalog_admin_write" on "gamification"."challenges_catalog";
drop policy "gamification_challenges_catalog_read" on "gamification"."challenges_catalog";
create policy "rls_challenges_catalog_select" on "gamification"."challenges_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_challenges_catalog_insert" on "gamification"."challenges_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_challenges_catalog_update" on "gamification"."challenges_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_challenges_catalog_delete" on "gamification"."challenges_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate gamification.cosmetic_items_catalog; retain the OR of existing permissions.
drop policy "gamification_cosmetic_catalog_admin_write" on "gamification"."cosmetic_items_catalog";
drop policy "gamification_cosmetic_catalog_read" on "gamification"."cosmetic_items_catalog";
create policy "rls_cosmetic_items_catalog_select" on "gamification"."cosmetic_items_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_cosmetic_items_catalog_insert" on "gamification"."cosmetic_items_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_cosmetic_items_catalog_update" on "gamification"."cosmetic_items_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_cosmetic_items_catalog_delete" on "gamification"."cosmetic_items_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate gamification.currency_ledger; retain the OR of existing permissions.
drop policy "gamification_currency_ledger_read" on "gamification"."currency_ledger";
drop policy "gamification_currency_ledger_write" on "gamification"."currency_ledger";
create policy "rls_currency_ledger_select" on "gamification"."currency_ledger"
  for select to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_currency_ledger_insert" on "gamification"."currency_ledger"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_currency_ledger_update" on "gamification"."currency_ledger"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = (select auth.uid()))))))))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_currency_ledger_delete" on "gamification"."currency_ledger"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_ledger.student_id) AND (s.user_id = (select auth.uid()))))))));

-- Consolidate gamification.currency_wallets; retain the OR of existing permissions.
drop policy "gamification_currency_wallets_read" on "gamification"."currency_wallets";
drop policy "gamification_currency_wallets_write" on "gamification"."currency_wallets";
create policy "rls_currency_wallets_select" on "gamification"."currency_wallets"
  for select to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_currency_wallets_insert" on "gamification"."currency_wallets"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_currency_wallets_update" on "gamification"."currency_wallets"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = (select auth.uid()))))))))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_currency_wallets_delete" on "gamification"."currency_wallets"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = currency_wallets.student_id) AND (s.user_id = (select auth.uid()))))))));

-- Consolidate gamification.hidden_rewards_catalog; retain the OR of existing permissions.
drop policy "gamification_hidden_rewards_catalog_admin_write" on "gamification"."hidden_rewards_catalog";
drop policy "gamification_hidden_rewards_catalog_read" on "gamification"."hidden_rewards_catalog";
create policy "rls_hidden_rewards_catalog_select" on "gamification"."hidden_rewards_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_hidden_rewards_catalog_insert" on "gamification"."hidden_rewards_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_hidden_rewards_catalog_update" on "gamification"."hidden_rewards_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_hidden_rewards_catalog_delete" on "gamification"."hidden_rewards_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

-- Consolidate gamification.leaderboard_snapshots; retain the OR of existing permissions.
drop policy "gamification_leaderboard_read" on "gamification"."leaderboard_snapshots";
drop policy "gamification_leaderboard_snapshots_write" on "gamification"."leaderboard_snapshots";
drop policy "gamification_leaderboard_write" on "gamification"."leaderboard_snapshots";
create policy "rls_leaderboard_snapshots_select" on "gamification"."leaderboard_snapshots"
  for select to "authenticated"
  using (true);
create policy "rls_leaderboard_snapshots_insert" on "gamification"."leaderboard_snapshots"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = (select auth.uid()))))))) or ((select public.is_admin_or_trainer())));
create policy "rls_leaderboard_snapshots_update" on "gamification"."leaderboard_snapshots"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = (select auth.uid()))))))) or ((select public.is_admin_or_trainer())))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = (select auth.uid()))))))) or ((select public.is_admin_or_trainer())));
create policy "rls_leaderboard_snapshots_delete" on "gamification"."leaderboard_snapshots"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = leaderboard_snapshots.student_id) AND (s.user_id = (select auth.uid()))))))) or ((select public.is_admin_or_trainer())));

-- Consolidate gamification.reward_events; retain the OR of existing permissions.
drop policy "gamification_reward_events_read" on "gamification"."reward_events";
drop policy "gamification_reward_events_write" on "gamification"."reward_events";
create policy "rls_reward_events_select" on "gamification"."reward_events"
  for select to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_reward_events_insert" on "gamification"."reward_events"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_reward_events_update" on "gamification"."reward_events"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = (select auth.uid()))))))))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_reward_events_delete" on "gamification"."reward_events"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = reward_events.student_id) AND (s.user_id = (select auth.uid()))))))));

-- Consolidate gamification.student_achievements; retain the OR of existing permissions.
drop policy "gamification_student_achievements_read" on "gamification"."student_achievements";
drop policy "gamification_student_achievements_write" on "gamification"."student_achievements";
create policy "rls_student_achievements_select" on "gamification"."student_achievements"
  for select to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_achievements_insert" on "gamification"."student_achievements"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_achievements_update" on "gamification"."student_achievements"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = (select auth.uid()))))))))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_achievements_delete" on "gamification"."student_achievements"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_achievements.student_id) AND (s.user_id = (select auth.uid()))))))));

alter policy "gamification_student_campaign_progress_insert" on "gamification"."student_campaign_progress"
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_campaign_progress_read" on "gamification"."student_campaign_progress"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_campaign_progress_update" on "gamification"."student_campaign_progress"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = (select auth.uid())))))))
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_campaign_progress.student_id) AND (s.user_id = (select auth.uid())))))));

-- Consolidate gamification.student_challenge_progress; retain the OR of existing permissions.
drop policy "gamification_student_challenge_progress_read" on "gamification"."student_challenge_progress";
drop policy "gamification_student_challenge_progress_write" on "gamification"."student_challenge_progress";
create policy "rls_student_challenge_progress_select" on "gamification"."student_challenge_progress"
  for select to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_challenge_progress_insert" on "gamification"."student_challenge_progress"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_challenge_progress_update" on "gamification"."student_challenge_progress"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = (select auth.uid()))))))))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_challenge_progress_delete" on "gamification"."student_challenge_progress"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_challenge_progress.student_id) AND (s.user_id = (select auth.uid()))))))));

-- Consolidate gamification.student_cosmetic_equipment; retain the OR of existing permissions.
drop policy "gamification_student_cosmetic_equipment_admin_write" on "gamification"."student_cosmetic_equipment";
drop policy "gamification_student_cosmetic_equipment_read" on "gamification"."student_cosmetic_equipment";
create policy "rls_student_cosmetic_equipment_select" on "gamification"."student_cosmetic_equipment"
  for select to "authenticated"
  using (((select public.is_admin_or_trainer())) or (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_cosmetic_equipment.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_cosmetic_equipment_insert" on "gamification"."student_cosmetic_equipment"
  for insert to "authenticated"
  with check (((select public.is_admin_or_trainer())));
create policy "rls_student_cosmetic_equipment_update" on "gamification"."student_cosmetic_equipment"
  for update to "authenticated"
  using (((select public.is_admin_or_trainer())))
  with check (((select public.is_admin_or_trainer())));
create policy "rls_student_cosmetic_equipment_delete" on "gamification"."student_cosmetic_equipment"
  for delete to "authenticated"
  using (((select public.is_admin_or_trainer())));

-- Consolidate gamification.student_cosmetic_items; retain the OR of existing permissions.
drop policy "gamification_student_cosmetic_items_admin_write" on "gamification"."student_cosmetic_items";
drop policy "gamification_student_cosmetic_items_read" on "gamification"."student_cosmetic_items";
create policy "rls_student_cosmetic_items_select" on "gamification"."student_cosmetic_items"
  for select to "authenticated"
  using (((select public.is_admin_or_trainer())) or (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_cosmetic_items.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_cosmetic_items_insert" on "gamification"."student_cosmetic_items"
  for insert to "authenticated"
  with check (((select public.is_admin_or_trainer())));
create policy "rls_student_cosmetic_items_update" on "gamification"."student_cosmetic_items"
  for update to "authenticated"
  using (((select public.is_admin_or_trainer())))
  with check (((select public.is_admin_or_trainer())));
create policy "rls_student_cosmetic_items_delete" on "gamification"."student_cosmetic_items"
  for delete to "authenticated"
  using (((select public.is_admin_or_trainer())));

alter policy "gamification_student_current_stage_insert" on "gamification"."student_current_stage"
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_current_stage_read" on "gamification"."student_current_stage"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_current_stage_update" on "gamification"."student_current_stage"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = (select auth.uid())))))))
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_current_stage.student_id) AND (s.user_id = (select auth.uid())))))));

alter policy "gamification_student_hidden_rewards_insert" on "gamification"."student_hidden_rewards"
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_hidden_rewards_read" on "gamification"."student_hidden_rewards"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_hidden_rewards_update" on "gamification"."student_hidden_rewards"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = (select auth.uid())))))))
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_hidden_rewards.student_id) AND (s.user_id = (select auth.uid())))))));

alter policy "gamification_student_identity_insert" on "gamification"."student_identity"
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_identity_read" on "gamification"."student_identity"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_identity_update" on "gamification"."student_identity"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = (select auth.uid())))))))
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_identity.student_id) AND (s.user_id = (select auth.uid())))))));

-- Consolidate gamification.student_profiles; retain the OR of existing permissions.
drop policy "gamification_profiles_admin_trainer_write" on "gamification"."student_profiles";
drop policy "gamification_profiles_own_read" on "gamification"."student_profiles";
create policy "rls_student_profiles_select" on "gamification"."student_profiles"
  for select to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_profiles_insert" on "gamification"."student_profiles"
  for insert to "authenticated"
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_profiles_update" on "gamification"."student_profiles"
  for update to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = (select auth.uid()))))))))
  with check ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = (select auth.uid()))))))));
create policy "rls_student_profiles_delete" on "gamification"."student_profiles"
  for delete to "authenticated"
  using ((((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_profiles.student_id) AND (s.user_id = (select auth.uid()))))))));

alter policy "gamification_student_stage_history_insert" on "gamification"."student_stage_history"
  with check (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_stage_history.student_id) AND (s.user_id = (select auth.uid())))))));
alter policy "gamification_student_stage_history_read" on "gamification"."student_stage_history"
  using (((select public.is_admin_or_trainer()) OR (EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = student_stage_history.student_id) AND (s.user_id = (select auth.uid())))))));

-- Consolidate gamification.titles_catalog; retain the OR of existing permissions.
drop policy "gamification_titles_catalog_admin_write" on "gamification"."titles_catalog";
drop policy "gamification_titles_catalog_read" on "gamification"."titles_catalog";
create policy "rls_titles_catalog_select" on "gamification"."titles_catalog"
  for select to "authenticated"
  using (true);
create policy "rls_titles_catalog_insert" on "gamification"."titles_catalog"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_titles_catalog_update" on "gamification"."titles_catalog"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_titles_catalog_delete" on "gamification"."titles_catalog"
  for delete to "authenticated"
  using (((select public.is_admin())));

alter policy "mobile_device_registrations_delete_own" on "profiles"."mobile_device_registrations"
  using (((select auth.uid()) = user_id));
alter policy "mobile_device_registrations_insert_own" on "profiles"."mobile_device_registrations"
  with check (((select auth.uid()) = user_id));
alter policy "mobile_device_registrations_select_own" on "profiles"."mobile_device_registrations"
  using (((select auth.uid()) = user_id));
alter policy "mobile_device_registrations_update_own" on "profiles"."mobile_device_registrations"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "user_notification_preferences_insert_own" on "profiles"."user_notification_preferences"
  with check (((select auth.uid()) = user_id));
alter policy "user_notification_preferences_select_own" on "profiles"."user_notification_preferences"
  using (((select auth.uid()) = user_id));
alter policy "user_notification_preferences_update_own" on "profiles"."user_notification_preferences"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "user_notification_inbox_state_delete_own" on "public"."user_notification_inbox_state"
  using (((select auth.uid()) = user_id));
alter policy "user_notification_inbox_state_insert_own" on "public"."user_notification_inbox_state"
  with check (((select auth.uid()) = user_id));
alter policy "user_notification_inbox_state_select_own" on "public"."user_notification_inbox_state"
  using (((select auth.uid()) = user_id));
alter policy "user_notification_inbox_state_update_own" on "public"."user_notification_inbox_state"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "Admins y entrenadores pueden crear anuncios" on "public_content"."announcements"
  with check ((select public.is_admin_or_trainer()));
alter policy "Creador, admins y entrenadores pueden actualizar anuncios" on "public_content"."announcements"
  using (((created_by = (select auth.uid())) OR (select public.is_admin_or_trainer())))
  with check (((created_by = (select auth.uid())) OR (select public.is_admin_or_trainer())));
alter policy "Solo admins pueden eliminar anuncios" on "public_content"."announcements"
  using ((select public.is_admin()));

alter policy "Todos pueden ver anuncios activos" on "public_content"."announcements"
  using (((is_active = true) OR (select public.is_admin_or_trainer())));

alter policy "report_artifacts_admin_trainer_read" on "reporting"."report_artifacts"
  using (((select public.is_admin_or_trainer()) AND (EXISTS ( SELECT 1
   FROM reporting.report_runs rr
  WHERE (rr.id = report_artifacts.run_id)))));

alter policy "report_definitions_admin_trainer_read" on "reporting"."report_definitions"
  using ((select public.is_admin_or_trainer()));

alter policy "report_runs_admin_trainer_read" on "reporting"."report_runs"
  using ((select public.is_admin_or_trainer()));

-- Consolidate training.attendances; retain the OR of existing permissions.
drop policy "Admins can manage all attendances" on "training"."attendances";
drop policy "Attendances can be deleted" on "training"."attendances";
drop policy "Attendances can be inserted" on "training"."attendances";
drop policy "Attendances can be read" on "training"."attendances";
drop policy "Attendances can be updated" on "training"."attendances";
drop policy "Trainers can manage all attendances" on "training"."attendances";
create policy "rls_attendances_select" on "training"."attendances"
  for select to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_attendances_insert" on "training"."attendances"
  for insert to "authenticated"
  with check (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_attendances_update" on "training"."attendances"
  for update to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())))
  with check (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_attendances_delete" on "training"."attendances"
  for delete to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = attendances.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));

-- Consolidate training.physical_tests; retain the OR of existing permissions.
drop policy "Admins can manage all physical_tests" on "training"."physical_tests";
drop policy "Physical tests can be deleted" on "training"."physical_tests";
drop policy "Physical tests can be inserted" on "training"."physical_tests";
drop policy "Physical tests can be read" on "training"."physical_tests";
drop policy "Physical tests can be updated" on "training"."physical_tests";
drop policy "Trainers can manage all physical_tests" on "training"."physical_tests";
create policy "rls_physical_tests_select" on "training"."physical_tests"
  for select to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_physical_tests_insert" on "training"."physical_tests"
  for insert to "authenticated"
  with check (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_physical_tests_update" on "training"."physical_tests"
  for update to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())))
  with check (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));
create policy "rls_physical_tests_delete" on "training"."physical_tests"
  for delete to "authenticated"
  using (((select public.is_admin())) or ((EXISTS ( SELECT 1
   FROM core.students s
  WHERE ((s.id = physical_tests.student_id) AND (s.user_id = (select auth.uid())))))) or ((select public.is_admin_or_trainer())));

-- Consolidate training.schedules; retain the OR of existing permissions.
drop policy "Admins manage schedules" on "training"."schedules";
drop policy "Schedules can be read" on "training"."schedules";
create policy "rls_schedules_select" on "training"."schedules"
  for select to "authenticated"
  using (true);
create policy "rls_schedules_insert" on "training"."schedules"
  for insert to "authenticated"
  with check (((select public.is_admin())));
create policy "rls_schedules_update" on "training"."schedules"
  for update to "authenticated"
  using (((select public.is_admin())))
  with check (((select public.is_admin())));
create policy "rls_schedules_delete" on "training"."schedules"
  for delete to "authenticated"
  using (((select public.is_admin())));


-- Preserve public, non-PII schedules and catalogs previously served by definer
-- views. One SELECT policy per role/action avoids new overlap warnings.
alter policy rls_membership_types_select on billing.membership_types to anon, authenticated;
alter policy rls_payment_types_select on billing.payment_types to anon, authenticated;
alter policy rls_schedules_select on training.schedules to anon, authenticated;
alter policy "Training categories can be read" on training.training_categories to anon, authenticated;
grant select on billing.membership_types, billing.payment_types,
  training.schedules, training.training_categories to anon;
grant select on public.training_categories to anon;

-- Audit payloads contain financial/user data and must be readable only by staff.
alter table audit.payments_audit enable row level security;
create policy rls_payments_audit_select on audit.payments_audit for select to authenticated
  using ((select public.is_admin_or_trainer()));

-- These tables already back invoker views but were missing RLS entirely.
-- Match the existing owner/staff access used by neighboring gamification tables.
alter table gamification.login_rewards enable row level security;
create policy rls_login_rewards_owner on gamification.login_rewards for all to authenticated
  using ((select public.is_admin_or_trainer()) or user_id = (select auth.uid()))
  with check ((select public.is_admin_or_trainer()) or user_id = (select auth.uid()));
alter table gamification.xp_ledger enable row level security;
create policy rls_xp_ledger_owner on gamification.xp_ledger for all to authenticated
  using ((select public.is_admin_or_trainer()) or exists (
    select 1 from core.students s
    where s.id = xp_ledger.student_id and s.user_id = (select auth.uid())))
  with check ((select public.is_admin_or_trainer()) or exists (
    select 1 from core.students s
    where s.id = xp_ledger.student_id and s.user_id = (select auth.uid())));

-- Password backups are server-only, including their underlying table.
revoke all on security.users_password_backup, public.users_password_backup
  from public, anon, authenticated;
grant usage on schema security to service_role;
grant all on security.users_password_backup to service_role;
grant select on public.users_password_backup to service_role;

-- RLS does not apply to TRUNCATE. Browser roles must never retain this grant.
do $block$
declare
  target record;
begin
  for target in
    select n.nspname, c.relname
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'p')
      and n.nspname in ('core', 'billing', 'training', 'profiles', 'public_content',
        'audit', 'security', 'gamification', 'reporting', 'public')
  loop
    execute format('revoke truncate on %I.%I from public, anon, authenticated',
      target.nspname, target.relname);
  end loop;
end;
$block$;

-- All compatibility views must enforce their caller's base-table permissions.
alter view public."membership_types" set (security_invoker = true);
alter view public."training_categories" set (security_invoker = true);
alter view public."payments_audit" set (security_invoker = true);
alter view public."users" set (security_invoker = true);
alter view public."attendances" set (security_invoker = true);
alter view public."announcements" set (security_invoker = true);
alter view public."announcements_with_creator" set (security_invoker = true);
alter view public."users_password_backup" set (security_invoker = true);
alter view public."students" set (security_invoker = true);
alter view public."mobile_device_registrations" set (security_invoker = true);
alter view public."schedules" set (security_invoker = true);
alter view public."physical_tests" set (security_invoker = true);
alter view public."user_profiles" set (security_invoker = true);
alter view public."payment_types" set (security_invoker = true);
alter view public."payments" set (security_invoker = true);
alter view public."payments_active" set (security_invoker = true);
alter view public."report_runs" set (security_invoker = true);
alter view public."report_artifacts" set (security_invoker = true);
alter view public."report_definitions" set (security_invoker = true);
alter view public."user_notification_preferences" set (security_invoker = true);

notify pgrst, 'reload schema';
