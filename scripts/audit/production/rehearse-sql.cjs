'use strict';
// Recovery of this session's OWN disposable laboratory only; never a production executor.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('./sql-context.cjs'),{connectLab,maintenance}=require('./sql-lab.cjs'),{returnSQL}=require('./sql-packet.cjs');
async function recover(){
 const db=await connectLab();try{
  const s=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json'))),pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions.json'))),query=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8');
  const file=process.argv[2]||'integracion/estado-final.json';assert.match(file,/^integracion\/estado-final(?:-ampliado|-\d+)?\.json$/);
  const applied=JSON.parse(fs.readFileSync(path.join(h.read().evidence,file))).appliedFingerprint;
  assert.equal((await db.query(query)).rows[0].fingerprint,applied);
  await maintenance(db);await db.query(returnSQL(s,pc,query,applied));
  const restored=(await db.query(query)).rows[0].fingerprint;assert.equal(restored,pc.fingerprint);
  const count=fs.readdirSync(path.join(h.read().evidence,'integracion')).filter(f=>f.startsWith('recuperacion-retorno')).length;
  h.write('integracion/recuperacion-retorno-'+String(count+1).padStart(2,'0')+'.json',{actualFingerprint:restored,matchesOriginal:true,productionChanged:false});
  console.log(JSON.stringify({returnExecuted:true,matchesOriginal:true}));
 }finally{await db.end();}
}
if(require.main===module)recover().catch(e=>{console.error(e);process.exitCode=1;});
