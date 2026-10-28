const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const assert=require('node:assert/strict');
const a=require('./auditar.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(a.out,f),'utf8'));
const checks=[];
function check(name,fn) { try { fn(); checks.push({name,status:'passed'}); } catch(e) { checks.push({name,status:'failed',error:e.message}); } }
const j=read('unitarias/jest-resultados.json');
const cases=read('unitarias/casos-detallados.json');
const extra=read('integracion/adicionales-resultados.json');
const pw=read('e2e/resultados.json');
const pc=read('e2e/casos-detallados.json');
const summary=read('resumen-verificaciones.json');
check('Jest: cifras coinciden con aserciones originales',()=>{
  assert.equal(cases.length,j.numTotalTests);
  assert.equal(cases.filter(t=>t.status==='passed').length,j.numPassedTests);
  assert.equal(j.numPassedTests,387); assert.equal(j.numTotalTestSuites,83);
  assert.equal(summary.baselineJest.executed,cases.length);
  assert.equal(extra.numPassedTests,5); assert.equal(extra.numFailedTests,0);
});
check('Playwright: conteo original y detalle por caso',()=>{
  assert.equal(pc.length,133);
  assert.equal(pc.filter(t=>t.status==='expected').length,pw.stats.expected);
  assert.equal(pc.filter(t=>t.status==='unexpected').length,pw.stats.unexpected);
  assert.equal(pw.stats.expected,126); assert.equal(pw.stats.unexpected,7); assert.equal(pw.stats.skipped,0);
  assert.equal(read('e2e/casos-bloqueados.json').cases.length,112);
});
check('Cobertura: numeradores y denominadores',()=>{
  const cv=read('unitarias/coverage/coverage-summary.json').total;
  assert.equal(cv.lines.covered,4968); assert.equal(cv.lines.total,12082);
  // Istanbul trunca a dos decimales; no redondea al valor más cercano.
  assert.equal(Math.floor(cv.lines.covered/cv.lines.total*10000)/100,cv.lines.pct);
  assert.deepEqual(summary.coverage,cv);
});
check('Contratos sin duplicar denominador de Jest',()=>{
  const contracts=read('integracion/contratos-resultados.json');
  assert.equal(contracts.numPassedTests,5);
  for(const suite of contracts.testResults) {
    const original=j.testResults.find(s=>s.name===suite.name);
    assert.ok(original); assert.deepEqual(original.assertionResults.map(t=>t.fullName).sort(),suite.assertionResults.map(t=>t.fullName).sort());
  }
});
check('Matriz: cada caso corresponde a una asercion ejecutada',()=>{
  for(const category of read('trazabilidad-casos.json')) {
    assert.equal(category.result.executed,category.cases.length);
    for(const t of category.cases) assert.ok(cases.find(x=>x.file===t.file&&x.fullName===t.fullName&&x.status===t.status));
  }
});
check('Compilación y endpoints: salidas reales',()=>{
  assert.equal(read('compilacion-web/build.meta.json').exitCode,0);
  assert.equal(read('compilacion-web/build.meta.json').durationSeconds,105.121);
  const h=read('integracion/health-resultados.json'); assert.equal(h.executed,2); assert.ok(h.results.every(r=>r.httpStatus===200));
  assert.equal(read('android/alcance.json').nativeBuildExecuted,false);
});
check('RLS objetivo y auditorias npm: valores originales',()=>{
  const cat=read('seguridad/catalogos-rls.json');
  for(const name of ['xp_ledger','login_rewards']) {const t=cat.tables.find(t=>t.schema==='gamification'&&t.table===name);assert.equal(t.rls,true);assert.equal(t.policy_count,1);}
  for(const [name,n] of [['npm-audit',63],['npm-audit-functions',39],['npm-audit-riovoley',5]]) {
    const audit=read('seguridad/'+name+'.json'); assert.equal(audit.metadata.vulnerabilities.total,n);
    assert.deepEqual(audit.metadata,JSON.parse(fs.readFileSync(path.join(a.out,'seguridad/'+name+'.stdout.log'),'utf8')).metadata);
    assert.equal(read('seguridad/'+name+'.meta.json').exitCode,1);
  }
});
check('Archivos originales y package-lock no cambiados',()=>{
  const inv=read('inventario.json');
  for(const [file,hash] of Object.entries(inv.fingerprints)) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(a.root,file))).digest('hex'),hash,file);
  assert.equal(read('integridad-tracked.meta.json').exitCode,0);
});
check('Enlaces locales de los tres documentos existen',()=>{
  for(const file of ['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md']) {
    const md=fs.readFileSync(path.join(a.out,file),'utf8');
    assert.ok(md.length>1000);
    for(const match of md.matchAll(/\]\(([^)]+)\)/g)) {
      if(/^(https?:|#)/.test(match[1])) continue;
      assert.ok(fs.existsSync(path.resolve(a.out,decodeURIComponent(match[1].split('#')[0]))),file+': '+match[1]);
    }
  }
});
check('Texto académico: cantidades alineadas con evidencias',()=>{
  const md=fs.readFileSync(path.join(a.out,'RESULTADOS_PARA_TESIS_4_5.md'),'utf8');
  for(const fragment of ['83 suites y 387','41,11 %','126 aprobaron y siete fallaron','105,121','63 registros','cinco casos de integración local']) assert.ok(md.includes(fragment),fragment);
});
check('Privacidad: revision final sin coincidencias pendientes',()=>{assert.equal(read('PRIVACIDAD.json').unresolved.length,0);});
const failed=checks.filter(c=>c.status==='failed');
a.write('INTEGRIDAD.json',{observedAt:new Date().toISOString(),checks,passed:checks.length-failed.length,failed:failed.length,note:'Estos son controles de integridad del expediente; no se agregan a los casos del producto.'});
const addedTests=['src/features/gamification/application/useCases/gamification.audit.integration.test.js','tests/e2e/audit.protected-routes.spec.js'];
const files=a.walk(a.out).filter(f=>path.basename(f)!=='MANIFIESTO_SHA256.json');
const hashFile=file=>({file:path.relative(a.out,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
a.write('MANIFIESTO_SHA256.json',{observedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,evidenceFiles:files.map(hashFile),additionalTestSources:addedTests.map(f=>hashFile(path.join(a.root,f)))});
console.log(JSON.stringify({integrityPassed:checks.length-failed.length,integrityFailed:failed,evidenceFiles:files.length,totalBytes:files.reduce((sum,f)=>sum+fs.statSync(f).size,0)}));
process.exitCode=failed.length?1:0;
