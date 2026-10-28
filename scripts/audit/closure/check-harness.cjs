const h=require('../../e2e/local/harness.cjs');
(async()=>{
  await h.run('unitarias/arnes-final',process.execPath,['--test',...['safety','schema','loopback','evidence'].map(n=>'scripts/e2e/local/'+n+'.test.cjs')]);
  await h.run('unitarias/privacidad-apk','python',['scripts/audit/android/privacy_test.py']);
  await h.run('versiones-node',process.execPath,['--version']);
  await h.run('versiones-npm',process.execPath,[require('node:path').join(require('node:path').dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'--version']);
})();
