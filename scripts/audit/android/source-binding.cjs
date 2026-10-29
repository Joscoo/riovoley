const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs');
const c=require('./context.cjs');
const dir=path.join(c.work,'project/build-safe/static/js');
const source=fs.readFileSync(path.join(h.root,'src/shared/platform/push.js'),'utf8').replace(/\r\n/g,'\n');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const entries=[];
for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('.map'))){
 const map=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
 map.sources.forEach((name,i)=>{if(('/'+name.replaceAll('\\','/')).endsWith('/shared/platform/push.js')){
  const bundled=map.sourcesContent[i].replace(/\r\n/g,'\n');
  entries.push({map:file,source:'src/shared/platform/push.js',matchesCurrent:bundled===source,sourceSha256:digest(source),bundledSourceSha256:digest(bundled)});
 }});
}
const result={state:entries.length&&entries.every(x=>x.matchesCurrent)?'APROBADO':'FALLIDO',entries,scope:'Comparación exacta del contenido de push.js del mapa de fuentes compilado con el archivo actual, normalizando únicamente CRLF.'};
h.write('android/vinculacion-fuentes-web.json',result);console.log(JSON.stringify(result));process.exitCode=result.state==='APROBADO'?0:1;
