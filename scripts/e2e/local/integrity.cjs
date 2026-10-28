const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const cp=require('node:child_process');
const assert=require('node:assert/strict');
const h=require('./harness.cjs');
const read=f=>JSON.parse(fs.readFileSync(path.join(h.evidence,f),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const checks=[];
function check(name,callback) {try{callback();checks.push({name,status:'passed'});}catch(e){checks.push({name,status:'failed',error:e.message});}}
function walk(dir) {return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]);}
const primary=['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md'];
check('Los 112 casos coinciden exactamente con el inventario originalmente bloqueado',()=>{
  const original=JSON.parse(fs.readFileSync(path.join(h.root,'docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/e2e/casos-bloqueados.json'))).cases;
  const current=read('casos-e2e-detallados.json');
  const key=x=>[x.file,x.title,x.project].join('::');
  assert.deepEqual(original.map(key).sort(),current.map(key).sort());
  assert.equal(new Set(current.map(key)).size,112);
});
check('Denominadores Playwright: 95 aprobados, 17 fallidos, ninguna omision',()=>{
  const stable=read('pendientes-estable/resultados.json');const mutations=read('mutaciones-estable/resultados.json');
  assert.equal(stable.stats.expected,95);assert.equal(stable.stats.unexpected,10);assert.equal(stable.stats.skipped,0);
  assert.equal(mutations.stats.expected,0);assert.equal(mutations.stats.unexpected,7);assert.equal(mutations.stats.skipped,0);
  const current=read('casos-e2e-detallados.json');assert.equal(current.filter(t=>t.status==='expected').length,95);assert.equal(current.filter(t=>t.status==='unexpected').length,17);
  assert.equal(read('resumen-e2e-local.json').executed,112);
});
check('Compilacion final y setup reproducible terminaron con codigo 0',()=>{
  const build=fs.readdirSync(h.evidence).find(f=>f.startsWith('compilacion-web-build-')&&f.endsWith('.meta.json'));
  assert.equal(read(build).exitCode,0);assert.equal(read('setup-final.meta.json').exitCode,0);
});
check('12 pruebas finales del arnes aprobadas',()=>{
  assert.equal(read('arnes-final.meta.json').exitCode,0);
  const log=fs.readFileSync(path.join(h.evidence,'arnes-final.stdout.log'),'utf8');
  assert.match(log,/tests 12/);assert.match(log,/pass 12/);assert.match(log,/fail 0/);
});
check('Auth, perfiles y consultas por rol reales',()=>{
  const result=read('auth-roles-reales.json');assert.equal(result.executed,3);assert.equal(result.passed,3);
  assert.equal(result.results.find(r=>r.actor==='student').visibleUsers,1);
});
check('Matriz SQL real termino con ROLLBACK y salida 0',()=>{
  assert.equal(read('rls-matriz-local.meta.json').exitCode,0);
  assert.match(fs.readFileSync(path.join(h.evidence,'rls-matriz-local.stdout.log'),'utf8'),/ROLLBACK/);
});
check('Seed repetible y persistencia real de recompensa diaria',()=>{
  const seed=read('seed-idempotencia.json');assert.deepEqual(seed.before,seed.after);
  const p=read('persistencia-local.json');assert.equal(p.daily_login_entries,1);assert.equal(p.daily_login_xp,8);assert.equal(p.duplicate_daily_groups,0);
});
check('Bindings de puertos exclusivos a loopback',()=>{
  const rows=read('red-local/bindings.json').results;assert.equal(rows.length,3);
  for(const r of rows) assert.ok(Object.values(r.bindings).flat().every(b=>b.HostIp==='127.0.0.1'));
});
check('Fuentes del producto y lockfile principal sin cambios',()=>{
  const output=cp.execFileSync('git',['diff','--name-only','--','src','tests','package-lock.json'],{cwd:h.root,encoding:'utf8'});
  assert.equal(output.trim(),'');
  const inv=JSON.parse(fs.readFileSync(path.join(h.root,'docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e/inventario.json')));
  for(const [file,expected] of Object.entries(inv.fingerprints).filter(([file])=>file!=='package.json')) assert.equal(hash(path.join(h.root,file)),expected,file);
  const ignored=cp.execFileSync('git',['check-ignore','.e2e-local/credentials.json'],{cwd:h.root,encoding:'utf8'});assert.match(ignored,/credentials\.json/);
});
check('Expediente original conservado con todos sus hashes',()=>{
  const original=path.join(h.root,'docs/tesis/evidencias/verificacion-tecnica/20261027-212222-c71f55e');
  const manifest=JSON.parse(fs.readFileSync(path.join(original,'MANIFIESTO_SHA256.json')));
  for(const item of [...manifest.evidenceFiles,...manifest.additionalTestSources]) assert.equal(hash(path.resolve(original,item.file)),item.sha256,item.file);
});
check('Privacidad: textos y tres archivos HTML embebidos sin coincidencias pendientes',()=>{
  const p=read('PRIVACIDAD.json');assert.equal(p.unresolved.length,0);assert.equal(p.unresolvedArchiveEntries.length,0);assert.equal(p.embeddedArchivesChecked,3);
});
check('Texto academico mantiene cifras y no atribuye exito a mutaciones fallidas',()=>{
  const md=fs.readFileSync(path.join(h.evidence,'RESULTADOS_PARA_TESIS_4_5.md'),'utf8');
  for(const value of ['112 instancias E2E','95 instancias aprobadas y 17 fallidas','ocho XP','no llegó a completar']) assert.ok(md.includes(value),value);
});
const sourceFiles=['.gitignore','package.json','playwright.local.config.cjs','database/e2e/local-baseline.sql',...fs.readdirSync(path.join(h.root,'scripts/e2e/local')).filter(f=>/\.(cjs|py|toml|md)$/.test(f)).map(f=>'scripts/e2e/local/'+f)];
fs.writeFileSync(path.join(h.evidence,'fuentes-entorno.json'),JSON.stringify(sourceFiles.map(file=>({file,sha256:hash(path.join(h.root,file))})),null,2)+'\n');
function record() {fs.writeFileSync(path.join(h.evidence,'INTEGRIDAD.json'),JSON.stringify({observedAt:new Date().toISOString(),checks,passed:checks.filter(c=>c.status==='passed').length,failed:checks.filter(c=>c.status==='failed').length,note:'Controles del expediente; no se suman a E2E.'},null,2)+'\n');}
record();
// Se crea un primer manifiesto real para poder comprobar todos los enlaces.
fs.writeFileSync(path.join(h.evidence,'MANIFIESTO_SHA256.json'),JSON.stringify({generatedAt:new Date().toISOString(),selfExcluded:true,entries:walk(h.evidence).filter(f=>path.basename(f)!=='MANIFIESTO_SHA256.json').map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),sha256:hash(file),bytes:fs.statSync(file).size}))},null,2)+'\n');
check('Los enlaces locales de los tres documentos existen',()=>{
  for(const file of primary) {
    const content=fs.readFileSync(path.join(h.evidence,file),'utf8');assert.ok(content.length>1000);
    for(const match of content.matchAll(/\]\(([^)]+)\)/g)) if(!/^(https?:|#)/.test(match[1])) assert.ok(fs.existsSync(path.resolve(h.evidence,decodeURIComponent(match[1].split('#')[0]))),file+': '+match[1]);
  }
});
record();
const files=walk(h.evidence).filter(f=>path.basename(f)!=='MANIFIESTO_SHA256.json');
fs.writeFileSync(path.join(h.evidence,'MANIFIESTO_SHA256.json'),JSON.stringify({generatedAt:new Date().toISOString(),algorithm:'SHA-256',selfExcluded:true,entries:files.map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),sha256:hash(file),bytes:fs.statSync(file).size}))},null,2)+'\n');
const failed=checks.filter(c=>c.status==='failed');
console.log(JSON.stringify({passed:checks.length-failed.length,failed,evidenceFiles:files.length,totalBytes:files.reduce((sum,file)=>sum+fs.statSync(file).size,0)}));
process.exitCode=failed.length?1:0;
