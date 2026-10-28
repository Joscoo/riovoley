const fs=require('node:fs');
const path=require('node:path');
const c=require('./context.cjs');
const label=process.argv[2]||'final';
if(!['inicial','final'].includes(label)) throw new Error('Usar inicial o final');
const source=path.join(c.work,'project/android/app/build/reports');
for(const ext of ['html','xml','txt']) {
  const name='lint-results-debug.'+ext;
  c.write('android/lint/'+label+'/'+name,fs.readFileSync(path.join(source,name),'utf8'));
}
if(label==='inicial') {
  const value=path.join(c.work,'sdk').replaceAll('\\','/').replaceAll(':','\\:');
  fs.writeFileSync(path.join(c.work,'project/android/local.properties'),'sdk.dir='+value+'\n');
  c.write('android/lint/correccion-entorno.json',{cause:'PropertyEscape en la propiedad sdk.dir generada por el arnés para Windows.',correction:'Escapar los dos puntos de la letra de unidad con \\:; solo local.properties de la copia aislada.',productionChanges:false,expectationsChanged:false});
}
