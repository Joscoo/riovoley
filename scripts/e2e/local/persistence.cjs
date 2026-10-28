const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const h=require('./harness.cjs');
(async()=>{
  const result=await h.sql('persistencia-local',`select jsonb_build_object('observed_at',current_timestamp,'login_reward_rows',(select count(*) from gamification.login_rewards),'daily_login_entries',(select count(*) from gamification.xp_ledger where source_type='daily_login'),'daily_login_xp',(select coalesce(sum(xp_delta),0) from gamification.xp_ledger where source_type='daily_login'),'duplicate_daily_groups',(select count(*) from (select student_id,occurred_at::date from gamification.xp_ledger where source_type='daily_login' group by student_id,occurred_at::date having count(*)>1) x),'users',(select count(*) from core.users),'students',(select count(*) from core.students),'payments',(select count(*) from billing.payments),'attendances',(select count(*) from training.attendances),'physical_tests',(select count(*) from training.physical_tests));`);
  const data=JSON.parse(result.stdout.trim());
  assert.ok(data.daily_login_entries>=1);assert.equal(data.duplicate_daily_groups,0);
  assert.equal(data.daily_login_xp,data.daily_login_entries*8);
  h.write('persistencia-local.json',{...data,status:'passed',scope:'Recompensa por login real de atleta observada en tablas locales tras Playwright. No acredita compra cosmética ni éxito del flujo UI de pago/asistencia.'});
  console.log(JSON.stringify({dailyLoginEntries:data.daily_login_entries,xp:data.daily_login_xp,duplicates:data.duplicate_daily_groups,users:data.users,students:data.students}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
