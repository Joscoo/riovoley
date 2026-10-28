const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const {environment}=require('../android/environment.cjs');
(async()=>{
  const profile=JSON.parse(fs.readFileSync(path.join(h.runtime,'emulator-audit.json')));assert.equal(profile.port,5580);assert.equal(profile.avdName,'riovoley-audit');
  const {env,sdk}=environment();
  await h.run('android/emulador-detener',path.join(sdk,'platform-tools/adb.exe'),['-s','emulator-5580','emu','kill'],{env});
})();
