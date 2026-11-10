const {test}=require('node:test');
const assert=require('node:assert/strict');
const {forwardSQL,returnSQL}=require('../../scripts/audit/production/sql-packet.cjs');
const fingerprint='a'.repeat(32),query='SELECT '+"'"+fingerprint+"'"+' AS fingerprint';
const snapshot={functions:[],policies:[],triggers:[],indexes:[]};
const preconditions={fingerprint,preconditions:{functions:[],security_schema_authenticated_usage:false}};
const local="BEGIN;\nDO $guard$\nBEGIN\n IF current_setting('riovoley.audit.local_project',true) IS DISTINCT FROM 'riovoley-e2e-local' THEN RAISE EXCEPTION 'local'; END IF;\nEND;\n$guard$;\nSELECT 1;\nCOMMIT;";
test('avance exige autorización operativa y huella; no acepta deriva silenciosa',()=>{
 const sql=forwardSQL(snapshot,preconditions,query,local);
 assert.match(sql,/riovoley\.release\.approval/);assert.match(sql,/lock_timeout/);
 assert.match(sql,/current_user <> 'postgres'/);
 assert.match(sql,/13|aaaaaaaa/);assert.match(sql,/Deriva/);
 assert.doesNotMatch(sql,/audit\.local_project/);
});
test('rechaza catálogos con objetos reservados para el paquete',()=>{
 assert.throws(()=>forwardSQL({...snapshot,functions:[{schema:'public',name:'claim_daily_login_reward'}]},preconditions,query,local),/existente/);
 assert.throws(()=>forwardSQL({...snapshot,policies:[{policyname:'rio_existing'}]},preconditions,query,local),/existente/);
});
test('retorno conserva opción de concesión y exige huella del estado aplicado',()=>{
 const s={...snapshot,functions:[{schema:'public',name:'example',identity_args:'',definition:'CREATE OR REPLACE FUNCTION public.example() RETURNS int LANGUAGE sql AS $$ SELECT 1 $$',owner:'postgres'}]};
 const pc={...preconditions,preconditions:{...preconditions.preconditions,functions:[{schema:'public',name:'example',identity_args:'',acl:[{role:'authenticated',privilege:'EXECUTE',grantable:true}]}]}};
 const sql=returnSQL(s,pc,query,'b'.repeat(32));
 assert.match(sql,/WITH GRANT OPTION/);assert.match(sql,/bbbbbbbb/);assert.match(sql,/aaaaaaaa/);assert.match(sql,/ALTER FUNCTION.*OWNER TO/);
});
