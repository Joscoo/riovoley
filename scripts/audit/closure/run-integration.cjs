const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const label=process.argv[2]||'integracion-real';
h.run('integracion/'+label,process.execPath,['functions/node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap','tests/integration/gamification.local.test.cjs'],{allowFailure:true}).then(r=>{process.exitCode=r.exitCode;});
