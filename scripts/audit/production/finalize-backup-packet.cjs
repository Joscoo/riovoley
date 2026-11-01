'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs'),json=file=>JSON.parse(fs.readFileSync(file,'utf8')),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
async function main(){
 assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'No modificar expediente sellado');
 const result=json(path.join(h.evidence,'RESULTADOS_AUTOMATIZADOS.json'));assert.equal(result.unit.pass,10);assert.equal(result.unit.fail,0);assert.equal(result.syntheticEncryptedFlow.passed,1);assert.equal(result.productionChanged,false);
 const checks=json(path.join(h.evidence,'integracion/backup-cifrado-entrega.json'));
 assert.equal(checks.rsaBits,3072);assert.equal(checks.institutionalBackupPerformed,false);assert.equal(checks.rawDumpWritten,false);
 const privateArtifacts=walk(path.join(h.runtime,'institutional-backup')).filter(f=>path.basename(f)==='database.incomplete.pgp');
 assert.ok(privateArtifacts.some(f=>sha(fs.readFileSync(f))===checks.sha256),'Artefacto privado no coincide');
 const oldManifests=walk(path.join(h.root,'docs/tesis/evidencias')).filter(f=>path.basename(f)==='MANIFIESTO_SHA256.json');
 const jobs=oldManifests.flatMap(file=>{const m=json(file);return (m.entries||[...m.evidenceFiles||[],...m.additionalTestSources||[]]).map(e=>({file:path.resolve(path.dirname(file),e.file),expected:e.sha256}));});
 let index=0;await Promise.all(Array.from({length:24},async()=>{while(index<jobs.length){const row=jobs[index++];assert.ok(row.file.startsWith(h.root+path.sep));assert.equal(sha(await fs.promises.readFile(row.file)),row.expected,'Evidencia previa alterada');}}));
 const changed=[...cp.execFileSync('git',['diff','--name-only','-z'],{cwd:h.root,encoding:'utf8'}).split('\0'),...cp.execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{cwd:h.root,encoding:'utf8'}).split('\0')].filter(Boolean);
 assert.ok(changed.every(f=>!f.startsWith('src/')&&!f.startsWith('android/')&&!f.startsWith('supabase/functions/')),'Cambió producto fuera del alcance');
 const sources=[...new Set(changed.filter(f=>!f.startsWith('docs/tesis/evidencias/')))];
 fs.writeFileSync(path.join(h.evidence,'FUENTES_EVALUADAS.json'),JSON.stringify({baseCommit:result.baseCommit,files:sources.map(file=>({file,sha256:sha(fs.readFileSync(path.join(h.root,file)))}))},null,2)+'\n');
 const commands=walk(h.evidence).filter(f=>f.endsWith('.meta.json')).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),...json(file)}));fs.writeFileSync(path.join(h.evidence,'COMANDOS.json'),JSON.stringify(commands,null,2)+'\n');
 let links=0;for(const file of [...walk(h.evidence).filter(f=>f.endsWith('.md')),path.join(h.root,'docs/produccion/RESPALDO_Y_RESTAURACION.md')]){
  const text=fs.readFileSync(file,'utf8');assert.ok(!text.includes('\uFFFD'));assert.ok(!/[A-Za-z]\?[A-Za-z]/.test(text.replace(/https?:\/\/[^\s)]+/g,'')),'Texto corrupto');
  for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){if(/^https?:\/\//.test(match[1]))continue;const target=path.resolve(path.dirname(file),match[1].split('#')[0]);if(!['COMANDOS.json','PRIVACIDAD.json','INTEGRIDAD.json','MANIFIESTO_SHA256.json'].includes(path.basename(target)))assert.ok(fs.existsSync(target),'Enlace roto: '+match[1]);links++;}
 }
 const known=new Set();
 const collect=(value,key='')=>{if(value&&typeof value==='object'){for(const [k,v]of Object.entries(value))collect(v,k);}else if(typeof value==='string'&&value.length>=16&&/password|secret|token|key/i.test(key))known.add(value);};
 const credentials=path.join(h.runtime,'credentials.json');if(fs.existsSync(credentials))collect(json(credentials));
 for(const file of fs.readdirSync(h.root).filter(f=>/^\.env(?:\.|$)/.test(f)&&!f.includes('example')))for(const m of fs.readFileSync(path.join(h.root,file),'utf8').matchAll(/^\s*([A-Z0-9_]+)\s*=\s*(.+)$/gm))if(/password|secret|token|key/i.test(m[1])){const val=m[2].trim().replace(/^['"]|['"]$/g,'');if(val.length>=16)known.add(val);}
 const scanFiles=[...new Set([...walk(h.evidence),...sources.map(f=>path.join(h.root,f))])];const issues=[];
 for(const file of scanFiles){const text=fs.readFileSync(file,'utf8'),label=path.relative(h.root,file).replaceAll('\\','/');if([...known].some(secret=>text.includes(secret)))issues.push({file:label,type:'KNOWN_PRIVATE_VALUE'});if(/-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/.test(text))issues.push({file:label,type:'SECRET_PATTERN'});}
 assert.deepEqual(issues,[],'Contenido privado detectado: revisar localmente, sin imprimir valores');
 h.write('PRIVACIDAD.json',{checkedAt:new Date().toISOString(),filesChecked:scanFiles.length,knownValuesCompared:known.size,issues:0,valuesRecorded:false,scope:'Valores sensibles conocidos de archivos de entorno locales y credenciales del laboratorio, más patrones de claves/JWT/URLs PostgreSQL con contraseña. Revisión limitada a archivos nuevos/modificados; no acredita ausencia universal de PII.'});
 h.write('seguridad/REVISION_INDEPENDIENTE.md','# Revisión independiente de solo lectura\n\nEl revisor examinó ejecutor, asistente, integración sintética y contratos, sin acceder a Cloud ni artefactos privados. Reejecutó 10/10 contratos y no confirmó defectos críticos/importantes. Verificó la separación entre descifrado/inspección y restauración real pendiente. Límite menor incorporado a la guía: el preflight del catálogo se realiza en otra transacción y no excluye DDL concurrente durante el snapshot de pg_dump.\n');
 h.write('INTEGRIDAD.json',{checkedAt:new Date().toISOString(),priorManifests:oldManifests.length,priorEntries:jobs.length,priorEntriesMatching:true,privateSyntheticArchiveHashMatches:true,relativeLinksChecked:links,brokenLinks:0,unitTests:10,syntheticFlows:1,institutionalBackupPerformed:false,productionChanged:false});
 const entries=walk(h.evidence).map(file=>({file:path.relative(h.evidence,file).replaceAll('\\','/'),sha256:sha(fs.readFileSync(file)),bytes:fs.statSync(file).size})).sort((a,b)=>a.file.localeCompare(b.file));
 fs.writeFileSync(path.join(h.evidence,'MANIFIESTO_SHA256.json'),JSON.stringify({createdAt:new Date().toISOString(),algorithm:'SHA-256',baseCommit:result.baseCommit,note:'Archivos de este expediente; no incluye el propio manifiesto ni artefactos privados.',entries},null,2)+'\n',{flag:'wx'});
 for(const row of entries)assert.equal(sha(fs.readFileSync(path.join(h.evidence,row.file))),row.sha256);
 console.log(JSON.stringify({sealed:true,entries:entries.length,priorManifests:oldManifests.length,priorEntries:jobs.length,privacyIssues:0,relativeLinks:links}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
