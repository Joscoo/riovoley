const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const safety=require('../../scripts/e2e/local/safety.cjs');
const local=safety.readLocal();
// Configurar antes de importar cualquier módulo del producto; no cargar dotenv.
Object.assign(process.env,safety.buildWebEnv(local));
const nativeFetch=globalThis.fetch;
globalThis.fetch=(input,options)=>{
  const url=new URL(typeof input==='string'?input:input.url||String(input));
  assert.ok(['http://127.0.0.1:55321','http://127.0.0.1:55324'].includes(url.origin),'Bloqueado destino externo en integración local');
  return nativeFetch(input,{...options,redirect:'error'});
};
const admin=createClient(local.apiUrl,local.serviceRoleKey,{auth:{autoRefreshToken:false,persistSession:false}});
const ok=result=>{assert.equal(result.error?.message||null,null);return result.data;};
async function fixture() {
  const suffix=crypto.randomBytes(8).toString('hex');
  const email='closure.'+suffix+'@example.test',password=crypto.randomBytes(24).toString('base64url')+'aA1!';
  fs.appendFileSync(path.join(safety.runtime,'observed-secrets.jsonl'),JSON.stringify({password})+'\n');
  const user=ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role:'estudiante'}})).user;
  ok(await admin.from('users').insert({id:user.id,email,nombre:'Fixture',apellido:'Cierre',role:'estudiante',fecha_nacimiento:'2008-01-15',first_login:false}));
  ok(await admin.from('user_profiles').upsert({id:user.id,full_name:'Fixture Cierre',role:'estudiante'}));
  const student=ok(await admin.from('students').insert({user_id:user.id,categoria:'iniciacion_hombres',fecha_nacimiento:'2008-01-15'}).select().single());
  return {user,student,email,password};
}
module.exports={local,admin,ok,fixture};
