const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const npm=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
(async()=>{
  await h.run('integracion/functions-build',process.execPath,[npm,'run','build'],{cwd:path.join(h.root,'functions'),allowFailure:true});
  await h.run('integracion/functions-lint',process.execPath,[npm,'run','lint'],{cwd:path.join(h.root,'functions'),allowFailure:true});
  await h.run('integracion/auxiliar-lint',process.execPath,[npm,'run','lint'],{cwd:path.join(h.root,'riovoley'),allowFailure:true});
  await h.run('unitarias/auth-edge',process.execPath,[npm,'run','test:auth-edge'],{allowFailure:true});
})();
