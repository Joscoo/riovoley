-- Fix: sincronizar columna avatar_style en gamification.student_identity y recargar cache PostgREST
-- Fecha: 2026-06-09

begin;

alter table gamification.student_identity
  add column if not exists avatar_style text not null default 'adventurer-neutral';

update gamification.student_identity
set avatar_style = coalesce(nullif(avatar_style, ''), 'adventurer-neutral')
where avatar_style is null
   or avatar_style = '';

create or replace view public.gamification_student_identity
with (security_invoker = true) as
select * from gamification.student_identity;

grant select, insert, update on public.gamification_student_identity to authenticated;

-- Forzar recarga de cache de PostgREST para que reconozca la nueva columna
select pg_notify('pgrst', 'reload schema');

commit;


select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'gamification_student_identity'
    and column_name = 'avatar_style'
) as has_avatar_style;