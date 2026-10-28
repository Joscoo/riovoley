const fs=require('node:fs');
const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const c=require('../android/context.cjs');
const {environment}=require('../android/environment.cjs');
(async()=>{
  const {env,sdk}=environment();
  const cmd=process.env.ComSpec||'C:\\Windows\\System32\\cmd.exe';
  const manager=path.join(sdk,'cmdline-tools/latest/bin/sdkmanager.bat');
  await h.run('android/imagen-instalar',cmd,['/d','/c',manager+' --sdk_root='+sdk+' system-images;android-36;google_apis;x86_64'],{env,input:'y\n'.repeat(20)});
  const avd=path.join(c.work,'closure-avd');
  env.ANDROID_AVD_HOME=path.join(c.work,'closure-avds');fs.mkdirSync(env.ANDROID_AVD_HOME,{recursive:true});
  await h.run('android/avd-crear',cmd,['/d','/c',path.join(sdk,'cmdline-tools/latest/bin/avdmanager.bat')+' create avd -n riovoley-audit -k system-images;android-36;google_apis;x86_64 -p '+avd],{env,input:'no\n'});
  fs.writeFileSync(path.join(h.runtime,'emulator-audit.json'),JSON.stringify({avdName:'riovoley-audit',avdHome:env.ANDROID_AVD_HOME,avdPath:avd,sdk,port:5580}));
  h.write('android/emulador-perfil.json',{name:'riovoley-audit',image:'system-images;android-36;google_apis;x86_64',port:5580,disposable:true,physicalDevice:false});
})();
