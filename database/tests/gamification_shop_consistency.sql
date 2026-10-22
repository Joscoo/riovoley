-- Run in a transaction and always roll it back. Uses a real student's ID only
-- inside this transaction; no balances, purchases or equipment are retained.
begin;
do $$
declare
  v_student uuid;
  v_user uuid;
  v_result jsonb;
  v_count integer;
begin
  select id, user_id into v_student, v_user from core.students where user_id is not null limit 1;
  if v_student is null then raise exception 'Test requires a student'; end if;

  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.purchase_gamification_item(v_student, '__shop_test_frame');
    raise exception 'Unauthenticated purchase accepted';
  exception when raise_exception then
    if sqlerrm <> 'not_allowed' then raise; end if;
  end;
  begin
    perform public.equip_gamification_item(v_student, '__shop_test_frame');
    raise exception 'Unauthenticated equip accepted';
  exception when raise_exception then
    if sqlerrm <> 'not_allowed' then raise; end if;
  end;
  begin
    perform public.unequip_gamification_item(v_student, 'frame');
    raise exception 'Unauthenticated unequip accepted';
  exception when raise_exception then
    if sqlerrm <> 'not_allowed' then raise; end if;
  end;
  perform set_config('request.jwt.claim.sub', v_user::text, true);

  insert into gamification.cosmetic_items_catalog(slug, name, description, category, price_coins)
  values ('__shop_test_frame', 'Test frame', 'Test', 'frame', 5),
         ('__shop_test_free', 'Test free', 'Test', 'badge', 0),
         ('__shop_test_expensive', 'Test expensive', 'Test', 'effect', 100),
         ('__shop_test_unsupported', 'Test unsupported', 'Test', 'riovoley', 1);
  insert into gamification.currency_wallets(student_id, balance, total_earned, total_spent)
  values(v_student, 10, 10, 0) on conflict(student_id) do update set balance = 10, total_earned = 10, total_spent = 0;

  begin
    perform public.equip_gamification_item(v_student, '__shop_test_frame');
    raise exception 'Unowned equip accepted';
  exception when raise_exception then
    if sqlerrm <> 'item_not_owned' then raise; end if;
  end;
  v_result := public.purchase_gamification_item(v_student, '__shop_test_frame');
  if (v_result#>>'{wallet,balance}')::int <> 5 or (v_result#>>'{wallet,totalSpent}')::int <> 5
     or (v_result#>>'{ledgerEntry,coinsDelta}')::int <> -5 then
    raise exception 'Incorrect receipt: %', v_result;
  end if;
  perform public.equip_gamification_item(v_student, '__shop_test_frame');
  if not exists(select 1 from gamification.student_cosmetic_equipment where student_id = v_student and frame_item_slug = '__shop_test_frame') then
    raise exception 'Equip did not persist';
  end if;
  perform public.unequip_gamification_item(v_student, 'frame');
  if exists(select 1 from gamification.student_cosmetic_equipment where student_id = v_student and frame_item_slug is not null) then
    raise exception 'Unequip did not persist';
  end if;

  begin
    perform public.purchase_gamification_item(v_student, '__shop_test_frame');
    raise exception 'Duplicate purchase accepted';
  exception when raise_exception then
    if sqlerrm <> 'item_already_owned' then raise; end if;
  end;
  begin
    perform public.purchase_gamification_item(v_student, '__shop_test_expensive');
    raise exception 'Insufficient balance purchase accepted';
  exception when raise_exception then
    if sqlerrm <> 'insufficient_coins' then raise; end if;
  end;
  begin
    perform public.purchase_gamification_item(v_student, '__shop_test_unsupported');
    raise exception 'Unsupported category purchase accepted';
  exception when raise_exception then
    if sqlerrm <> 'unsupported_category' then raise; end if;
  end;
  v_result := public.purchase_gamification_item(v_student, '__shop_test_free');
  if (v_result#>>'{wallet,balance}')::int <> 5 or (v_result->>'priceCoins')::int <> 0 then
    raise exception 'Free purchase changed balance';
  end if;
  select count(*) into v_count from gamification.currency_ledger where student_id = v_student and source_ref like '__shop_test_%';
  if v_count <> 2 then raise exception 'Unexpected ledger count: %', v_count; end if;
end;
$$;
select 'shop transaction assertions passed' as result;
rollback;
