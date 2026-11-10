const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const source=path.join(h.root,'functions/src');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
assert.ok(!fs.existsSync(path.join(source,'genkit-sample.ts')));
for(const file of files(source))assert.ok(!/genkit|@genkit-ai/.test(fs.readFileSync(file,'utf8')),'No retirar una dependencia utilizada');
h.run('seguridad/functions-retirar-genkit',process.execPath,[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),'uninstall','genkit','--ignore-scripts','--no-fund'],{cwd:path.join(h.root,'functions')}).catch(()=>{process.exitCode=1;});
