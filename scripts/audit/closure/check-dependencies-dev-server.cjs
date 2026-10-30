const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const net=require('node:net');
const h=require('../../e2e/local/harness.cjs');
const {buildWebEnv,readLocal}=require('../../e2e/local/safety.cjs');
(async()=>{
 const port=6101,origin='http://127.0.0.1:'+port;
 const probe=net.createServer();
 await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
 const env={...buildWebEnv(readLocal()),PORT:String(port),WDS_SOCKET_PORT:String(port),CI:'true'};
 const command=[process.execPath,path.join(h.root,'node_modules/react-scripts/scripts/start.js')];
 const start=new Date();
 const child=cp.spawn(command[0],command.slice(1),{cwd:h.root,env,windowsHide:true,stdio:['ignore','pipe','pipe']});
 let stdout='',stderr='',exitCode,exitSignal;
 child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
 const closed=new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>{exitCode=code;exitSignal=signal;resolve();});});
 const checks=[];
 let failure;
 try{
  const deadline=Date.now()+240000;
  let page;
  while(Date.now()<deadline){
   if(child.exitCode!==null)throw new Error('CRA terminó antes de servir el proyecto');
   try{const r=await fetch(origin,{signal:AbortSignal.timeout(1500)});if(r.ok){page=await r.text();break;}}catch{}
   await new Promise(resolve=>setTimeout(resolve,500));
  }
  assert.ok(page,'CRA no devolvió HTML dentro del plazo');assert.match(page,/static\/js\/bundle\.js/);
  checks.push({name:'HTML real de CRA sobre loopback',state:'APROBADO',status:200});
  const bundle=await fetch(origin+'/static/js/bundle.js',{signal:AbortSignal.timeout(15000)});
  assert.equal(bundle.status,200);const bytes=(await bundle.arrayBuffer()).byteLength;assert.ok(bytes>1000);
  checks.push({name:'Bundle servido por el middleware actualizado',state:'APROBADO',status:200,bytes});
  const wsType=await new Promise((resolve,reject)=>{
   const ws=new WebSocket('ws://127.0.0.1:'+port+'/ws');
   const timer=setTimeout(()=>{ws.close();reject(new Error('No llegó un mensaje del canal HMR'));},10000);
   ws.addEventListener('error',()=>{clearTimeout(timer);ws.close();reject(new Error('Falló WebSocket local de CRA'));},{once:true});
   ws.addEventListener('message',event=>{clearTimeout(timer);ws.close();try{const message=JSON.parse(String(event.data));assert.equal(typeof message.type,'string');resolve(message.type);}catch(e){reject(e);}},{once:true});
  });
  checks.push({name:'Canal WebSocket HMR real',state:'APROBADO',messageType:wsType});
 }catch(e){failure=e;checks.push({name:'Control '+(checks.length+1),state:'FALLIDO',error:e.message});}
 finally{
  if(child.exitCode===null){
   assert.ok(Number.isInteger(child.pid)&&child.pid>0);
   await new Promise((resolve,reject)=>cp.execFile('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true},e=>e?reject(e):resolve()));
  }
  await closed;
  h.write('integracion/dev-server.stdout.log',stdout);h.write('integracion/dev-server.stderr.log',stderr);
  h.write('integracion/dev-server-proceso.json',{command,start:start.toISOString(),end:new Date().toISOString(),durationSeconds:(Date.now()-start)/1000,exitCode,signal:exitSignal,intentionalStop:true,origin,scope:'Arranque CRA real, HTTP y HMR; se descargó el bundle sin ejecutar JavaScript de la app. Entorno REACT_APP exclusivamente local; no inicio de sesión ni proveedores externos.'});
  h.write('integracion/dev-server-controles.json',{checks,executed:checks.length,passed:checks.filter(c=>c.state==='APROBADO').length,failed:checks.filter(c=>c.state==='FALLIDO').length});
 }
 if(failure)throw failure;
 console.log(JSON.stringify({executed:checks.length,passed:checks.length,failed:0}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
