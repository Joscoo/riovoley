'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('./sql-context.cjs'),{forwardSQL,returnSQL}=require('./sql-packet.cjs');
const c=h.read(),sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const results=json(path.join(c.evidence,'RESULTADOS_AUTOMATIZADOS.json')),packet=json(path.join(c.evidence,'seguridad/paquete-ensayado-05.json'));
assert.equal(results.finalIntegration.tests,29);assert.equal(results.finalIntegration.pass,29);assert.equal(results.finalIntegration.fail,0);assert.equal(results.finalToolContracts.pass,6);
const read=file=>fs.readFileSync(file,'utf8'),snapshot=json(path.join(h.privateDir,'catalog.json')),pc=json(path.join(h.privateDir,'preconditions.json')),query=read(path.join(__dirname,'catalog-fingerprint.sql'));
assert.equal(read(path.join(h.root,packet.forward)),forwardSQL(snapshot,pc,query,read(path.join(h.root,'database/security/local/20261029141114_riovoley_security_local.sql'))));
assert.equal(read(path.join(h.root,packet.return)),returnSQL(snapshot,pc,query,packet.appliedFingerprint));
assert.equal(sha(path.join(h.root,packet.forward)),packet.forwardSha256);assert.equal(sha(path.join(h.root,packet.return)),packet.returnSha256);
assert.equal(sha(path.join(c.evidence,'seguridad/avance-propuesto-final.sql')),packet.forwardSha256);assert.equal(sha(path.join(c.evidence,'seguridad/retorno-propuesto-final.sql')),packet.returnSha256);
const privacy=json(path.join(h.root,'.e2e-local/publish/20261031-sql/scan.json'));assert.deepEqual(privacy.issues,[]);
h.write('PRIVACIDAD.json',{checkedAt:new Date().toISOString(),candidateFiles:privacy.candidateFiles,checkedEntries:privacy.checkedEntries,knownSensitiveValueFindings:0,genericTokenOrPrivateKeyFindings:0,reviewedFindings:privacy.reviewedSyntheticFindings,scope:'Archivos nuevos/modificados antes del cierre; comparación con valores secretos privados y patrones de tokens/claves, sin publicar esos valores.'});
const prior=walk(path.join(h.root,'docs/tesis/evidencias')).filter(f=>path.basename(f)==='MANIFIESTO_SHA256.json');let priorEntries=0;
for(const file of prior){const m=json(file),entries=m.entries||[...m.evidenceFiles||[],...m.additionalTestSources||[]];for(const item of entries){assert.equal(sha(path.resolve(path.dirname(file),item.file)),item.sha256,'Evidencia previa alterada');priorEntries++;}}
let links=0;const reports=['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md','seguridad/REVISION_INDEPENDIENTE.md'].map(f=>path.join(c.evidence,f));
for(const file of [...reports,path.join(h.root,'database/security/production-proposal/README.md')])for(const m of read(file).matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){const target=m[1];if(/^https?:\/\//.test(target))continue;const clean=target.split('#')[0];assert.ok(fs.existsSync(path.resolve(path.dirname(file),clean)),file+': enlace roto '+clean);links++;}
for(const file of reports){assert.ok(!read(file).includes('\uFFFD'),'UTF8 inválido');assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(read(file)),'Control no imprimible');}
const commands=walk(c.evidence).filter(f=>f.endsWith('.meta.json')).map(f=>({file:path.relative(c.evidence,f).replaceAll('\\','/'),...json(f)}));
fs.writeFileSync(path.join(c.evidence,'COMANDOS.json'),JSON.stringify(commands,null,2)+'\n');
const sources=[...walk(__dirname).filter(f=>/\.(cjs|sql)$/.test(f)),...['tests/integration/production-sql-packet.test.cjs','tests/integration/production-sql.local.test.cjs','scripts/e2e/local/schema.cjs','scripts/e2e/local/schema.test.cjs','scripts/audit/security/local-db.cjs',packet.forward,packet.return,'database/security/production-proposal/README.md','docs/superpowers/plans/2026-10-31-paquete-sql-produccion.md'].map(f=>path.join(h.root,f))];
fs.writeFileSync(path.join(c.evidence,'FUENTES_EVALUADAS.json'),JSON.stringify({commit:c.commit,note:'Snapshot de fuentes finales sin commit durante la ejecución; no son entradas externas inmutables del manifiesto de evidencia.',files:[...new Set(sources)].map(file=>({file:path.relative(h.root,file).replaceAll('\\','/'),sha256:sha(file)}))},null,2)+'\n');
h.write('INTEGRIDAD.json',{checkedAt:new Date().toISOString(),priorManifests:prior.length,priorEntriesChecked:priorEntries,brokenLinks:0,relativeLinksChecked:links,finalIntegration:{reported:29,passed:29,failed:0,skipped:0},toolContracts:{reported:6,passed:6,failed:0,skipped:0},sqlMatchesGenerators:true,sqlMatchesRecordedHashes:true,productionCatalogMatchesBaseline:json(path.join(c.evidence,'seguridad/lectura-institucional-final.json')).matchesInstitutionalBaseline,personalRowsCopied:0,productOrDependencyChanges:false,productionApplied:false});
const entries=walk(c.evidence).map(file=>({file:path.relative(c.evidence,file).replaceAll('\\','/'),sha256:sha(file),bytes:fs.statSync(file).size})).sort((a,b)=>a.file.localeCompare(b.file));
fs.writeFileSync(path.join(c.evidence,'MANIFIESTO_SHA256.json'),JSON.stringify({createdAt:new Date().toISOString(),algorithm:'SHA-256',commit:c.commit,note:'Solo archivos del expediente; el manifiesto no se incluye a sí mismo. Las fuentes externas son snapshots separados.',entries},null,2)+'\n',{flag:'wx'});
for(const row of entries)assert.equal(sha(path.join(c.evidence,row.file)),row.sha256);
console.log(JSON.stringify({sealed:true,evidence:path.relative(h.root,c.evidence).replaceAll('\\','/'),entries:entries.length,priorManifests:prior.length,priorEntries,links,finalIntegration:29,contracts:6}));
