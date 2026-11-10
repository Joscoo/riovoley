const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const nativeFetch=globalThis.fetch;
const {local,admin,ok,fixture}=require('./local-fixture.cjs');
const guardedFetch=globalThis.fetch;
globalThis.fetch=(input,options)=>{
 const url=new URL(typeof input==='string'?input:input.url||String(input));
 if(url.origin==='http://127.0.0.1:55321'&&url.pathname==='/functions/v1/delete-auth-user')return nativeFetch('http://127.0.0.1:6161/delete-auth-user',{...options,redirect:'error'});
 return guardedFetch(input,options);
};
const {supabase}=require('../../src/config/supabase.js');
const {SupabaseUserManagementRepository}=require('../../src/features/user-management/infrastructure/repositories/supabaseUserManagementRepository.js');
let administrator,trainer,suspended,legacy,targetAdmin,athlete,tokens={};
const auth=async person=>{
 const client=createClient(local.apiUrl,local.anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
 return ok(await client.auth.signInWithPassword(person)).session.access_token;
};
const post=async(path,token,body={})=>{
 assert.ok(['/send-push','/delete-auth-user'].includes(path));
 return nativeFetch('http://127.0.0.1:6161'+path,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),redirect:'error'});
};
before(async()=>{
 administrator=await fixture();trainer=await fixture();suspended=await fixture();legacy=await fixture();targetAdmin=await fixture();athlete=await fixture();
 for(const [p,role,flag] of [[administrator,'administrador',false],[trainer,'entrenador',false],[suspended,'administrador',true],[targetAdmin,'administrador',false]])ok(await admin.from('users').update({role,suspended:flag}).eq('id',p.user.id));
 ok(await admin.from('students').delete().eq('user_id',legacy.user.id));ok(await admin.from('users').delete().eq('id',legacy.user.id));ok(await admin.from('user_profiles').upsert({id:legacy.user.id,full_name:'Fixture legado',role:'administrador'}));
 for(const [name,person] of Object.entries({administrator,trainer,suspended,legacy,athlete}))tokens[name]=await auth(person);
});
test('H01: push HTTP sin sesión devuelve 401',async()=>{assert.equal((await post('/send-push',null)).status,401);});
test('H02: push HTTP de personal suspendido devuelve 403',async()=>{assert.equal((await post('/send-push',tokens.suspended)).status,403);});
test('H03: perfil legado privilegiado sin usuario canónico no envía push',async()=>{assert.equal((await post('/send-push',tokens.legacy)).status,403);});
test('H04: administrador activo supera autorización y recibe validación 400 sin enviar',async()=>{const r=await post('/send-push',tokens.administrator);assert.equal(r.status,400);assert.equal((await r.json()).code,'INVALID_INPUT');});
test('H05: entrenador no elimina Auth de administrador por HTTP',async()=>{assert.equal((await post('/delete-auth-user',tokens.trainer,{userId:targetAdmin.user.id})).status,403);assert.equal(ok(await admin.auth.admin.getUserById(targetAdmin.user.id)).user.id,targetAdmin.user.id);});
test('H06: administrador tampoco elimina cuenta administrativa desde este módulo',async()=>{assert.equal((await post('/delete-auth-user',tokens.administrator,{userId:targetAdmin.user.id})).status,403);});
test('H07: repositorio real de entrenador elimina Auth y filas de un atleta autorizado',async()=>{
 const target=await fixture();ok(await supabase.auth.signInWithPassword(trainer));
 await new SupabaseUserManagementRepository().deleteUser(target.user.id,'atleta');
 assert.ok((await admin.auth.admin.getUserById(target.user.id)).error);
 assert.equal(ok(await admin.from('users').select('id').eq('id',target.user.id)).length,0);assert.equal(ok(await admin.from('students').select('id').eq('user_id',target.user.id)).length,0);
});
test('H08: atleta canónico no obtiene autorización de push',async()=>{assert.equal((await post('/send-push',tokens.athlete)).status,403);});
test('H09: entrenador no elimina a otro entrenador por HTTP',async()=>{assert.equal((await post('/delete-auth-user',tokens.trainer,{userId:trainer.user.id})).status,403);});
test('H10: repositorio real de administrador elimina otro atleta autorizado',async()=>{
 const target=await fixture();ok(await supabase.auth.signInWithPassword(administrator));await new SupabaseUserManagementRepository().deleteUser(target.user.id,'atleta');
 assert.ok((await admin.auth.admin.getUserById(target.user.id)).error);assert.equal(ok(await admin.from('user_profiles').select('id').eq('id',target.user.id)).length,0);
});
test('H11: token inválido se rechaza por HTTP con 401',async()=>{assert.equal((await post('/send-push','invalid')).status,401);});
test('H12: método no permitido devuelve 405',async()=>{assert.equal((await nativeFetch('http://127.0.0.1:6161/send-push',{method:'GET',redirect:'error'})).status,405);});
