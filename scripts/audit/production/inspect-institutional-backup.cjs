'use strict';
// Private inspection only: no row output, no database connection, no plaintext dump file.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const b=require('../../production/backup.cjs'),root=path.resolve(__dirname,'../../..'),runtime=path.join(root,'.e2e-local');
const sha=buf=>crypto.createHash('sha256').update(buf).digest('hex'),read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
function main(){
 const folder=path.join(runtime,'institutional-backup/artifacts/20261101-025806-728619b0'),receipt=read(path.join(folder,'receipt.json'));
 assert.equal(receipt.status,'ENCRYPTED_LOGICAL_ARCHIVE_VERIFIED','RECEIPT_STATUS');assert.equal(receipt.projectRef,'mayvvlkvheagkojunzzb','RECEIPT_PROJECT');
 assert.equal(path.resolve(receipt.archive),path.join(folder,'database.pgp'),'ARCHIVE_LOCATION');assert.equal(sha(fs.readFileSync(receipt.archive)),receipt.sha256,'ARCHIVE_HASH');assert.equal(sha(fs.readFileSync(receipt.recoveryKey)),receipt.recoveryKeySha256,'KEY_HASH');
 const privateDir=path.join(runtime,'institutional-restore');fs.mkdirSync(privateDir,{recursive:true});
 let home=null;for(const entry of fs.readdirSync(path.join(runtime,'gpg'),{withFileTypes:true}).filter(e=>e.isDirectory())){
  const candidate=path.join(runtime,'gpg',entry.name),list=cp.spawnSync(b.tools().gpg,['--homedir',b.gpgPath(candidate),'--batch','--no-tty','--with-colons','--list-secret-keys',receipt.recipientFingerprint],{env:b.baseEnvironment(),windowsHide:true,timeout:10000});
  if(list.status===0&&list.stdout.toString().includes(receipt.recipientFingerprint)){home=candidate;break;}
 }
 assert.ok(home,'PRIVATE_KEY_HOME_NOT_FOUND');
 const decrypted=cp.spawnSync(b.tools().gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty','--pinentry-mode','error','--decrypt',b.gpgPath(receipt.archive)],{env:b.baseEnvironment(),windowsHide:true,maxBuffer:64*1024*1024,timeout:60000});
 if(decrypted.status!==0){console.log(JSON.stringify({archiveHashVerified:true,recoveryKeyHashVerified:true,status:'LOCAL_RECOVERY_PHRASE_REQUIRED',rawDiagnosticsPublished:false}));process.exitCode=2;return;}
 const run=args=>{const r=cp.spawnSync(b.tools().restore,args,{env:b.baseEnvironment(),input:decrypted.stdout,windowsHide:true,maxBuffer:32*1024*1024,timeout:60000});if(r.status!==0){const diagnostic=r.stderr.toString('utf8');throw new Error(/either.*-d.*-f|one of.*-d.*-f/.test(diagnostic)?'PG_RESTORE_OUTPUT_REQUIRED':'ARCHIVE_INSPECTION_FAILED');}return r.stdout;};
 const toc=run(['--list']).toString('utf8'),schema=run(['--schema-only','--file=-']);
 fs.writeFileSync(path.join(privateDir,'archive.list'),toc,{flag:'wx'});fs.writeFileSync(path.join(privateDir,'schema.private.sql'),schema,{flag:'wx'});
 fs.writeFileSync(path.join(privateDir,'inspection.json'),JSON.stringify({receipt:path.relative(root,path.join(folder,'receipt.json')),keyHome:path.relative(root,home),archiveSha256:receipt.sha256,schemaSha256:sha(schema),tocSha256:sha(Buffer.from(toc)),inspectedAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});
 const entries=toc.split(/\r?\n/).filter(l=>/^\d+;/.test(l));
 console.log(JSON.stringify({archiveHashVerified:true,recoveryKeyHashVerified:true,decryptionExitCode:decrypted.status,archiveBytes:receipt.bytes,tocEntries:entries.length,privateSchemaPrepared:true,plaintextDumpWritten:false,databaseRestorePerformed:false}));
}
try{main();}catch(e){const label=e.message?.split('\n')[0];console.error(JSON.stringify({stage:/^[A-Z_]+$/.test(label)?label:e.code||'INSPECTION_FAILED',rawDiagnosticsPublished:false}));process.exitCode=1;}
