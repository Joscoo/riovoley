const assert=require('node:assert/strict');
const {root,write}=require('../auditar.cjs');
const path=require('path');
(async()=>{
  const results=[];
  for(const [file,service] of [['functions/lib/index.js','functions'],['riovoley/index.js','riovoley']]) {
    const mod=require(path.join(root,file));
    const app=mod.app || mod;
    const server=await new Promise(resolve=>{ const s=app.listen(0,'127.0.0.1',()=>resolve(s)); });
    try {
      const response=await fetch('http://127.0.0.1:'+server.address().port+'/health');
      const body=await response.json();
      assert.equal(response.status,200); assert.equal(body.status,'ok'); assert.equal(body.service,service);
      results.push({file,service,httpStatus:response.status,body,status:'passed'});
    } finally { await new Promise(resolve=>server.close(resolve)); }
  }
  write('integracion/health-resultados.json',{observedAt:new Date().toISOString(),executed:results.length,passed:results.length,results,scope:'HTTP local real; no conexiones al backend ni persistencia'});
  console.log(JSON.stringify(results));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
