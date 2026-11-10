const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript'),entry=path.resolve('supabase/functions/send-payment-reminders/index.ts');
function handler(secret,payments){
 let serve,queries=0;const module={exports:{}};
 const compiled=ts.transpileModule(fs.readFileSync(entry,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const query={select:()=>query,is:()=>query,lte:async()=>({data:payments,error:null})};
 const loader=id=>id.includes('/http/server.ts')?{serve:fn=>{serve=fn;}}:id.startsWith('npm:')?{createClient:()=>({from:table=>{queries++;if(table!=='payments'||payments===undefined)throw Error('Unexpected database access');return query;}})}:id.includes('firebase-push')?{FirebasePushGateway:class{constructor(){throw Error('Unexpected provider access');}}}:require(path.resolve(path.dirname(entry),id));
 const env={SUPABASE_URL:'http://127.0.0.1:55321',SUPABASE_SERVICE_ROLE_KEY:'synthetic',REPORTS_SCHEDULER_SECRET:secret};
 vm.runInNewContext('(function(require,module,exports,Deno){'+compiled+'})',{Request,Response,console})(loader,module,module.exports,{env:{get:key=>env[key]}});
 return {serve,queries:()=>queries};
}
test('recordatorios sin secreto configurado se bloquean antes de consultar datos',async()=>{
 const h=handler(''),r=await h.serve(new Request('http://127.0.0.1/test',{method:'POST'}));assert.equal(r.status,503);assert.equal(h.queries(),0);
});
test('recordatorios con secreto incorrecto devuelven403 sin consultas',async()=>{
 const h=handler('synthetic-scheduler-secret'),r=await h.serve(new Request('http://127.0.0.1/test',{method:'POST',headers:{'x-scheduler-secret':'wrong'}}));assert.equal(r.status,403);assert.equal(h.queries(),0);
});
test('secreto válido conserva la respuesta legítima sin destinatarios',async()=>{
 const h=handler('synthetic-scheduler-secret',[]),r=await h.serve(new Request('http://127.0.0.1/test',{method:'POST',headers:{'x-scheduler-secret':'synthetic-scheduler-secret'}}));assert.equal(r.status,200);assert.equal((await r.json()).code,'PAYMENT_REMINDERS_SKIPPED');assert.equal(h.queries(),1);
});
test('destinatarios ambiguos abortan el lote antes de consultar dispositivos o enviar',async()=>{
 const h=handler('synthetic-scheduler-secret',[{students:[{users:{id:'a'}},{users:{id:'b'}}]}]),r=await h.serve(new Request('http://127.0.0.1/test',{method:'POST',headers:{'x-scheduler-secret':'synthetic-scheduler-secret'}}));assert.equal(r.status,500);assert.equal(h.queries(),1);
});
