const {test,before}=require('node:test');
const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const {runtime}=require('../../scripts/e2e/local/safety.cjs');
const {local,admin,ok,fixture}=require('./local-fixture.cjs');
let f,other,staff,trainer,suspended,studentClient,adminClient,trainerClient,suspendedClient,paymentId;
const anonymous=createClient(local.apiUrl,local.anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
const connect=async account=>{const client=createClient(local.apiUrl,local.anonKey,{auth:{persistSession:false,autoRefreshToken:false}});ok(await client.auth.signInWithPassword(account));return client;};
const denied=result=>assert.equal(result.error?.code,'42501','La operación debe rechazarse por autorización, no por ambigüedad o fallo interno');
const payment=async()=>ok(await admin.from('payments').select('*').eq('id',paymentId).single());
async function promote(person,role,suspend=false){ok(await admin.from('users').update({role,suspended:suspend}).eq('id',person.user.id));}
async function authOnly(){
 const email='security.'+crypto.randomBytes(8).toString('hex')+'@example.test',password=crypto.randomBytes(24).toString('base64url')+'aA1!';
 fs.appendFileSync(path.join(runtime,'observed-secrets.jsonl'),JSON.stringify({password})+'\n');
 return {email,user:ok(await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{role:'administrador'}})).user};
}
before(async()=>{
 f=await fixture();other=await fixture();staff=await fixture();trainer=await fixture();suspended=await fixture();
 await promote(staff,'administrador');await promote(trainer,'entrenador');await promote(suspended,'administrador',true);
 studentClient=await connect(f);adminClient=await connect(staff);trainerClient=await connect(trainer);suspendedClient=await connect(suspended);
 const p=ok(await admin.from('payments').insert({student_id:f.student.id,membership_type_id:1,fecha_pago:new Date().toISOString().slice(0,10)}).select().single());paymentId=p.id;
 ok(await admin.from('gamification_currency_wallets').upsert({student_id:f.student.id,balance:0,total_earned:0,total_spent:0}));
});
test('S01: anónimo no puede invocar borrado de pago',async()=>{denied(await anonymous.rpc('soft_delete_payment',{payment_id:paymentId}));});
test('S02: atleta no puede invocar borrado de su pago',async()=>{try{denied(await studentClient.rpc('soft_delete_payment',{payment_id:paymentId}));}finally{ok(await admin.from('payments').update({deleted_at:null}).eq('id',paymentId));}});
test('S03: atleta no modifica pago propio por REST',async()=>{
 const previous=await payment();try{await studentClient.from('payments').update({deleted_at:new Date().toISOString()}).eq('id',paymentId);assert.equal((await payment()).deleted_at,previous.deleted_at);}finally{ok(await admin.from('payments').update({deleted_at:previous.deleted_at}).eq('id',paymentId));}
});
test('S04: atleta no inserta XP arbitrario propio',async()=>{
 try{denied(await studentClient.from('gamification_xp_ledger').insert({student_id:f.student.id,source_type:'audit_security',source_ref:'attack',xp_delta:99999,label:'Fixture'}));}finally{ok(await admin.from('gamification_xp_ledger').delete().eq('student_id',f.student.id).eq('source_type','audit_security'));}
});
test('S05: atleta no cambia saldo propio por REST',async()=>{
 try{await studentClient.from('gamification_currency_wallets').update({balance:99999,total_earned:99999}).eq('student_id',f.student.id);assert.equal(ok(await admin.from('gamification_currency_wallets').select('*').eq('student_id',f.student.id).single()).balance,0);}finally{ok(await admin.from('gamification_currency_wallets').update({balance:0,total_earned:0,total_spent:0}).eq('student_id',f.student.id));}
});
test('S06: atleta no cambia fecha/recuento de recompensa por REST',async()=>{
 try{denied(await studentClient.from('gamification_login_rewards').upsert({user_id:f.user.id,reward_date:'2099-01-01',reward_count:999}));}finally{ok(await admin.from('gamification_login_rewards').delete().eq('user_id',f.user.id));}
});
test('S07: atleta tampoco inserta XP de otro atleta',async()=>{denied(await studentClient.from('gamification_xp_ledger').insert({student_id:other.student.id,source_type:'audit_security',xp_delta:99999,label:'Fixture'}));});
test('S08: recompensa diaria concurrente entrega exactamente ocho XP una vez',async()=>{
 const results=await Promise.all(Array.from({length:12},()=>studentClient.rpc('claim_daily_login_reward')));results.forEach(ok);
 assert.equal(results.filter(r=>r.data.awarded).length,1);assert.equal(results.reduce((n,r)=>n+r.data.xpDelta,0),8);
 const rows=ok(await admin.from('gamification_xp_ledger').select('*').eq('student_id',f.student.id).eq('source_type','daily_login'));
 assert.equal(rows.length,1);assert.equal(rows[0].xp_delta,8);
});
test('S09: RPC diaria no acepta actor, fecha o XP suministrados',async()=>{
 const result=await studentClient.rpc('claim_daily_login_reward',{user_id:other.user.id,reward_date:'2099-01-01',xp_delta:99999});assert.ok(result.error);
 assert.equal(ok(await admin.from('gamification_xp_ledger').select('*').eq('student_id',other.student.id).eq('source_type','daily_login')).length,0);
});
test('S10: atleta no se autoasigna rol administrador',async()=>{
 try{denied(await studentClient.from('users').update({role:'administrador'}).eq('id',f.user.id));}finally{await promote(f,'estudiante');}
});
test('S11: perfil alternativo tampoco permite autoasignación de rol',async()=>{
 try{denied(await studentClient.from('user_profiles').update({role:'administrador'}).eq('id',f.user.id));}finally{ok(await admin.from('user_profiles').update({role:'estudiante'}).eq('id',f.user.id));}
});
test('S12: usuario suspendido no puede quitar su suspensión',async()=>{
 try{
  const result=await suspendedClient.from('users').update({suspended:false}).eq('id',suspended.user.id).select('id');
  assert.ok(result.error?.code==='42501'||result.data?.length===0);
  assert.equal(ok(await admin.from('users').select('suspended').eq('id',suspended.user.id).single()).suspended,true);
 }finally{await promote(suspended,'administrador',true);}
});
test('S13: administrador borra y restaura por RPC UUID con auditoría',async()=>{
 assert.equal(ok(await adminClient.rpc('soft_delete_payment',{payment_id:paymentId})),true);assert.ok((await payment()).deleted_at);
 assert.equal(ok(await adminClient.rpc('restore_payment',{payment_id:paymentId})),true);assert.equal((await payment()).deleted_at,null);
 assert.equal(ok(await adminClient.rpc('restore_payment',{payment_id:paymentId})),false);
 assert.ok(ok(await adminClient.from('payments_audit').select('id').eq('payment_id',paymentId)).length>=2);
});
test('S14: entrenador activo conserva RPC de pagos',async()=>{
 assert.equal(ok(await trainerClient.rpc('soft_delete_payment',{payment_id:paymentId})),true);assert.equal(ok(await trainerClient.rpc('restore_payment',{payment_id:paymentId})),true);
});
test('S15: administrador suspendido no modifica pagos por REST',async()=>{
 try{await suspendedClient.from('payments').update({deleted_at:new Date().toISOString()}).eq('id',paymentId);assert.equal((await payment()).deleted_at,null);}finally{ok(await admin.from('payments').update({deleted_at:null}).eq('id',paymentId));}
});
test('S16: administrador suspendido no modifica pagos por RPC',async()=>{denied(await suspendedClient.rpc('soft_delete_payment',{payment_id:paymentId}));});
test('S17: atleta no puede regalarse inventario cosmético',async()=>{
 const item=ok(await admin.from('gamification_cosmetic_items_catalog').select('slug').limit(1))[0];assert.ok(item);
 try{denied(await studentClient.from('gamification_student_cosmetic_items').insert({student_id:f.student.id,item_slug:item.slug,source_type:'purchase'}));}finally{ok(await admin.from('gamification_student_cosmetic_items').delete().eq('student_id',f.student.id));}
});
test('S18: atleta no puede regalarse logros',async()=>{
 const item=ok(await admin.from('gamification_achievement_catalog').select('slug').limit(1))[0];assert.ok(item);
 try{denied(await studentClient.from('gamification_student_achievements').insert({student_id:f.student.id,achievement_slug:item.slug}));}finally{ok(await admin.from('gamification_student_achievements').delete().eq('student_id',f.student.id));}
});
test('S19: anónimo no obtiene recompensa diaria',async()=>{denied(await anonymous.rpc('claim_daily_login_reward'));});
test('S20: personal suspendido no obtiene recompensa diaria',async()=>{denied(await suspendedClient.rpc('claim_daily_login_reward'));});
test('S21: entrenador conserva suspensión y reactivación de un atleta',async()=>{
 try{
  ok(await trainerClient.from('users').update({suspended:true}).eq('id',other.user.id));
  assert.equal(ok(await admin.from('users').select('suspended').eq('id',other.user.id).single()).suspended,true);
  ok(await trainerClient.from('users').update({suspended:false}).eq('id',other.user.id));
  assert.equal(ok(await admin.from('users').select('suspended').eq('id',other.user.id).single()).suspended,false);
 }finally{await promote(other,'estudiante');}
});
test('S22: atleta no registra asistencia propia para fabricar progreso',async()=>{
 try{denied(await studentClient.from('attendances').insert({student_id:f.student.id,fecha:'2026-01-05',metodo_pago_id:1}));}finally{ok(await admin.from('attendances').delete().eq('student_id',f.student.id).eq('fecha','2026-01-05'));}
});
test('S23: atleta no registra evaluación propia para fabricar progreso',async()=>{
 try{denied(await studentClient.from('physical_tests').insert({student_id:f.student.id,fecha_test:'2026-01-05'}));}finally{ok(await admin.from('physical_tests').delete().eq('student_id',f.student.id).eq('fecha_test','2026-01-05'));}
});
test('S24: sincronización con gasto obsoleto conserva el gasto ya confirmado',async()=>{
 ok(await admin.from('gamification_currency_wallets').update({total_earned:100,total_spent:9,balance:91}).eq('student_id',f.student.id));
 ok(await adminClient.from('gamification_currency_wallets').update({total_earned:120,total_spent:0,balance:120}).eq('student_id',f.student.id));
 const row=ok(await admin.from('gamification_currency_wallets').select('*').eq('student_id',f.student.id).single());assert.equal(row.total_spent,9);assert.equal(row.balance,111);
});
test('S25: personal suspendido no crea un administrador mediante REST',async()=>{
 const person=await authOnly();try{denied(await suspendedClient.from('users').insert({id:person.user.id,email:person.email,nombre:'Fixture',apellido:'Seguridad',role:'administrador'}));}finally{ok(await admin.from('users').delete().eq('id',person.user.id));}
});
test('S26: personal suspendido no elimina otro usuario',async()=>{
 const original=ok(await admin.from('users').select('*').eq('id',other.user.id).single());
 try{await suspendedClient.from('users').delete().eq('id',other.user.id);assert.equal(ok(await admin.from('users').select('id').eq('id',other.user.id)).length,1);}finally{
  const writable=Object.fromEntries(['id','email','nombre','apellido','role','fecha_nacimiento','first_login','suspended'].map(k=>[k,original[k]]));
  ok(await admin.from('users').upsert(writable));ok(await admin.from('user_profiles').upsert({id:other.user.id,full_name:'Fixture Seguridad',role:'estudiante'}));
  const writableStudent=Object.fromEntries(['id','user_id','categoria','fecha_nacimiento'].map(k=>[k,other.student[k]]));ok(await admin.from('students').upsert(writableStudent));
 }
});
test('S27: personal suspendido no crea un administrador mediante RPC',async()=>{
 const person=await authOnly();try{denied(await suspendedClient.rpc('admin_insert_user',{p_id:person.user.id,p_email:person.email,p_role:'administrador',p_nombre:'Fixture',p_apellido:'Seguridad'}));}finally{ok(await admin.from('users').delete().eq('id',person.user.id));}
});
test('S28: atleta no duplica su identidad deportiva',async()=>{
 const id=crypto.randomUUID();try{denied(await studentClient.from('students').insert({id,user_id:f.user.id,categoria:'iniciacion_hombres',fecha_nacimiento:f.student.fecha_nacimiento}));}finally{ok(await admin.from('students').delete().eq('id',id));}
});
test('S29: atleta no altera su categoría usada en clasificación',async()=>{
 try{await studentClient.from('students').update({categoria:'perfeccionamiento_hombres'}).eq('id',f.student.id);assert.equal(ok(await admin.from('students').select('categoria').eq('id',f.student.id).single()).categoria,f.student.categoria);}finally{ok(await admin.from('students').update({categoria:f.student.categoria}).eq('id',f.student.id));}
});
test('S30: metadata editable de Auth no concede un perfil administrador',async()=>{
 const person=await authOnly();assert.equal(ok(await admin.from('user_profiles').select('role').eq('id',person.user.id).single()).role,'usuario');
});
test('S31: compra RPC rechaza cosmético bloqueado aunque exista saldo',async()=>{
 const template=ok(await admin.from('gamification_cosmetic_items_catalog').select('*').limit(1))[0];assert.ok(template);
 const slug='security-blocked-'+f.student.id.slice(0,8);
 ok(await admin.from('gamification_cosmetic_items_catalog').insert({...template,slug,price_coins:1,is_active:true,metadata:{unlockType:'level',unlockTarget:99}}));
 ok(await admin.from('gamification_currency_wallets').update({balance:100,total_earned:100,total_spent:0}).eq('student_id',f.student.id));
 try{
  denied(await studentClient.rpc('purchase_gamification_item',{p_student_id:f.student.id,p_item_slug:slug}));
  assert.equal(ok(await admin.from('gamification_currency_wallets').select('balance').eq('student_id',f.student.id).single()).balance,100);
 }finally{ok(await admin.from('gamification_student_cosmetic_items').delete().eq('student_id',f.student.id).eq('item_slug',slug));ok(await admin.from('gamification_cosmetic_items_catalog').delete().eq('slug',slug));}
});
test('S32: cambiar la relación deportiva no permite otra recompensa al mismo actor',async()=>{
 let replacement;
 try{
  ok(await admin.from('students').update({user_id:null}).eq('id',f.student.id));
  replacement=ok(await admin.from('students').insert({user_id:f.user.id,categoria:f.student.categoria,fecha_nacimiento:f.student.fecha_nacimiento}).select().single());
  const result=ok(await studentClient.rpc('claim_daily_login_reward'));assert.equal(result.awarded,false);assert.equal(result.xpDelta,0);
  assert.equal(ok(await admin.from('gamification_xp_ledger').select('id').eq('student_id',replacement.id).eq('source_type','daily_login')).length,0);
 }finally{
  if(replacement)ok(await admin.from('students').delete().eq('id',replacement.id));
  ok(await admin.from('students').update({user_id:f.user.id}).eq('id',f.student.id));
 }
});
test('S33: XP diario que cruza de nivel permite la compra válida sin esperar otra sincronización',async()=>{
 const person=await fixture(),client=await connect(person);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil'}).format(new Date());
 const history=Array.from({length:24},(_,i)=>{const day=new Date(today+'T12:00:00Z');day.setUTCDate(day.getUTCDate()-i-1);return {student_id:person.student.id,source_type:'daily_login',source_ref:day.toISOString().slice(0,10),xp_delta:8,label:'Historial sintético'};});
 ok(await admin.from('gamification_xp_ledger').insert(history));
 ok(await admin.from('gamification_profiles').upsert({student_id:person.student.id,total_xp:192,current_xp:192,current_level:1}));
 ok(await admin.from('gamification_currency_wallets').upsert({student_id:person.student.id,total_earned:100,total_spent:0,balance:100}));
 const template=ok(await admin.from('gamification_cosmetic_items_catalog').select('*').limit(1))[0],slug='security-level2-'+person.student.id.slice(0,8);
 ok(await admin.from('gamification_cosmetic_items_catalog').insert({...template,slug,price_coins:1,is_active:true,metadata:{unlockType:'level',unlockTarget:2}}));
 try{
  assert.equal(ok(await client.rpc('claim_daily_login_reward')).xpDelta,8);
  assert.equal(ok(await admin.from('gamification_xp_ledger').select('xp_delta').eq('student_id',person.student.id)).reduce((n,r)=>n+r.xp_delta,0),200);
  ok(await client.rpc('purchase_gamification_item',{p_student_id:person.student.id,p_item_slug:slug}));
  assert.equal(ok(await admin.from('gamification_student_cosmetic_items').select('id').eq('student_id',person.student.id).eq('item_slug',slug)).length,1);
 }finally{ok(await admin.from('gamification_student_cosmetic_items').delete().eq('student_id',person.student.id).eq('item_slug',slug));ok(await admin.from('gamification_cosmetic_items_catalog').delete().eq('slug',slug));}
});
test('S34: entrenador conserva la secuencia de borrado de filas de atleta',async()=>{
 const person=await fixture();
 const original=ok(await admin.from('users').select('id,email,nombre,apellido,role,fecha_nacimiento,first_login,suspended').eq('id',person.user.id).single());
 try{
  ok(await trainerClient.from('students').delete().eq('user_id',person.user.id));
  ok(await trainerClient.from('user_profiles').delete().eq('id',person.user.id));
  ok(await trainerClient.from('users').delete().eq('id',person.user.id));
  assert.equal(ok(await admin.from('users').select('id').eq('id',person.user.id)).length,0);
 }finally{
  ok(await admin.from('users').upsert(original));ok(await admin.from('user_profiles').upsert({id:person.user.id,full_name:'Fixture Seguridad',role:'estudiante'}));
  const student=Object.fromEntries(['id','user_id','categoria','fecha_nacimiento'].map(k=>[k,person.student[k]]));ok(await admin.from('students').upsert(student));
 }
});
