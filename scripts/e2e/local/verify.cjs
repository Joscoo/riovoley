const assert=require('node:assert/strict');
const {createClient}=require('@supabase/supabase-js');
const {readLocal}=require('./safety.cjs');
const h=require('./harness.cjs');
(async()=>{
  const local=readLocal(),results=[];
  for(const [key,role] of [['admin','administrador'],['trainer','entrenador'],['student','estudiante']]) {
    const client=createClient(local.apiUrl,local.anonKey,{auth:{autoRefreshToken:false,persistSession:false}});
    const account=local.accounts[key];
    const signed=await client.auth.signInWithPassword({email:account.email,password:account.password});
    assert.ifError(signed.error);
    assert.equal(signed.data.user.id,account.userId);
    const profile=await client.from('user_profiles').select('role').eq('id',account.userId).single();
    assert.ifError(profile.error); assert.equal(profile.data.role,role);
    const users=await client.from('users').select('id,role');assert.ifError(users.error);
    const students=await client.from('students').select('id,user_id');assert.ifError(students.error);
    if(key==='student') {assert.equal(users.data.length,1);assert.ok(students.data.every(s=>s.user_id===account.userId));}
    else {assert.ok(users.data.length>=10);assert.ok(students.data.length>=8);}
    results.push({actor:key,expectedRole:role,login:'passed',profile:'passed',visibleUsers:users.data.length,visibleStudents:students.data.length,backend:'Supabase Auth/PostgreSQL local reales'});
    await client.auth.signOut();
  }
  h.write('auth-roles-reales.json',{observedAt:new Date().toISOString(),executed:results.length,passed:results.length,results});
  const info=await h.sql('inventario-local',`select jsonb_build_object('postgres',current_setting('server_version'),'tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and n.nspname in ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')),'views',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='v' and n.nspname in ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')),'policies',(select count(*) from pg_policies where schemaname in ('audit','billing','core','gamification','profiles','public','public_content','reporting','security','training')),'users',(select count(*) from core.users),'students',(select count(*) from core.students),'payments',(select count(*) from billing.payments),'attendances',(select count(*) from training.attendances),'physical_tests',(select count(*) from training.physical_tests));`);
  const summary=JSON.parse(info.stdout.trim());h.write('inventario-local.json',summary);
  assert.equal(summary.tables,47); assert.equal(summary.views,44); assert.equal(summary.policies,139);
  console.log(JSON.stringify({authRolesPassed:results.length,inventory:summary}));
})().catch(e=>{console.error(require('./safety.cjs').redact(e.message));process.exitCode=1;});
