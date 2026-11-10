const test=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const {EventEmitter}=require('node:events');
const http=require('node:http');
const vm=require('node:vm');
const proxyRequire=createRequire(require.resolve('http-proxy-agent'));
const consumers=['css-minimizer-webpack-plugin','terser-webpack-plugin','rollup-plugin-terser'];

for(const consumer of consumers){
 const serialize=createRequire(require.resolve(consumer))('serialize-javascript');
 test(`${consumer}: serialización escapa el cierre script al final de una función (GHSA-m5mm-p8h7-m29v)`,()=>{
  function f(){}
  f.toString=()=> 'function f(){ return 1 }//</script';
  const output=serialize({f},{space:2});
  assert.doesNotMatch(output,/<\/script(?:$|[\t\n\f\r />])/i);
 });
 test(`${consumer}: conserva opciones y valores utilizados al serializar trabajo de compilación`,()=>{
  const input={options:{passes:2},callback:function(value){return value+1;},pattern:/asset\.js$/gi,date:new Date('2026-10-30T00:00:00.000Z'),missing:undefined,big:42n,map:new Map([['key',7]]),set:new Set(['asset'])};
  const output=vm.runInNewContext('('+serialize(input)+')',{}, {timeout:1000});
  assert.equal(output.options.passes,2);assert.equal(output.callback(2),3);
  assert.equal(output.pattern.source,input.pattern.source);assert.equal(output.pattern.flags,'gi');
  assert.equal(output.date.toISOString(),input.date.toISOString());assert.equal(output.big,42n);
  assert.equal(output.map.get('key'),7);assert.equal(output.set.has('asset'),true);
  assert.equal(Object.hasOwn(output,'missing'),true);assert.equal(output.missing,undefined);
 });
}

test('Once del consumidor HTTP rechaza la espera abortada y retira sus listeners',async()=>{
 const imported=proxyRequire('@tootallnate/once'),once=imported.default||imported;
 const emitter=new EventEmitter(),controller=new AbortController();
 const pending=once(emitter,'ready',{signal:controller.signal});
 let timer;
 try{
  controller.abort();
  await Promise.race([
   assert.rejects(pending,error=>error.name==='AbortError'),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('La espera abortada no se resolvió ni rechazó')),250);}),
  ]);
  assert.equal(emitter.listenerCount('ready'),0);assert.equal(emitter.listenerCount('error'),0);
 }finally{clearTimeout(timer);pending.cancel?.();emitter.removeAllListeners();}
});

test('HTTP Proxy Agent mantiene una solicitud HTTP real sobre loopback con Once actualizado',async()=>{
 const createAgent=require('http-proxy-agent');
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({url:req.url}));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const agent=createAgent('http://127.0.0.1:'+server.address().port);
 try{
  const body=await new Promise((resolve,reject)=>{
   const req=http.get('http://127.0.0.1:1/audit',{agent},res=>{let body='';res.on('data',d=>body+=d);res.on('end',()=>resolve(body));});
   req.on('error',reject);req.setTimeout(2000,()=>req.destroy(new Error('Timeout en proxy de prueba')));
  });
  assert.deepEqual(JSON.parse(body),{url:'http://127.0.0.1:1/audit'});
 }finally{agent.destroy();await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});

test('HTTP Proxy Agent propaga el rechazo de conexión en lugar de dejar la petición pendiente',async()=>{
 const server=http.createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;await new Promise(resolve=>server.close(resolve));
 const agent=require('http-proxy-agent')('http://127.0.0.1:'+port);
 try{
  await assert.rejects(new Promise((resolve,reject)=>{
   const req=http.get('http://127.0.0.1:1/audit',{agent},resolve);req.on('error',reject);
   req.setTimeout(2000,()=>req.destroy(new Error('Timeout en conexión de prueba')));
  }),error=>error.code==='ECONNREFUSED');
 }finally{agent.destroy();}
});
