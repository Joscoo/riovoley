'use strict';
// Align only this session's uniquely marked lab, preserving every earlier draft.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('./sql-context.cjs'),{connectLab,maintenance}=require('./sql-lab.cjs'),{forwardSQL}=require('./sql-packet.cjs'),{alignAccess}=require('./sql-access.cjs');
async function upgrade(){
 const db=await connectLab();try{
  const packet=JSON.parse(fs.readFileSync(path.join(h.privateDir,'packet.json'))),snapshot=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json'))),pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions-v2.json')));
  const previousReturn=packet.forward.replace(/_riovoley_security_production_proposal\.sql$/,'_riovoley_security_return_proposal.sql');
  for(const [name,file] of [['avance-borrador-01.sql',packet.forward],['retorno-borrador-03.sql',previousReturn]]){const content=fs.readFileSync(path.join(h.root,file),'utf8'),existing=path.join(h.read().evidence,'seguridad',name);if(fs.existsSync(existing))assert.equal(fs.readFileSync(existing,'utf8'),content);else h.write('seguridad/'+name,content);}
  await maintenance(db);
  const oldQuery=fs.readFileSync(path.join(h.privateDir,'fingerprint-v1.sql'),'utf8');
  if((await db.query(oldQuery)).rows[0].fingerprint!==packet.baselineFingerprint)await db.query(fs.readFileSync(path.join(h.root,previousReturn),'utf8'));
  await alignAccess(db,pc.access);
  const query=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'),actual=(await db.query(query)).rows[0].fingerprint;
  const attempt=String(fs.readdirSync(path.join(h.read().evidence,'integracion')).filter(f=>f.startsWith('reconstruccion-huella-ampliada')).length+1).padStart(2,'0');
  h.write('integracion/reconstruccion-huella-ampliada-'+attempt+'.json',{actualFingerprint:actual,expectedFingerprint:pc.fingerprint,scope:'Funciones y ACL; vistas; RLS/policies; triggers/estado; constraints; columnas; indices/validez; enum; secuencias; propietarios y ACL de relaciones/esquemas/columnas; ACL predeterminadas de funciones del propietario postgres',normalization:'Solo el CHECK legado announcements_priority_check acepta dos representaciones equivalentes de conversión varchar[] a text[], de PG17.4 y PG17.11.'});
  assert.equal(actual,pc.fingerprint);
  fs.copyFileSync(path.join(h.privateDir,'preconditions.json'),path.join(h.privateDir,'preconditions-v1.json'),fs.constants.COPYFILE_EXCL);
  fs.writeFileSync(path.join(h.privateDir,'preconditions.json'),JSON.stringify(pc,null,2)+'\n');
  const sql=forwardSQL(snapshot,pc,query,fs.readFileSync(path.join(h.root,'database/security/local/20261029141114_riovoley_security_local.sql'),'utf8'));
  fs.writeFileSync(path.join(h.root,packet.forward),sql);
  fs.copyFileSync(path.join(h.privateDir,'packet.json'),path.join(h.privateDir,'packet-v1.json'),fs.constants.COPYFILE_EXCL);
  const current={...packet,baselineFingerprint:pc.fingerprint,sha256:crypto.createHash('sha256').update(sql).digest('hex'),revision:2};
  fs.writeFileSync(path.join(h.privateDir,'packet.json'),JSON.stringify(current,null,2)+'\n');
  h.write('seguridad/precondiciones-institucionales-ampliadas.json',pc);h.write('seguridad/paquete-ampliado.json',current);
  console.log(JSON.stringify({baselineMatches:true,revision:2,productionChanged:false}));
 }finally{await db.end();}
}
if(require.main===module)upgrade().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={alignAccess};
