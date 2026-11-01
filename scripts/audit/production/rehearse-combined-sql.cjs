'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const verified=await require('../security/local-db.cjs').connect();await verified.end();
 const ctx=JSON.parse(fs.readFileSync(path.join(h.runtime,'production-migration/context.json')));assert.match(ctx.database,/^riovoley_release_\d{14}$/);
 const {Client}=require(path.join(h.runtime,'sql-driver/node_modules/pg')),db=new Client({host:'127.0.0.1',port:55322,user:'postgres',password:process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',database:ctx.database,ssl:false});await db.connect();
 try{
 assert.equal((await db.query("SELECT shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()")).rows[0].marker,'RIOVOLEY isolated production-schema rehearsal; synthetic data only');
 const acl=JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/reporting-acl-ensayo.json'))),query=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'),fp=async()=>(await db.query(query)).rows[0].fingerprint;
 assert.equal(await fp(),acl.beforeFingerprint);await db.query("SELECT set_config('riovoley.release.approval','reviewed-maintenance:mayvvlkvheagkojunzzb',false),set_config('riovoley.release.window','closed-to-clients',false)");
 const main='database/security/production-proposal/20261031211612_riovoley_security_production_proposal.sql',back='database/security/production-proposal/20261031211612_riovoley_security_return_proposal.sql';
 await db.query(fs.readFileSync(path.join(h.root,acl.forward),'utf8'));assert.equal(await fp(),acl.appliedFingerprint);
 await assert.rejects(db.query(fs.readFileSync(path.join(h.root,back),'utf8')),/Deriva/);await db.query('ROLLBACK');
 await db.query(fs.readFileSync(path.join(h.root,acl.return),'utf8'));assert.equal(await fp(),acl.beforeFingerprint);
 await db.query(fs.readFileSync(path.join(h.root,back),'utf8'));assert.equal(await fp(),'15b9d9e869fb5113263c485714009878');
 await db.query(fs.readFileSync(path.join(h.root,main),'utf8'));assert.equal(await fp(),acl.beforeFingerprint);
 await db.query(fs.readFileSync(path.join(h.root,acl.forward),'utf8'));assert.equal(await fp(),acl.appliedFingerprint);
 h.write('seguridad/retorno-combinado.json',{executedAt:new Date().toISOString(),database:ctx.database,primaryAppliedFingerprint:acl.beforeFingerprint,combinedFingerprint:acl.appliedFingerprint,wrongReturnOrderRejected:true,complementReturnedBeforePrimary:true,primaryReturnedToOriginal:true,primaryAndComplementReapplied:true,productionChanged:false});console.log(JSON.stringify({combinedReturnPassed:true,wrongOrderRejected:true}));
 }finally{await db.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
