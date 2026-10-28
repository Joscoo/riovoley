const path=require('node:path');
const c=require('./context.cjs');
const {environment}=require('./environment.cjs');
(async()=>{
  const {env,sdk}=environment();
  const r=await c.run('android/adb-dispositivos',path.join(sdk,'platform-tools/adb.exe'),['devices','-l'],{env,privateOutput:true});
  const devices=r.stdout.split(/\r?\n/).filter(line=>line.trim()&&!line.startsWith('List of devices')&&!line.startsWith('*')).map(line=>({status:line.trim().split(/\s+/)[1]}));
  c.write('android/dispositivos'+(process.argv[2]==='final'?'-final':'')+'.json',{observedAt:new Date().toISOString(),count:devices.length,devices,installedOnDevice:false,instrumentedExecution:'NO EJECUTADO: requiere emulador o dispositivo autorizado; no se instala ni inicia la app con esta consulta.'});
})();
