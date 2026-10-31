const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const net=require('node:net');
const h=require('../../e2e/local/harness.cjs');
const {buildWebEnv,readLocal}=require('../../e2e/local/safety.cjs');
const tag=(process.argv.find(arg=>arg.startsWith('--label='))||'--label=').slice(8);
assert.match(tag,/^[a-z0-9-]*$/);
const label='integracion/dev-server'+(tag?'-'+tag:'');
(async()=>{
 const port=6101,origin='http://127.0.0.1:'+port;
 const probe=net.createServer();
 await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
 const env={...buildWebEnv(readLocal()),PORT:String(port),WDS_SOCKET_PORT:String(port),CI:'true'};
 const command=[process.execPath,path.join(h.root,process.argv.includes('--baseline')?'node_modules/react-scripts/scripts/start.js':'scripts/toolchain/start.cjs')];
 const start=new Date();
 const child=cp.spawn(command[0],command.slice(1),{cwd:h.root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='',exitCode,exitSignal;
 child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
 const closed=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>{exitCode=code;exitSignal=signal;resolve();});});
 const checks=[],timings=[];
 let failure;
 try{
  const deadline=Date.now()+360000;
  let page;
  while(Date.now()<deadline){
   if(child.exitCode!==null)throw new Error('CRA terminó antes de servir el proyecto');
   if(/Failed to compile\./.test(stdout))throw new Error('CRA informó un fallo de compilación; HTTP 200 no basta');
   if(/Compiled successfully!/.test(stdout)){
    timings.push({event:'compiled',at:new Date().toISOString()});
    const r=await fetch(origin,{signal:AbortSignal.timeout(30000)});
    timings.push({event:'http-headers',at:new Date().toISOString(),status:r.status});
    assert.equal(r.status,200);page=await r.text();break;
   }
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(page,'CRA no devolvió HTML dentro del plazo');assert.match(page,/static\/js\/bundle\.js/);
  checks.push({name:'HTML real de CRA sobre loopback',state:'APROBADO',status:200});
  assert.match(stdout,/Compiled successfully!/);assert.doesNotMatch(stdout,/Failed to compile\./);
  checks.push({name:'Compilación de desarrollo sin errores',state:'APROBADO'});
  const bundle=await fetch(origin+'/static/js/bundle.js',{signal:AbortSignal.timeout(15000)});
  assert.equal(bundle.status,200);const bytes=(await bundle.arrayBuffer()).byteLength;assert.ok(bytes>1000);
  checks.push({name:'Bundle servido por el middleware actualizado',state:'APROBADO',status:200,bytes});
  const wsType=await new Promise((resolve,reject)=>{
   const Client=require('node:module').createRequire(require.resolve('webpack-dev-server'))('ws');
   const ws=new Client('ws://127.0.0.1:'+port+'/ws',{origin});
   const timer=setTimeout(()=>{ws.close();reject(new Error('No llegó un mensaje del canal HMR'));},10000);
   ws.addEventListener('error',()=>{clearTimeout(timer);ws.close();reject(new Error('Falló WebSocket local de CRA'));},{once:true});
   ws.addEventListener('message',event=>{clearTimeout(timer);ws.close();try{const message=JSON.parse(String(event.data));const type=message.action||message.type;assert.ok(['sync','built','building','hot','hash','ok'].includes(type),'Se esperaba un mensaje HMR válido, recibido '+type);resolve(type);}catch(e){reject(e);}},{once:true});
  });
  checks.push({name:'Canal WebSocket HMR real',state:'APROBADO',messageType:wsType});
  const WebSocketClient=require('node:module').createRequire(require.resolve('webpack-dev-server'))('ws');
  const denied=await new Promise((resolve,reject)=>{
   const ws=new WebSocketClient('ws://127.0.0.1:'+port+'/ws',{origin:'https://untrusted.example.test'});
   const timer=setTimeout(()=>{ws.terminate();reject(new Error('No se resolvió el control de origen HMR'));},10000);
   let refused=false;
   ws.on('unexpected-response',(_req,res)=>{clearTimeout(timer);ws.terminate();resolve(res.statusCode===403);});
   ws.on('message',data=>{const message=JSON.parse(String(data));const type=message.action||message.type;if(type==='error'&&/Invalid Host\/Origin header/.test(String(message.message||message.data)))refused=true;else if(['sync','built','building','hot','hash','ok'].includes(type)){clearTimeout(timer);ws.close();resolve(false);}});
   ws.on('close',()=>{clearTimeout(timer);resolve(refused);});
   ws.on('error',()=>{});
  });
  assert.equal(denied,true,'HMR debe rechazar orígenes web ajenos al host local');
  checks.push({name:'HMR rechaza un origen web no autorizado',state:'APROBADO'});
 }catch(e){failure=e;checks.push({name:'Control '+(checks.length+1),state:'FALLIDO',error:e.message});}
 finally{
  if(child.exitCode===null){
   assert.ok(Number.isInteger(child.pid)&&child.pid>0);
   await new Promise((resolve,reject)=>cp.execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},e=>e?reject(e):resolve()));
  }
  await closed;
  h.write(label+'.stdout.log',stdout);h.write(label+'.stderr.log',stderr);
  h.write(label+'-proceso.json',{command,start:start.toISOString(),end:new Date().toISOString(),durationSeconds:(Date.now()-start)/1000,exitCode,signal:exitSignal,intentionalStop:true,origin,scope:'Arranque CRA real, HTTP y HMR; se descargó el bundle sin ejecutar JavaScript de la app. Entorno REACT_APP exclusivamente local; no inicio de sesión ni proveedores externos.'});
  h.write(label+'-controles.json',{checks,executed:checks.length,passed:checks.filter(c=>c.state==='APROBADO').length,failed:checks.filter(c=>c.state==='FALLIDO').length});
  h.write(label+'-tiempos.json',timings);
 }
 if(failure)throw failure;
 console.log(JSON.stringify({executed:checks.length,passed:checks.length,failed:0}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
