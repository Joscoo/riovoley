const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const {dockerArgs,localDockerEnv,dockerSocket}=require('./safety.cjs');
function copyKongHome(source,target) {
  return new Promise((resolve,reject)=>{
    const from=cp.spawn('docker',dockerArgs(['cp','--archive',source+':/home/kong','-']),{windowsHide:true,env:localDockerEnv()});
    const to=cp.spawn('docker',dockerArgs(['cp','--archive','-',target+':/home/']),{windowsHide:true,env:localDockerEnv()});
    from.stdout.pipe(to.stdin);
    let errors='';from.stderr.on('data',d=>errors+=d);to.stderr.on('data',d=>errors+=d);
    from.on('error',reject);to.on('error',reject);
    to.on('close',code=>code===0?resolve():reject(new Error('No se pudo conservar runtime Kong: '+errors)));
  });
}
function loopbackConfig(inspected) {
  const host=structuredClone(inspected.HostConfig);
  for(const mappings of Object.values(host.PortBindings||{})) for(const mapping of mappings) mapping.HostIp='127.0.0.1';
  const endpoints=Object.fromEntries(Object.entries(inspected.NetworkSettings.Networks).map(([name,network])=>[name,{Aliases:network.Aliases,NetworkID:network.NetworkID}]));
  return {...inspected.Config,HostConfig:host,NetworkingConfig:{EndpointsConfig:endpoints}};
}
function api(method,url,body) {
  return new Promise((resolve,reject)=>{
    const payload=body?JSON.stringify(body):null;
    const request=http.request({socketPath:dockerSocket,path:'/v1.55'+url,method,headers:payload?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(payload)}:{}},response=>{
      let output='';response.on('data',d=>output+=d);response.on('end',()=>{
        if(response.statusCode>=400) reject(new Error('Docker API '+method+' '+url+': HTTP '+response.statusCode));
        else resolve(output?JSON.parse(output):null);
      });
    });
    request.on('error',reject);request.end(payload);
  });
}
async function enforceLoopback() {
  const h=require('./harness.cjs');
  const results=[];
  for(const service of ['db','kong','inbucket']) {
    const name='supabase_'+service+'_riovoley-e2e-local';
    const original=await api('GET','/containers/'+name+'/json');
    assert.ok(original.Name==='/'+name);
    const bindings=Object.values(original.HostConfig.PortBindings||{}).flat();
    if(!bindings.every(b=>b.HostIp==='127.0.0.1')) {
      const backup=name+'-before-loopback-'+Date.now();
      const dir=path.join(h.runtime,'container-backups');fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,backup+'.json'),JSON.stringify(original));
      await api('POST','/containers/'+name+'/stop?t=30');
      await api('POST','/containers/'+name+'/rename?name='+backup);
      await api('POST','/containers/create?name='+name,loopbackConfig(original));
      // CLI copia certificados/config al filesystem del gateway, fuera de volúmenes.
      // Transferencia TAR directa: conserva uid/gid y modos; no pasa por NTFS.
      if(service==='kong') await copyKongHome(backup,name);
      await api('POST','/containers/'+name+'/start');
    }
    const current=await api('GET','/containers/'+name+'/json');
    assert.ok(Object.values(current.HostConfig.PortBindings).flat().every(b=>b.HostIp==='127.0.0.1'));
    results.push({service,bindings:current.HostConfig.PortBindings,verified:true});
  }
  h.write('red-local/bindings.json',{observedAt:new Date().toISOString(),results,note:'Se conservaron contenedores anteriores detenidos y sus volúmenes; solo se recrearon los tres contenedores descartables de este proyecto para fijar HostIp.'});
  console.log('Puertos del stack E2E limitados a 127.0.0.1');
}
if(require.main===module) enforceLoopback().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={loopbackConfig,enforceLoopback,copyKongHome};
