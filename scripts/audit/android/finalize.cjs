const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const c=require('./context.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(c.base,file),'utf8'));
function walk(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);}
(async()=>{
  await c.run('android/privacidad-final','python',['scripts/audit/android/privacy.py']);
  const checks=[];
  function check(name,fn) {try{const details=fn();checks.push({name,state:'APROBADO',details});}catch(e){checks.push({name,state:'FALLIDO',error:e.message});}}
  check('APK final coincide con archivo privado, firma verificada y metadatos',()=>{
    const report=read('resumen-android.json'),a=read('android/artefacto-final.json');
    assert.equal(c.hash(path.join(c.base,a.file)),a.sha256);assert.equal(c.hash(path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk')),a.sha256);
    assert.equal(report.nativeBuild.exitCode,0);assert.equal(a.metadata.applicationId,'com.riovoley.app');assert.equal(a.metadata.variantName,'debug');
    assert.equal(report.capacitorSync.plugins,7);
    assert.equal(fs.readdirSync(path.join(c.base,'android/artefactos')).filter(f=>f.endsWith('.apk')).length,1);
  });
  check('Lint final sin errores y con advertencias conservadas',()=>{const r=read('android/lint/final/resumen.json');assert.equal(r.errors,0);assert.equal(r.warnings,29);assert.equal(read('resumen-android.json').lint.exitCode,0);});
  check('JUnit y guardas con denominadores independientes',()=>{
    const r=read('android/unitarias-final/resumen.json');assert.equal(r.results.length,1);assert.equal(r.results[0].tests,1);assert.equal(r.results[0].failures,0);assert.equal(r.results[0].errors,0);assert.equal(r.results[0].skipped,0);
    assert.equal(read('android/guardas-privacidad.meta.json').exitCode,0);assert.match(fs.readFileSync(path.join(c.base,'android/guardas-privacidad.stderr.log'),'utf8'),/Ran 3 tests/);
  });
  check('Privacidad final: todo el APK y archivos públicos sin valores pendientes',()=>{const p=read('PRIVACIDAD.json');assert.equal(p.unresolved.length,0);assert.equal(read('android/privacidad-previa-verificada.json').unresolved.length,0);return {checked:p.checked};});
  check('Fuentes originales y cambios locales previos preservados',()=>{
    const before=read('android/fuentes-iniciales.json');for(const row of before) assert.equal(c.hash(path.join(c.root,row.file)),row.sha256,row.file);return {checked:before.length,changed:0};
  });
  check('Expedientes anteriores conservados',()=>{
    const folders=['docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e','docs/tesis/evidencias/e2e-aislado/20261028-141243-c71f55e','docs/tesis/evidencias/e2e-aislado/20261028-101418-correcciones-c71f55e'];
    return folders.map(folder=>{const base=path.join(c.root,folder),m=JSON.parse(fs.readFileSync(path.join(base,'MANIFIESTO_SHA256.json')));const entries=m.entries||[...m.evidenceFiles,...m.additionalTestSources];for(const row of entries)assert.equal(c.hash(path.resolve(base,row.file)),row.sha256,row.file);return {folder,checked:entries.length};});
  });
  check('No se confunde compilación con ejecución en dispositivo',()=>{
    const d=read('android/dispositivos-final.json');assert.equal(d.count,0);assert.equal(d.installedOnDevice,false);
    const text=fs.readFileSync(path.join(c.base,'RESULTADOS_PARA_TESIS_4_5.md'),'utf8');for(const part of ['compilación nativa Android','29 advertencias','plantilla aritmética','no ejecutados'])assert.ok(text.includes(part),part);
  });
  // Registrar resultados reales ya ejecutados antes de resolver enlaces al propio cierre.
  fs.writeFileSync(path.join(c.base,'INTEGRIDAD.json'),JSON.stringify({generatedAt:new Date().toISOString(),checks},null,2)+'\n');
  function manifest() {const files=walk(c.base).filter(file=>path.basename(file)!=='MANIFIESTO_SHA256.json');fs.writeFileSync(path.join(c.base,'MANIFIESTO_SHA256.json'),JSON.stringify({generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries:files.map(file=>({file:path.relative(c.base,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:c.hash(file)}))},null,2)+'\n');return files.length;}
  manifest();
  check('Documentos requeridos y enlaces locales existen',()=>{
    for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']) {
      const text=fs.readFileSync(path.join(c.base,file),'utf8');assert.ok(text.length>1000);
      for(const m of text.matchAll(/\]\(([^)]+)\)/g)) if(!/^(https?:|#)/.test(m[1])) assert.ok(fs.existsSync(path.resolve(c.base,m[1])),file+': '+m[1]);
    }
  });
  const failed=checks.filter(row=>row.state==='FALLIDO');
  const sources=fs.readdirSync(__dirname).filter(name=>/\.(cjs|py|md)$/.test(name)).map(name=>({file:'scripts/audit/android/'+name,sha256:c.hash(path.join(__dirname,name))}));
  c.write('android/fuentes-arnes.json',sources);
  fs.writeFileSync(path.join(c.base,'INTEGRIDAD.json'),JSON.stringify({generatedAt:new Date().toISOString(),passed:checks.length-failed.length,failed:failed.length,checks},null,2)+'\n');
  const files=manifest();
  for(const entry of read('MANIFIESTO_SHA256.json').entries) assert.equal(c.hash(path.join(c.base,entry.file)),entry.sha256);
  console.log(JSON.stringify({evidence:path.relative(c.root,c.base),passed:checks.length-failed.length,failed,files}));process.exitCode=failed.length?1:0;
})();
