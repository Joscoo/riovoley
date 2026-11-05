'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs'),b=require('../../production/backup.cjs');
(async()=>{
 try{
 const verified=await require('../security/local-db.cjs').connect();await verified.end();
 const source=JSON.parse(fs.readFileSync(path.join(h.runtime,'production-migration/context.json'))).database;assert.match(source,/^riovoley_release_\d{14}$/);
 const {Client}=require(path.join(h.runtime,'sql-driver/node_modules/pg')),db=new Client({host:'127.0.0.1',port:55322,user:'postgres',password:process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',database:source,ssl:false});await db.connect();
 try{assert.equal((await db.query("SELECT shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()")).rows[0].marker,'RIOVOLEY isolated production-schema rehearsal; synthetic data only');}finally{await db.end();}
 const folder=path.join(h.runtime,'institutional-backup','synthetic-'+Date.now());fs.mkdirSync(folder);const phrase='synthetic-backup-recovery-only-123456';
 const identity=b.createIdentity(folder,phrase,b.tools());
 const env=b.pgEnvironment({host:'127.0.0.1',port:55322,database:source,username:'postgres',sslmode:'disable'},process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',b.tools().ca);
 const fingerprint='38434a2af96ad410967032b00a0828ac';
 assert.equal(b.checkFingerprint({expectedFingerprint:fingerprint,expectedServerMajor:17},env,b.tools()),fingerprint);
 assert.throws(()=>b.checkFingerprint({expectedFingerprint:'00000000000000000000000000000000',expectedServerMajor:17},env,b.tools()),e=>e.stage==='CATALOG_DRIFT');
 assert.throws(()=>b.checkFingerprint({expectedFingerprint:fingerprint,expectedServerMajor:18},env,b.tools()),e=>e.stage==='SOURCE_VERSION_OR_READONLY');
 const archived=await b.encryptDatabase(folder,env,identity),verifiedArchive=await b.verifyArchive(archived.file,identity,phrase);
 const recoveryHome=b.importRecovery(folder,identity,phrase);const recovered=await b.verifyArchive(archived.file,identity,phrase,b.tools(),recoveryHome);assert.equal(recovered.tocSha256,verifiedArchive.tocSha256);
 await assert.rejects((async()=>{const wrongHome=b.importRecovery(folder,identity,'incorrect-synthetic-passphrase-123456');await b.verifyArchive(archived.file,identity,'incorrect-synthetic-passphrase-123456',b.tools(),wrongHome);})(),e=>['RECOVERY_IMPORT_FAILED','ARCHIVE_VERIFICATION_FAILED'].includes(e.stage));
 const incompleteFolder=path.join(folder,'failed-dump');fs.mkdirSync(incompleteFolder);
 await assert.rejects(b.encryptDatabase(incompleteFolder,{...env,PGDATABASE:'riovoley_missing_synthetic_database'},identity),e=>e.stage==='DUMP_FAILED'&&e.exitCode!==0);
 const corrupted=path.join(folder,'corrupted.pgp'),bytes=fs.readFileSync(archived.file);bytes[Math.floor(bytes.length/2)]^=0x40;fs.writeFileSync(corrupted,bytes,{flag:'wx'});
 await assert.rejects(b.verifyArchive(corrupted,identity,phrase),e=>e.stage==='ARCHIVE_VERIFICATION_FAILED');
 h.write('integracion/backup-cifrado-entrega.json',{onlySynthetic:true,rsaBits:3072,sourceDatabase:source,archiveBytes:archived.bytes,sha256:crypto.createHash('sha256').update(fs.readFileSync(archived.file)).digest('hex'),recipientFingerprint:identity.fingerprint,dumpExitCode:archived.dumpExitCode,encryptionExitCode:archived.gpgExitCode,originalArchiveVerified:true,exportedRecoveryKeyVerified:true,corruptionRejected:true,wrongPassphraseRejected:true,failedDumpRejected:true,sourceCatalogCheckedReadOnly:true,wrongCatalogRejected:true,wrongServerMajorRejected:true,tocEntries:verifiedArchive.tocEntries,tocSha256:verifiedArchive.tocSha256,recoveryKeySha256:identity.recoveryKeySha256,rawDumpWritten:false,plaintextRowDataPublished:false,institutionalBackupPerformed:false});
 console.log(JSON.stringify({syntheticArchiveVerified:true,recoveryKeyVerified:true,corruptionRejected:true,tocEntries:verifiedArchive.tocEntries}));
 }catch(e){console.error(JSON.stringify({stage:e.stage||e.code||e.name,exitCode:e.exitCode??null}));process.exitCode=1;}
})();
