const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const c=require('./context.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(h.evidence,f),'utf8'));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
 assert.equal(c.base,h.evidence);assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
 await h.run('privacidad-final','python',['scripts/e2e/local/privacy.py']);
 const s=read('RESUMEN_FINAL.json'),checks=[];
 function check(name,fn){try{checks.push({name,state:'APROBADO',details:fn()});}catch(e){checks.push({name,state:'FALLIDO',error:e.message});}}
 check('Siete expedientes previos intactos',()=>{
  const manifests=walk(path.join(h.root,'docs/tesis/evidencias')).filter(f=>path.basename(f)==='MANIFIESTO_SHA256.json');
  assert.equal(manifests.length,7);
  let entries=0;for(const file of manifests){const m=JSON.parse(fs.readFileSync(file));for(const row of m.entries||[...(m.evidenceFiles||[]),...(m.additionalTestSources||[])]){assert.equal(hash(path.resolve(path.dirname(file),row.file)),row.sha256,row.file);entries++;}}
  return {manifests:manifests.length,entries};
 });
 check('Jest y cobertura coinciden con registros originales',()=>{
  const j=read(s.jest.file);assert.equal(j.numTotalTests,419);assert.equal(j.numPassedTests,419);assert.equal(j.numFailedTests,0);assert.equal(j.numPendingTests,0);assert.equal(j.numTotalTestSuites,88);
  assert.equal(read('unitarias/jest-push-cierre.meta.json').exitCode,0);assert.equal(read('unitarias/casos-jest.json').length,j.numTotalTests);assert.deepEqual(s.coverage,read('unitarias/cobertura-push-cierre/coverage-summary.json').total);
  return s.jest;
 });
 check('Regresiones y guardas tienen denominadores separados',()=>{
  for(const [r,n] of [[s.compatibility,6],[s.guards,2]]){const text=fs.readFileSync(path.join(h.evidence,r.file),'utf8');assert.match(text,new RegExp('# tests '+n+'\\b'));assert.match(text,new RegExp('# pass '+n+'\\b'));assert.match(text,/# fail 0\b/);assert.equal(read(r.file.replace('.stdout.log','.meta.json')).exitCode,0);}
  return {dependencyTests:6,environmentTests:2};
 });
 check('Compilaciones, sync, firma y lint con resultados reales',()=>{
  for(const r of [s.web,s.sync,s.assemble,s.lintRun])assert.equal(read(r.file).exitCode,0);
  assert.equal(read('android/apk-firma-cierre.meta.json').exitCode,0);assert.equal(s.lint.errors,0);
  assert.ok(s.web.end<s.sync.start);assert.ok(s.sync.end<s.assemble.start);
  assert.equal(s.junit.results.reduce((n,x)=>n+x.tests,0),1);assert.ok(s.junit.results.every(x=>x.failures===0&&x.errors===0));
  assert.equal(s.instrumentation.executed,1);assert.equal(s.instrumentation.passed,1);
  return {webExit:0,nativeExit:0,lint:s.lint,junit:1,instrumented:1};
 });
 check('APK inspeccionado y ejecutado; trece verificaciones nativas',()=>{
  const apk=path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk');
  assert.equal(hash(apk),s.apk.sha256);assert.equal(s.apk.state,'APROBADO');assert.deepEqual(s.apk.forbiddenMatches,[]);assert.equal(s.apk.sourceMatchVerified,true);
  assert.deepEqual(s.native,read(s.nativeEvidence));
  assert.equal(s.native.artifactSha256,s.apk.sha256);assert.equal(s.native.executed,13);assert.equal(s.native.passed,13);assert.equal(s.native.failed,0);assert.equal(s.native.notExecuted,0);assert.deepEqual(s.native.cleanupFailures,[]);
  assert.deepEqual(s.native.after,{rows:1,rewards:1,ledger_rows:1,xp:8});
  assert.equal(read('android/estabilidad-cierre.json').appCrashes,0);
  assert.ok(s.native.cases.find(x=>x.code==='N-artefacto'&&x.state==='APROBADO'));
  assert.equal(walk(h.evidence).filter(f=>/\.(apk|aab|apks)$/i.test(f)).length,0);
  return {executed:13,passed:13,sha256:s.apk.sha256,privateApk:true};
 });
 check('Seguridad actual y análisis npm, sin extrapolar a producción',()=>{
  assert.equal(read('seguridad/verificacion-catalogo.json').passed,true);
  const a=read('seguridad/npm-raiz-after.json');assert.deepEqual(a.metadata.vulnerabilities,s.dependencies.after);assert.equal(a.metadata.vulnerabilities.total,31);
  assert.equal(s.dependencies.functions.total,0);assert.equal(s.dependencies.aux.total,0);assert.equal(s.productionChanged,false);
  return s.dependencies;
 });
 check('Documentos, enlaces y ocho categorías',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']){
   const value=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(value.length>1000);
   for(const match of value.matchAll(/\]\(([^)]+)\)/g)) if(!/^(https?:|#)/.test(match[1]))assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(match[1]))),file+': '+match[1]);
  }
  assert.equal(read('trazabilidad-detallada.json').length,8);return {documents:3,categories:8};
 });
 check('Privacidad del expediente',()=>{const p=read('PRIVACIDAD.json');assert.deepEqual(p.unresolved,[]);assert.deepEqual(p.unresolvedArchiveEntries,[]);return {textFiles:p.textFilesChecked,archives:p.embeddedArchivesChecked};});
 const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:h.root}).toString().split('\0').filter(f=>f&&!f.startsWith('docs/tesis/evidencias/')&&fs.existsSync(path.join(h.root,f)));
 h.write('fuentes-finales.json',files.map(file=>({file,sha256:hash(path.join(h.root,file))})));
 h.write('estado-final.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
 const result={generatedAt:new Date().toISOString(),passed:checks.filter(x=>x.state==='APROBADO').length,failed:checks.filter(x=>x.state==='FALLIDO').length,checks};
 if(result.failed){h.write('integridad-intento.json',result);console.log(JSON.stringify(result));process.exitCode=1;return;}
 h.write('INTEGRIDAD.json',result);
 const entries=walk(h.evidence).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)}));
 h.write('MANIFIESTO_SHA256.json',{generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries});
 for(const row of entries)assert.equal(hash(path.join(h.evidence,row.file)),row.sha256);
 console.log(JSON.stringify({passed:result.passed,failed:0,evidenceFiles:entries.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
