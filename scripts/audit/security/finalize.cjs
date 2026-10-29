const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
 assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'No sobrescribir un expediente sellado');
 await h.run('privacidad-final','python',['scripts/e2e/local/privacy.py']);
 const checks=[];
 function check(name,fn){try{checks.push({name,status:'APROBADO',details:fn()});}catch(e){checks.push({name,status:'FALLIDO',error:e.message});}}
 const s=read('RESUMEN_FINAL.json');
 check('Seis expedientes anteriores preservados',()=>{
  const folders=['verificacion-tecnica/20261027-212222-c71f55e','e2e-aislado/20261028-141243-c71f55e','e2e-aislado/20261028-101418-correcciones-c71f55e','verificacion-tecnica/20261028-155551-android-c71f55e','e2e-aislado/20261028-192557-cierre-c71f55e','verificacion-tecnica/20261028-200050-android-actualizado-c71f55e'];
  return folders.map(folder=>{const base=path.join(h.root,'docs/tesis/evidencias',folder),m=JSON.parse(fs.readFileSync(path.join(base,'MANIFIESTO_SHA256.json')));const entries=m.entries||[...m.evidenceFiles,...m.additionalTestSources];for(const e of entries)assert.equal(hash(path.resolve(base,e.file)),e.sha256,e.file);return {folder,checked:entries.length};});
 });
 check('410 casos Jest en87 suites y cobertura recalculada',()=>{
  const j=read('unitarias/jest-410-final.json');assert.equal(j.numTotalTests,410);assert.equal(j.numPassedTests,410);assert.equal(j.numFailedTests,0);assert.equal(j.numPendingTests,0);assert.equal(j.numTotalTestSuites,87);assert.equal(read('unitarias/casos-jest.json').length,410);
  const cov=require('istanbul-lib-coverage').createCoverageMap(read('unitarias/cobertura-jest-410-final/coverage-final.json')).getCoverageSummary().toJSON();assert.deepEqual(cov,s.coverage);assert.deepEqual(cov,read('unitarias/cobertura-resumen.json'));return s.jest;
 });
 check('Runners separados:34 seguridad,18 funcionales,20 contratos,12 HTTP y2 Express',()=>{
  for(const [key,n] of [['access',34],['functional',18],['edge',20],['http',12],['health',2]]){
   const r=s[key],text=fs.readFileSync(path.join(h.evidence,r.file),'utf8');assert.equal(r.executed,n);assert.match(text,new RegExp('# tests '+n+'\\b'));assert.match(text,new RegExp('# pass '+n+'\\b'));assert.match(text,/# fail 0\b/);assert.equal(read(r.file.replace('.stdout.log','.meta.json')).exitCode,0);
  }return {security:34,functional:18,edgeContracts:20,realHttp:12,express:2};
 });
 check('Playwright249 instancias sin omitidos ni reintentos',()=>{
  assert.equal(read('e2e/casos-playwright.json').length,249);assert.ok(read('e2e/casos-playwright.json').every(r=>r.status==='expected'));assert.deepEqual(s.browsers.map(r=>r.expected),[133,105,7,4]);assert.ok(s.browsers.every(r=>r.unexpected===0&&r.skipped===0&&r.flaky===0&&r.exitCode===0));return {executed:249,passed:249};
 });
 check('Catálogo y SQL final local; reversión de definiciones,ACL y políticas',()=>{
  assert.equal(read('seguridad/verificacion-catalogo.json').passed,true);assert.equal(s.rollback.functionsRestored,11);assert.equal(s.rollback.functionAclsRestored,11);assert.equal(s.rollback.policiesRestored,111);assert.equal(s.rollback.newDailyRpcRemoved,true);
  const applies=fs.readdirSync(path.join(h.evidence,'seguridad')).filter(f=>/^apply(?:-.*)?\.json$/.test(f)).map(f=>read('seguridad/'+f)).filter(r=>r.success&&r.migrationSha256);
  assert.ok(applies.length);assert.equal(applies.at(-1).migrationSha256,hash(path.join(h.root,s.migration)));assert.equal(s.productionChanged,false);return {migrationSha256:hash(path.join(h.root,s.migration)),functions:11,acls:11,policies:111};
 });
 check('HTTP Deno con caché cerrada y permisos de red locales',()=>{
  const metas=fs.readdirSync(path.join(h.evidence,'integracion')).filter(f=>f.startsWith('edge-http-servidor')&&f.endsWith('.meta.json')).map(f=>read('integracion/'+f)).sort((a,b)=>a.end.localeCompare(b.end));
  const m=metas.at(-1);assert.equal(m.exitCode,0);assert.ok(m.command.includes('--cached-only'));assert.ok(m.command.includes('--allow-net=127.0.0.1:55321,127.0.0.1:6161'));assert.equal(s.deno.exitCode,0);return {cachedOnly:true,externalProviderNetworkAllowed:false};
 });
 check('Compilación web y dependencia functions comprobadas',()=>{
  assert.ok(s.builds.every(b=>b.exitCode===0));assert.equal(s.audits.find(a=>a.name==='functions').before.total,62);assert.equal(s.audits.find(a=>a.name==='functions').after.total,0);assert.equal(s.audits.find(a=>a.name==='raiz').after.total,35);assert.equal(s.audits.find(a=>a.name==='auxiliar').after.total,0);
  assert.ok(!JSON.parse(fs.readFileSync(path.join(h.root,'functions/package.json'))).dependencies.genkit);return {web:s.builds.at(-1).exitCode,functionsAudit:0,rootAudit:35};
 });
 check('Documentos, enlaces y ocho categorías',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']){
   const text=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(text.length>1000);
   for(const m of text.matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(m[1])){const target=path.resolve(h.evidence,decodeURIComponent(m[1]));const planned=['INTEGRIDAD.json','MANIFIESTO_SHA256.json'].map(f=>path.join(h.evidence,f));assert.ok(fs.existsSync(target)||planned.includes(target),file+': '+m[1]);}
  }assert.equal(read('trazabilidad-detallada.json').length,8);return {documents:3,categories:8};
 });
 check('Privacidad: textos y ZIP de reportes',()=>{const p=read('PRIVACIDAD.json');assert.deepEqual(p.unresolved,[]);assert.deepEqual(p.unresolvedArchiveEntries,[]);return {textFiles:p.textFilesChecked,embeddedArchives:p.embeddedArchivesChecked};});
 if(checks.every(r=>r.status==='APROBADO')){
  const plan=path.join(h.root,'docs/superpowers/plans/2026-10-29-seguridad-local.md');
  fs.writeFileSync(plan,fs.readFileSync(plan,'utf8').replace(/^- \[ \]/gm,'- [x]'));
 }
 const candidates=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:h.root}).toString().split('\0').filter(f=>f&&!f.startsWith('docs/tesis/evidencias/'));
 h.write('fuentes-finales.json',candidates.filter(f=>fs.existsSync(path.join(h.root,f))).map(file=>({file,sha256:hash(path.join(h.root,file))})));
 h.write('estado-final.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
 const result={generatedAt:new Date().toISOString(),passed:checks.filter(r=>r.status==='APROBADO').length,failed:checks.filter(r=>r.status==='FALLIDO').length,checks};
 if(result.failed){h.write('integridad-intento.json',result);console.log(JSON.stringify(result));process.exitCode=1;return;}
 h.write('INTEGRIDAD.json',result);
 const entries=walk(h.evidence).filter(f=>path.basename(f)!=='MANIFIESTO_SHA256.json').map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),sha256:hash(file),bytes:fs.statSync(file).size}));
 h.write('MANIFIESTO_SHA256.json',{generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries});
 for(const e of entries)assert.equal(hash(path.join(h.evidence,e.file)),e.sha256,e.file);
 console.log(JSON.stringify({passed:result.passed,failed:0,evidenceFiles:entries.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
