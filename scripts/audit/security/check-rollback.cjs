const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const {connect}=require('./local-db.cjs');
(async()=>{const db=await connect();try{
 const before=[...JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/antes-funciones.json'),'utf8')),...JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/antes-autorizadores.json'),'utf8'))];
 for(const f of before){
  const result=await db.query('SELECT pg_get_functiondef(to_regprocedure($1)) AS definition',[f.signature]);assert.equal(result.rows[0].definition,f.definition,f.signature);
  const acl=(await db.query("SELECT CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END AS role,a.privilege_type AS privilege,a.is_grantable AS grantable FROM pg_proc p CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a WHERE p.oid=to_regprocedure($1)",[f.signature])).rows;
  const normalized=rows=>rows.map(a=>`${a.role}:${a.privilege}:${a.grantable}`).sort();assert.deepEqual(normalized(acl),normalized(f.acl||[]),f.signature+' ACL');
 }
 const policies=(await db.query("SELECT * FROM pg_policies WHERE schemaname IN ('core','billing','gamification','profiles') ORDER BY schemaname,tablename,policyname")).rows;
 assert.deepEqual(policies,JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/antes-politicas.json'),'utf8')));
 assert.equal((await db.query("SELECT to_regprocedure('public.claim_daily_login_reward()') IS NULL AS removed")).rows[0].removed,true);
 h.write('seguridad/rollback-verificado.json',{passed:true,functionsRestored:before.length,functionAclsRestored:before.length,policiesRestored:policies.length,newDailyRpcRemoved:true,scope:'Reversión de definiciones, ACL de funciones y políticas comparadas, sin restaurar datos descartables creados por pruebas ni afirmar un respaldo de producción.'});
 console.log(JSON.stringify({passed:true,functions:before.length,policies:policies.length}));
}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
