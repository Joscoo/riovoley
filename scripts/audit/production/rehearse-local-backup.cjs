'use strict';
// Synthetic local lab only. No institutional connection input or destructive reset.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const h=require('../../e2e/local/harness.cjs'),{dockerArgs,localDockerEnv}=require('../../e2e/local/safety.cjs');
const {Client}=require(path.join(h.runtime,'sql-driver/node_modules/pg'));
const config=database=>({host:'127.0.0.1',port:55322,user:'postgres',password:process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',database,ssl:false});
const binary=(label,args,input)=>{const start=new Date(),r=cp.spawnSync('docker',dockerArgs(['exec','-i','supabase_db_riovoley-e2e-local',...args]),{env:localDockerEnv(),input,windowsHide:true,maxBuffer:64*1024*1024});h.write(label+'.meta.json',{command:['docker','exec','-i','supabase_db_riovoley-e2e-local',...args],start:start.toISOString(),end:new Date().toISOString(),durationSeconds:(Date.now()-start)/1000,exitCode:r.status,stdoutBytes:r.stdout?.length||0,rawOutputPrivate:true});h.write(label+'.stderr.log',r.stderr?.toString('utf8')||'');return r;};
(async()=>{
 const verified=await require('../security/local-db.cjs').connect();
 const src=JSON.parse(fs.readFileSync(path.join(h.runtime,'production-migration/context.json'))).database;assert.match(src,/^riovoley_release_\d{14}$/);
 const source=new Client(config(src));await source.connect();
 const dir=path.join(h.runtime,'production-backup'),stamp=new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);fs.mkdirSync(dir,{recursive:true});
 const create=async name=>{assert.match(name,/^riovoley_restore_\d{14}(?:_compat)?$/);assert.equal((await verified.query('SELECT 1 FROM pg_database WHERE datname=$1',[name])).rowCount,0);await verified.query('CREATE DATABASE "'+name+'" TEMPLATE template0');await verified.query('COMMENT ON DATABASE "'+name+'" IS '+"'RIOVOLEY synthetic backup restore rehearsal'");};
 try{
 assert.equal((await source.query("SELECT shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()")).rows[0].marker,'RIOVOLEY isolated production-schema rehearsal; synthetic data only');
 const dumped=binary('seguridad/backup-local-pg-dump',['pg_dump','-U','postgres','--format=custom','--dbname='+src]);assert.equal(dumped.status,0);
 const file=path.join(dir,stamp+'.dump');fs.writeFileSync(file,dumped.stdout,{flag:'wx'});
 const raw='riovoley_restore_'+stamp;await create(raw);
 const first=binary('seguridad/backup-local-restore-directo',['pg_restore','-U','postgres','--exit-on-error','--dbname='+raw],dumped.stdout);
 let target=raw,compatibility=null;
 if(first.status!==0){
  assert.match(first.stderr.toString('utf8'),/generation expression is not immutable/,'Fallo de restauracion no previsto: conservar y revisar');
  target=raw+'_compat';await create(target);
  const parsed=JSON.parse(fs.readFileSync(path.join(h.runtime,'production-migration/catalog.json'))),age=parsed.functions.find(f=>f.schema==='public'&&f.name==='calculate_age');assert.ok(age);
  const db=new Client(config(target));await db.connect();try{await db.query(age.definition.replace('LANGUAGE sql','LANGUAGE sql IMMUTABLE'));}finally{await db.end();}
  const listed=binary('seguridad/backup-local-toc',['pg_restore','--list'],dumped.stdout);assert.equal(listed.status,0);
  const lines=listed.stdout.toString('utf8').split('\n'),matches=lines.filter(l=>/ FUNCTION public calculate_age\(/.test(l));assert.equal(matches.length,1);
  const toc=lines.map(l=>matches.includes(l)?'; '+l:l).join('\n');const tocFile=path.join(dir,stamp+'-restore.list');fs.writeFileSync(tocFile,toc,{flag:'wx'});
  // Send the reviewed TOC to the container over stdin, with a fixed private path.
  const containerList='/tmp/riovoley-synthetic-restore-'+stamp+'.list';const copied=binary('seguridad/backup-local-toc-copiar',['tee',containerList],Buffer.from(toc));assert.equal(copied.status,0);
  const restored=binary('seguridad/backup-local-restore-compatible',['pg_restore','-U','postgres','--exit-on-error','--use-list='+containerList,'--dbname='+target],dumped.stdout);assert.equal(restored.status,0);
  const final=new Client(config(target));await final.connect();try{await final.query(age.definition);}finally{await final.end();}
  compatibility={reason:'calculate_age tiene volatilidad no inmutable y una columna GENERATED almacenada depende de ella.',temporaryRestoreOnly:'Precrear calculate_age IMMUTABLE en destino vacio, omitir solo su definicion en TOC, restaurar la definicion original inmediatamente despues.',sourceFunctionChanged:false,sourceDumpChanged:false,failedDatabasePreserved:raw,generatedValuesCaution:'pg_dump no conserva el valor almacenado de columnas GENERATED; se recalcula en destino. La igualdad de datos solo se verifica en estas fixtures, no en datos institucionales.'};
 }
 const restored=new Client(config(target));await restored.connect();
 try{
 const fingerprint=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'),a=(await source.query(fingerprint)).rows[0].fingerprint,b=(await restored.query(fingerprint)).rows[0].fingerprint;assert.equal(a,b);
 const tables=['core.users','core.students','billing.payments','gamification.xp_ledger','gamification.login_rewards','gamification.currency_wallets'];const rows=[];
 for(const table of tables){const sql="SELECT count(*)::int AS count,md5(COALESCE(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),'')) AS content_hash FROM "+table+' t';const left=(await source.query(sql)).rows[0],right=(await restored.query(sql)).rows[0];assert.deepEqual(right,left);rows.push({table,sourceRows:left.count,restoredRows:right.count,contentHashMatches:true});}
 h.write('seguridad/backup-local-restaurado.json',{executedAt:new Date().toISOString(),syntheticOnly:true,institutionalBackupCreated:false,institutionalRestorePerformed:false,sourceDatabase:src,restoredDatabase:target,format:'PostgreSQL custom archive',privateArchive:path.relative(h.root,file).replaceAll('\\','/'),bytes:dumped.stdout.length,sha256:crypto.createHash('sha256').update(dumped.stdout).digest('hex'),directRestoreExitCode:first.status,compatibility,sourceFingerprint:a,restoredFingerprint:b,tables:rows,scope:'Base local de ensayo con Auth minimo, no Supabase gestionado ni objetos Storage. Ningun registro institucional copiado.'});console.log(JSON.stringify({localBackupRestored:true,directRestoreExitCode:first.status,compatibilityUsed:!!compatibility,comparedTables:rows.length,institutionalBackupCreated:false}));
 }finally{await restored.end();}
 }finally{await source.end();await verified.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
