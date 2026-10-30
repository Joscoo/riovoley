const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(h.evidence,f),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
(async()=>{
 const routeRedactions=[];
 for(const file of walk(h.evidence).filter(f=>/\.(?:json|md|log|html|js|css|xml|info|txt)$/i.test(f))){
  const original=fs.readFileSync(file,'utf8');
  const safe=original.replace(/([A-Z]:\\+Users\\+)[^\\/\r\n]+/gi,'$1[USUARIO_LOCAL]');
  if(safe!==original){fs.writeFileSync(file,safe);routeRedactions.push(path.relative(h.evidence,file));}
 }
 h.write('PRIVACIDAD_RUTAS.json',{files:routeRedactions,scope:'Nombres de perfiles Windows en rutas temporales, sin alterar estados, cantidades ni aserciones.'});
 await h.run('privacidad-final','python',['scripts/e2e/local/privacy.py']);
 const s=read('RESUMEN_FINAL.json'),checks=[];
 const check=(name,fn)=>{try{checks.push({name,state:'APROBADO',details:fn()});}catch(e){checks.push({name,state:'FALLIDO',error:e.message});}};
 check('Nueve expedientes anteriores intactos',()=>{
  const manifests=walk(path.join(h.root,'docs/tesis/evidencias')).filter(f=>path.basename(f)==='MANIFIESTO_SHA256.json');assert.equal(manifests.length,9);let entries=0;
  for(const file of manifests){const m=JSON.parse(fs.readFileSync(file));for(const row of m.entries||[...(m.evidenceFiles||[]),...(m.additionalTestSources||[])]){assert.equal(hash(path.resolve(path.dirname(file),row.file)),row.sha256,row.file);entries++;}}
  return {manifests:9,entries};
 });
 check('Jest, contratos, memoria y cobertura coinciden',()=>{
  const j=read('unitarias/jest-resultados.json'),cases=read('unitarias/casos-jest.json'),c=read('unitarias/cobertura/coverage-summary.json').total;
  assert.equal(j.numTotalTests,419);assert.equal(j.numPassedTests,419);assert.equal(j.numFailedTests,0);assert.equal(j.numPendingTests,0);assert.equal(j.numTotalTestSuites,88);
  assert.equal(cases.length,419);assert.ok(cases.every(t=>t.status==='passed'));assert.equal(s.jest.contracts,12);assert.equal(s.jest.memoryIntegration,5);
  assert.equal(c.lines.pct,42.96);assert.deepEqual(c,s.jest.coverage);assert.equal(read('unitarias/jest-cobertura.meta.json').exitCode,0);
  return {cases:419,suites:88,contractsIncluded:12,memoryIncluded:5,lines:c.lines};
 });
 check('Ciclos rojos conservados y 22 contratos Node finales aprobados',()=>{
  assert.deepEqual(s.nodeGroups.map(g=>[g.executed,g.passed,g.failed,g.skipped,g.meta.exitCode]),[[9,5,4,0,1],[15,15,0,0,0],[7,3,4,0,1],[22,22,0,0,0]]);
  for(const g of s.nodeGroups){const text=fs.readFileSync(path.join(h.evidence,g.label+'.stdout.log'),'utf8');for(const [field,label]of [['executed','tests'],['passed','pass'],['failed','fail'],['skipped','skipped']])assert.equal(Number(text.match(new RegExp('# '+label+' (\\d+)\\b'))?.[1]),g[field]);assert.equal(read(g.label+'.meta.json').exitCode,g.meta.exitCode);}
  assert.deepEqual(s.guards,{executed:12,passed:12,failed:0,skipped:0});assert.equal(read('unitarias/guardas-aislamiento.meta.json').exitCode,0);
  return {uniqueFinalNodeCases:22,priorReproductionFailures:8,separateHarnessCases:12};
 });
 check('Avisos 31 a 23 a 15 sin alertas altas o críticas',()=>{
  assert.deepEqual(['before','after','after-loaders'].map(p=>s.audits.raiz[p].total),[31,23,15]);
  for(const [tree,stages]of Object.entries(s.audits))for(const [stage,counts]of Object.entries(stages)){assert.deepEqual(counts,read(`seguridad/npm-${tree}-${stage}.json`).metadata.vulnerabilities);assert.equal(read(`seguridad/npm-${tree}-${stage}.meta.json`).exitCode,counts.total?1:0);}
  assert.deepEqual(s.audits.raiz['after-loaders'],{info:0,low:13,moderate:2,high:0,critical:0,total:15});
  assert.equal(s.audits.functions['after-loaders'].total,0);assert.equal(s.audits.auxiliar['after-loaders'].total,0);assert.equal(s.remediationComplete,false);assert.equal(read('seguridad/arbol-final.meta.json').exitCode,0);
  return {remaining:15,high:0,critical:0,zeroAlertsCriterionMet:false};
 });
 check('249 instancias E2E únicas con denominadores y mocks explícitos',()=>{
  assert.deepEqual(s.e2e,{executed:249,passed:249,failed:0,skipped:0});const cases=read('e2e/casos-playwright.json');assert.equal(cases.length,249);
  assert.deepEqual(s.browsers.map(g=>g.counts.executed),[133,105,7,4]);assert.equal(new Set(cases.map(c=>[c.file,c.title,c.project].join('|'))).size,249);
  assert.ok(cases.every(c=>c.status==='passed'&&c.attempts===1));assert.equal(s.recoveryMocks,28);
  for(const g of s.browsers){const r=read(g.label+'/resultados.json');assert.equal(r.stats.expected,g.counts.executed);assert.equal(r.stats.unexpected,0);assert.equal(r.stats.flaky,0);assert.equal(r.stats.skipped,0);assert.equal(read(g.label+'/ejecucion.meta.json').exitCode,0);assert.ok(fs.existsSync(path.join(h.evidence,g.label,'html/index.html')));}
  return {passed:249,automaticRetries:0,mockRecovery:28,realLocalMutationFlows:7};
 });
 check('Integración PG READ ONLY y servidor CRA reales',()=>{
  assert.equal(s.persistence.readOnly,'on');assert.deepEqual(s.persistence.counts,{students:7,payments:7,paymentswithexpectedamount:7,attendances:7});assert.deepEqual(s.persistence,read('integracion/persistencia-postgresql.json'));assert.equal(read('integracion/persistencia-postgresql.meta.json').exitCode,0);
  assert.equal(s.dev.executed,3);assert.equal(s.dev.passed,3);assert.equal(s.dev.failed,0);assert.equal(read('integracion/dev-server.meta.json').exitCode,0);assert.equal(read('integracion/dev-server-proceso.json').intentionalStop,true);assert.equal(read('seguridad/backend-local.json').identityVerified,true);
  return {sqlRows:s.persistence.counts,httpHmrControls:3,institutionalChanges:false};
 });
 check('Compilación web y nativa con APK privado nuevo',()=>{
  for(const label of ['android/capacitor-sync','android/capacitor-plugins','android/gradle-assemble','android/apk-badging','android/apk-firma','android/verificar-apk','android/privacidad-apk'])assert.equal(read(label+'.meta.json').exitCode,0,label);
  assert.equal(s.web.exitCode,0);assert.equal(s.webAndroid.exitCode,0);assert.ok(s.android.command.join(' ').includes('--rerun-tasks'));
  const apk=read('android/apk-verificado.json');assert.equal(hash(path.join(h.root,apk.file)),apk.sha256);assert.equal(apk.privateNotPublished,true);assert.equal(apk.matchingWebAssets,106);assert.equal(apk.autoUpdate,false);assert.deepEqual(read('android/privacidad-apk.json').unresolved,[]);
  assert.equal(s.junit.executed,1);assert.equal(s.junit.passed,1);assert.equal(s.junit.failed,0);assert.equal(s.junit.skipped,0);
  return {webExit:0,nativeExit:0,matchingApkAssets:106,jvmTemplateTests:1,apkDistributed:false};
 });
 check('Fuentes de aplicación conservadas y overrides documentados',()=>{
  const initial=read('fuentes-iniciales.json');const changed=initial.filter(r=>hash(path.join(h.root,r.file))!==r.sha256).map(r=>r.file).sort();
  assert.deepEqual(changed,['package-lock.json','package.json','scripts/audit/closure/verify-e2e-final-persistence.cjs'].sort());
  const pkg=JSON.parse(fs.readFileSync(path.join(h.root,'package.json')));assert.equal(pkg.dependencies['react-scripts'],'5.0.1');assert.equal(pkg.overrides['serialize-javascript'],'7.1.4');assert.equal(pkg.overrides['@svgr/webpack'],'6.5.1');assert.equal(pkg.overrides['resolve-url-loader'],'5.0.0');assert.equal(pkg.overrides['http-proxy-agent']['@tootallnate/once'],'2.0.1');assert.equal(pkg.overrides.sockjs.uuid,'11.1.1');assert.equal(pkg.overrides['webpack-dev-server']['webpack-dev-middleware'],'7.4.6');
  const lock=JSON.parse(fs.readFileSync(path.join(h.root,'package-lock.json')));assert.equal(lock.packages['node_modules/serialize-javascript'].version,'7.1.4');assert.equal(s.applicationChanged,false);assert.equal(s.productionChanged,false);
  return {checked:initial.length,changed,framework:'CRA5.0.1',applicationUnchanged:true};
 });
 check('Tres documentos y ocho categorías con referencias válidas',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']){const text=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(text.length>1000);for(const m of text.matchAll(/\]\(([^)]+)\)/g))if(!/^(?:https?:|#)/.test(m[1]))assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(m[1]))),file+': '+m[1]);}
  assert.equal(read('trazabilidad-detallada.json').length,8);return {documents:3,categories:8};
 });
 check('Privacidad de texto, ZIP HTML y APK',()=>{
  const p=read('PRIVACIDAD.json');assert.deepEqual(p.unresolved,[]);assert.deepEqual(p.unresolvedArchiveEntries,[]);assert.deepEqual(read('android/privacidad-apk.json').unresolved,[]);return {textFiles:p.textFilesChecked,htmlArchives:p.embeddedArchivesChecked,windowsProfilePathsAnonymized:true};
 });
 const files=[...new Set([...read('fuentes-iniciales.json').map(r=>r.file),...cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:h.root}).toString().split('\0').filter(f=>/^(scripts\/|tests\/)/.test(f))])];
 h.write('fuentes-finales.json',files.map(file=>({file,sha256:hash(path.join(h.root,file))})));
 h.write('estado-final.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
 const result={generatedAt:new Date().toISOString(),passed:checks.filter(c=>c.state==='APROBADO').length,failed:checks.filter(c=>c.state==='FALLIDO').length,checks};
 if(result.failed){h.write('integridad-intento.json',result);console.log(JSON.stringify(result));process.exitCode=1;return;}
 h.write('INTEGRIDAD.json',result);const entries=walk(h.evidence).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)}));
 h.write('MANIFIESTO_SHA256.json',{generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries});for(const row of entries)assert.equal(hash(path.join(h.evidence,row.file)),row.sha256);
 console.log(JSON.stringify({checksPassed:result.passed,failed:0,evidenceFiles:entries.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
