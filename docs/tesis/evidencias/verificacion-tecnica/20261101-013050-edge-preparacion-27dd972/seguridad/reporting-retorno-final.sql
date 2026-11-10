-- RETORNO COMPLEMENTARIO: ejecutar antes del retorno del paquete principal.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
SET LOCAL search_path=public,extensions;
DO $release_guard$
DECLARE actual text;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Ejecutar como postgres para conservar propietarios y ACL previstas'; END IF;
 IF current_setting('riovoley.release.approval',true) IS DISTINCT FROM 'reviewed-maintenance:mayvvlkvheagkojunzzb' OR current_setting('riovoley.release.window',true) IS DISTINCT FROM 'closed-to-clients' THEN
 RAISE EXCEPTION 'Paquete pendiente de autorizacion expresa, respaldo y ventana sin clientes';
 END IF;
 SELECT fingerprint INTO actual FROM (SELECT md5(string_agg(item,E'\n' ORDER BY item)) AS fingerprint
FROM (
 SELECT 'function:'||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||
 pg_get_userbyid(p.proowner)||':'||pg_get_functiondef(p.oid)||':'||COALESCE((
 SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable)
 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a),'') AS item
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.prokind='f' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
 UNION ALL
 SELECT 'policy:'||schemaname||'.'||tablename||':'||policyname||':'||permissive||':'||roles::text||':'||cmd||':'||COALESCE(qual,'')||':'||COALESCE(with_check,'')
 FROM pg_policies WHERE schemaname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'trigger:'||n.nspname||'.'||c.relname||':'||t.tgname||':'||t.tgenabled::text||':'||pg_get_triggerdef(t.oid)
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND (n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 OR (n.nspname='auth' AND t.tgname IN ('on_auth_user_created','trigger_sync_first_login_on_password_change','trigger_sync_last_login_from_auth')))
 UNION ALL
 SELECT 'relation:'||n.nspname||'.'||c.relname||':'||c.relkind::text||':'||c.relrowsecurity||':'||c.relforcerowsecurity||':'||COALESCE(c.reloptions::text,'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p','v') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull||':'||a.attidentity::text||':'||a.attgenerated::text||':'||COALESCE(pg_get_expr(d.adbin,d.adrelid),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'index:'||i.indisvalid||':'||i.indisready||':'||pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'view:'||n.nspname||'.'||c.relname||':'||pg_get_viewdef(c.oid,true)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='v' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 -- Exact compatibility pair: PG 17.11 distributes the varchar[] -> text[] cast
 -- when restoring this PG 17.4 CHECK. Both forms compare the same four literals.
 -- Every other expression, table or constraint remains byte sensitive.
 SELECT 'constraint:'||n.nspname||'.'||c.relname||':'||k.conname||':'||CASE
 WHEN n.nspname='public_content' AND c.relname='announcements' AND k.conname='announcements_priority_check'
 AND pg_get_constraintdef(k.oid)=$compat$CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('normal'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text])))$compat$
 THEN $compat$CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))$compat$
 ELSE pg_get_constraintdef(k.oid) END
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'relation_acl:'||n.nspname||'.'||c.relname||':'||pg_get_userbyid(c.relowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner))) a),'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','v','S') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'schema_acl:'||n.nspname||':'||pg_get_userbyid(n.nspowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a),'')
 FROM pg_namespace n WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'default_function_acl:'||pg_get_userbyid(d.defaclrole)||':'||COALESCE(n.nspname,'GLOBAL')||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(d.defaclacl) a),'')
 FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclobjtype='f' AND pg_get_userbyid(d.defaclrole)='postgres' AND (d.defaclnamespace=0 OR n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training'))
 UNION ALL
 SELECT 'enum:'||n.nspname||'.'||t.typname||':'||(SELECT string_agg(e.enumlabel,',' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid)
 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typtype='e' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'sequence:'||n.nspname||'.'||c.relname||':'||format_type(s.seqtypid,NULL)||':'||s.seqstart||':'||s.seqincrement||':'||s.seqmin||':'||s.seqmax||':'||s.seqcache||':'||s.seqcycle||':'||COALESCE((SELECT rn.nspname||'.'||r.relname||'.'||a.attname FROM pg_depend d JOIN pg_class r ON r.oid=d.refobjid JOIN pg_namespace rn ON rn.oid=r.relnamespace JOIN pg_attribute a ON a.attrelid=r.oid AND a.attnum=d.refobjsubid WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i')),'')
 FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column_acl:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||COALESCE((SELECT string_agg((CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END)||'/'||x.privilege_type||'/'||x.is_grantable::text,',' ORDER BY (CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END),x.privilege_type,x.is_grantable) FROM aclexplode(a.attacl) x),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
) objects) captured;
 IF actual IS DISTINCT FROM '38434a2af96ad410967032b00a0828ac' THEN RAISE EXCEPTION 'Deriva del catalogo: abortar y reconstruir el paquete'; END IF;
END;
$release_guard$;
REVOKE SELECT ON reporting.report_definitions FROM service_role;
REVOKE SELECT,INSERT,UPDATE,DELETE ON reporting.report_runs,reporting.report_artifacts FROM service_role;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='120s';
SET LOCAL search_path=public,extensions;
DO $release_guard$
DECLARE actual text;
BEGIN
 IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Ejecutar como postgres para conservar propietarios y ACL previstas'; END IF;
 IF current_setting('riovoley.release.approval',true) IS DISTINCT FROM 'reviewed-maintenance:mayvvlkvheagkojunzzb' OR current_setting('riovoley.release.window',true) IS DISTINCT FROM 'closed-to-clients' THEN
 RAISE EXCEPTION 'Paquete pendiente de autorizacion expresa, respaldo y ventana sin clientes';
 END IF;
 SELECT fingerprint INTO actual FROM (SELECT md5(string_agg(item,E'\n' ORDER BY item)) AS fingerprint
FROM (
 SELECT 'function:'||n.nspname||'.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||'):'||
 pg_get_userbyid(p.proowner)||':'||pg_get_functiondef(p.oid)||':'||COALESCE((
 SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable)
 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a),'') AS item
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE p.prokind='f' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 AND NOT EXISTS(SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e')
 UNION ALL
 SELECT 'policy:'||schemaname||'.'||tablename||':'||policyname||':'||permissive||':'||roles::text||':'||cmd||':'||COALESCE(qual,'')||':'||COALESCE(with_check,'')
 FROM pg_policies WHERE schemaname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'trigger:'||n.nspname||'.'||c.relname||':'||t.tgname||':'||t.tgenabled::text||':'||pg_get_triggerdef(t.oid)
 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE NOT t.tgisinternal AND (n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 OR (n.nspname='auth' AND t.tgname IN ('on_auth_user_created','trigger_sync_first_login_on_password_change','trigger_sync_last_login_from_auth')))
 UNION ALL
 SELECT 'relation:'||n.nspname||'.'||c.relname||':'||c.relkind::text||':'||c.relrowsecurity||':'||c.relforcerowsecurity||':'||COALESCE(c.reloptions::text,'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.relkind IN ('r','p','v') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||format_type(a.atttypid,a.atttypmod)||':'||a.attnotnull||':'||a.attidentity::text||':'||a.attgenerated::text||':'||COALESCE(pg_get_expr(d.adbin,d.adrelid),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
 WHERE a.attnum>0 AND NOT a.attisdropped AND c.relkind IN ('r','p') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'index:'||i.indisvalid||':'||i.indisready||':'||pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'view:'||n.nspname||'.'||c.relname||':'||pg_get_viewdef(c.oid,true)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='v' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 -- Exact compatibility pair: PG 17.11 distributes the varchar[] -> text[] cast
 -- when restoring this PG 17.4 CHECK. Both forms compare the same four literals.
 -- Every other expression, table or constraint remains byte sensitive.
 SELECT 'constraint:'||n.nspname||'.'||c.relname||':'||k.conname||':'||CASE
 WHEN n.nspname='public_content' AND c.relname='announcements' AND k.conname='announcements_priority_check'
 AND pg_get_constraintdef(k.oid)=$compat$CHECK (((priority)::text = ANY (ARRAY[('low'::character varying)::text, ('normal'::character varying)::text, ('high'::character varying)::text, ('urgent'::character varying)::text])))$compat$
 THEN $compat$CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[])))$compat$
 ELSE pg_get_constraintdef(k.oid) END
 FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'relation_acl:'||n.nspname||'.'||c.relname||':'||pg_get_userbyid(c.relowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 's'::"char" ELSE 'r'::"char" END,c.relowner))) a),'')
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','p','v','S') AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'schema_acl:'||n.nspname||':'||pg_get_userbyid(n.nspowner)||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a),'')
 FROM pg_namespace n WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'default_function_acl:'||pg_get_userbyid(d.defaclrole)||':'||COALESCE(n.nspname,'GLOBAL')||':'||COALESCE((SELECT string_agg((CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END)||'/'||a.privilege_type||'/'||a.is_grantable::text,',' ORDER BY (CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END),a.privilege_type,a.is_grantable) FROM aclexplode(d.defaclacl) a),'')
 FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE d.defaclobjtype='f' AND pg_get_userbyid(d.defaclrole)='postgres' AND (d.defaclnamespace=0 OR n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training'))
 UNION ALL
 SELECT 'enum:'||n.nspname||'.'||t.typname||':'||(SELECT string_agg(e.enumlabel,',' ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid)
 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE t.typtype='e' AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'sequence:'||n.nspname||'.'||c.relname||':'||format_type(s.seqtypid,NULL)||':'||s.seqstart||':'||s.seqincrement||':'||s.seqmin||':'||s.seqmax||':'||s.seqcache||':'||s.seqcycle||':'||COALESCE((SELECT rn.nspname||'.'||r.relname||'.'||a.attname FROM pg_depend d JOIN pg_class r ON r.oid=d.refobjid JOIN pg_namespace rn ON rn.oid=r.relnamespace JOIN pg_attribute a ON a.attrelid=r.oid AND a.attnum=d.refobjsubid WHERE d.objid=c.oid AND d.classid='pg_class'::regclass AND d.deptype IN ('a','i')),'')
 FROM pg_sequence s JOIN pg_class c ON c.oid=s.seqrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
 UNION ALL
 SELECT 'column_acl:'||n.nspname||'.'||c.relname||'.'||a.attname||':'||COALESCE((SELECT string_agg((CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END)||'/'||x.privilege_type||'/'||x.is_grantable::text,',' ORDER BY (CASE WHEN x.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(x.grantee) END),x.privilege_type,x.is_grantable) FROM aclexplode(a.attacl) x),'')
 FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL AND n.nspname IN ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')
) objects) captured;
 IF actual IS DISTINCT FROM '500d15ffa5fa23aeddb47e5c21cd1d13' THEN RAISE EXCEPTION 'Deriva del catalogo: abortar y reconstruir el paquete'; END IF;
END;
$release_guard$;

COMMIT;
