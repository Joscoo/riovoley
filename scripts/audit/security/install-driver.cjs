const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
h.run('herramientas/pg-local',process.execPath,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'install','--prefix',path.join(h.runtime,'sql-driver'),'--no-audit','--no-fund','--save-exact','pg@8.23.1']).catch(()=>{process.exitCode=1;});
