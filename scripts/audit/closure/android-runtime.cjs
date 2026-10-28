const path=require('node:path');
const fs=require('node:fs');
const h=require('../../e2e/local/harness.cjs');
const {environment}=require('../android/environment.cjs');
(async()=>{
  const {env,sdk}=environment();
  const manager=path.join(sdk,'cmdline-tools/latest/bin/sdkmanager.bat');
  await h.run('android/emulator-instalar',process.env.ComSpec||'C:\\Windows\\System32\\cmd.exe',['/d','/c',manager+' --sdk_root='+sdk+' emulator'],{env,input:'y\n'.repeat(20)});
  const r=await h.run('android/aceleracion',path.join(sdk,'emulator/emulator.exe'),['-accel-check'],{env,allowFailure:true});
  h.write('android/aceleracion.json',{exitCode:r.exitCode,output:r.stdout+r.stderr,scope:'Consulta de aceleración; no se cambian características Windows ni se reinicia el equipo.'});
})();
