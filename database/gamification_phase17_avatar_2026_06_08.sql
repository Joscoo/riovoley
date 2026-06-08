begin;

alter table gamification.student_identity
  add column if not exists avatar_style text not null default 'adventurer-neutral';

update gamification.student_identity
set avatar_style = coalesce(nullif(avatar_style, ''), 'adventurer-neutral')
where avatar_style is null
   or avatar_style = '';

commit;
