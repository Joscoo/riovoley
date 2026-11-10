const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 await h.run('integracion/functions-build-final',process.execPath,[npm,'run','build'],{cwd:path.join(h.root,'functions')});
 await h.run('integracion/functions-lint-final',process.execPath,[npm,'run','lint'],{cwd:path.join(h.root,'functions')});
 await h.run('integracion/functions-health-final',process.execPath,['--test','--test-reporter=tap','tests/integration/functions-health.local.test.cjs']);
})();
