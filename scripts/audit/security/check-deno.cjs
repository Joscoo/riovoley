const path=require('node:path');
const fs=require('node:fs');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const prefix=path.join(h.runtime,'deno-tool'),binary=path.join(prefix,'node_modules/@deno/win32-x64/deno.exe');
 if(!fs.existsSync(binary))await h.run('herramientas/deno-instalar',process.execPath,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'install','--prefix',prefix,'--save-exact','--ignore-scripts','--no-audit','--no-fund','deno@2.9.6']);
 await h.run('herramientas/deno-version',binary,['--version']);
 await h.run('herramientas/deno-ayuda',binary,['check','--help']);
})();
