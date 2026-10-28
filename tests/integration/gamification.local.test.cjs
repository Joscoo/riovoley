const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {local,admin,ok,fixture}=require('./local-fixture.cjs');
const {supabase}=require('../../src/config/supabase.js');
const {createGamificationService}=require('../../src/features/gamification/presentation/createGamificationService.js');
const {SupabaseGamificationRepository}=require('../../src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js');
const {createAttendanceUseCases}=require('../../src/features/attendance/application/useCases/createAttendanceUseCases.js');
const {SupabaseAttendanceRepository}=require('../../src/features/attendance/infrastructure/repositories/supabaseAttendanceRepository.js');
const {createPhysicalTestsUseCases}=require('../../src/features/physical-tests/application/useCases/createPhysicalTestsUseCases.js');
const {SupabasePhysicalTestsRepository}=require('../../src/features/physical-tests/infrastructure/repositories/supabasePhysicalTestsRepository.js');
const {createPaymentsUseCases}=require('../../src/features/payments/application/useCases/createPaymentsUseCases.js');
const {SupabasePaymentsRepository}=require('../../src/features/payments/infrastructure/repositories/supabasePaymentsRepository.js');
const {getEcuadorDate,getEcuadorISOString}=require('../../src/utils/dateUtils.js');
const h=require('../../scripts/e2e/local/harness.cjs');
const repo=new SupabaseGamificationRepository();
const game=createGamificationService(repo,{notificationService:{}});
const attendance=createAttendanceUseCases(new SupabaseAttendanceRepository(),{gamificationService:game});
const physical=createPhysicalTestsUseCases(new SupabasePhysicalTestsRepository(),{gamificationService:game});
const payment=createPaymentsUseCases(new SupabasePaymentsRepository(),{gamificationService:game,getEcuadorDate,getEcuadorISOString});
let f,paymentId,testId,cosmetic;
const nickname=()=> 'Cierre'+f.student.id.replaceAll('-','').slice(0,10);
const today=getEcuadorDate();
const rows=async table=>ok(await admin.from(table).select('*').eq('student_id',f.student.id));
const sign=async account=>ok(await supabase.auth.signInWithPassword(account));
before(async()=>{f=await fixture();await sign(local.accounts.admin);});
after(async()=>{await supabase.auth.signOut({scope:'local'});h.write('integracion/fixture-real.json',{studentId:f?.student?.id,backend:'Supabase local real',data:'Cuenta y registros ficticios conservados para inspección; no se publican credenciales.'});});

test('G01: servicio y repositorio real persisten perfil inicial',async()=>{
  const result=await game.refreshStudentProgress({studentId:f.student.id});
  assert.equal(result.studentId,f.student.id);
  assert.equal((await rows('gamification_profiles')).length,1);
});
test('G02: asistencia real acumula 35 XP y queda en PostgreSQL',async()=>{
  await attendance.registerAttendanceWithPaymentUseCase.execute({athleteId:f.student.id,selectedDate:today,paymentTypeId:1});
  const xp=(await rows('gamification_xp_ledger')).filter(r=>r.source_type==='attendance');
  assert.equal(xp.length,1);assert.equal(xp[0].xp_delta,35);
});
test('G03: registro repetido de asistencia no duplica sus movimientos XP',async()=>{
  await attendance.registerAttendanceWithPaymentUseCase.execute({athleteId:f.student.id,selectedDate:today,paymentTypeId:1});
  assert.equal((await rows('attendances')).length,1);
  assert.equal((await rows('gamification_xp_ledger')).filter(r=>r.source_type==='attendance').length,1);
});
test('G04: pago real sincroniza historial XP de mensualidad',async()=>{
  const result=await payment.createPaymentUseCase.execute({formData:{student_id:f.student.id,membership_type_id:'1',fecha_pago:today}});
  paymentId=result.createdPayment.id;
  assert.equal((await rows('payments')).length,1);
  const xp=(await rows('gamification_xp_ledger')).filter(r=>r.source_type==='payment');
  assert.equal(xp.length,1);assert.equal(xp[0].xp_delta,90);
});
test('G05: modificar pago mantiene un único movimiento de su fuente',async()=>{
  assert.ok(paymentId);
  await payment.updatePaymentUseCase.execute({paymentId,formData:{student_id:f.student.id,membership_type_id:'2',fecha_pago:today}});
  assert.equal((await rows('payments'))[0].monto,32.5);
  assert.equal((await rows('gamification_xp_ledger')).filter(r=>r.source_type==='payment').length,1);
});
test('G06: evaluación física real incorpora su XP e incrementa nivel',async()=>{
  const record=await physical.createTestUseCase.execute({formData:{student_id:f.student.id,fecha_test:today,estatura:'1.65',peso:'58',brazo_extend_inicial:'200',brazo_extend_sin_impulso:'240',brazo_extend_con_impulso:'250',fuerza_explosiva_salto_largo:'180',fuerza_abdomen:'20',fuerza_brazos:'15',fuerza_piernas:'30',elevaciones_barra:'3'}});
  testId=record.id;
  assert.ok((await rows('gamification_xp_ledger')).some(r=>r.source_type==='physical_test'&&r.xp_delta===100));
  const profile=(await rows('gamification_profiles'))[0];assert.ok(profile.total_xp>=200);assert.ok(profile.current_level>=2);
});
test('G07: sincronización repetida conserva suma XP, saldo e historial',async()=>{
  const xpBefore=(await rows('gamification_xp_ledger')).reduce((n,r)=>n+r.xp_delta,0);
  const walletBefore=(await rows('gamification_currency_wallets'))[0];
  await game.refreshStudentProgress({studentId:f.student.id});
  assert.equal((await rows('gamification_xp_ledger')).reduce((n,r)=>n+r.xp_delta,0),xpBefore);
  assert.equal((await rows('gamification_currency_wallets'))[0].balance,walletBefore.balance);
});
test('G08: logros, retos y clasificación se persisten con actividad real',async()=>{
  assert.ok((await rows('gamification_student_achievements')).length>0);
  assert.ok((await rows('gamification_student_challenge_progress')).length>0);
  assert.ok((await rows('gamification_leaderboard_snapshots')).length>0);
});
test('G09: recompensa de login real entrega 8 XP una sola vez al día',async()=>{
  await sign({email:f.email,password:f.password});
  const first=await game.registerDailyLoginReward({userId:f.user.id});
  const second=await game.registerDailyLoginReward({userId:f.user.id});
  assert.equal(first.awarded,true);assert.equal(second.awarded,false);
  const daily=(await rows('gamification_xp_ledger')).filter(r=>r.source_type==='daily_login');
  assert.equal(daily.length,1);assert.equal(daily[0].xp_delta,8);
});
test('G10: identidad y avatar del atleta se guardan por sesión real',async()=>{
  await game.updateStudentIdentity({userId:f.user.id,nickname:nickname(),avatarStyle:'adventurer-neutral',profileImageMode:'avatar'});
  assert.equal((await rows('gamification_student_identity'))[0].nickname,nickname());
});
test('G11: compra RPC descuenta monedas y persiste inventario',async()=>{
  const state=await game.loadStudentGamification(f.user.id);
  cosmetic=state.cosmetics.items.find(item=>item.canPurchase&&item.priceCoins>0&&item.priceCoins<=state.currency.balance);
  assert.ok(cosmetic,'Se requiere un cosmético desbloqueado y asequible mediante actividad real');
  const before=(await rows('gamification_currency_wallets'))[0];
  await game.purchaseCosmeticItem({userId:f.user.id,itemSlug:cosmetic.slug});
  const after=(await rows('gamification_currency_wallets'))[0];
  assert.ok(after.balance<before.balance);assert.ok(after.total_spent>before.total_spent);
  assert.ok((await rows('gamification_student_cosmetic_items')).some(item=>item.item_slug===cosmetic.slug));
});
test('G12: equipar y desequipar usan las RPC reales',async()=>{
  assert.ok(cosmetic);
  await game.equipCosmeticItem({userId:f.user.id,itemSlug:cosmetic.slug});
  assert.ok((await rows('gamification_student_cosmetic_equipment')).some(row=>Object.values(row).includes(cosmetic.slug)));
  await game.unequipCosmeticItem({userId:f.user.id,category:cosmetic.category});
  assert.ok(!(await rows('gamification_student_cosmetic_equipment')).some(row=>Object.values(row).includes(cosmetic.slug)));
});
test('G13: resincronizar conserva gasto, compra e integridad del saldo real',async()=>{
  const spent=(await rows('gamification_currency_wallets'))[0].total_spent;
  await sign(local.accounts.admin);
  await game.refreshStudentProgress({studentId:f.student.id});
  const wallet=(await rows('gamification_currency_wallets'))[0];
  assert.equal(wallet.total_spent,spent);assert.equal(wallet.balance,wallet.total_earned-wallet.total_spent);
  assert.equal((await rows('gamification_currency_ledger')).filter(row=>row.source_type==='cosmetic_purchase').length,1);
});
test('G14: tres días hábiles consecutivos quedan reflejados en la racha persistida',async()=>{
  const date=new Date(today+'T12:00:00Z');let count=0;
  while(count<3) {date.setUTCDate(date.getUTCDate()-1);if([0,6].includes(date.getUTCDay()))continue;count++;
    await attendance.registerAttendanceWithPaymentUseCase.execute({athleteId:f.student.id,selectedDate:date.toISOString().slice(0,10),paymentTypeId:1});
  }
  assert.ok((await rows('gamification_profiles'))[0].summary.weekdayAttendanceStreak>=3);
});
test('G15: título desbloqueado y modelo de avatar se persisten por propietario',async()=>{
  await sign({email:f.email,password:f.password});
  const state=await game.loadStudentGamification(f.user.id);
  const title=state.identity.availableTitles.find(row=>row.isUnlocked);assert.ok(title);
  await game.updateStudentIdentity({userId:f.user.id,nickname:nickname(),selectedTitleSlug:title.slug,avatarStyle:'adventurer-neutral',profileImageMode:'avatar'});
  const identity=(await rows('gamification_student_identity'))[0];
  assert.equal(identity.selected_title_slug,title.slug);assert.ok(identity.avatar_model_slug);
});
test('G16: campaña activa de fixture persiste progreso y finalización reales',async()=>{
  await sign(local.accounts.admin);
  const catalog=ok(await supabase.from('gamification_campaigns_catalog').select('*').limit(1));assert.ok(catalog.length);
  const campaign={...catalog[0],slug:'closure-'+f.student.id.slice(0,8),start_date:today,end_date:today,target_metric:'attendance_window',target_value:1,is_active:true};
  delete campaign.id;
  const literal=JSON.stringify(campaign).replaceAll("'","''");
  // Preparación de un catálogo sintético en el contenedor local: no se cambian grants/RLS.
  await h.sql('integracion/campana-fixture',`INSERT INTO gamification.campaigns_catalog SELECT * FROM jsonb_populate_record(NULL::gamification.campaigns_catalog, '${literal}'::jsonb);`);
  await sign(local.accounts.admin);await game.refreshStudentProgress({studentId:f.student.id});
  const progress=ok(await supabase.from('gamification_student_campaign_progress').select('*').eq('student_id',f.student.id)).find(row=>row.campaign_slug===campaign.slug);
  assert.ok(progress);assert.equal(progress.is_completed,true);assert.ok(progress.progress_value>=1);
});
test('G17: correo de recuperación se entrega en SMTP/Mailpit local sin cambiar contraseña',async()=>{
  ok(await supabase.auth.resetPasswordForEmail(f.email,{redirectTo:'http://127.0.0.1:6100/reset-password'}));
  let found=false;
  for(let i=0;i<20&&!found;i++) {
    const response=await fetch('http://127.0.0.1:55324/api/v1/messages');assert.equal(response.status,200);
    const mailbox=await response.json();
    found=(mailbox.messages||[]).some(message=>(message.To||[]).some(to=>to.Address===f.email));
    if(!found) await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert.equal(found,true,'El correo debe existir en el sumidero SMTP local');
  h.write('integracion/correo-local.json',{provider:'Supabase Auth → SMTP Mailpit local',delivered:true,passwordChanged:false,externalResendOrFcmValidated:false});
});
