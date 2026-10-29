const fs=require('node:fs');
const path=require('node:path');
const base=require('../../e2e/local/harness.cjs');
const label=process.argv[2]||'final';
require('node:assert/strict').match(label,/^[a-z0-9-]+$/);
const h={...base,run:(name,...args)=>base.run(name+'-'+label,...args),write:(name,data)=>base.write(name.replace(/(\.[^.]+)$/,'-'+label+'$1'),data)};
const cli=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
(async()=>{
 const before=JSON.parse(fs.readFileSync(path.join(h.root,'package-lock.json'),'utf8'));
 const result=await h.run('seguridad/instalar-parche-underscore',process.execPath,[cli,'install','--ignore-scripts','--no-audit','--no-fund']);
 if(result.exitCode!==0)throw new Error('Instalación fallida');
 await h.run('seguridad/aplicar-parches-compatibles',process.execPath,[cli,'audit','fix','--ignore-scripts','--json'],{allowFailure:true});
 const after=JSON.parse(fs.readFileSync(path.join(h.root,'package-lock.json'),'utf8'));
 const changed=[];
 for(const name of new Set([...Object.keys(before.packages),...Object.keys(after.packages)])){
  const a=before.packages[name]?.version,b=after.packages[name]?.version;
  if(a!==b)changed.push({path:name,before:a||null,after:b||null});
 }
 h.write('seguridad/cambios-lockfile.json',{changed,overrides:require(path.join(h.root,'package.json')).overrides,forced:false,frameworkChanged:false});
 await h.run('seguridad/compatibilidad-underscore-verde',process.execPath,['--test','--test-reporter=tap','tests/integration/toolchain.dependencies.test.cjs']);
 const audit=await h.run('seguridad/npm-audit-final',process.execPath,[cli,'audit','--json'],{allowFailure:true});
 h.write('seguridad/npm-audit-final.json',JSON.parse(audit.stdout));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
