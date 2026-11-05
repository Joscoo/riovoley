const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs');
const {connect}=require('./local-db.cjs');
const mode=process.argv[2];
assert.ok(['preflight','apply','rollback'].includes(mode),'Indicar preflight, apply o rollback');
const migration=path.join(h.root,'database/security/local/20261029141114_riovoley_security_local.sql');
const q=s=>'"'+s.replaceAll('"','""')+'"';
async function execute(){
 const db=await connect();
 try{
  await db.query("SELECT set_config('riovoley.audit.local_project','riovoley-e2e-local',false)");
  let sql=fs.readFileSync(migration,'utf8');
  if(mode==='preflight'){
   const functions=[...JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/antes-funciones.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/antes-autorizadores.json'),'utf8'))];
   const namespaceFile=path.join(h.evidence,'seguridad/antes-namespace.json');
   const schemaUsage=fs.existsSync(namespaceFile)?JSON.parse(fs.readFileSync(namespaceFile,'utf8')).authenticatedHadSecurityUsage:(await db.query("SELECT has_schema_privilege('authenticated','security','USAGE') AS allowed")).rows[0].allowed;
   h.write('seguridad/antes-namespace.json',{authenticatedHadSecurityUsage:schemaUsage});
   const rollback=[`-- Reversión exclusiva del entorno local verificado. No usar en producción.\nBEGIN;\nDO $$ BEGIN IF current_setting('riovoley.audit.local_project',true) IS DISTINCT FROM 'riovoley-e2e-local' THEN RAISE EXCEPTION 'Solo local'; END IF; END $$;`,
    `DO $$ DECLARE p record; BEGIN FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE policyname LIKE 'rio_%' AND schemaname IN ('gamification','billing','training','core','profiles') LOOP EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename);END LOOP;END $$;`,
    'DROP TRIGGER IF EXISTS rio_guard_privileges ON core.users;','DROP TRIGGER IF EXISTS rio_guard_privileges ON profiles.user_profiles;','DROP TRIGGER IF EXISTS rio_preserve_spending ON gamification.currency_wallets;',
    ...['currency_wallets','currency_ledger','student_cosmetic_items','student_cosmetic_equipment'].map(t=>`DROP TRIGGER IF EXISTS rio_active_actor ON gamification.${t};`),
    'DROP TRIGGER IF EXISTS rio_active_actor ON core.users;','DROP TRIGGER IF EXISTS rio_active_actor ON profiles.user_profiles;',
    'DROP TRIGGER IF EXISTS rio_staff_source ON core.students;','DROP TRIGGER IF EXISTS rio_staff_source ON training.attendances;','DROP TRIGGER IF EXISTS rio_staff_source ON training.physical_tests;',
    'DROP TRIGGER IF EXISTS rio_cosmetic_unlock ON gamification.student_cosmetic_items;',
    'DROP FUNCTION IF EXISTS public.claim_daily_login_reward();','DROP INDEX IF EXISTS gamification.rio_daily_login_once;','DROP INDEX IF EXISTS core.rio_student_user_identity;',
    ...functions.filter(f=>/^(is_admin|is_admin_or_trainer)\(/.test(f.signature)).map(f=>f.definition+';'),
    ...['guard_user_privileges','preserve_wallet_spending','guard_active_gamification_actor','guard_staff_sources','guard_cosmetic_unlock','is_active_staff','is_active_admin','is_active_user'].map(n=>`DROP FUNCTION IF EXISTS security.${n}();`),
    'ALTER FUNCTION public.soft_delete_payment_legacy_bigint(bigint) RENAME TO soft_delete_payment;','ALTER FUNCTION public.restore_payment_legacy_bigint(bigint) RENAME TO restore_payment;'
   ];
   for(const f of functions.filter(f=>/^(soft_delete_payment|restore_payment|audit_payments|handle_new_user|is_admin|is_admin_or_trainer)\(/.test(f.signature))){
    rollback.push(f.definition+';',`REVOKE ALL ON FUNCTION public.${f.signature} FROM PUBLIC,anon,authenticated,service_role;`);
    for(const a of f.acl||[])rollback.push(`GRANT ${a.privilege} ON FUNCTION public.${f.signature} TO ${a.role==='PUBLIC'?'PUBLIC':q(a.role)}${a.grantable?' WITH GRANT OPTION':''};`);
   }
   if(!schemaUsage)rollback.push('REVOKE USAGE ON SCHEMA security FROM authenticated;');
   rollback.push("NOTIFY pgrst,'reload schema';COMMIT;");const rollbackFile=h.write('seguridad/rollback-local.sql',rollback.join('\n'));fs.writeFileSync(path.join(h.runtime,'security-rollback-current.txt'),rollbackFile);
   sql=sql.replace(/COMMIT;\s*$/,'ROLLBACK;');
  }
  if(mode==='rollback'){
   const file=fs.readFileSync(path.join(h.runtime,'security-rollback-current.txt'),'utf8');assert.ok(file.startsWith(path.join(h.evidence,'seguridad')+path.sep));sql=fs.readFileSync(file,'utf8');
  }
  await db.query(sql);
  h.write('seguridad/'+mode+'.json',{success:true,mode,onlyLocal:true,productionChanged:false,sqlFile:path.relative(h.root,migration),migrationSha256:crypto.createHash('sha256').update(fs.readFileSync(migration)).digest('hex'),executedSqlSha256:crypto.createHash('sha256').update(sql).digest('hex'),transaction:mode==='preflight'?'ROLLBACK':'COMMIT'});
  console.log(JSON.stringify({success:true,mode,onlyLocal:true}));
 }finally{await db.end();}
}
execute().catch(e=>{h.write('seguridad/'+mode+'-error.json',{success:false,code:e.code,message:e.message});console.error(e.message);process.exitCode=1;});
