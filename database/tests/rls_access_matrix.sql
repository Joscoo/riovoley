-- Execute as the database owner. All writes are rolled back.
-- Exercises actual RLS as anon/authenticated, without SECURITY DEFINER test helpers.
begin;

do $test$
declare
  student_user uuid;
  other_student_user uuid;
  admin_user uuid;
  trainer_user uuid;
  actor uuid;
  fixture_user uuid;
  expected_counts jsonb := '{}'::jsonb;
  expected_public jsonb := '{}'::jsonb;
  expected_student jsonb := '{}'::jsonb;
  relation_name text;
  visible_count bigint;
  affected_count bigint;
begin
  select s.user_id into student_user from core.students s
    join profiles.user_profiles p on p.id = s.user_id limit 1;
  select user_id into other_student_user from core.students
    where user_id <> student_user limit 1;
  select id into admin_user from core.users where role = 'administrador' limit 1;
  select id into trainer_user from core.users where role = 'entrenador' limit 1;
  if student_user is null or other_student_user is null
     or admin_user is null or trainer_user is null then
    raise exception 'Requires two students, an administrator and a trainer';
  end if;

  foreach relation_name in array array[
    'users', 'students', 'payments', 'attendances', 'physical_tests',
    'report_definitions', 'report_runs', 'report_artifacts', 'payments_audit'
  ] loop
    execute format('select count(*) from public.%I', relation_name) into visible_count;
    expected_counts := expected_counts || jsonb_build_object(relation_name, visible_count);
  end loop;
  foreach relation_name in array array[
    'schedules', 'training_categories', 'payment_types', 'membership_types'
  ] loop
    execute format('select count(*) from public.%I', relation_name) into visible_count;
    expected_public := expected_public || jsonb_build_object(relation_name, visible_count);
  end loop;

  foreach relation_name in array array[
    'payments', 'payments_active', 'attendances', 'physical_tests',
    'gamification_profiles', 'gamification_xp_ledger', 'gamification_currency_wallets',
    'gamification_reward_events', 'gamification_student_achievements',
    'gamification_student_challenge_progress', 'gamification_currency_ledger',
    'gamification_student_identity', 'gamification_student_cosmetic_items',
    'gamification_student_cosmetic_equipment', 'gamification_student_current_stage',
    'gamification_student_stage_history', 'gamification_student_campaign_progress',
    'gamification_student_hidden_rewards'
  ] loop
    execute format(
      'select count(*) from public.%I where student_id in
       (select id from core.students where user_id = $1)', relation_name
    ) into visible_count using student_user;
    expected_student := expected_student || jsonb_build_object(relation_name, visible_count);
  end loop;

  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  foreach relation_name in array array[
    'users', 'students', 'user_profiles', 'payments', 'payments_active',
    'attendances', 'physical_tests', 'payments_audit', 'users_password_backup',
    'report_definitions', 'report_runs', 'report_artifacts'
  ] loop
    begin
      execute format('select count(*) from public.%I', relation_name) into visible_count;
      if visible_count <> 0 then
        raise exception 'Anonymous access exposed rows in public.%', relation_name;
      end if;
    exception when insufficient_privilege then
      null; -- Revoked table privileges are also a valid denial.
    end;
  end loop;
  foreach relation_name in array array[
    'schedules', 'training_categories', 'payment_types', 'membership_types'
  ] loop
    execute format('select count(*) from public.%I', relation_name) into visible_count;
    if visible_count <> (expected_public ->> relation_name)::bigint then
      raise exception 'Public catalog unavailable: %', relation_name;
    end if;
  end loop;
  perform count(*) from public.announcements_with_creator;
  execute 'reset role';

  foreach actor in array array[admin_user, trainer_user] loop
    perform set_config('request.jwt.claim.sub', actor::text, true);
    perform set_config('request.jwt.claims',
      jsonb_build_object('sub', actor, 'role', 'authenticated')::text, true);
    execute 'set local role authenticated';
    foreach relation_name in array array[
      'users', 'students', 'payments', 'attendances', 'physical_tests',
      'report_definitions', 'report_runs', 'report_artifacts', 'payments_audit'
    ] loop
      execute format('select count(*) from public.%I', relation_name) into visible_count;
      if visible_count <> (expected_counts ->> relation_name)::bigint then
        raise exception 'Staff access blocked in public.%', relation_name;
      end if;
    end loop;
    update public.users set nombre = nombre where id = student_user;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Staff cannot edit a student';
    end if;
    update public.user_profiles set full_name = full_name where id = student_user;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Staff cannot edit a student profile';
    end if;
    if actor = trainer_user then
      begin
        update public.users set role = 'administrador' where id = student_user;
        raise exception 'Trainer can promote a student to administrator';
      exception when insufficient_privilege then null;
      end;
      update public.users set nombre = nombre where id = admin_user;
      get diagnostics affected_count = row_count;
      if affected_count <> 0 then
        raise exception 'Trainer can edit an administrator';
      end if;
    end if;
    fixture_user := gen_random_uuid();
    insert into public.users (id, email, nombre, apellido, role)
      values (fixture_user, 'rls-test-' || fixture_user || '@example.invalid',
        'RLS', 'Test', case when actor = admin_user then 'entrenador' else 'estudiante' end);
    delete from public.users where id = fixture_user;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Staff cannot create/delete an allowed user';
    end if;
    if actor = trainer_user then
      begin
        insert into public.users (id, email, nombre, apellido, role)
          values (fixture_user, 'rls-test-' || fixture_user || '@example.invalid',
            'RLS', 'Test', 'administrador');
        raise exception 'Trainer can create an administrator';
      exception when insufficient_privilege then null;
      end;
    end if;
    execute 'reset role';
  end loop;

  perform set_config('request.jwt.claim.sub', student_user::text, true);
  perform set_config('request.jwt.claims',
    jsonb_build_object('sub', student_user, 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if (select count(*) from public.users where id = student_user) <> 1 then
    raise exception 'Student cannot read their user record (login would fail)';
  end if;
  if exists(select 1 from public.users where id <> student_user) then
    raise exception 'Student can read another user';
  end if;
  if exists(select 1 from public.students where user_id <> student_user) then
    raise exception 'Student can read another student';
  end if;
  if exists(select 1 from public.user_profiles where id <> student_user) then
    raise exception 'Student can read another profile';
  end if;
  foreach relation_name in array array[
    'payments', 'payments_active', 'attendances', 'physical_tests',
    'gamification_profiles', 'gamification_xp_ledger', 'gamification_currency_wallets',
    'gamification_reward_events', 'gamification_student_achievements',
    'gamification_student_challenge_progress', 'gamification_currency_ledger',
    'gamification_student_identity', 'gamification_student_cosmetic_items',
    'gamification_student_cosmetic_equipment', 'gamification_student_current_stage',
    'gamification_student_stage_history', 'gamification_student_campaign_progress',
    'gamification_student_hidden_rewards'
  ] loop
    execute format(
      'select count(*) from public.%I where student_id not in
       (select id from public.students where user_id = auth.uid())',
      relation_name
    ) into visible_count;
    if visible_count <> 0 then
      raise exception 'Student can read another student data in %', relation_name;
    end if;
    execute format('select count(*) from public.%I', relation_name) into visible_count;
    if visible_count <> (expected_student ->> relation_name)::bigint then
      raise exception 'Student cannot read all their own data in %', relation_name;
    end if;
  end loop;
  if exists(select 1 from public.gamification_login_rewards where user_id <> student_user) then
    raise exception 'Student can read another login reward';
  end if;
  foreach relation_name in array array['report_runs', 'report_artifacts', 'payments_audit'] loop
    execute format('select count(*) from public.%I', relation_name) into visible_count;
    if visible_count <> 0 then
      raise exception 'Student can read staff data in %', relation_name;
    end if;
  end loop;

  update public.users set last_login = last_login where id = student_user;
  get diagnostics affected_count = row_count;
  if affected_count <> 1 then
    raise exception 'Student cannot update own login timestamp';
  end if;
  update public.users set first_login = first_login where id = student_user;
  get diagnostics affected_count = row_count;
  if affected_count <> 1 then
    raise exception 'Student cannot complete first login';
  end if;
  update public.users set nombre = nombre where id = other_student_user;
  get diagnostics affected_count = row_count;
  if affected_count <> 0 then
    raise exception 'Student can update another user';
  end if;

  begin
    update public.users set role = 'administrador' where id = student_user;
    raise exception 'Student can elevate their core role';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.user_profiles set role = 'administrador' where id = student_user;
    raise exception 'Student can elevate their profile role';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.users set suspended = not coalesce(suspended, false) where id = student_user;
    raise exception 'Student can change their suspension status';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
end;
$test$;

select 'RLS access matrix passed: anon, student, trainer, administrator' as result;
rollback;
