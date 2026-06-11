begin;

alter table gamification.student_identity
  add column if not exists profile_image_mode text not null default 'avatar',
  add column if not exists profile_photo_path text,
  add column if not exists profile_photo_updated_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gamification_student_identity_profile_image_mode_check'
  ) then
    alter table gamification.student_identity
      add constraint gamification_student_identity_profile_image_mode_check
      check (profile_image_mode in ('avatar', 'photo'));
  end if;
end $$;

update gamification.student_identity
set profile_image_mode = 'avatar'
where profile_image_mode is null
   or profile_image_mode not in ('avatar', 'photo');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-images',
  'profile-images',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists profile_images_authenticated_select on storage.objects;
create policy profile_images_authenticated_select
on storage.objects
for select
to authenticated
using (bucket_id = 'profile-images');

drop policy if exists profile_images_authenticated_insert on storage.objects;
create policy profile_images_authenticated_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'students'
  and (
    public.is_admin_or_trainer()
    or exists (
      select 1
      from core.students s
      where s.id::text = (storage.foldername(name))[2]
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists profile_images_authenticated_update on storage.objects;
create policy profile_images_authenticated_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'students'
  and (
    public.is_admin_or_trainer()
    or exists (
      select 1
      from core.students s
      where s.id::text = (storage.foldername(name))[2]
        and s.user_id = auth.uid()
    )
  )
)
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'students'
  and (
    public.is_admin_or_trainer()
    or exists (
      select 1
      from core.students s
      where s.id::text = (storage.foldername(name))[2]
        and s.user_id = auth.uid()
    )
  )
);

drop policy if exists profile_images_authenticated_delete on storage.objects;
create policy profile_images_authenticated_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] = 'students'
  and (
    public.is_admin_or_trainer()
    or exists (
      select 1
      from core.students s
      where s.id::text = (storage.foldername(name))[2]
        and s.user_id = auth.uid()
    )
  )
);

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

grant execute on function public.unequip_gamification_item(uuid, text) to authenticated;

create or replace view public.gamification_student_identity
with (security_invoker = true) as
select * from gamification.student_identity;

grant select, insert, update on public.gamification_student_identity to authenticated;

commit;
