-- Keep currency, inventory and the receipt in one transaction. Serializing by
-- student also covers the first purchase, when a wallet does not exist yet.
create or replace function public.purchase_gamification_item(p_student_id uuid, p_item_slug text)
returns jsonb language plpgsql security definer
set search_path = public, gamification, core
as $$
declare
  v_owner uuid;
  v_item gamification.cosmetic_items_catalog%rowtype;
  v_wallet gamification.currency_wallets%rowtype;
  v_entry gamification.currency_ledger%rowtype;
  v_now timestamptz := now();
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select user_id into v_owner from core.students where id = p_student_id;
  if not found then raise exception 'student_not_found'; end if;
  if not (coalesce(public.is_admin_or_trainer(), false) or coalesce(v_owner = auth.uid(), false)) then
    raise exception 'not_allowed';
  end if;

  select * into v_item from gamification.cosmetic_items_catalog
  where slug = p_item_slug and is_active = true for share;
  if not found then raise exception 'item_not_found'; end if;
  if v_item.category not in ('frame', 'background', 'badge', 'effect') then
    raise exception 'unsupported_category';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('gamification-shop:' || p_student_id::text, 0));
  insert into gamification.currency_wallets(student_id, balance, total_earned, total_spent, last_synced_at, updated_at)
  values (p_student_id, 0, 0, 0, v_now, v_now) on conflict (student_id) do nothing;
  select * into v_wallet from gamification.currency_wallets where student_id = p_student_id for update;

  if exists(select 1 from gamification.student_cosmetic_items where student_id = p_student_id and item_slug = p_item_slug) then
    raise exception 'item_already_owned';
  end if;
  if v_wallet.balance < v_item.price_coins then raise exception 'insufficient_coins'; end if;

  update gamification.currency_wallets
  set balance = balance - v_item.price_coins, total_spent = total_spent + v_item.price_coins,
      updated_at = v_now, last_synced_at = v_now
  where student_id = p_student_id returning * into v_wallet;

  insert into gamification.currency_ledger(student_id, source_type, source_ref, coins_delta, label, description, metadata, occurred_at, created_at)
  values(p_student_id, 'cosmetic_purchase', p_item_slug, -v_item.price_coins, 'Compra cosmetica',
    format('Compraste %s para tu perfil.', v_item.name),
    jsonb_build_object('itemSlug', v_item.slug, 'category', v_item.category), v_now, v_now)
  returning * into v_entry;

  insert into gamification.student_cosmetic_items(student_id, item_slug, source_type, metadata, acquired_at)
  values(p_student_id, p_item_slug, 'purchase', jsonb_build_object('priceCoins', v_item.price_coins), v_now);

  return jsonb_build_object('ok', true, 'itemSlug', v_item.slug, 'priceCoins', v_item.price_coins,
    'wallet', jsonb_build_object('balance', v_wallet.balance, 'totalEarned', v_wallet.total_earned, 'totalSpent', v_wallet.total_spent),
    'ledgerEntry', jsonb_build_object('id', v_entry.id, 'sourceType', v_entry.source_type, 'sourceRef', v_entry.source_ref,
      'coinsDelta', v_entry.coins_delta, 'label', v_entry.label, 'description', v_entry.description, 'occurredAt', v_entry.occurred_at));
end;
$$;

revoke all on function public.purchase_gamification_item(uuid, text) from public, anon;
grant execute on function public.purchase_gamification_item(uuid, text) to authenticated;


create or replace function public.equip_gamification_item(
  p_student_id uuid,
  p_item_slug text
)
returns jsonb
language plpgsql
security definer
set search_path = public, gamification, core
as $$
declare
  v_student_owner uuid;
  v_item gamification.cosmetic_items_catalog%rowtype;
  v_owned boolean;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select s.user_id
  into v_student_owner
  from core.students s
  where s.id = p_student_id;

  if v_student_owner is null then
    raise exception 'student_not_found';
  end if;

  if not (coalesce(public.is_admin_or_trainer(), false) or coalesce(v_student_owner = auth.uid(), false)) then
    raise exception 'not_allowed';
  end if;

  select *
  into v_item
  from gamification.cosmetic_items_catalog
  where slug = p_item_slug
    and is_active = true;

  if v_item.slug is null then
    raise exception 'item_not_found';
  end if;

  select exists (
    select 1
    from gamification.student_cosmetic_items sci
    where sci.student_id = p_student_id
      and sci.item_slug = p_item_slug
  )
  into v_owned;

  if not v_owned then
    raise exception 'item_not_owned';
  end if;

  insert into gamification.student_cosmetic_equipment (
    student_id,
    updated_at
  ) values (
    p_student_id,
    v_now
  )
  on conflict (student_id) do nothing;

  if v_item.category = 'frame' then
    update gamification.student_cosmetic_equipment
    set frame_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  elsif v_item.category = 'background' then
    update gamification.student_cosmetic_equipment
    set background_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  elsif v_item.category = 'badge' then
    update gamification.student_cosmetic_equipment
    set badge_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  elsif v_item.category = 'effect' then
    update gamification.student_cosmetic_equipment
    set effect_item_slug = v_item.slug, updated_at = v_now
    where student_id = p_student_id;
  else
    raise exception 'unsupported_category';
  end if;

  return jsonb_build_object(
    'ok', true,
    'itemSlug', v_item.slug,
    'category', v_item.category
  );
end;
$$;
revoke all on function public.equip_gamification_item(uuid, text) from public, anon;
grant execute on function public.equip_gamification_item(uuid, text) to authenticated;


create or replace function public.unequip_gamification_item(
  p_student_id uuid,
  p_category text
)
returns jsonb
language plpgsql
security definer
set search_path = public, gamification, core
as $$
declare
  v_student_owner uuid;
  v_now timestamptz := timezone('utc', now());
begin
  if auth.uid() is null then raise exception 'not_allowed'; end if;
  select s.user_id
  into v_student_owner
  from core.students s
  where s.id = p_student_id;

  if v_student_owner is null then
    raise exception 'student_not_found';
  end if;

  if not (coalesce(public.is_admin_or_trainer(), false) or coalesce(v_student_owner = auth.uid(), false)) then
    raise exception 'not_allowed';
  end if;

  insert into gamification.student_cosmetic_equipment (
    student_id,
    updated_at
  ) values (
    p_student_id,
    v_now
  )
  on conflict (student_id) do nothing;

  if p_category = 'frame' then
    update gamification.student_cosmetic_equipment
    set frame_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  elsif p_category = 'background' then
    update gamification.student_cosmetic_equipment
    set background_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  elsif p_category = 'badge' then
    update gamification.student_cosmetic_equipment
    set badge_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  elsif p_category = 'effect' then
    update gamification.student_cosmetic_equipment
    set effect_item_slug = null, updated_at = v_now
    where student_id = p_student_id;
  else
    raise exception 'unsupported_category';
  end if;

  return jsonb_build_object(
    'ok', true,
    'category', p_category
  );
end;
$$;
revoke all on function public.unequip_gamification_item(uuid, text) from public, anon;
grant execute on function public.unequip_gamification_item(uuid, text) to authenticated;
