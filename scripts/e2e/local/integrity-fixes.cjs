const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const h = require('./harness.cjs');
const read = file => JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const checks=[];
function check(name,fn) { try { const details=fn();checks.push({name,status:'passed',details}); } catch(e) { checks.push({name,status:'failed',error:e.message}); } }
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]); }
check('Expedientes previos inalterados',()=>{
  const folders=['docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e','docs/tesis/evidencias/e2e-aislado/20261028-141243-c71f55e'];
  return folders.map(folder=>{
    const base=path.join(h.root,folder),m=JSON.parse(fs.readFileSync(path.join(base,'MANIFIESTO_SHA256.json')));
    const entries=m.entries||[...m.evidenceFiles,...m.additionalTestSources];
    for(const entry of entries) assert.equal(hash(path.resolve(base,entry.file)),entry.sha256,entry.file);
    return {folder,checked:entries.length};
  });
});
check('Mismos 112 casos y 17 fallos resueltos; cuatro límites adicionales',()=>{
  const summary=read('resumen-correcciones.json'),cases=read('casos-e2e-detallados.json'),resolved=read('fallos-corregidos.json');
  assert.equal(cases.length,112);assert.equal(cases.filter(c=>c.status==='expected').length,112);
  assert.equal(summary.resolved,17);assert.equal(resolved.length,17);assert.ok(resolved.every(c=>c.currentStatus==='expected'));
  const original=JSON.parse(fs.readFileSync(path.join(h.root,'docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/e2e/casos-bloqueados.json'))).cases;
  const key=c=>[c.file,c.title,c.project].join('::');assert.deepEqual(cases.map(key).sort(),original.map(key).sort());
  for(const label of ['pendientes-finales','mutaciones-confirmadas','limites-finales']) {
    const r=read(label+'/resultados.json');assert.equal(r.stats.unexpected,0);assert.equal(r.stats.skipped,0);assert.equal(r.stats.flaky,0);
    assert.equal(read(label+'/ejecucion.meta.json').exitCode,0);
  }
  assert.equal(summary.boundaries.executed,4);
});
check('395 casos Jest, 84 suites y cobertura verificable',()=>{
  const r=read('jest-coverage-final.json'),c=read('cobertura-resumen.json');
  assert.equal(r.numTotalTests,395);assert.equal(r.numPassedTests,395);assert.equal(r.numFailedTests,0);assert.equal(r.numPendingTests,0);assert.equal(r.numTotalTestSuites,84);
  assert.equal(read('casos-jest-detallados.json').length,395);
  const calculated=require('istanbul-lib-coverage').createCoverageMap(read('cobertura/coverage-final.json')).getCoverageSummary().toJSON();
  assert.deepEqual(c,calculated);assert.equal(read('jest-coverage-final.meta.json').exitCode,0);
});
check('Siete cadenas persistidas, sin sumar controles SQL a E2E',()=>{
  const p=read('persistencia-siete-flujos.json');assert.equal(p.passed,7);assert.equal(p.rows.length,7);
  for(const row of p.rows) {assert.equal(row.payments,1);assert.equal(row.attendances,1);assert.deepEqual(row.amounts,[35]);}
});
check('Compilación, guardas, RLS y seed verificadas',()=>{
  const builds=fs.readdirSync(h.evidence).filter(f=>/^compilacion-web-build-.*\.meta\.json$/.test(f));assert.equal(builds.length,2);
  for(const file of builds) assert.equal(read(file).exitCode,0);
  assert.equal(read('arnes-final.meta.json').exitCode,0);assert.match(fs.readFileSync(path.join(h.evidence,'arnes-final.stdout.log'),'utf8'),/pass 12/);
  assert.equal(read('rls-local.meta.json').exitCode,0);
  const seed=read('seed-idempotencia.json');assert.deepEqual(seed.before,seed.after);
  for(const r of read('bindings-locales.json').results) assert.ok(Object.values(r.bindings).flat().every(b=>b.HostIp==='127.0.0.1'));
});
check('Solo cambios previstos en fuentes existentes; lockfile intacto',()=>{
  const allowed=['src/features/attendance/presentation/components/AsistenciasManager.js','src/features/payments/presentation/components/PagosManager.js','src/shared/ui/SortableHeader.js','src/shared/ui/SortableHeader.test.js','tests/e2e/admin.happy-path-controlled.spec.js','tests/e2e/asistencias.guided.review.spec.js','tests/e2e/filters-sorting.tables.spec.js'];
  const changed=cp.execFileSync('git',['diff','--name-only','--','src','tests'],{cwd:h.root,encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);assert.deepEqual(changed.sort(),allowed.sort());
  assert.equal(cp.execFileSync('git',['diff','--name-only','--','package-lock.json'],{cwd:h.root,encoding:'utf8'}).trim(),'');
  assert.match(cp.execFileSync('git',['check-ignore','.e2e-local/observed-secrets.jsonl'],{cwd:h.root,encoding:'utf8'}),/observed-secrets/);
});
check('Privacidad de textos y archivos HTML embebidos',()=>{
  const p=read('PRIVACIDAD.json');assert.equal(p.unresolved.length,0);assert.equal(p.unresolvedArchiveEntries.length,0);assert.ok(p.embeddedArchivesChecked>=3);
  return {textFilesChecked:p.textFilesChecked,embeddedArchivesChecked:p.embeddedArchivesChecked};
});
// Publicar el estado real de los controles ya ejecutados antes de comprobar
// enlaces a los propios archivos de cierre. Al terminar se actualizan sus hashes.
fs.writeFileSync(path.join(h.evidence,'INTEGRIDAD.json'),JSON.stringify({observedAt:new Date().toISOString(),checks},null,2)+'\n');
const intermediateFiles=walk(h.evidence).filter(file=>path.basename(file)!=='MANIFIESTO_SHA256.json');
fs.writeFileSync(path.join(h.evidence,'MANIFIESTO_SHA256.json'),JSON.stringify({generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries:intermediateFiles.map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),sha256:hash(file),bytes:fs.statSync(file).size}))},null,2)+'\n');
check('Documentos y referencias relativas existentes',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']) {
    const content=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(content.length>1000);
    for(const match of content.matchAll(/\]\(([^)]+)\)/g)) if(!/^(https?:|#)/.test(match[1])) assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(match[1].split('#')[0]))),file+': '+match[1]);
  }
  const thesis=fs.readFileSync(path.join(h.evidence,'RESULTADOS_PARA_TESIS_4_5.md'),'utf8');
  for(const phrase of ['112 instancias','395 casos aprobados en 84 suites','siete estudiantes nuevos','permanece no ejecutada','siete incidencias de acceso anónimo']) assert.ok(thesis.includes(phrase),phrase);
});
const tracked=['src/features/attendance/presentation/components/AsistenciasManager.js','src/features/payments/presentation/components/PagosManager.js','src/shared/ui/SortableHeader.js','src/shared/ui/SortableHeader.test.js','tests/e2e/admin.happy-path-controlled.spec.js','tests/e2e/asistencias.guided.review.spec.js','tests/e2e/filters-sorting.tables.spec.js','tests/e2e/helpers/paymentsSorting.js','tests/e2e/payments.responsive-boundaries.spec.js','playwright.local.config.cjs',...fs.readdirSync(path.join(h.root,'scripts/e2e/local')).filter(f=>/\.(cjs|py|toml|md)$/.test(f)).map(f=>'scripts/e2e/local/'+f)];
fs.writeFileSync(path.join(h.evidence,'fuentes-corregidas.json'),JSON.stringify(tracked.map(file=>({file,sha256:hash(path.join(h.root,file))})),null,2)+'\n');
fs.writeFileSync(path.join(h.evidence,'INTEGRIDAD.json'),JSON.stringify({observedAt:new Date().toISOString(),passed:checks.filter(c=>c.status==='passed').length,failed:checks.filter(c=>c.status==='failed').length,checks},null,2)+'\n');
const files=walk(h.evidence).filter(file=>path.basename(file)!=='MANIFIESTO_SHA256.json');
fs.writeFileSync(path.join(h.evidence,'MANIFIESTO_SHA256.json'),JSON.stringify({generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries:files.map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),sha256:hash(file),bytes:fs.statSync(file).size}))},null,2)+'\n');
const failed=checks.filter(c=>c.status==='failed');console.log(JSON.stringify({passed:checks.length-failed.length,failed,files:files.length}));process.exitCode=failed.length?1:0;
