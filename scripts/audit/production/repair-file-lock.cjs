const fs=require('node:fs'),path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const cwd=path.join(h.runtime,'spikes','packed-lock-'+Date.now());fs.mkdirSync(cwd,{recursive:true});
 fs.cpSync(path.join(h.root,'vendor'),path.join(cwd,'vendor'),{recursive:true});
 const cli=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 for(const folder of ['.','functions','riovoley']){
  const dest=path.join(cwd,folder);fs.mkdirSync(dest,{recursive:true});
  fs.copyFileSync(path.join(h.root,folder,'package.json'),path.join(dest,'package.json'));
  fs.copyFileSync(path.join(h.root,folder,'.npmrc'),path.join(dest,'.npmrc'));
  const lock=JSON.parse(fs.readFileSync(path.join(h.root,folder,'package-lock.json')));
  for(const [key,value]of Object.entries(lock.packages))if(value.link||key.includes('/vendor/')||key.startsWith('vendor/')||value.resolved?.startsWith('file:'))delete lock.packages[key];
  fs.writeFileSync(path.join(dest,'package-lock.json'),JSON.stringify(lock,null,2));
  await h.run('seguridad/lock-empaquetado-'+(folder==='.'?'raiz':folder),process.execPath,[cli,'install','--package-lock-only','--ignore-scripts','--no-audit','--no-fund'],{cwd:dest});
  fs.copyFileSync(path.join(dest,'package-lock.json'),path.join(h.root,folder,'package-lock.json'));
 }
 h.write('seguridad/reparacion-lock.json',{directory:path.relative(h.root,cwd),scope:'Regeneración aislada de entradas locales inválidas con install-links=true; versiones restantes conservadas en el lock de entrada. No se editaron node_modules manualmente.'});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
