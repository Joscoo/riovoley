const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const cli=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
(async()=>{
  for(const [label,folder] of [['raiz','.'],['functions','functions'],['auxiliar','riovoley']]) {
    await h.run('seguridad/npm-'+label+'-reparacion',process.execPath,[cli,'audit','fix','--ignore-scripts','--json'],{cwd:path.join(h.root,folder),allowFailure:true});
  }
})();
