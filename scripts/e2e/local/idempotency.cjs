const assert=require('node:assert/strict');
const h=require('./harness.cjs');
const query="select jsonb_build_object('auth',(select count(*) from auth.users),'users',(select count(*) from core.users),'students',(select count(*) from core.students),'payments',(select count(*) from billing.payments),'attendances',(select count(*) from training.attendances),'tests',(select count(*) from training.physical_tests));";
(async()=>{
  const before=JSON.parse((await h.sql('idempotencia/antes',query)).stdout);
  await h.run('idempotencia/repeticion',process.execPath,['scripts/e2e/local/seed.cjs']);
  const after=JSON.parse((await h.sql('idempotencia/despues',query)).stdout);
  assert.deepEqual(before,after);
  h.write('seed-idempotencia.json',{before,after,result:'passed'});
  console.log('Seed idempotente verificado');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
