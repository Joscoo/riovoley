const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('./sql-context.cjs'),{connectLab,maintenance}=require('./sql-lab.cjs'),{forwardSQL}=require('./sql-packet.cjs');
(async()=>{const db=await connectLab();try{
 const p=JSON.parse(fs.readFileSync(path.join(h.privateDir,'packet.json'))),pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions.json'))),s=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json'))),q=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8');
 const back=p.forward.replace(/_riovoley_security_production_proposal\.sql$/,'_riovoley_security_return_proposal.sql');
 h.write('seguridad/avance-borrador-02.sql',fs.readFileSync(path.join(h.root,p.forward),'utf8'));h.write('seguridad/retorno-previo-cierre.sql',fs.readFileSync(path.join(h.root,back),'utf8'));
 await maintenance(db);await db.query(fs.readFileSync(path.join(h.root,back),'utf8'));assert.equal((await db.query(q)).rows[0].fingerprint,pc.fingerprint);
 const sql=forwardSQL(s,pc,q,fs.readFileSync(path.join(h.root,'database/security/local/20261029141114_riovoley_security_local.sql'),'utf8'));fs.writeFileSync(path.join(h.root,p.forward),sql);
 const next={...p,revision:3,sha256:crypto.createHash('sha256').update(sql).digest('hex')};fs.writeFileSync(path.join(h.privateDir,'packet.json'),JSON.stringify(next,null,2)+'\n');h.write('seguridad/paquete-revision-03.json',next);console.log(JSON.stringify({revision:3,productionChanged:false}));
 }finally{await db.end();}})().catch(e=>{console.error(e);process.exitCode=1;});
