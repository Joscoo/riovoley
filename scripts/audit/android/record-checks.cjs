const c=require('./context.cjs');
(async()=>{
  await c.run('android/guardas-entorno',process.execPath,['--test','scripts/audit/android/environment.test.cjs']);
  await c.run('android/guardas-privacidad','python',['scripts/audit/android/privacy_test.py']);
  const path=require('node:path');
  await c.run('android/apk-privacidad-verificada','python',['scripts/audit/android/privacy.py','--apk',path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk'),'--report','android/privacidad-previa-verificada.json']);
})();
