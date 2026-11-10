const fs=require('node:fs');
const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const names=[],origins=[];
const files=fs.readdirSync(h.root).filter(f=>/^\.env(?:$|\.)/.test(f)&&!f.endsWith('.example'));
for(const file of files){
 for(const match of fs.readFileSync(path.join(h.root,file),'utf8').matchAll(/^\s*([A-Z_0-9]+)\s*=\s*(.*?)\s*$/gm)){
  names.push({file,name:match[1],present:Boolean(match[2])});
  if(/(?:APP_URL|SUPABASE_URL)$/.test(match[1])){
   let value=match[2];if((value[0]==='"'||value[0]==="'")&&value.at(-1)===value[0])value=value.slice(1,-1);
   try{origins.push({file,name:match[1],origin:new URL(value).origin});}catch{}
  }
 }
}
h.write('seguridad/variables-locales.json',{names,publicOrigins:origins,valuesRecorded:false,scope:'Solo nombres, presencia y orígenes públicos sin credenciales, rutas o querystrings.'});
h.write('seguridad/vercel-descubrimiento.json',{time:new Date().toISOString(),method:'Conector Vercel: búsqueda riovoley en la cuenta disponible',matchingProjects:0,productionDeploymentIdentified:false,scope:'No demuestra inexistencia en otras cuentas; no se modificó configuración.'});
console.log(JSON.stringify({files:files.length,variableNames:names.length,publicOrigins:origins}));
