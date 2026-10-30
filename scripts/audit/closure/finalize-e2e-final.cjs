const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const {readLocal}=require('../../e2e/local/safety.cjs');
const read=file=>JSON.parse(fs.readFileSync(path.join(h.evidence,file),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
(async()=>{
 assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
 await h.run('privacidad-final','python',['scripts/e2e/local/privacy.py']);
 const summary=read('RESUMEN_FINAL.json'),cases=read('e2e/casos-playwright.json'),checks=[];
 function check(name,fn){try{checks.push({name,state:'APROBADO',details:fn()});}catch(e){checks.push({name,state:'FALLIDO',error:e.message});}}
 check('Ocho expedientes anteriores intactos',()=>{
  const manifests=walk(path.join(h.root,'docs/tesis/evidencias')).filter(f=>path.basename(f)==='MANIFIESTO_SHA256.json');assert.equal(manifests.length,8);let entries=0;
  for(const file of manifests){const m=JSON.parse(fs.readFileSync(file));for(const row of m.entries||[...(m.evidenceFiles||[]),...(m.additionalTestSources||[])]){assert.equal(hash(path.resolve(path.dirname(file),row.file)),row.sha256,row.file);entries++;}}
  return {manifests:8,entries};
 });
 check('Matriz final de 249 instancias únicas, sin fallos ni reintentos automáticos',()=>{
  assert.deepEqual(summary.total,{executed:249,passed:249,failed:0,skipped:0,flaky:0});assert.equal(cases.length,249);
  assert.deepEqual(summary.groups.map(g=>g.cases),[133,105,7,4]);assert.equal(new Set(cases.map(c=>[c.file,c.title,c.project].join('|'))).size,249);
  assert.ok(cases.every(c=>c.actualStatus==='passed'&&c.expectedStatus==='passed'&&c.attempts===1));
  for(const group of summary.groups){const raw=read(group.evidence);assert.equal(raw.stats.expected,group.cases);assert.equal(raw.stats.unexpected,0);assert.equal(raw.stats.skipped,0);assert.equal(raw.stats.flaky,0);assert.equal(read(group.label+'/ejecucion.meta.json').exitCode,0);assert.ok(fs.existsSync(path.join(h.evidence,group.html)));}
  return summary.total;
 });
 check('Fallo original y repetición manual diferenciados',()=>{
  const initial=read('paneles-finales/resultados.json'),stats=initial.stats;
  assert.equal(stats.expected,104);assert.equal(stats.unexpected,1);assert.equal(stats.skipped,0);assert.equal(stats.flaky,0);
  assert.equal(read('paneles-finales/ejecucion.meta.json').exitCode,1);
  const attempts=summary.priorPanelResults;
  assert.deepEqual(attempts.map(g=>g.label),['paneles-finales','paneles-corregidos']);
  let passed=249,failed=0;
  for(const group of attempts){const raw=read(group.evidence),meta=read(group.label+'/ejecucion.meta.json');assert.equal(group.executed,105);assert.equal(group.passed,raw.stats.expected);assert.equal(group.failed,raw.stats.unexpected);assert.equal(group.skipped,raw.stats.skipped);assert.equal(meta.exitCode,1);assert.equal(raw.stats.skipped,0);assert.equal(raw.stats.flaky,0);passed+=group.passed;failed+=group.failed;}
  assert.deepEqual(summary.completedInvocations,{executed:459,passed,failed,skipped:0});
  assert.equal(summary.initialPanelResult.executed,105);assert.equal(summary.initialPanelResult.passed,104);assert.equal(summary.initialPanelResult.failed,1);
  assert.equal(summary.groups[1].label,'paneles-verificados');assert.equal(summary.groups[2].label,'mutaciones-reanudadas');
  assert.equal(read('e2e/interrupcion.json').status,'INTERRUMPIDO SIN RESULTADO');
  assert.ok(!fs.existsSync(path.join(h.evidence,'mutaciones-finales/resultados.json')));
  return {originalPanelCases:105,originalFailures:1,manualPanelRepetitions:2,repeatedPanelCases:210,completedInvocations:459,passed,failed,interruptedAttemptWithoutFinalResult:true};
 });
 check('Mocks identificados y denominadores separados',()=>{
  assert.equal(cases.filter(c=>c.file.endsWith('auth.password-recovery.spec.js')).length,28);assert.equal(summary.mockCases,28);assert.equal(summary.mutations,7);
  const text=fs.readFileSync(path.join(h.evidence,'unitarias/guardas-locales.stdout.log'),'utf8');assert.match(text,/# tests 8\b/);assert.match(text,/# pass 8\b/);assert.match(text,/# fail 0\b/);assert.equal(read('unitarias/guardas-locales.meta.json').exitCode,0);
  return {mockRecovery:28,realLocalMutationFlows:7,harnessNodeTests:8};
 });
 check('Persistencia corroborada mediante PostgreSQL READ ONLY',()=>{
  const p=read('integracion/persistencia-postgresql.json'),meta=read('mutaciones-reanudadas/ejecucion.meta.json');
  assert.equal(p.readOnly,'on');assert.deepEqual(p.counts,{students:7,payments:7,paymentswithexpectedamount:7,attendances:7});
  assert.deepEqual(p.window,{start:meta.start,end:meta.end});assert.equal(read('integracion/persistencia-postgresql.meta.json').exitCode,0);
  assert.deepEqual(summary.persistence,p);return {readOnly:true,counts:p.counts,additionalPlaywrightCases:0};
 });
 check('Fuentes de aplicación del commit evaluado sin cambios',()=>{
  const initial=read('fuentes-evaluadas.json'),differences=initial.filter(row=>hash(path.join(h.root,row.file))!==row.sha256).map(row=>row.file);
  assert.deepEqual(differences,['scripts/e2e/local/functions.cjs','tests/e2e/filters-sorting.tables.spec.js']);
  const code=fs.readFileSync(path.join(h.root,differences[0]),'utf8');assert.ok(code.includes("'--network-id','riovoley-e2e-loopback'"));
  const test=fs.readFileSync(path.join(h.root,differences[1]),'utf8');assert.ok(test.includes('resetRequestPromise'));assert.ok(test.includes('resetRows.length > 0'));
  return {checked:initial.length,applicationAndLockfilesUnchanged:true,documentedHarnessAndTestChanges:differences};
 });
 check('Bundle nuevo local con la corrección push actual',()=>{
  assert.equal(summary.build.exitCode,0);const buildName=/compilacion-(web-build-\d+)\.meta\.json/.exec(summary.build.file)?.[1];assert.ok(buildName);assert.equal(readLocal().activeBuild,buildName);
  const dir=path.join(h.runtime,buildName,'static/js'),current=fs.readFileSync(path.join(h.root,'src/shared/platform/push.js'),'utf8').replace(/\r\n/g,'\n');let matched=0;
  for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.map'))){const map=JSON.parse(fs.readFileSync(path.join(dir,file)));map.sources.forEach((name,i)=>{if(('/'+name.replaceAll('\\','/')).endsWith('/shared/platform/push.js')){assert.equal(map.sourcesContent[i].replace(/\r\n/g,'\n'),current);matched++;}});}
  assert.equal(matched,1);return {buildName,matchingPushSourceMaps:matched};
 });
 check('Entorno real local verificado y sin cambios institucionales',()=>{assert.equal(read('seguridad/backend-local-verificado.json').identityVerified,true);assert.equal(read('seguridad/reanudacion-local.json').identityVerified,true);assert.equal(read('seguridad/edge-disponible.json').status,200);assert.equal(read('seguridad/edge-reanudado.json').status,200);assert.equal(summary.productionChanged,false);assert.equal(summary.applicationChanged,false);return {localOnly:true,edgePreflight:200};});
 check('Documentos y ocho categorías con enlaces válidos',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']){
   const text=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(text.length>1000);for(const match of text.matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(match[1]))assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(match[1]))),file+': '+match[1]);
  }
  assert.equal(read('trazabilidad-detallada.json').length,8);return {documents:3,categories:8};
 });
 check('Privacidad del texto y archivos ZIP internos de HTML',()=>{const p=read('PRIVACIDAD.json');assert.deepEqual(p.unresolved,[]);assert.deepEqual(p.unresolvedArchiveEntries,[]);return {textFiles:p.textFilesChecked,archives:p.embeddedArchivesChecked};});
 h.write('fuentes-finales.json',read('fuentes-evaluadas.json').map(r=>({...r,sha256:hash(path.join(h.root,r.file))})));
 h.write('estado-final.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
 const result={generatedAt:new Date().toISOString(),passed:checks.filter(c=>c.state==='APROBADO').length,failed:checks.filter(c=>c.state==='FALLIDO').length,checks};
 if(result.failed){h.write('integridad-intento.json',result);console.log(JSON.stringify(result));process.exitCode=1;return;}
 h.write('INTEGRIDAD.json',result);
 const entries=walk(h.evidence).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)}));
 h.write('MANIFIESTO_SHA256.json',{generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries});for(const row of entries)assert.equal(hash(path.join(h.evidence,row.file)),row.sha256);
 console.log(JSON.stringify({passed:result.passed,failed:0,evidenceFiles:entries.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
