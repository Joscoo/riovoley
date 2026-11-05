'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),crypto=require('node:crypto'),b=require('./backup.cjs'),m=require('./scheduler-secret.cjs');
const root=path.resolve(__dirname,'../..'),runtime=path.join(root,'.e2e-local'),hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function protectValue(value,folder,env=b.baseEnvironment()){
 m.envPayload(value);assert.ok(path.resolve(folder).startsWith(runtime+path.sep),'PRIVATE_PROTECTION_DIRECTORY_REQUIRED');
 const bytes=Buffer.from(JSON.stringify({project:m.project,name:m.name,value,createdAt:new Date().toISOString()}));
 try{
  const r=cp.spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'protect-scheduler.ps1')],{input:bytes,env,windowsHide:true,encoding:'utf8',timeout:15000});assert.equal(r.status,0,'DPAPI_PROTECTION_FAILED');const protectedData=JSON.parse(r.stdout);assert.equal(protectedData.roundTripMatches,true,'DPAPI_ROUNDTRIP_FAILED');fs.writeFileSync(path.join(folder,'scheduler.dpapi'),Buffer.from(protectedData.ciphertext,'base64'),{flag:'wx'});
  const backup=JSON.parse(fs.readFileSync(path.join(runtime,'institutional-backup/artifacts/20261101-025806-728619b0/receipt.json')));assert.equal(backup.projectRef,m.project,'BACKUP_PROJECT_MISMATCH');assert.equal(hash(fs.readFileSync(backup.recoveryKey)),backup.recoveryKeySha256,'RECOVERY_KEY_CHANGED');const home=b.keyHome(),gpg=b.tools().gpg,run=args=>{const x=cp.spawnSync(gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty',...args],{env,windowsHide:true,encoding:'utf8',timeout:15000});assert.equal(x.status,0,'PUBLIC_RECIPIENT_IMPORT_FAILED');return x.stdout;};
  run(['--import',b.gpgPath(path.join(path.dirname(backup.archive),'recipient.asc'))]);const fpr=run(['--with-colons','--list-keys']).split(/\r?\n/).filter(x=>x.startsWith('fpr:')).map(x=>x.split(':')[9]);assert.ok(fpr.includes(backup.recipientFingerprint),'RECIPIENT_MISMATCH');
  const encrypted=cp.spawnSync(gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty','--trust-model','always','--cipher-algo','AES256','--recipient',backup.recipientFingerprint,'--encrypt'],{input:bytes,env,windowsHide:true,timeout:15000,maxBuffer:1024*1024});assert.equal(encrypted.status,0,'GPG_PROTECTION_FAILED');assert.ok(encrypted.stdout.length>0&&!encrypted.stdout.includes(Buffer.from(value)),'CIPHERTEXT_INVALID');fs.writeFileSync(path.join(folder,'scheduler.pgp'),encrypted.stdout,{flag:'wx'});
  return {protected:true,dpapiRoundTripVerified:true,gpgRecipientMatchesExistingBackup:true,gpgCiphertextCreated:true,gpgRecoveryDecryptionExecuted:false};
 }finally{bytes.fill(0);}
}
module.exports={protectValue};
