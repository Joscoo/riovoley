const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const h=require('../../e2e/local/harness.cjs');
const c=require('../android/context.cjs');
const read=(base,file)=>JSON.parse(fs.readFileSync(path.join(base,file),'utf8'));
const walk=base=>fs.readdirSync(base,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(base,e.name)):[path.join(base,e.name)]);
(async()=>{
  await h.run('privacidad-cierre','python',['scripts/e2e/local/privacy.py']);
  await h.run('privacidad-nativa','python',['scripts/audit/android/privacy.py']);
  const checks=[];
  function check(name,fn){try{checks.push({name,status:'APROBADO',details:fn()});}catch(e){checks.push({name,status:'FALLIDO',error:e.message});}}
  check('Expedientes previos y dos archivos adicionales preservados',()=>{
    const folders=['verificacion-tecnica/20261027-212222-c71f55e','e2e-aislado/20261028-141243-c71f55e','e2e-aislado/20261028-101418-correcciones-c71f55e','verificacion-tecnica/20261028-155551-android-c71f55e'];
    return folders.map(folder=>{const base=path.join(h.root,'docs/tesis/evidencias',folder),m=read(base,'MANIFIESTO_SHA256.json');const entries=m.entries||[...m.evidenceFiles,...m.additionalTestSources];for(const e of entries)assert.equal(c.hash(path.resolve(base,e.file)),e.sha256,e.file);return {folder,checked:entries.length};});
  });
  check('404 casos y85 suites; contratos e integración en memoria no duplicados',()=>{
    const j=read(h.evidence,'jest-coverage.json'),s=read(h.evidence,'RESUMEN_CIERRE.json');
    assert.equal(j.numTotalTests,404);assert.equal(j.numPassedTests,404);assert.equal(j.numFailedTests,0);assert.equal(j.numPendingTests,0);assert.equal(j.numTotalTestSuites,85);
    assert.equal(read(h.evidence,'casos-jest-detallados.json').length,404);
    const cov=require('istanbul-lib-coverage').createCoverageMap(read(h.evidence,'cobertura/coverage-final.json')).getCoverageSummary().toJSON();assert.deepEqual(cov,s.coverage);assert.deepEqual(cov,read(h.evidence,'cobertura-resumen.json'));
    assert.equal(read(h.evidence,'unitarias/jest-coverage.meta.json').exitCode,0);return s.jest;
  });
  check('17 integraciones reales finales aprobadas y diez Edge separados',()=>{
    const tap=fs.readFileSync(path.join(h.evidence,'integracion/integracion-17-final.stdout.log'),'utf8');for(const pattern of [/# tests 17/,/# pass 17/,/# fail 0/,/# skipped 0/])assert.match(tap,pattern);
    assert.equal(read(h.evidence,'integracion/integracion-17-final.meta.json').exitCode,0);assert.equal(read(h.evidence,'unitarias/auth-edge.meta.json').exitCode,0);
    assert.match(fs.readFileSync(path.join(h.evidence,'unitarias/auth-edge.stdout.log'),'utf8'),/pass 10/);return {real:17,edge:10};
  });
  check('249 instancias Playwright sin omisiones ni reintentos',()=>{
    const rows=read(h.evidence,'casos-e2e-detallados.json');assert.equal(rows.length,249);assert.ok(rows.every(r=>r.status==='expected'));
    const s=read(h.evidence,'RESUMEN_CIERRE.json');assert.deepEqual(s.browsers.map(r=>r.expected),[133,105,7,4]);for(const r of s.browsers){assert.equal(r.skipped,0);assert.equal(r.unexpected,0);assert.equal(r.flaky,0);assert.equal(r.exitCode,0);}return s.browsers;
  });
  check('APK final compilado, firmado, mismo archivo instalado y leído por WebView',()=>{
    const a=read(c.base,'android/artefacto-final.json');assert.equal(c.hash(path.join(c.base,a.file)),a.sha256);assert.equal(c.hash(path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk')),a.sha256);
    assert.equal(read(c.base,'android/gradle-assemble.meta.json').exitCode,0);assert.equal(read(c.base,'android/apk-firma.meta.json').exitCode,0);assert.equal(read(c.base,'android/capacitor-sync.meta.json').exitCode,0);
    assert.equal(read(h.evidence,'android/instrumentacion-final.json').passed,1);assert.equal(read(h.evidence,'android/webview-final.json').artifactSha256,a.sha256);assert.equal(read(h.evidence,'android/webview-final.json').access.passed,3);
    const lint=fs.readFileSync(path.join(c.base,'android/lint/lint-results-debug.txt'),'utf8');assert.match(lint,/0 errors, 29 warnings/);assert.equal(read(c.base,'android/gradle-lint.meta.json').exitCode,0);return {sha256:a.sha256,bytes:a.bytes,lintErrors:0,lintWarnings:29};
  });
  check('Privacidad de textos, HTML embebidos y cada miembro del APK',()=>{
    const p=read(h.evidence,'PRIVACIDAD.json'),n=read(c.base,'PRIVACIDAD.json');assert.deepEqual(p.unresolved,[]);assert.deepEqual(p.unresolvedArchiveEntries,[]);assert.deepEqual(n.unresolved,[]);return {textFiles:p.textFilesChecked,embeddedArchives:p.embeddedArchivesChecked,nativeEntries:n.checked};
  });
  check('Tres documentos, referencias y ocho categorías',()=>{
    for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']){
      const text=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(text.length>1000);
      for(const m of text.matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(m[1])){
        const target=path.resolve(h.evidence,decodeURIComponent(m[1]));
        const planned=['INTEGRIDAD.json','MANIFIESTO_SHA256.json'].map(f=>path.join(h.evidence,f));
        assert.ok(fs.existsSync(target)||planned.includes(target),file+': '+m[1]);
      }
    }
    assert.equal(read(h.evidence,'trazabilidad-detallada.json').length,8);return {documents:3,categories:8};
  });
  check('Solo cambios previstos respecto a la instantánea inicial',()=>{
    const changed=read(h.evidence,'fuentes-iniciales.json').filter(e=>!fs.existsSync(path.join(h.root,e.file))||c.hash(path.join(h.root,e.file))!==e.sha256).map(e=>e.file);
    const allowed=['android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java','functions/package-lock.json','package-lock.json','riovoley/package-lock.json','src/features/payments/application/useCases/createPaymentsUseCases.js','src/features/payments/application/useCases/createPaymentsUseCases.test.js','src/features/student-dashboard/presentation/components/StudentPanel.js'];
    assert.ok(changed.every(f=>allowed.includes(f)),JSON.stringify(changed));
    const protectedNative=read(c.base,'android/fuentes-iniciales.json');for(const e of protectedNative)assert.equal(c.hash(path.join(h.root,e.file)),e.sha256,e.file);
    assert.match(cp.execFileSync('git',['check-ignore','.e2e-local/credentials.json'],{encoding:'utf8'}),/credentials/);return {changed,nativeSnapshot:protectedNative.length};
  });
  const sources=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:h.root}).toString().split('\0').filter(f=>f&&!f.startsWith('docs/tesis/evidencias/'));
  h.write('fuentes-finales.json',sources.filter(f=>fs.existsSync(path.join(h.root,f))).map(file=>({file,sha256:c.hash(path.join(h.root,file))})));
  h.write('estado-final.txt',cp.execFileSync('git',['status','--short'],{encoding:'utf8'}));
  const result={generatedAt:new Date().toISOString(),passed:checks.filter(r=>r.status==='APROBADO').length,failed:checks.filter(r=>r.status==='FALLIDO').length,checks};
  if(result.failed){h.write('integridad-intento.json',result);console.log(JSON.stringify(result));process.exitCode=1;return;}
  h.write('INTEGRIDAD.json',result);
  for(const base of [h.evidence,c.base]){
    const entries=walk(base).filter(f=>path.basename(f)!=='MANIFIESTO_SHA256.json').map(f=>({file:path.relative(base,f).replaceAll('\\','/'),bytes:fs.statSync(f).size,sha256:c.hash(f)}));
    const target=path.join(base,'MANIFIESTO_SHA256.json');assert.ok(!fs.existsSync(target),'No sobrescribir manifiestos');fs.writeFileSync(target,JSON.stringify({generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries},null,2)+'\n');
    for(const e of entries)assert.equal(c.hash(path.join(base,e.file)),e.sha256,e.file);
  }
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md'])for(const m of fs.readFileSync(path.join(h.evidence,file),'utf8').matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(m[1]))assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(m[1]))),file+': '+m[1]);
  console.log(JSON.stringify(result));process.exitCode=result.failed?1:0;
})();
