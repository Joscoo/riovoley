'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{pathToFileURL}=require('node:url');
const h=require('../../e2e/local/harness.cjs'),{readLocal}=require('../../e2e/local/safety.cjs');
(async()=>{
 const local=readLocal(),dir=path.join(h.runtime,'edge-production/http');fs.mkdirSync(dir,{recursive:true});
 const shim=path.join(dir,'serve.ts'),entry=path.join(dir,'entry.ts'),map=path.join(dir,'imports.json');
 fs.writeFileSync(shim,'export const serve=(handler: (req: Request)=>Response|Promise<Response>)=>{((globalThis as any).__auditHandlers ||= []).push(handler);};\n');
 fs.writeFileSync(map,JSON.stringify({imports:{'https://deno.land/std@0.168.0/http/server.ts':pathToFileURL(shim).href}}));
 const names=['generate-report','delete-report-run','send-payment-reminders'];
 fs.writeFileSync(entry,names.map(name=>`await import(${JSON.stringify(pathToFileURL(path.join(h.root,'supabase/functions',name,'index.ts')).href)});`).join('\n')+`\nconst names=${JSON.stringify(names)};const handlers=(globalThis as any).__auditHandlers;const server=Deno.serve({hostname:'127.0.0.1',port:6162},async req=>{const p=new URL(req.url).pathname;if(p==='/__health')return new Response('ready');if(p==='/__stop'&&req.headers.get('X-audit-shutdown')===Deno.env.get('RIOVOLEY_TEST_STOP_TOKEN')){setTimeout(()=>server.shutdown(),0);return new Response('stopping');}const i=names.indexOf(p.slice(1));return i<0?new Response('unknown',{status:404}):handlers[i](req);});await server.finished;\n`);
 const env=Object.fromEntries(Object.entries(process.env).filter(([k])=>!/SUPABASE|RESEND|FCM|TOKEN|SECRET|PASSWORD|GOOGLE_APPLICATION_CREDENTIALS/.test(k)));
 const nonce=crypto.randomBytes(32).toString('hex');Object.assign(env,{SUPABASE_URL:local.apiUrl,SUPABASE_ANON_KEY:local.anonKey,SUPABASE_SERVICE_ROLE_KEY:local.serviceRoleKey,DENO_DIR:path.join(h.runtime,'deno-cache'),DENO_NO_PROMPT:'1',RIOVOLEY_TEST_STOP_TOKEN:nonce});
 const running=h.run('integracion/reportes-http-servidor',path.join(h.runtime,'deno-tool/node_modules/@deno/win32-x64/deno.exe'),['run','--no-config','--cached-only','--lock='+path.join(h.runtime,'edge-production/deno.lock'),'--import-map='+map,'--allow-net=127.0.0.1:55321,127.0.0.1:6162','--allow-env','--allow-read='+path.join(h.runtime,'deno-cache'),entry],{env,allowFailure:true,timeoutMs:120000});
 let ready=false;
 try{for(let i=0;i<30&&!ready;i++){try{ready=(await fetch('http://127.0.0.1:6162/__health',{signal:AbortSignal.timeout(500)})).ok;}catch{}if(!ready)await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('Servidor local de reportes no disponible');const result=await h.run('integracion/reportes-http-pruebas',process.execPath,['functions/node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap','tests/integration/edge-reporting.local.test.cjs'],{allowFailure:true,timeoutMs:90000});process.exitCode=result.exitCode??1;
 }finally{if(ready)await fetch('http://127.0.0.1:6162/__stop',{method:'POST',headers:{'X-audit-shutdown':nonce}}).catch(()=>{});if((await running).exitCode!==0)process.exitCode=1;}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
