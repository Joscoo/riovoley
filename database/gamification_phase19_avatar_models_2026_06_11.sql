begin;

alter table gamification.student_identity
  add column if not exists avatar_model_slug text;

update gamification.student_identity
set avatar_model_slug = null
where avatar_model_slug = '';

create or replace view public.gamification_student_identity
with (security_invoker = true) as
select * from gamification.student_identity;

grant select, insert, update on public.gamification_student_identity to authenticated;

commit;
