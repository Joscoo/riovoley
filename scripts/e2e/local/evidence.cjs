const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const suffix=()=>Date.now()+'-'+crypto.randomBytes(3).toString('hex');
function allocateRun(parent,prefix,requested) {
  const label=requested||prefix+'-'+suffix();
  if(!/^[a-z0-9-]+$/.test(label)) throw new Error('Etiqueta de evidencia inválida');
  const directory=path.join(parent,label);
  if(fs.existsSync(directory)) throw new Error('La evidencia ya existe; usar otra etiqueta');
  fs.mkdirSync(directory);
  return {label,directory};
}
function writeNew(parent,name,text) {
  let file=path.join(parent,name);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  if(fs.existsSync(file)) {const ext=path.extname(file);file=(ext?file.slice(0,-ext.length):file)+'-'+suffix()+ext;}
  fs.writeFileSync(file,text,{flag:'wx'});
  return file;
}
function emptyEdgeEnv(runtime) {
  const file=path.join(runtime,'edge-'+suffix()+'.env');
  fs.writeFileSync(file,'# Generado por el arnes local; sin variables de proveedores externos.\n',{flag:'wx'});
  return file;
}
module.exports={allocateRun,writeNew,emptyEdgeEnv};
