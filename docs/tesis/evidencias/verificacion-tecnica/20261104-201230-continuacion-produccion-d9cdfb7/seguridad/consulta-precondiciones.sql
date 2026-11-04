BEGIN READ ONLY;
SELECT json_build_object(
 'rls',(SELECT json_agg(x ORDER BY table_name) FROM (
  SELECT c.relname AS table_name,c.relrowsecurity AS enabled,c.relforcerowsecurity AS forced,
   (SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid) AS policies
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='gamification' AND c.relname IN ('xp_ledger','login_rewards')) x),
 'dailyRewardRpcPresent',to_regprocedure('public.claim_daily_login_reward()') IS NOT NULL,
 'duplicate_student_user_groups',(SELECT count(*) FROM (SELECT user_id FROM core.students WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*)>1) d),
 'duplicate_daily_login_groups',(SELECT count(*) FROM (SELECT student_id,source_ref FROM gamification.xp_ledger WHERE source_type='daily_login' AND source_ref IS NOT NULL GROUP BY student_id,source_ref HAVING count(*)>1) d),
 'daily_login_null_refs',(SELECT count(*) FROM gamification.xp_ledger WHERE source_type='daily_login' AND source_ref IS NULL),
 'noncanonical_roles',(SELECT count(*) FROM core.users WHERE role IS NULL OR role NOT IN ('administrador','admin','entrenador','usuario','estudiante')),
 'postgresSuperuser',(SELECT rolsuper FROM pg_roles WHERE rolname='postgres')
) AS summary;
COMMIT;
