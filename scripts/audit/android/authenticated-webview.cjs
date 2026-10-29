const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {_android:android}=require('playwright');
const {expect}=require('@playwright/test');
const h=require('../../e2e/local/harness.cjs');
const c=require('./context.cjs');
const {environment}=require('./environment.cjs');
const {readLocal}=require('../../e2e/local/safety.cjs');
const {connect}=require('../security/local-db.cjs');

(async()=>{
 const label=(process.argv.find(x=>x.startsWith('--label='))||'--label=autenticacion-inicial').slice(8);
 assert.match(label,/^[a-z0-9-]+$/);
 const local=readLocal(),{env,sdk}=environment(),adb=path.join(sdk,'platform-tools/adb.exe');
 const profile=JSON.parse(fs.readFileSync(path.join(h.runtime,'emulator-audit.json'),'utf8'));
 assert.equal(profile.avdName,'riovoley-audit');assert.equal(profile.port,5580);
 const serial='emulator-5580',pkg='com.riovoley.app',cases=[],responses=[],blocked=[];
 const apk=path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk'),expectedSha256=c.hash(apk);
 const adbRun=(name,args)=>h.run('android/'+label+'-'+name,adb,['-s',serial,...args],{env,timeoutMs:30000});
 const db=await connect();let device,page,identityVerified=false,tunnelCreated=false,permissionFixed=false;
 const reward=async()=>{
  const r=await db.query("SELECT count(*)::int AS rows,coalesce(sum(reward_count),0)::int AS rewards FROM gamification.login_rewards WHERE user_id=$1 AND reward_date=(now() AT TIME ZONE 'America/Guayaquil')::date",[local.accounts.student.userId]);
  const ledger=await db.query("SELECT count(*)::int AS ledger_rows,coalesce(sum(l.xp_delta),0)::int AS xp FROM gamification.xp_ledger l JOIN core.students s ON s.id=l.student_id WHERE s.user_id=$1 AND l.source_type='daily_login' AND l.source_ref=((now() AT TIME ZONE 'America/Guayaquil')::date)::text",[local.accounts.student.userId]);
  return {...r.rows[0],...ledger.rows[0]};
 };
 let before=null;
 async function verify(code,name,fn){const start=Date.now();try{await fn();cases.push({code,name,state:'APROBADO',seconds:(Date.now()-start)/1000});}catch(e){cases.push({code,name,state:'FALLIDO',seconds:(Date.now()-start)/1000,error:c.scrub(e.message)});throw e;}}
 try {
  before=await reward();
  const inspection=JSON.parse(fs.readFileSync(path.join(h.evidence,'android/apk-privado-inspeccion-cierre.json'),'utf8'));
  assert.equal(inspection.state,'APROBADO');assert.equal(inspection.sha256,expectedSha256);
  const avd=await adbRun('identidad-avd',['emu','avd','name']);assert.equal(avd.stdout.trim().split(/\r?\n/)[0].trim(),profile.avdName);
  identityVerified=true;
  await verify('N-artefacto','El paquete instalado coincide con el APK privado compilado',async()=>{
   const installed=await adbRun('apk-ruta',['shell','pm','path',pkg]);
   const file=installed.stdout.trim().replace(/^package:/,'');assert.match(file,/^\/data\/app\/[^\r\n]+\/base\.apk$/);
   const digest=await adbRun('apk-huella',['shell','sha256sum',file]);assert.equal(digest.stdout.trim().split(/\s+/)[0],expectedSha256);
  });
  await adbRun('tunel',['reverse','tcp:55321','tcp:55321']);
  tunnelCreated=true;
  await adbRun('detener',['shell','am','force-stop',pkg]);
  await adbRun('notificaciones-revocar',['shell','pm','revoke',pkg,'android.permission.POST_NOTIFICATIONS']);
  await adbRun('notificaciones-fijar',['shell','pm','set-permission-flags',pkg,'android.permission.POST_NOTIFICATIONS','user-fixed']);
  permissionFixed=true;
  await adbRun('iniciar',['shell','am','start','-n',pkg+'/.MainActivity']);
  device=(await android.devices({host:'127.0.0.1',port:5037})).find(d=>d.serial()===serial);assert.ok(device);
  page=await(await device.webView({pkg,timeout:60000})).page();
  await page.context().route('**/*',route=>{
   const u=new URL(route.request().url());
   if(u.origin==='https://localhost'||u.origin===local.apiUrl)return route.continue();
   blocked.push({origin:u.origin,pathname:u.pathname});return route.abort();
  });
  page.on('response',r=>{const u=new URL(r.url());if(u.origin===local.apiUrl)responses.push({path:u.pathname,status:r.status(),method:r.request().method()});});
  await page.goto('https://localhost/login');
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear();for(const role of ['admin','trainer','student'])localStorage.setItem('riovoley:panel-guide:'+role,JSON.stringify({version:'2026-06-22',status:'dismissed'}));});
  await page.reload();
  async function login(role,route){
   await page.goto('https://localhost/login');
   await page.locator('input[type=email]').fill(local.accounts[role].email);
   await page.locator('input[type=password]').fill(local.accounts[role].password);
   const reply=page.waitForResponse(r=>r.url().startsWith(local.apiUrl+'/auth/v1/token?')&&r.request().method()==='POST');
   await page.locator('form button[type=submit]').click();
   assert.equal((await reply).status(),200);
   await expect(page).toHaveURL(new RegExp(route+'(?:[?#]|$)'),{timeout:60000});
   await expect(page.getByRole('button',{name:'Abrir guia del panel'})).toBeVisible({timeout:60000});
  }
  async function logout(route){
   const toggle=page.getByRole('button',{name:'Abrir menú',exact:true});if(await toggle.isVisible())await toggle.click();
   const reply=page.waitForResponse(r=>r.url().startsWith(local.apiUrl+'/auth/v1/logout')&&r.request().method()==='POST');
   await page.getByRole('button',{name:/cerrar sesi/i}).click();
   assert.ok([200,204].includes((await reply).status()));
   await expect.poll(()=>page.evaluate(()=>Object.keys(localStorage).filter(k=>/^sb-.*-auth-token$/.test(k)).length),{timeout:30000}).toBe(0);
   await page.goto('https://localhost'+route);
   await expect(page.getByRole('heading',{name:/acceso denegado/i})).toBeVisible({timeout:30000});
  }
  for(const [role,route] of [['admin','/admin'],['trainer','/entrenador'],['student','/estudiante']]){
   await verify('N-'+role+'-login','Inicio real de sesión y panel: '+role,()=>login(role,route));
   await page.screenshot({path:path.join(h.evidence,'android/'+label+'-'+role+'.png')});
   await verify('N-'+role+'-persistencia','Sesión conservada tras recargar WebView: '+role,async()=>{await page.reload();await expect(page.getByRole('button',{name:'Abrir guia del panel'})).toBeVisible({timeout:60000});});
   if(role!=='admin')await verify('N-'+role+'-rol','Denegación del panel administrador: '+role,async()=>{await page.goto('https://localhost/admin');await expect(page.getByRole('heading',{name:/acceso denegado/i})).toBeVisible({timeout:30000});await page.goto('https://localhost'+route);await expect(page.getByRole('button',{name:'Abrir guia del panel'})).toBeVisible({timeout:60000});});
   await verify('N-'+role+'-logout','Cierre real de sesión y denegación del panel propio: '+role,()=>logout(route));
  }
  await verify('N-student-recompensa','Segundo ingreso atleta conserva una recompensa diaria de 8 XP en PostgreSQL',async()=>{await login('student','/estudiante');await expect.poll(reward,{timeout:30000}).toEqual({rows:1,rewards:1,ledger_rows:1,xp:8});});
  await logout('/estudiante');
 }catch(e){h.write('android/'+label+'-error.txt',c.scrub(e.stack||e.message));process.exitCode=1;
 }finally{
  const cleanupFailures=[];let after=null;
  async function cleanup(name,fn){try{return await fn();}catch(e){cleanupFailures.push({name,error:c.scrub(e.message)});process.exitCode=1;return null;}}
  after=await cleanup('consulta-recompensa-final',reward);
  if(device)await cleanup('cerrar-playwright',()=>device.close());
  await cleanup('cerrar-db',()=>db.end());
  if(identityVerified&&permissionFixed)await cleanup('restaurar-permisos',()=>adbRun('notificaciones-restaurar',['shell','pm','clear-permission-flags',pkg,'android.permission.POST_NOTIFICATIONS','user-fixed']));
  if(identityVerified&&tunnelCreated)await cleanup('retirar-tunel',()=>adbRun('tunel-retirar',['reverse','--remove','tcp:55321']));
  h.write('android/'+label+'.json',{planned:13,executed:cases.length,notExecuted:13-cases.length,passed:cases.filter(x=>x.state==='APROBADO').length,failed:cases.filter(x=>x.state==='FALLIDO').length,state:process.exitCode?'FALLIDO':'APROBADO',cases,cleanupFailures,backend:'Supabase Auth/REST/PostgreSQL local reales; sin mocks ni almacenamiento de tokens',before,after,responses,blockedBrowserRequests:blocked,artifactSha256:expectedSha256,scope:'WebView real de APK debug en emulator-5580; HTTP loopback por túnel ADB. No verifica transporte TLS institucional, FCM, Resend ni OTA. Se deniega permiso de notificaciones; OTA apunta a puerto loopback cerrado.',apkDistributed:false});
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
