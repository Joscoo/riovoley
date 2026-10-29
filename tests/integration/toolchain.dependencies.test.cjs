const test=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const bfjRequire=createRequire(require.resolve('bfj'));
const jsonpathRequire=createRequire(bfjRequire.resolve('jsonpath'));
const underscore=jsonpathRequire('underscore');
const expressRequire=createRequire(require.resolve('express'));

test('QS de Express serializa arrays comma con null y undefined sin excepción (CVE-2026-8723)',()=>{
 const qs=expressRequire('qs');
 for(const value of [null,undefined]) assert.doesNotThrow(()=>qs.stringify({a:[value,'b']},{arrayFormat:'comma',encodeValuesOnly:true}));
});
test('Express conserva filtros anidados y body URL-encoded con el QS actualizado',async()=>{
 const express=require('express'),app=express();app.use(express.urlencoded({extended:true}));
 app.post('/audit',(req,res)=>res.json({query:req.query,body:req.body}));
 const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
 try{
  const r=await fetch('http://127.0.0.1:'+server.address().port+'/audit?filter[role]=student&sort=xp',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'items[]=one&items[]=two&profile[name]=local'});
  assert.equal(r.status,200);
  assert.deepEqual(await r.json(),{query:{filter:{role:'student'},sort:'xp'},body:{items:['one','two'],profile:{name:'local'}}});
 }finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});

test('Underscore usado por JSONPath procesa arrays de 20000 niveles sin desbordar la pila (CVE-2026-27601)',()=>{
 let nested=[1];for(let i=0;i<20000;i++)nested=[nested];
 assert.deepEqual(underscore.flatten(nested),[1]);
});
test('Underscore compara objetos de 6000 niveles sin desbordar la pila',()=>{
 let a={value:1},b={value:1};for(let i=0;i<6000;i++){a={next:a};b={next:b};}
 assert.equal(underscore.isEqual(a,b),true);
});
test('JSONPath mantiene filtros y selección recursiva con el parche de Underscore',()=>{
 const jp=bfjRequire('jsonpath');
 const data={rows:[{role:'admin',xp:16},{role:'student',xp:24},{role:'student',xp:8}]};
 assert.deepEqual(jp.query(data,'$..xp'),[16,24,8]);
 assert.deepEqual(jp.query(data,'$.rows[?(@.xp > 10)].role'),['admin','student']);
});
test('BFJ conserva la lectura y escritura JSON del informe de compilación',async()=>{
 const bfj=require('bfj'),data={assets:[{name:'main.js',size:1234}],warnings:[],errors:[]};
 const json=await bfj.stringify(data);
 assert.deepEqual(await bfj.parse(require('node:stream').Readable.from([json])),data);
});
