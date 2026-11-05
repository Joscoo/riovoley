SELECT jsonb_build_object(
 'captured_at',current_timestamp,
 'duplicate_student_user_groups',(SELECT count(*) FROM (SELECT user_id FROM core.students WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*)>1) d),
 'duplicate_daily_login_groups',(SELECT count(*) FROM (SELECT student_id,source_ref FROM gamification.xp_ledger WHERE source_type='daily_login' AND source_ref IS NOT NULL GROUP BY student_id,source_ref HAVING count(*)>1) d),
 'daily_login_null_refs',(SELECT count(*) FROM gamification.xp_ledger WHERE source_type='daily_login' AND source_ref IS NULL),
 'noncanonical_roles',(SELECT count(*) FROM core.users WHERE role IS NULL OR role NOT IN ('administrador','admin','entrenador','usuario','estudiante')),
 'functions',(SELECT jsonb_agg(jsonb_build_object('schema',n.nspname,'name',p.proname,'identity_args',pg_get_function_identity_arguments(p.oid),'owner',pg_get_userbyid(p.proowner),'config',p.proconfig,'security_definer',p.prosecdef,'acl',(SELECT jsonb_agg(jsonb_build_object('role',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,'privilege',a.privilege_type,'grantable',a.is_grantable) ORDER BY a.grantee,a.privilege_type) FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a)) ORDER BY n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.prokind='f' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training') AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')),
 'security_schema_authenticated_usage',has_schema_privilege('authenticated','security','USAGE')
) AS preconditions;
