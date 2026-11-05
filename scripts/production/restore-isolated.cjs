'use strict';
// No Cloud credentials or URLs accepted. Institutional rows never enter public evidence.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const b=require('./backup.cjs'),safety=require('../e2e/local/safety.cjs'),root=safety.root,runtime=safety.runtime;
const image='sha256:c141fd17ac6a76c4323e90b3aee8ff1a23d2e89e547c2b963cfadc309c079cc2';
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex'),qi=name=>'"'+name.replaceAll('"','""')+'"';
function assertIsolated(info,name){
 assert.match(name,/^riovoley-restore-[a-z0-9-]+$/);assert.equal(info.Name,'/'+name);
 assert.equal(info.Config.Labels['riovoley.audit.scope'],'institutional-restore');assert.equal(info.HostConfig.NetworkMode,'none');assert.equal(info.HostConfig.LogConfig.Type,'none');
 assert.equal(Object.keys(info.HostConfig.PortBindings||{}).length,0);assert.equal(Object.keys(info.NetworkSettings.Ports||{}).length,0);
 assert.ok(info.HostConfig.Tmpfs?.['/restore']);assert.ok((info.Mounts||[]).every(m=>m.Type==='tmpfs'));return true;
}
function compatibleToc(toc){
 const lines=toc.split(/\r?\n/),omitted=lines.filter(l=>/^\d+;.* FUNCTION public calculate_age\(date\) postgres$/.test(l));assert.equal(omitted.length,1,'CALCULATE_AGE_TOC_AMBIGUOUS');
 return {text:lines.map(l=>omitted.includes(l)?'; '+l:l).join('\n'),omitted};
}
function requiredRoles(schema){
 schema=schema.replaceAll('\r\n','\n');
 const roles=new Set([...schema.matchAll(/^ALTER .* OWNER TO ([a-z_][a-z0-9_]*);$/gm)].map(m=>m[1]));
 for(const m of schema.matchAll(/^(?:GRANT .* TO|REVOKE .* FROM) ([a-z_][a-z0-9_, ]*);$/gm))for(const part of m[1].split(','))roles.add(part.trim());
 roles.delete('postgres');roles.delete('public');return [...roles].sort();
}
function ageDefinition(schema){const definition=schema.replaceAll('\r\n','\n').match(/CREATE FUNCTION public\.calculate_age\(birthdate date\)[\s\S]*?\bAS (\$[A-Za-z0-9_]*\$)[\s\S]*?\1;/)?.[0];assert.ok(definition,'CALCULATE_AGE_DEFINITION_MISSING');return definition;}
function execute(args,input){return cp.spawnSync('docker',safety.dockerArgs(args),{env:safety.localDockerEnv(b.baseEnvironment()),windowsHide:true,input,maxBuffer:64*1024*1024,timeout:120000});}
function verifyReceipt(folder){
 const expected=path.join(runtime,'institutional-backup/artifacts/20261101-025806-728619b0');assert.equal(folder,expected);
 const receipt=JSON.parse(fs.readFileSync(path.join(folder,'receipt.json'),'utf8'));assert.equal(receipt.status,'ENCRYPTED_LOGICAL_ARCHIVE_VERIFIED');assert.equal(receipt.projectRef,'mayvvlkvheagkojunzzb');assert.equal(path.resolve(receipt.archive),path.join(folder,'database.pgp'));assert.equal(sha(fs.readFileSync(receipt.archive)),receipt.sha256);return receipt;
}
async function restore(){
 const dir=path.join(runtime,'institutional-restore'),ctx=JSON.parse(fs.readFileSync(path.join(dir,'context.json'),'utf8')),inspection=JSON.parse(fs.readFileSync(path.join(dir,'inspection.json'),'utf8'));
 const h=require('../e2e/local/harness.cjs');assert.equal(h.evidence,ctx.evidence);assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')));
 const receipt=verifyReceipt(path.join(runtime,'institutional-backup/artifacts/20261101-025806-728619b0'));
 assert.equal(inspection.archiveSha256,receipt.sha256);const home=path.resolve(root,inspection.keyHome);assert.ok(home.startsWith(path.join(runtime,'gpg')+path.sep));
 const schema=fs.readFileSync(path.join(dir,'schema.private.sql'),'utf8'),toc=fs.readFileSync(path.join(dir,'archive.list'),'utf8');assert.equal(sha(Buffer.from(schema)),inspection.schemaSha256);assert.equal(sha(Buffer.from(toc)),inspection.tocSha256);
 // Cached local agent only; no pinentry window and no password in args or logs.
 const unlocked=cp.spawnSync(b.tools().gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty','--pinentry-mode','error','--decrypt',b.gpgPath(receipt.archive)],{env:b.baseEnvironment(),windowsHide:true,maxBuffer:64*1024*1024,timeout:60000});
 if(unlocked.status!==0)throw new b.BackupError('LOCAL_RECOVERY_PHRASE_REQUIRED',unlocked.status);
 const inventory=execute(['container','ls','-a','--format','{{.Names}}']);assert.equal(inventory.status,0,'DOCKER_LOCAL_UNAVAILABLE');const existing=new Set(inventory.stdout.toString('utf8').trim().split(/\r?\n/));
 let name;for(let attempt=1;attempt<=9;attempt++){const candidate=ctx.container+'-'+String(attempt).padStart(2,'0');if(!existing.has(candidate)){name=candidate;break;}}assert.ok(name,'NEW_TARGET_REQUIRED');assert.match(name,/^riovoley-restore-[a-z0-9-]+$/);
 const privateRun=path.join(dir,name);fs.mkdirSync(privateRun,{recursive:false});
 const diagnostic=(label,bytes)=>{if(!bytes.length)return;const r=cp.spawnSync(b.tools().gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty','--trust-model','always','--recipient',receipt.recipientFingerprint,'--encrypt'],{env:b.baseEnvironment(),windowsHide:true,input:bytes,maxBuffer:64*1024*1024});if(r.status===0)fs.writeFileSync(path.join(privateRun,label+'.stderr.pgp'),r.stdout,{flag:'wx'});};
 const run=(label,args,input)=>{const started=new Date(),r=execute(args,input);h.write('integracion/'+label+'.meta.json',{command:['docker',...args],startedAt:started.toISOString(),finishedAt:new Date().toISOString(),durationSeconds:(Date.now()-started)/1000,exitCode:r.status,signal:r.signal,stdoutBytes:r.stdout?.length||0,stderrBytes:r.stderr?.length||0,inputRecorded:false,rawOutputPublished:false});if(r.status!==0){diagnostic(label,r.stderr||Buffer.alloc(0));const text=r.stderr?.toString('utf8')||'';const category=/generation expression is not immutable/.test(text)?'GENERATED_VOLATILITY':/does not exist/.test(text)?'MISSING_DATABASE_OBJECT':/already exists/.test(text)?'DUPLICATE_DATABASE_OBJECT':/must be loaded via shared_preload_libraries/.test(text)?'EXTENSION_PRELOAD':/permission denied/.test(text)?'PERMISSION_DENIED':'NATIVE_TOOL_FAILURE';throw new b.BackupError(label+'_'+category,r.status);}return r.stdout;};
 run('destino-crear',['run','-d','--name',name,'--network','none','--log-driver','none','--label','riovoley.audit.scope=institutional-restore','--tmpfs','/restore:rw,noexec,nosuid,size=1g,mode=1777','--entrypoint','/usr/bin/tail',image,'-f','/dev/null']);
 const info=JSON.parse(run('aislamiento-inspeccionar',['inspect',name]))[0];assertIsolated(info,name);
 h.write('seguridad/aislamiento-destino.json',{container:name,imageDigest:image,networkMode:info.HostConfig.NetworkMode,publishedPorts:0,hostBindMounts:0,logDriver:info.HostConfig.LogConfig.Type,pgdata:'tmpfs:/restore/pgdata',supabaseServicesStarted:false,productionConnectionsConfigured:false});
 run('cluster-inicializar',['exec','--user','postgres',name,'initdb','-D','/restore/pgdata','-A','trust','--locale=C.UTF-8','--encoding=UTF8']);
 run('postgres-iniciar',['exec','-d','--user','postgres',name,'postgres','-D','/restore/pgdata','-c','listen_addresses=','-c','unix_socket_directories=/tmp','-c','shared_preload_libraries=pg_cron,pg_net','-c','cron.launch_active_jobs=off','-c','max_worker_processes=0','-c','log_min_messages=panic','-c','log_min_error_statement=panic']);
 let ready=false;for(let attempt=0;attempt<30;attempt++){if(execute(['exec','--user','postgres',name,'pg_isready','-h','/tmp','-d','postgres']).status===0){ready=true;break;}await new Promise(resolve=>setTimeout(resolve,200));}assert.ok(ready,'LOCAL_DATABASE_NOT_READY');
 const sql=(label,text)=>run(label,['exec','-i','--user','postgres',name,'psql','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-h','/tmp','-d','postgres'],Buffer.from(text));
 const roles=requiredRoles(schema),sourceRoles=JSON.parse(fs.readFileSync(path.join(dir,'source-roles.json'),'utf8'));
 assert.deepEqual(sourceRoles.filter(r=>r.rolsuper).map(r=>r.rolname),['supabase_admin'],'SOURCE_SUPERUSER_CHANGED');
 sql('roles-destino',roles.map(name=>{const role=sourceRoles.find(r=>r.rolname===name);assert.ok(role,'SOURCE_ROLE_MISSING');const flags=[['rolsuper','SUPERUSER','NOSUPERUSER'],['rolinherit','INHERIT','NOINHERIT'],['rolcreaterole','CREATEROLE','NOCREATEROLE'],['rolcreatedb','CREATEDB','NOCREATEDB'],['rolreplication','REPLICATION','NOREPLICATION'],['rolbypassrls','BYPASSRLS','NOBYPASSRLS']].map(([key,yes,no])=>role[key]?yes:no);return 'CREATE ROLE '+qi(name)+' NOLOGIN '+flags.join(' ')+';';}).join('\n'));
 h.write('seguridad/bootstrap-roles.json',{checkedAt:new Date().toISOString(),source:'Catalogo institucional pg_roles de solo lectura; sin contrasenas',roles:sourceRoles,sourceGlobalPasswordsIncluded:false,membershipsRestored:false,targetLoginDisabledExceptRestoreOperator:true,localRestoreOperatorRemainsSuperuser:true,productionChanged:false});
 const adaptation=compatibleToc(toc),age=ageDefinition(schema);
 sql('compatibilidad-preparar',age.replace('LANGUAGE sql','LANGUAGE sql IMMUTABLE'));
 run('toc-destino',['exec','-i',name,'tee','/restore/archive.list'],Buffer.from(adaptation.text));
 run('restauracion-compatible',['exec','-i','--user','postgres',name,'pg_restore','--exit-on-error','--use-list=/restore/archive.list','-h','/tmp','--dbname=postgres'],unlocked.stdout);
 sql('funcion-original-recuperar',age.replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION'));
 const fp=sql('catalogo-destino',"BEGIN READ ONLY;SET LOCAL search_path=public,extensions;"+fs.readFileSync(path.join(root,'scripts/audit/production/catalog-fingerprint.sql'),'utf8')+'ROLLBACK;').toString('utf8').trim();
 const health=JSON.parse(sql('controles-destino',"BEGIN READ ONLY;SELECT json_build_object('version',current_setting('server_version'),'listen',current_setting('listen_addresses'),'workers',current_setting('max_worker_processes'),'cronActive',current_setting('cron.launch_active_jobs'),'tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname NOT IN ('pg_catalog','information_schema')));ROLLBACK;").toString('utf8').trim());
 const outcome={completedAt:new Date().toISOString(),archiveSha256:receipt.sha256,container:name,restoreExitCode:0,sourcePreflightFingerprint:receipt.sourceFingerprint,restoredFingerprint:fp,catalogMatchesSourcePreflight:fp===receipt.sourceFingerprint,compatibility:{omittedTocEntries:adaptation.omitted.length,sourceArchiveChanged:false,sourceDatabaseChanged:false,originalFunctionDefinitionRestored:true,generatedValuesRecomputed:true},bootstrapRoles:{count:roles.length,globalRoleAttributesAndMembershipsRestored:false},health,storageObjectsRestored:false,managedSupabaseRecoveryVerified:false};
 fs.writeFileSync(path.join(privateRun,'result.json'),JSON.stringify(outcome,null,2)+'\n',{flag:'wx'});h.write('integracion/restauracion-institucional.json',outcome);require('./restore-guards.cjs').assertCatalog(receipt.sourceFingerprint,fp);console.log(JSON.stringify({restoreCompleted:true,container:name,catalogMatches:outcome.catalogMatchesSourcePreflight,managedSupabaseRecoveryVerified:false}));
}
if(require.main===module)restore().catch(e=>{console.error(JSON.stringify({stage:e.stage||e.message?.split('\n')[0]?.match(/^[A-Z_]+$/)?.[0]||e.code||'RESTORE_FAILED',toolExitCode:e.exitCode??null,errorType:e.name,frames:(e.stack||'').split('\n').filter(line=>/^\s+at /.test(line)).slice(0,3),rawDiagnosticsPublished:false}));process.exitCode=1;});
module.exports={assertIsolated,compatibleToc,requiredRoles,ageDefinition,restore};
