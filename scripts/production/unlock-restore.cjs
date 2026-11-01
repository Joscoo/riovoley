'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),b=require('./backup.cjs');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'.e2e-local/institutional-restore');
async function unlock(){
 const h=require('../e2e/local/harness.cjs');if(fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')))throw new b.BackupError('NEW_EVIDENCE_REQUIRED');
 const file=path.join(dir,'inspection.json'),inspection=JSON.parse(fs.readFileSync(file,'utf8')),folder=path.join(root,'.e2e-local/institutional-backup/artifacts/20261101-025806-728619b0'),receipt=JSON.parse(fs.readFileSync(path.join(folder,'receipt.json'),'utf8'));
 if(receipt.status!=='ENCRYPTED_LOGICAL_ARCHIVE_VERIFIED'||receipt.projectRef!=='mayvvlkvheagkojunzzb'||path.resolve(receipt.archive)!==path.join(folder,'database.pgp'))throw new b.BackupError('WRONG_BACKUP');
 const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(sha(receipt.archive)!==receipt.sha256||sha(receipt.recoveryKey)!==receipt.recoveryKeySha256)throw new b.BackupError('BACKUP_HASH_MISMATCH');
 const phrase=process.env.RIOVOLEY_RESTORE_PASSPHRASE;if(!phrase||phrase.length<20)throw new b.BackupError('RECOVERY_PASSPHRASE_REQUIRED');
 const identity={fingerprint:receipt.recipientFingerprint,recoveryFile:receipt.recoveryKey};const home=b.importRecovery(dir,identity,phrase);
 let verified;try{verified=await b.verifyArchive(receipt.archive,{...identity,home},phrase);}catch(e){
  const probe=cp.spawnSync(b.tools().gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty','--pinentry-mode','loopback','--passphrase-fd','0','--decrypt',b.gpgPath(receipt.archive)],{env:b.baseEnvironment(),input:Buffer.from(phrase+'\n'),stdio:['pipe','ignore','pipe'],windowsHide:true,timeout:60000,maxBuffer:1024*1024});
  const category=probe.status===0?'POSTGRES_ARCHIVE_INSPECTION_FAILED':require('./restore-guards.cjs').diagnosticCategory(probe.stderr?.toString('utf8')||'');
  h.write('seguridad/desbloqueo-fallido.json',{checkedAt:new Date().toISOString(),category,gpgExitCode:probe.status,archiveHashMatches:true,recoveryKeyHashMatches:true,phraseRecorded:false,rawErrorPublished:false});throw new b.BackupError(category,probe.status);
 }if(verified.tocSha256!==inspection.tocSha256)throw new b.BackupError('ARCHIVE_TOC_MISMATCH');
 fs.copyFileSync(file,path.join(dir,'inspection-before-unlock-'+Date.now()+'.json'),fs.constants.COPYFILE_EXCL);fs.writeFileSync(file,JSON.stringify({...inspection,keyHome:path.relative(root,home),lastUnlockedAt:new Date().toISOString()},null,2)+'\n');
 h.write('seguridad/recuperacion-clave-renovada.json',{checkedAt:new Date().toISOString(),archiveHashMatches:true,recoveryKeyHashMatches:true,decryptExitCode:verified.decryptExitCode,pgRestoreListExitCode:verified.pgRestoreListExitCode,phraseRecorded:false,productionContacted:false});
 const result=require('../audit/production/inspect-restore-error.cjs').diagnose(home);h.write('seguridad/diagnosticos-restauracion.json',result);
 console.log(JSON.stringify({status:'LOCAL_KEY_UNLOCKED',diagnosticsSaved:true,phraseRecorded:false,institutionalDatabaseChanged:false}));
}
if(require.main===module)unlock().catch(e=>{console.error(JSON.stringify({stage:e.stage||e.code||'LOCAL_UNLOCK_FAILED',toolExitCode:e.exitCode??null,rawDiagnosticsPublished:false}));process.exitCode=1;}).finally(()=>{delete process.env.RIOVOLEY_RESTORE_PASSPHRASE;});
module.exports={unlock};
