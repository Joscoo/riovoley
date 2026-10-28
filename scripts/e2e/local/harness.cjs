const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const {root,runtime,projectId,redact,localDockerEnv,dockerArgs}=require('./safety.cjs');
const {writeNew}=require('./evidence.cjs');
fs.mkdirSync(runtime,{recursive:true});
const runFile=path.join(runtime,'evidence-dir.txt');
let evidence;
if(fs.existsSync(runFile)) evidence=fs.readFileSync(runFile,'utf8').trim();
else {
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);
  evidence=path.join(root,'docs/tesis/evidencias/e2e-aislado',stamp+'-c71f55e');
  fs.writeFileSync(runFile,evidence);
}
fs.mkdirSync(evidence,{recursive:true});
const cli=path.join(runtime,'tools/node_modules/@supabase/cli-windows-x64/bin/supabase.exe');
const container='supabase_db_'+projectId;
function secrets() {
  const file=path.join(runtime,'credentials.json');
  if(!fs.existsSync(file)) return [];
  const c=JSON.parse(fs.readFileSync(file));
  const observed=path.join(runtime,'observed-secrets.jsonl');
  const generated=fs.existsSync(observed)?fs.readFileSync(observed,'utf8').split(/\r?\n/).filter(Boolean).map(line=>JSON.parse(line).password):[];
  return [c.anonKey,c.serviceRoleKey,c.piiEncryptionKey,...Object.values(c.accounts||{}).map(a=>a.password),...generated];
}
function write(name,data) {
  const file=path.join(evidence,name); fs.mkdirSync(path.dirname(file),{recursive:true});
  return writeNew(evidence,name,redact(typeof data==='string'?data:JSON.stringify(data,null,2),secrets())+'\n');
}
function run(label,command,args=[],options={}) {
  if(['docker','docker.exe'].includes(path.basename(command).toLowerCase())) args=dockerArgs(args);
  if(['.stdout.log','.stderr.log','.meta.json'].some(ext=>fs.existsSync(path.join(evidence,label+ext)))) label+='-'+Date.now();
  const start=new Date();
  return new Promise((resolve,reject)=>{
    const child=cp.spawn(command,args,{cwd:options.cwd||root,env:localDockerEnv(options.env||process.env),windowsHide:true,timeout:options.timeoutMs||0});
    let stdout='',stderr='';
    child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
    child.on('error',reject);
    child.on('close',(exitCode,signal)=>{
      write(label+'.stdout.log',options.privateOutput?'Salida sensible guardada únicamente en runtime privado; valores omitidos.':stdout);write(label+'.stderr.log',stderr);
      write(label+'.meta.json',{command:[command,...args],start:start.toISOString(),end:new Date().toISOString(),durationSeconds:(Date.now()-start)/1000,exitCode,signal,cwd:path.relative(root,options.cwd||root)||'.'});
      console.log(JSON.stringify({label,exitCode,durationSeconds:(Date.now()-start)/1000,stderrTail:redact(stderr.slice(-700),secrets())}));
      if(exitCode!==0&&!options.allowFailure) reject(new Error(label+' terminó con código '+exitCode));
      else resolve({stdout,stderr,exitCode});
    });
    if(options.input) child.stdin.end(options.input); else child.stdin.end();
  });
}
async function sql(label,query) { return run(label,'docker',['exec','-i',container,'psql','-X','-U','postgres','-d','postgres','-v','ON_ERROR_STOP=1','-A','-t'],{input:query}); }
module.exports={root,runtime,projectId,evidence,cli,container,run,write,sql};
