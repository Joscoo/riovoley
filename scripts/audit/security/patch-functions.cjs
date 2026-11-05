const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
h.run('seguridad/functions-parche-compatible',process.execPath,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'audit','fix','--ignore-scripts','--json'],{cwd:path.join(h.root,'functions'),allowFailure:true}).then(r=>{process.exitCode=r.exitCode??1;});
