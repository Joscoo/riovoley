const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const allowed=new Set(['riovoley.com','www.riovoley.com']);
const paths=['/','/login','/sobre','/horarios'];
const selectedHeaders=['content-type','cache-control','strict-transport-security','content-security-policy','x-content-type-options','referrer-policy','x-frame-options','permissions-policy'];
(async()=>{
 const observations=[];
 for(const path of paths){
  let url=new URL(path,'https://riovoley.com'),response;
  const redirects=[];
  for(let hop=0;hop<4;hop++){
   assert.equal(url.protocol,'https:');assert.ok(allowed.has(url.hostname));assert.ok(!url.username&&!url.password);
   response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000),headers:{'User-Agent':'RIOVOLEY-readonly-readiness'}});
   if(response.status>=300&&response.status<400&&response.headers.get('location')){
    const next=new URL(response.headers.get('location'),url);redirects.push({status:response.status,from:url.origin+url.pathname,to:next.origin+next.pathname});url=next;continue;
   }
   break;
  }
  const body=await response.text();
  observations.push({path,finalOrigin:url.origin,status:response.status,redirects,headers:Object.fromEntries(selectedHeaders.map(name=>[name,response.headers.get(name)])),bodySha256:crypto.createHash('sha256').update(body).digest('hex'),hasRootElement:/id=["']root["']/.test(body),mainScript:(body.match(/src=["']([^"']*\/static\/js\/main\.[^"']+\.js)["']/)||[])[1]||null});
 }
 h.write('seguridad/despliegue-publico.json',{observedAt:new Date().toISOString(),method:'GET HTTPS, solo HTML público; sin ejecutar JS, sesiones, credenciales o escrituras de negocio',targetConfirmedByUser:true,observations,scope:'Disponibilidad de rutas y cabeceras; no prueba login, roles, persistencia, correo ni push.'});
 console.log(JSON.stringify(observations.map(o=>({path:o.path,status:o.status,hasRootElement:o.hasRootElement,cspPresent:Boolean(o.headers['content-security-policy'])}))));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
