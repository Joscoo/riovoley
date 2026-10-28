const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'../../..');
const privateRoot = path.join(root,'.e2e-local');
const pointer = path.join(privateRoot,'android-audit-context.json');
if(!fs.existsSync(pointer)) {
  const stamp=new Date().toISOString().replace(/[-:]/g,'').slice(0,15).replace('T','-');
  const base=path.join(root,'docs/tesis/evidencias/verificacion-tecnica',stamp+'-android-c71f55e');
  const work=path.join(privateRoot,'android-native',stamp);
  fs.mkdirSync(base,{recursive:true});fs.mkdirSync(work,{recursive:true});
  fs.writeFileSync(pointer,JSON.stringify({root,base,work,createdAt:new Date().toISOString()}));
}
const context=JSON.parse(fs.readFileSync(pointer));
if(context.root!==root || !context.base.startsWith(path.join(root,'docs/tesis/evidencias/verificacion-tecnica')+path.sep) || !context.work.startsWith(privateRoot+path.sep)) throw new Error('Contexto Android fuera del workspace');
function scrub(value) {
  return String(value).replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,'[JWT_REDACTADO]').replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g,'[CLAVE_REDACTADA]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[CORREO_REDACTADO]');
}
function write(name,data) {
  const target=path.join(context.base,name);if(!target.startsWith(context.base+path.sep)) throw new Error('Ruta fuera de evidencias');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if(fs.existsSync(target)) throw new Error('Evidencia existente: '+name);
  fs.writeFileSync(target,scrub(typeof data==='string'?data:JSON.stringify(data,null,2))+'\n');
}
function commandEnvironment(overrides={},inherited=process.env) {
  const env={...inherited,...overrides};
  // Conservar los overrides REACT_APP_* que bloquean dotenv institucional.
  for(const name of Object.keys(env)) if(!name.startsWith('REACT_APP_') && /KEYSTORE|KEY_PASSWORD|CAP_PUBLISH|RESEND|FCM_|SUPABASE.*(?:KEY|TOKEN)|^E2E_/.test(name)) delete env[name];
  return env;
}
async function run(label,command,args=[],options={}) {
  if(fs.existsSync(path.join(context.base,label+'.meta.json')) || fs.existsSync(path.join(context.base,label+'.stdout.log'))) label+='-'+Date.now();
  if(command==='cmd.exe') command=process.env.ComSpec||'C:\\Windows\\System32\\cmd.exe';
  const start=new Date();let stdout='',stderr='';
  const env=commandEnvironment(options.env);
  return new Promise((resolve,reject)=>{
    const child=cp.spawn(command,args,{cwd:options.cwd||root,env,windowsHide:true});
    child.stdout.on('data',data=>{stdout+=data;});child.stderr.on('data',data=>{stderr+=data;});
    child.on('error',reject);child.on('close',(exitCode,signal)=>{
      const meta={command:[command,...args],cwd:path.relative(root,options.cwd||root),start:start.toISOString(),end:new Date().toISOString(),durationSeconds:(Date.now()-start)/1000,exitCode,signal};
      write(label+'.stdout.log',options.privateOutput?'Salida reservada; se publica únicamente el resumen sin identificadores.':stdout);write(label+'.stderr.log',stderr);write(label+'.meta.json',meta);
      console.log(JSON.stringify({label,exitCode,durationSeconds:meta.durationSeconds,stderrTail:scrub(stderr.slice(-900))}));
      if(exitCode!==0&&!options.allowFailure) reject(new Error(label+' terminó con salida '+exitCode));else resolve({stdout,stderr,...meta});
    });
    child.stdin.on('error',()=>{});child.stdin.end(options.input||'');
  });
}
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
module.exports={...context,pointer,write,run,hash,scrub,commandEnvironment};
