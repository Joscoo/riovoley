begin;

create table if not exists gamification.cosmetic_items_catalog (
  slug text primary key,
  name text not null,
  description text not null,
  rarity text not null default 'common',
  category text not null,
  price_coins integer not null default 0 check (price_coins >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists gamification.student_cosmetic_items (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references core.students(id) on delete cascade,
  item_slug text not null references gamification.cosmetic_items_catalog(slug) on delete cascade,
  source_type text not null default 'purchase',
  metadata jsonb not null default '{}'::jsonb,
  acquired_at timestamptz not null default timezone('utc', now()),
  unique (student_id, item_slug)
);

create table if not exists gamification.student_cosmetic_equipment (
  student_id uuid primary key references core.students(id) on delete cascade,
  frame_item_slug text references gamification.cosmetic_items_catalog(slug) on delete set null,
  background_item_slug text references gamification.cosmetic_items_catalog(slug) on delete set null,
  badge_item_slug text references gamification.cosmetic_items_catalog(slug) on delete set null,
  effect_item_slug text references gamification.cosmetic_items_catalog(slug) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

insert into gamification.cosmetic_items_catalog (slug, name, description, rarity, category, price_coins, sort_order, metadata)
values
  ('frame_bronce_club', 'Marco Bronce Club', 'Un marco inicial para destacar tu perfil en los rankings.', 'common', 'frame', 0, 10, '{"accent":"amber"}'::jsonb),
  ('frame_cian_ruta', 'Marco Ruta Cian', 'Marco limpio para quienes ya marcan presencia constante.', 'common', 'frame', 14, 20, '{"accent":"cyan"}'::jsonb),
  ('background_olas_noche', 'Fondo Olas Nocturnas', 'Fondo oscuro con energia de partido.', 'common', 'background', 18, 30, '{"palette":"night"}'::jsonb),
  ('background_cancha_dorada', 'Fondo Cancha Dorada', 'Fondo brillante para mostrar progreso premium.', 'rare', 'background', 28, 40, '{"palette":"gold"}'::jsonb),
  ('badge_primer_impulso', 'Insignia Primer Impulso', 'Sello para quienes ya arrancaron su ruta competitiva.', 'common', 'badge', 10, 50, '{"icon":"spark"}'::jsonb),
  ('badge_muro_constante', 'Insignia Muro Constante', 'Sello visible para reforzar presencia en rankings.', 'rare', 'badge', 22, 60, '{"icon":"shield"}'::jsonb),
  ('effect_aura_oro', 'Aura Oro Ligera', 'Efecto visual suave para perfiles con monedas ahorradas.', 'epic', 'effect', 36, 70, '{"glow":"gold"}'::jsonb),
  ('effect_rayo_cian', 'Rastro Cian', 'Efecto energico para quienes quieren una presencia mas viva.', 'epic', 'effect', 42, 80, '{"glow":"cyan"}'::jsonb)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity,
  category = excluded.category,
  price_coins = excluded.price_coins,
  is_active = true,
  sort_order = excluded.sort_order,
  metadata = excluded.metadata;

alter table gamification.cosmetic_items_catalog enable row level security;
alter table gamification.student_cosmetic_items enable row level security;
alter table gamification.student_cosmetic_equipment enable row level security;

drop policy if exists gamification_cosmetic_catalog_read on gamification.cosmetic_items_catalog;
create policy gamification_cosmetic_catalog_read
on gamification.cosmetic_items_catalog
for select
to authenticated
using (true);

drop policy if exists gamification_cosmetic_catalog_admin_write on gamification.cosmetic_items_catalog;
create policy gamification_cosmetic_catalog_admin_write
on gamification.cosmetic_items_catalog
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists gamification_student_cosmetic_items_read on gamification.student_cosmetic_items;
create policy gamification_student_cosmetic_items_read
on gamification.student_cosmetic_items
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_cosmetic_items.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_cosmetic_items_admin_write on gamification.student_cosmetic_items;
create policy gamification_student_cosmetic_items_admin_write
on gamification.student_cosmetic_items
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

drop policy if exists gamification_student_cosmetic_equipment_read on gamification.student_cosmetic_equipment;
create policy gamification_student_cosmetic_equipment_read
on gamification.student_cosmetic_equipment
for select
to authenticated
using (
  public.is_admin_or_trainer()
  or exists (
    select 1
    from core.students s
    where s.id = student_cosmetic_equipment.student_id
      and s.user_id = auth.uid()
  )
);

drop policy if exists gamification_student_cosmetic_equipment_admin_write on gamification.student_cosmetic_equipment;
create policy gamification_student_cosmetic_equipment_admin_write
on gamification.student_cosmetic_equipment
for all
to authenticated
using (public.is_admin_or_trainer())
with check (public.is_admin_or_trainer());

grant usage on schema gamification to authenticated;
grant select on
  gamification.cosmetic_items_catalog,
  gamification.student_cosmetic_items,
  gamification.student_cosmetic_equipment
to authenticated;

create or replace function public.purchase_gamification_item(
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
  v_wallet gamification.currency_wallets%rowtype;
  v_owned boolean;
  v_now timestamptz := timezone('utc', now());
begin
  select s.user_id
  into v_student_owner
  from core.students s
  where s.id = p_student_id;

  if v_student_owner is null then
    raise exception 'student_not_found';
  end if;

  if not (public.is_admin_or_trainer() or v_student_owner = auth.uid()) then
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

  if v_owned then
    raise exception 'item_already_owned';
  end if;

  select *
  into v_wallet
  from gamification.currency_wallets
  where student_id = p_student_id
  for update;

  if v_wallet.student_id is null then
    insert into gamification.currency_wallets (
      student_id,
      balance,
      total_earned,
      total_spent,
      last_synced_at,
      updated_at
    ) values (
      p_student_id,
      0,
      0,
      0,
      v_now,
      v_now
    )
    returning *
    into v_wallet;
  end if;

  if v_wallet.balance < v_item.price_coins then
    raise exception 'insufficient_coins';
  end if;

  update gamification.currency_wallets
  set
    balance = balance - v_item.price_coins,
    total_spent = total_spent + v_item.price_coins,
    updated_at = v_now,
    last_synced_at = v_now
  where student_id = p_student_id;

  insert into gamification.currency_ledger (
    student_id,
    source_type,
    source_ref,
    coins_delta,
    label,
    description,
    metadata,
    occurred_at,
    created_at
  ) values (
    p_student_id,
    'cosmetic_purchase',
    p_item_slug,
    -v_item.price_coins,
    'Compra cosmetica',
    format('Compraste %s para tu perfil.', v_item.name),
    jsonb_build_object('itemSlug', v_item.slug, 'category', v_item.category),
    v_now,
    v_now
  );

  insert into gamification.student_cosmetic_items (
    student_id,
    item_slug,
    source_type,
    metadata,
    acquired_at
  ) values (
    p_student_id,
    p_item_slug,
    'purchase',
    jsonb_build_object('priceCoins', v_item.price_coins),
    v_now
  );

  return jsonb_build_object(
    'ok', true,
    'itemSlug', v_item.slug,
    'priceCoins', v_item.price_coins
  );
end;
$$;

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
  select s.user_id
  into v_student_owner
  from core.students s
  where s.id = p_student_id;

  if v_student_owner is null then
    raise exception 'student_not_found';
  end if;

  if not (public.is_admin_or_trainer() or v_student_owner = auth.uid()) then
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

grant execute on function public.purchase_gamification_item(uuid, text) to authenticated;
grant execute on function public.equip_gamification_item(uuid, text) to authenticated;

create or replace view public.gamification_cosmetic_items_catalog
with (security_invoker = true) as
select * from gamification.cosmetic_items_catalog;

create or replace view public.gamification_student_cosmetic_items
with (security_invoker = true) as
select * from gamification.student_cosmetic_items;

create or replace view public.gamification_student_cosmetic_equipment
with (security_invoker = true) as
select * from gamification.student_cosmetic_equipment;

grant select on
  public.gamification_cosmetic_items_catalog,
  public.gamification_student_cosmetic_items,
  public.gamification_student_cosmetic_equipment
to authenticated;

commit;
