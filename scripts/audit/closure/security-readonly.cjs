const h=require('../../e2e/local/harness.cjs');
(async()=>{
  await h.sql('seguridad/catalogo-local-lectura', `BEGIN READ ONLY;
SELECT json_build_object('schema',n.nspname,'table',c.relname,'rls',c.relrowsecurity,'forced',c.relforcerowsecurity)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='gamification' AND c.relname IN ('xp_ledger','login_rewards','wallets','student_wallets');
SELECT row_to_json(p) FROM pg_policies p WHERE schemaname='gamification'
AND tablename IN ('xp_ledger','login_rewards','wallets','student_wallets');
SELECT json_build_object('function',p.oid::regprocedure::text,'security_definer',p.prosecdef,
'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),
'authenticated_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),
'definition',pg_get_functiondef(p.oid)) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('soft_delete_payment','restore_payment');
COMMIT;`);
})();
