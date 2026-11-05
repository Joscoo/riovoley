// Preserve the unpublished draft seal before six typography-only corrections.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs');
const manifest=path.join(h.evidence,'MANIFIESTO_SHA256.json');
assert.equal(path.basename(h.evidence),'20261030-151554-preparacion-produccion-28e48d2');
assert.equal(cp.execFileSync('git',['ls-files','--',path.relative(h.root,manifest)],{encoding:'utf8'}).trim(),'','El sello debe seguir sin publicar ni versionar');
assert.ok(fs.existsSync(manifest));
const snapshot=path.resolve(h.runtime,'editorial-before-publish-'+Date.now());assert.ok(snapshot.startsWith(h.runtime+path.sep));fs.mkdirSync(snapshot);
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const docs=['INFORME_VERIFICACION_TECNICA.md','MATRIZ_VERIFICACIONES_TESIS.md','RESULTADOS_PARA_TESIS_4_5.md','ESTADO_PRODUCCION.md'];
const originals=docs.map(name=>{const from=path.resolve(h.evidence,name),to=path.resolve(snapshot,name);assert.ok(from.startsWith(h.evidence+path.sep));assert.ok(to.startsWith(snapshot+path.sep));fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);return {file:name,originalSha256:hash(to)};});
for(const name of ['MANIFIESTO_SHA256.json','INTEGRIDAD.json','fuentes-finales.json','estado-final.txt','PRIVACIDAD.json','PRIVACIDAD_RUTAS.json']){
 const from=path.resolve(h.evidence,name),to=path.resolve(snapshot,name);assert.ok(from.startsWith(h.evidence+path.sep));assert.ok(to.startsWith(snapshot+path.sep));if(fs.existsSync(from))fs.renameSync(from,to);
}
console.log(JSON.stringify({privateDraftPreserved:path.relative(h.root,snapshot),originals}));
fs.writeFileSync(path.join(snapshot,'REVISION.json'),JSON.stringify({reason:'Seis tildes corruptas detectadas después del primer sello local, todavía no versionado/publicado. Se conservan los documentos y archivos de cierre previos; no se alteran pruebas ni los diez expedientes históricos.',originals},null,2));
// No changes to numbers, statuses, expectations, build outputs or test logs.
for(const name of docs){const file=path.join(h.evidence,name);let s=fs.readFileSync(file,'utf8');for(const [a,b]of [['utiliz?','utilizó'],['conserv?','conservó'],['comprob?','comprobó'],['repiti?','repitió'],['realiz?','realizó'],['s? sola','sí sola']])s=s.split(a).join(b);assert.ok(!s.includes('?'),name+': codificación pendiente');fs.writeFileSync(file,s);}
h.write('REVISION_EDITORIAL.json',{recordedAt:new Date().toISOString(),privateDraftPreserved:path.relative(h.root,snapshot),originals,changes:'Solo seis tildes; resultados y diez expedientes anteriores intactos. Nuevo cierre después de revisión documental.',publishedDraft:false});
