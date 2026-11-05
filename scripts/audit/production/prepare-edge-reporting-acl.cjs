'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs'),{guard}=require('./sql-packet.cjs');
const body='GRANT SELECT ON reporting.report_definitions TO service_role;\nGRANT SELECT,INSERT,UPDATE,DELETE ON reporting.report_runs,reporting.report_artifacts TO service_role;';
const reverse='REVOKE SELECT ON reporting.report_definitions FROM service_role;\nREVOKE SELECT,INSERT,UPDATE,DELETE ON reporting.report_runs,reporting.report_artifacts FROM service_role;';
const hash=sql=>crypto.createHash('sha256').update(sql).digest('hex');
(async()=>{
 const privateDir=path.join(h.runtime,'edge-production'),query=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'),baseline='500d15ffa5fa23aeddb47e5c21cd1d13';
 // First verify the local server through its known synthetic Auth/DB identity.
 const main=await require('../security/local-db.cjs').connect();
 const context=JSON.parse(fs.readFileSync(path.join(h.runtime,'production-migration/context.json')));assert.match(context.database,/^riovoley_release_\d{14}$/);
 const {Client}=require(path.join(h.runtime,'sql-driver/node_modules/pg')),db=new Client({host:'127.0.0.1',port:55322,user:'postgres',password:process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',database:context.database,ssl:false});await db.connect();
 try{
  assert.equal((await db.query("SELECT shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()")).rows[0].marker,'RIOVOLEY isolated production-schema rehearsal; synthetic data only');
  assert.equal((await db.query(query)).rows[0].fingerprint,baseline);
  const sql='-- PROPUESTA COMPLEMENTARIA. Aplicar despues del paquete principal; retornar antes de el.\nBEGIN;\n'+guard(query,baseline)+body+'\nCOMMIT;\n';
  await db.query("SELECT set_config('riovoley.release.approval','reviewed-maintenance:mayvvlkvheagkojunzzb',false),set_config('riovoley.release.window','closed-to-clients',false)");await db.query(sql);
  const applied=(await db.query(query)).rows[0].fingerprint;
  assert.equal((await db.query("SELECT has_table_privilege('service_role','reporting.report_definitions','SELECT') AS readable,has_table_privilege('service_role','reporting.report_definitions','INSERT') AS writable")).rows[0].readable,true);
  assert.equal((await db.query("SELECT has_table_privilege('service_role','reporting.report_definitions','INSERT') AS writable")).rows[0].writable,false);
  const rollback='-- RETORNO COMPLEMENTARIO: ejecutar antes del retorno del paquete principal.\nBEGIN;\n'+guard(query,applied)+reverse+'\n'+guard(query,baseline)+'\nCOMMIT;\n';
  await db.query(rollback);assert.equal((await db.query(query)).rows[0].fingerprint,baseline);
  const work=path.join(privateDir,'acl-cli');fs.mkdirSync(work,{recursive:true});
  const r=await h.run('seguridad/cli-reporting-migration-new',h.cli,['migration','new','reporting_service_grants_proposal','--workdir',work]);assert.equal(r.exitCode,0);
  const files=fs.readdirSync(path.join(work,'supabase/migrations')).filter(f=>/reporting_service_grants_proposal\.sql$/.test(f));assert.equal(files.length,1);
  const forward='database/security/production-proposal/'+files[0],back=forward.replace('_reporting_service_grants_proposal.sql','_reporting_service_return_proposal.sql');
  fs.renameSync(path.join(work,'supabase/migrations',files[0]),path.join(h.root,forward));fs.writeFileSync(path.join(h.root,forward),sql);fs.writeFileSync(path.join(h.root,back),rollback,{flag:'wx'});
  // This known local database uses the earlier hardened schema. Apply only the
  // exact grant body for HTTP tests, not a fabricated production guard result.
  const before=(await main.query("SELECT has_table_privilege('service_role',c.oid,'SELECT') AS allowed FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='reporting' AND c.relname IN ('report_definitions','report_runs','report_artifacts')")).rows;assert.ok(before.every(r=>!r.allowed));
  await main.query('BEGIN;'+body+'COMMIT;');
  h.write('seguridad/reporting-acl-ensayo.json',{database:context.database,beforeFingerprint:baseline,appliedFingerprint:applied,restoredFingerprint:baseline,returnExecuted:true,forward,return:back,forwardSha256:hash(sql),returnSha256:hash(rollback),grantBodySha256:hash(body),mainLocalHttpDatabase:'postgres at 127.0.0.1:55322; verified Auth identity',mainLocalExactBodyApplied:true,mainLocalFullProductionGuardExercised:false,productionChanged:false});
  h.write('seguridad/reporting-acl-institucional.json',JSON.parse(fs.readFileSync(path.join(privateDir,'reporting-cloud-acl.json'))));
  console.log(JSON.stringify({proposal:forward,returnTested:true,productionChanged:false}));
 }finally{await db.end();await main.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
