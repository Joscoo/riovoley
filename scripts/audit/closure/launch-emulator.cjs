const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const h=require('../../e2e/local/harness.cjs');
const c=require('../android/context.cjs');
const {environment}=require('../android/environment.cjs');
(async()=>{
  const profile=JSON.parse(fs.readFileSync(path.join(h.runtime,'emulator-audit.json')));
  const {env,sdk}=environment();env.ANDROID_AVD_HOME=profile.avdHome;
  const args=['-avd',profile.avdName,'-port',String(profile.port),'-no-window','-no-audio','-no-boot-anim','-no-snapshot','-gpu','swiftshader','-memory','1536','-cores','2','-http-proxy','http://127.0.0.1:9'];
  const stdout=fs.openSync(path.join(c.work,'emulator-live.stdout.log'),'a');
  const stderr=fs.openSync(path.join(c.work,'emulator-live.stderr.log'),'a');
  const child=cp.spawn(path.join(sdk,'emulator/emulator.exe'),args,{env,windowsHide:true,detached:true,stdio:['ignore',stdout,stderr]});child.unref();
  const attempts=[],start=Date.now(),adb=path.join(sdk,'platform-tools/adb.exe'),serial='emulator-'+profile.port;
  while(Date.now()-start<300000) {
    try {
      const value=cp.execFileSync(adb,['-s',serial,'shell','getprop','sys.boot_completed'],{env,encoding:'utf8',windowsHide:true,timeout:4000,stdio:['ignore','pipe','pipe']}).trim();
      attempts.push({at:new Date().toISOString(),exitCode:0,bootCompleted:value});
      if(value==='1') {h.write('android/emulador-arranque.json',{status:'APROBADO',pid:child.pid,args,serial,durationSeconds:(Date.now()-start)/1000,attempts});console.log('Emulador local iniciado: '+serial);return;}
    } catch(error) {attempts.push({at:new Date().toISOString(),exitCode:error.status??null,bootCompleted:false});}
    await new Promise(resolve=>setTimeout(resolve,3000));
  }
  h.write('android/emulador-arranque.json',{status:'BLOQUEADO',pid:child.pid,args,durationSeconds:(Date.now()-start)/1000,attempts});
  throw new Error('Emulador no completó el arranque en cinco minutos; revisar logs privados');
})();
