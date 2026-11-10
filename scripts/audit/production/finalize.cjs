const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(h.evidence,f),'utf8'));
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
(async()=>{
 const pathChanges=[];
 for(const f of walk(h.evidence).filter(f=>/\.(json|md|log|html|js|css|xml|info|txt|sql)$/i.test(f))){
  const original=fs.readFileSync(f,'utf8'),safe=original.replace(/([A-Z]:\\+Users\\+)[^\\/\r\n]+/gi,'$1[USUARIO_LOCAL]');
  if(original!==safe){fs.writeFileSync(f,safe);pathChanges.push(path.relative(h.evidence,f));}
 }
 h.write('PRIVACIDAD_RUTAS.json',{files:pathChanges,scope:'Se anonimizan perfiles Windows solo en copias de evidencia, sin alterar estados ni cantidades.'});
 await h.run('privacidad-final','python',['scripts/e2e/local/privacy.py']);
 const s=read('RESUMEN_FINAL.json'),checks=[];
 const check=(name,fn)=>{try{checks.push({name,state:'APROBADO',details:fn()});}catch(e){checks.push({name,state:'FALLIDO',error:e.message});}};
 check('Diez expedientes anteriores intactos',()=>{
  const all=cp.execFileSync('git',['ls-files','-z','docs/tesis/evidencias'],{cwd:h.root}).toString().split('\0').filter(f=>f.endsWith('/MANIFIESTO_SHA256.json')).map(f=>path.join(h.root,f));assert.equal(all.length,10);let entries=0;
  for(const f of all){const m=JSON.parse(fs.readFileSync(f));for(const r of m.entries||[...(m.evidenceFiles||[]),...(m.additionalTestSources||[])]){assert.equal(hash(path.resolve(path.dirname(f),r.file)),r.sha256,r.file);entries++;}console.log(JSON.stringify({priorManifestVerified:path.basename(path.dirname(f)),entries}));}
  return {manifests:all.length,entries};
 });
 check('Jest, contratos, memoria, cobertura y módulos coinciden con sus registros',()=>{
  const j=read('unitarias/jest-final.json'),rows=read('unitarias/casos-jest.json');assert.equal(j.numPassedTests,419);assert.equal(j.numFailedTests,0);assert.equal(j.numPendingTests,0);assert.equal(j.numTotalTestSuites,88);assert.equal(rows.length,419);assert.ok(rows.every(r=>r.status==='passed'));
  assert.equal(s.jest.contracts,12);assert.equal(s.jest.memoryIntegration,5);assert.deepEqual(s.jest.coverage,read('unitarias/cobertura-final/coverage-summary.json').total);assert.equal(read('unitarias/jest-final.meta.json').exitCode,0);
  assert.equal(read('unitarias/modulos.json').reduce((a,m)=>a+m.executed,0),419);return {cases:419,suites:88,contractsIncluded:12,memoryIncluded:5,coverage:s.jest.coverage};
 });
 check('76 contratos, instalación independiente y 12 guardas',()=>{
  for(const n of [s.node,s.clean.counts])assert.deepEqual(n,{executed:76,passed:76,failed:0,skipped:0});
  assert.equal(read('unitarias/cadena-regresion-final.meta.json').exitCode,0);assert.equal(read(s.clean.meta.file).exitCode,0);assert.deepEqual(s.guards,{executed:12,passed:12,failed:0,skipped:0});
  assert.equal(read('unitarias/arnes-final.meta.json').exitCode,0);assert.equal(s.clean.registryAdvisories.total,0);assert.equal(s.clean.localForkCoveredByRegistryAudit,false);return {uniqueNodeCases:76,repeatedAfterCleanInstall:76,separateGuards:12};
 });
 check('249 instancias únicas finales y tres fallos conservados en intentos previos',()=>{
  assert.deepEqual(s.e2e,{executed:249,passed:249,failed:0,skipped:0});const rows=read('e2e/casos-playwright.json');assert.equal(rows.length,249);assert.ok(rows.every(r=>r.status==='passed'&&r.attempts===1));assert.equal(new Set(rows.map(r=>[r.file,r.title,r.project].join('|'))).size,249);
  assert.deepEqual(s.browsers.map(g=>g.executed),[133,105,7,4]);for(const g of s.browsers){assert.equal(g.meta.exitCode,0);assert.equal(g.stats.expected,g.executed);assert.equal(g.stats.unexpected,0);assert.equal(g.stats.flaky,0);assert.equal(g.stats.skipped,0);assert.ok(fs.existsSync(path.join(h.evidence,g.label,'html/index.html')));}
  assert.equal(s.previousPanel.expected,104);assert.equal(s.previousPanel.unexpected,1);assert.equal(s.intermediatePanel.expected,103);assert.equal(s.intermediatePanel.unexpected,2);
  assert.equal(rows.filter(r=>r.file.endsWith('/auth.password-recovery.spec.js')).length,28);return {uniqueFinal:249,totalInstancesAcrossAttempts:459,passedAcrossAttempts:456,failedAcrossAttempts:3,mockAuthRecoveryIncluded:28};
 });
 check('HTTP/HMR reales y persistencia local READ ONLY',()=>{
  assert.equal(s.dev.executed,5);assert.equal(s.dev.passed,5);assert.equal(s.dev.failed,0);assert.equal(read('integracion/dev-server-aislado.meta.json').exitCode,0);assert.equal(read('integracion/dev-server-aislado-proceso.json').intentionalStop,true);
  assert.equal(read('seguridad/backend-local.json').identityVerified,true);assert.equal(s.persistence.readOnly,'on');assert.deepEqual(s.persistence.counts,{students:7,payments:7,paymentswithexpectedamount:7,attendances:7});assert.equal(read('integracion/persistencia-postgresql.meta.json').exitCode,0);return {devChecks:5,sqlRows:s.persistence.counts,institutionalWrites:false};
 });
 check('Tres árboles del registro sin avisos; código local declarado fuera de alcance',()=>{
  for(const name of ['raiz','functions','auxiliar']){assert.equal(s.audits[name].verificado.total,0);assert.equal(read('seguridad/npm-'+name+'-verificado.meta.json').exitCode,0);assert.deepEqual(read('seguridad/npm-'+name+'-verificado.json').metadata.vulnerabilities,s.audits[name].verificado);}
  assert.equal(s.audits.raiz.before.total,15);assert.equal(s.audits.raiz.final.total,51);assert.equal(s.audits.functions.final.total,15);assert.equal(s.audits.auxiliar.final.total,10);
  const pkg=require(path.join(h.root,'package.json'));assert.equal(pkg.overrides.deepmerge,'$deepmerge');assert.equal(pkg.overrides.minimatch,'$minimatch');assert.equal(pkg.overrides['webpack-dev-server'],'6.1.0');assert.equal(pkg.dependencies['react-scripts'],'5.0.1');
  for(const name of ['deepmerge','minimatch'])assert.equal(hash(path.join(h.root,'node_modules',name,'index.cjs')),hash(path.join(h.root,'vendor',name==='deepmerge'?'deepmerge':'minimatch-compat','index.cjs')));
  return {root:0,functions:0,auxiliary:0,localCodeIsNotRegistryAudited:true};
 });
 check('Build estricto sin mapas y APK final coinciden con los artefactos privados',()=>{
  const prefix='android/definitivo/';assert.equal(s.web.exitCode,0);assert.equal(s.android.exitCode,0);assert.ok(s.android.command.join(' ').includes('--rerun-tasks'));assert.deepEqual(read('compilacion-web/vercel-salida.json').sourceMaps,[]);
  for(const name of ['capacitor-sync','capacitor-plugins','gradle-assemble','gradle-version'])assert.equal(read(prefix+'android/'+name+'.meta.json').exitCode,0);
  assert.equal(hash(path.join(h.root,s.apk.file)),s.apk.sha256);assert.equal(s.apk.matchingWebAssets,106);assert.equal(s.apk.autoUpdate,false);assert.equal(s.apk.privateNotPublished,true);assert.equal(s.junit.executed,1);assert.equal(s.junit.passed,1);assert.equal(s.junit.failed,0);
  for(const name of ['apk-badging-definitivo','apk-firma-definitivo'])assert.equal(read('android/'+name+'.meta.json').exitCode,0);assert.deepEqual(read(prefix+'android/privacidad-apk.json').unresolved,[]);
  const first=read('android/apk-primer-build-preservado.json');assert.equal(hash(path.join(h.root,first.preservedFile)),first.sha256);return {assets:106,bytes:s.apk.bytes,private:true,jvmTemplateCases:1};
 });
 check('Fuentes de producto conservadas y cambios auditables',()=>{
  const initial=read('fuentes-iniciales.json');const changed=initial.filter(r=>hash(path.join(h.root,r.file))!==r.sha256).map(r=>r.file);assert.ok(changed.length>0);assert.ok(!changed.some(f=>f.startsWith('src/')));
  assert.ok(changed.includes('package-lock.json'));assert.ok(changed.includes('tests/e2e/asistencias.guided.review.spec.js'));return {sources:initial.length,changed,applicationSourcesUnchanged:true};
 });
 check('Producción permanece bloqueada; no se confunde configuración con aprobación',()=>{
  assert.equal(s.productionModified,false);assert.equal(s.productionReady,false);assert.equal(s.ciRemoteExecuted,false);assert.equal(read('seguridad/vercel-acceso-equipo.json').httpStatus,403);
  const v=require(path.join(h.root,'vercel.json'));assert.equal(v.git.deploymentEnabled['fix/seguridad-local-20261029'],false);assert.ok(v.buildCommand.includes('CI=true'));assert.ok(v.buildCommand.includes('GENERATE_SOURCEMAP=false'));
  const payload=JSON.parse(read('seguridad/supabase-catalogo-20261031.json').result.content[0].text).result;
  const data=JSON.parse(payload.match(/\n<untrusted-data-[^>]+>\s*([\s\S]*?)\s*<\/untrusted-data/)[1])[0].metadata;
  assert.equal(data.claim_daily_login_reward_present,false);for(const n of ['xp_ledger','login_rewards'])assert.equal(data.tables.find(t=>t.table===n).rls,true);
  assert.equal(read('seguridad/preflight-config-local.meta.json').exitCode,1);assert.ok(fs.readFileSync(path.join(h.evidence,'seguridad/preflight-config-local.stdout.log'),'utf8').includes('REACT_APP_APP_URL: INVALID_OR_MISSING'));
  return {vercelAccess:403,missingDailyRewardRpc:true,rlsEnabledInTwoObservedTables:true,finalApprovalPending:true};
 });
 check('Tres documentos, matriz de ocho categorías y referencias existentes',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md','ESTADO_PRODUCCION.md']){
   const s=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(s.length>1000);for(const m of s.matchAll(/\]\(([^)]+)\)/g))if(!/^(https?:|#)/.test(m[1])&&!['fuentes-finales.json','INTEGRIDAD.json','MANIFIESTO_SHA256.json'].includes(m[1]))assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(m[1]))),file+': '+m[1]);
  }
  assert.equal(read('trazabilidad-detallada.json').length,8);return {documents:4,categories:8};
 });
 check('Privacidad de logs, reportes HTML y APK',()=>{
  const p=read('PRIVACIDAD.json');assert.deepEqual(p.unresolved,[]);assert.deepEqual(p.unresolvedArchiveEntries,[]);assert.deepEqual(read('android/definitivo/android/privacidad-apk.json').unresolved,[]);return {textFiles:p.textFilesChecked,embeddedArchives:p.embeddedArchivesChecked};
 });
 const initial=read('fuentes-iniciales.json').map(r=>r.file),other=cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:h.root}).toString().split('\0').filter(f=>/^(scripts\/|tests\/|vendor\/|\.github\/|docs\/produccion\/|docs\/superpowers\/plans\/|\.npmrc$|\.nvmrc$|functions\/\.npmrc$|riovoley\/\.npmrc$)/.test(f));
 other.push('README.md','docs/tesis/README.md');
 h.write('fuentes-finales.json',[...new Set([...initial,...other])].map(file=>({file,sha256:hash(path.join(h.root,file))})));
 h.write('estado-final.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
 const result={generatedAt:new Date().toISOString(),passed:checks.filter(c=>c.state==='APROBADO').length,failed:checks.filter(c=>c.state==='FALLIDO').length,checks};
 if(result.failed){h.write('integridad-intento.json',result);console.log(JSON.stringify(result));process.exitCode=1;return;}
 h.write('INTEGRIDAD.json',result);
 const entries=walk(h.evidence).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)}));
 h.write('MANIFIESTO_SHA256.json',{generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries});
 for(const r of entries)assert.equal(hash(path.join(h.evidence,r.file)),r.sha256);
 console.log(JSON.stringify({checksPassed:result.passed,failed:0,files:entries.length}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
