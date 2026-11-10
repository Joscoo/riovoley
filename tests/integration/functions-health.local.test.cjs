const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const {app}=require('../../functions/lib/index.js');
let server,url;
before(async()=>{server=app.listen(0,'127.0.0.1');await once(server,'listening');url='http://127.0.0.1:'+server.address().port;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('servicio functions responde health real en loopback',async()=>{const r=await fetch(url+'/health');assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'ok',service:'functions',provider:'supabase'});});
test('servicio functions conserva su respuesta pública de diagnóstico',async()=>{const r=await fetch(url+'/');assert.equal(r.status,200);assert.match(await r.text(),/Supabase-only integrations/);});
