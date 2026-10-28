const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const h=require('./harness.cjs');
const {assertLocalTarget}=require('./safety.cjs');
const network='riovoley-e2e-loopback';
const workdir=path.join(h.runtime,'stack');
async function captureStatus() {
  const result=await h.run('stack/status',h.cli,['status','--workdir',workdir,'-o','json'],{privateOutput:true});
  const status=JSON.parse(result.stdout);
  assertLocalTarget(status.API_URL);
  const file=path.join(h.runtime,'credentials.json');
  const previous=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{};
  fs.writeFileSync(file,JSON.stringify({...previous,projectId:h.projectId,apiUrl:status.API_URL,anonKey:status.ANON_KEY,serviceRoleKey:status.SERVICE_ROLE_KEY,piiEncryptionKey:previous.piiEncryptionKey||crypto.randomBytes(32).toString('base64url')},null,2));
}
async function waitReady() {
  const url='http://127.0.0.1:55321/auth/v1/health';
  for(let attempt=0;attempt<60;attempt++) {
    try { const response=await fetch(url,{signal:AbortSignal.timeout(2000)});if(response.ok)return; } catch {}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  throw new Error('Auth local no quedó disponible en el puerto dedicado');
}
async function start() {
  if(!fs.existsSync(h.cli)) {
    const npmCli=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
    await h.run('herramientas/instalar-cli',process.execPath,[npmCli,'install','--prefix',path.join(h.runtime,'tools'),'--no-audit','--no-fund','--save-exact','supabase@2.122.0']);
  }
  await h.run('herramientas/docker','docker',['info','--format','{{.ServerVersion}}']);
  fs.mkdirSync(path.join(workdir,'supabase'),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'config.toml'),path.join(workdir,'supabase/config.toml'));
  fs.cpSync(path.join(h.root,'supabase/functions'),path.join(workdir,'supabase/functions'),{recursive:true,filter:source=>!path.basename(source).startsWith('.env')});
  const exists=await h.run('red/consultar','docker',['network','inspect',network],{allowFailure:true});
  if(exists.exitCode!==0) await h.run('red/crear','docker',['network','create','--driver','bridge','--opt','com.docker.network.bridge.host_binding_ipv4=127.0.0.1',network]);
  await h.run('stack/start',h.cli,['start','--workdir',workdir,'--network-id',network,'--exclude','studio,postgres-meta,logflare,vector,supavisor,imgproxy'],{privateOutput:true});
  await require('./loopback.cjs').enforceLoopback();
  await waitReady();
  await captureStatus();
}
async function setup() {
  await start();
  const exists=await h.sql('schema/existe',"select to_regclass('core.users') is not null;");
  if(exists.stdout.trim()!=='t') await h.sql('schema/restaurar',fs.readFileSync(path.join(h.root,'database/e2e/local-baseline.sql'),'utf8'));
  await require('./seed.cjs').seed();
  await h.run('validacion/roles',process.execPath,['scripts/e2e/local/verify.cjs']);
  await h.run('validacion/idempotencia',process.execPath,['scripts/e2e/local/idempotency.cjs']);
}
const action=process.argv[2]||'setup';
const actions={setup,start,status:captureStatus,stop:()=>h.run('stack/stop',h.cli,['stop','--workdir',workdir,'--project-id',h.projectId])};
if(!actions[action]) throw new Error('Usar setup, start, status o stop');
actions[action]().catch(e=>{console.error(require('./safety.cjs').redact(e.message));process.exitCode=1;});
