const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const {connect}=require('./local-db.cjs');
(async()=>{const db=await connect();try{
 const rls=(await db.query("SELECT n.nspname AS schema,c.relname AS table,c.relrowsecurity AS rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN ('gamification','core','billing','training','profiles') ORDER BY n.nspname,c.relname")).rows;
 for(const table of ['xp_ledger','login_rewards','currency_wallets','currency_ledger'])assert.equal(rls.find(r=>r.schema==='gamification'&&r.table===table)?.rls,true,table);
 const policies=(await db.query("SELECT * FROM pg_policies WHERE schemaname IN ('gamification','core','billing','training','profiles') ORDER BY schemaname,tablename,policyname")).rows;
 h.write('herramientas-entorno.json',{os:require('node:os').type(),release:require('node:os').release(),architecture:process.arch,node:process.version,postgres:(await db.query('SHOW server_version')).rows[0].server_version,driver:'pg8.23.1',backend:'127.0.0.1:55321 / PostgreSQL127.0.0.1:55322',environmentValuesPublished:false});
 const functions=(await db.query("SELECT p.oid::regprocedure::text AS signature,p.prosecdef AS security_definer,p.proconfig AS config,has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('claim_daily_login_reward','soft_delete_payment','restore_payment','soft_delete_payment_legacy_bigint','restore_payment_legacy_bigint','handle_new_user','is_admin','is_admin_or_trainer') ORDER BY p.proname")).rows;
 for(const row of functions.filter(r=>/payment/.test(r.signature))){assert.equal(row.anon_execute,false);if(/legacy/.test(row.signature))assert.equal(row.authenticated_execute,false);else assert.equal(row.security_definer,false);}
 h.write('seguridad/rls-final.json',rls);h.write('seguridad/politicas-finales.json',policies);h.write('seguridad/funciones-finales.json',functions);
 h.write('seguridad/verificacion-catalogo.json',{passed:true,rlsChecked:['gamification.xp_ledger','gamification.login_rewards','gamification.currency_wallets','gamification.currency_ledger'],policies:policies.length,rpcUuidInvoker:true,anonymousPaymentRpc:false,legacyWebExecute:false,localOnly:true});
 console.log(JSON.stringify({passed:true,policies:policies.length,functions:functions.length}));
}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
