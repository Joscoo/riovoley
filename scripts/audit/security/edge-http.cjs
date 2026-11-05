const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const h=require('../../e2e/local/harness.cjs');
const {readLocal}=require('../../e2e/local/safety.cjs');
(async()=>{
 const local=readLocal(),folder=path.join(h.runtime,'edge-http');fs.mkdirSync(folder,{recursive:true});
 const shim=path.join(folder,'serve.ts'),entry=path.join(folder,'entry.ts'),map=path.join(folder,'imports.json');
 fs.writeFileSync(shim,"export const serve=(handler: (req: Request)=>Response|Promise<Response>)=>{((globalThis as any).__auditHandlers ||= []).push(handler);};\n");
 fs.writeFileSync(map,JSON.stringify({imports:{'https://deno.land/std@0.168.0/http/server.ts':pathToFileURL(shim).href}}));
 fs.writeFileSync(entry,`await import(${JSON.stringify(pathToFileURL(path.join(h.root,'supabase/functions/delete-auth-user/index.ts')).href)});\nawait import(${JSON.stringify(pathToFileURL(path.join(h.root,'supabase/functions/send-push/index.ts')).href)});\nconst handlers=(globalThis as any).__auditHandlers;\nconst server=Deno.serve({hostname:'127.0.0.1',port:6161},async req=>{const p=new URL(req.url).pathname;if(p==='/__stop'&&req.headers.get('X-audit-shutdown')===Deno.env.get('RIOVOLEY_TEST_STOP_TOKEN')){setTimeout(()=>server.shutdown(),0);return new Response('stopping');}if(p==='/__health')return new Response('ready');return p==='/delete-auth-user'?handlers[0](req):p==='/send-push'?handlers[1](req):new Response('unknown',{status:404});});await server.finished;\n`);
 const nonce=crypto.randomBytes(32).toString('hex');
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/SUPABASE|RESEND|FCM|TOKEN|SECRET|PASSWORD|GOOGLE_APPLICATION_CREDENTIALS/.test(key)));
 Object.assign(env,{SUPABASE_URL:local.apiUrl,SUPABASE_SERVICE_ROLE_KEY:local.serviceRoleKey,DENO_DIR:path.join(h.runtime,'deno-cache'),DENO_NO_PROMPT:'1',RIOVOLEY_TEST_STOP_TOKEN:nonce,CI:'true'});
 const deno=path.join(h.runtime,'deno-tool/node_modules/@deno/win32-x64/deno.exe');
 const server=h.run('integracion/edge-http-servidor',deno,['run','--no-config','--cached-only','--import-map='+map,'--allow-net=127.0.0.1:55321,127.0.0.1:6161','--allow-env','--allow-read='+path.join(h.runtime,'deno-cache'),entry],{env,allowFailure:true,timeoutMs:180000});
 let ready=false;
 try{
  for(let i=0;i<45&&!ready;i++){try{ready=(await fetch('http://127.0.0.1:6161/__health',{signal:AbortSignal.timeout(500)})).ok;}catch{}if(!ready)await new Promise(r=>setTimeout(r,500));}
  if(!ready)throw new Error('Servidor Edge HTTP local no quedó disponible');
  const result=await h.run('integracion/edge-http-pruebas',process.execPath,['functions/node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap','tests/integration/edge-http.local.test.cjs'],{allowFailure:true,timeoutMs:120000});process.exitCode=result.exitCode??1;
 }finally{
  if(ready)await fetch('http://127.0.0.1:6161/__stop',{method:'POST',headers:{'X-audit-shutdown':nonce},signal:AbortSignal.timeout(2000)}).catch(()=>{});
  const result=await server;if(result.exitCode!==0)process.exitCode=1;
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
