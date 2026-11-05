'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),net=require('node:net'),cp=require('node:child_process');
const project='mayvvlkvheagkojunzzb',name='REPORTS_SCHEDULER_SECRET';
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
function assertTarget(ref,authorization){assert.equal(ref,project,'TARGET_NOT_ALLOWED');assert.equal(authorization,'create-scheduler-only','AUTHORIZATION_REQUIRED');}
function validateList(rows){assert.ok(Array.isArray(rows),'SECRET_LIST_INVALID');const seen=new Set();for(const row of rows){assert.ok(row&&typeof row.name==='string'&&/^[A-Z][A-Z0-9_]+$/.test(row.name)&&!seen.has(row.name),'SECRET_LIST_INVALID');assert.ok(typeof row.digest==='string'&&row.digest.length>0,'SECRET_LIST_INVALID');seen.add(row.name);}return rows;}
function normalizeCliList(rows){assert.ok(Array.isArray(rows),'SECRET_LIST_INVALID');return validateList(rows.map(row=>{assert.ok(row&&typeof row.name==='string','SECRET_LIST_INVALID');if(Object.hasOwn(row,'value')){assert.ok(!Object.hasOwn(row,'digest')&&typeof row.value==='string'&&/^[a-f0-9]{64}$/i.test(row.value),'SECRET_LIST_INVALID');return {name:row.name,digest:row.value.toLowerCase()};}return {name:row.name,digest:row.digest};}));}
const generateValue=()=>crypto.randomBytes(32).toString('base64url');
function envPayload(value){assert.match(value,/^[A-Za-z0-9_-]{43}$/,'VALUE_INVALID');assert.equal(Buffer.from(value,'base64url').length,32,'VALUE_INVALID');return name+'='+value+'\n';}
async function createOnly(options){
 assertTarget(options.project,options.authorization);const before=validateList(await options.list());assert.ok(!before.some(r=>r.name===name),'SECRET_ALREADY_EXISTS');
 let value=generateValue();try{
  await options.protect(value);const immediatelyBefore=validateList(await options.list());assert.ok(!immediatelyBefore.some(r=>r.name===name),'SECRET_APPEARED_BEFORE_WRITE');assert.equal(JSON.stringify(before.map(r=>[r.name,r.digest]).sort()),JSON.stringify(immediatelyBefore.map(r=>[r.name,r.digest]).sort()),'SECRETS_CHANGED_BEFORE_WRITE');
  let writeExitCode;try{writeExitCode=await options.write(value);}catch{writeExitCode=null;}
  // Exactly one write attempt. Read even if the acknowledgement was lost; never overwrite/retry.
  const after=validateList(await options.list()),target=after.find(r=>r.name===name);assert.ok(target&&target.digest===digest(value),'SECRET_VALUE_NOT_CONFIRMED');
  assert.equal(JSON.stringify(before.map(r=>[r.name,r.digest]).sort()),JSON.stringify(after.filter(r=>r.name!==name).map(r=>[r.name,r.digest]).sort()),'OTHER_SECRETS_CHANGED');
  return {status:writeExitCode===0?'SCHEDULER_SECRET_CREATED_VERIFIED':'SCHEDULER_SECRET_PRESENT_AFTER_UNCERTAIN_ACK',name,writeExitCode,valueDigestMatchesInMemory:true,digestPublished:false,otherDigestsUnchanged:true,writeAttempts:1,secretValuePublished:false,jobsInvoked:false,functionsDeployed:false};
 }finally{value=undefined;}
}
async function viaNamedPipe(command,args,payload,options={}){
 assert.equal(process.platform,'win32','WINDOWS_PIPE_REQUIRED');const pipe='\\\\.\\pipe\\riovoley-scheduler-'+crypto.randomUUID();let connections=0,child,timer;const chunks={stdout:[],stderr:[]};
 const server=net.createServer(socket=>{if(++connections>1){socket.destroy();return;}socket.on('error',()=>{});socket.end(payload);});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen({path:pipe,readableAll:false,writableAll:false},resolve);});
 try{
  const result=await new Promise((resolve,reject)=>{
   child=cp.spawn(command,[...args,'--env-file',pipe],{cwd:options.cwd,env:options.env,windowsHide:true,stdio:['ignore','pipe','pipe']});let size=0;
   for(const kind of ['stdout','stderr'])child[kind].on('data',bytes=>{size+=bytes.length;if(size>1024*1024)child.kill();else chunks[kind].push(bytes);});
   child.once('error',()=>reject(Error('PIPE_CLI_START_FAILED')));child.once('close',code=>resolve({exitCode:code,stdout:Buffer.concat(chunks.stdout).toString('utf8'),stderr:Buffer.concat(chunks.stderr).toString('utf8')}));timer=setTimeout(()=>{child.kill();reject(Error('PIPE_CLI_TIMEOUT'));},options.timeoutMs||60000);
  });
  if(options.observeSyntheticResult)options.observeSyntheticResult({...result,connections});
  assert.equal(connections,1,'PIPE_NOT_CONSUMED_ONCE');const sentValue=payload.slice(payload.indexOf('=')+1).trim();assert.ok(sentValue&&!result.stdout.includes(sentValue)&&!result.stderr.includes(sentValue),'PIPE_PAYLOAD_IN_OUTPUT');return {...result,connections};
 }finally{clearTimeout(timer);if(child&&!child.killed&&child.exitCode===null)child.kill();await new Promise(resolve=>server.close(resolve));}
}
module.exports={project,name,digest,assertTarget,validateList,normalizeCliList,generateValue,envPayload,createOnly,viaNamedPipe};
