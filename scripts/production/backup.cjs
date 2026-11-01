'use strict';
// Credentials live in memory only. PostgreSQL bytes stream directly into GnuPG.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const {pipeline}=require('node:stream/promises');
const projectRef='mayvvlkvheagkojunzzb',root=path.resolve(__dirname,'../..');
class BackupError extends Error{constructor(stage,exitCode){super(stage);this.stage=stage;this.exitCode=exitCode;}}
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
async function shaFile(file){const hash=crypto.createHash('sha256');for await(const bytes of fs.createReadStream(file))hash.update(bytes);return hash.digest('hex');}
function validateSource(source){
 const fields=['projectRef','host','port','database','username','sslmode','expectedFingerprint','expectedServerMajor'];
 if(!source||Object.keys(source).some(k=>!fields.includes(k)))throw new BackupError('CONFIG_FIELDS');
 if(source.projectRef!==projectRef||source.host!=='db.'+projectRef+'.supabase.co'||source.port!==5432||source.database!=='postgres'||source.username!=='postgres'||source.sslmode!=='verify-full'||source.expectedServerMajor!==17||!/^[a-f0-9]{32}$/.test(source.expectedFingerprint||''))throw new BackupError('SOURCE_NOT_APPROVED');
 return source;
}
function baseEnvironment(){const out={};for(const k of ['PATH','Path','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','APPDATA','LOCALAPPDATA','HOME'])if(process.env[k])out[k]=process.env[k];return out;}
function pgEnvironment(source,password,ca){
 if(typeof password!=='string'||!password||password.includes('\0'))throw new BackupError('DATABASE_PASSWORD_MISSING');
 return {...baseEnvironment(),PGHOST:source.host,PGPORT:String(source.port),PGDATABASE:source.database,PGUSER:source.username,PGPASSWORD:password,PGSSLMODE:source.sslmode,PGSSLROOTCERT:ca,PGCONNECT_TIMEOUT:'10',PGCLIENTENCODING:'UTF8',PGOPTIONS:'-c default_transaction_read_only=on -c lock_timeout=5000 -c statement_timeout=300000'};
}
function tools(){const pg=path.join(root,'.e2e-local/backup-tools/postgres17');return {dump:path.join(pg,'pg_dump.exe'),restore:path.join(pg,'pg_restore.exe'),psql:path.join(pg,'psql.exe'),gpg:'C:/Program Files/Git/usr/bin/gpg.exe',ca:path.join(root,'.e2e-local/backup-tools/supabase-prod-ca-2021.crt')};}
function sync(stage,command,args,env,input){const r=cp.spawnSync(command,args,{env,input,windowsHide:true,maxBuffer:8*1024*1024,timeout:60000});if(r.status!==0)throw new BackupError(stage,r.status??r.error?.code);return r.stdout;}
function checkFingerprint(source,env,toolset){
 const query=fs.readFileSync(path.join(root,'scripts/audit/production/catalog-fingerprint.sql'),'utf8');
 const sql="BEGIN TRANSACTION READ ONLY;SET LOCAL search_path=public,extensions;SELECT (current_setting('server_version_num')::integer/10000)::text || ':' || current_setting('transaction_read_only');"+query+'ROLLBACK;';
 const output=sync('SOURCE_PREFLIGHT_FAILED',toolset.psql,['-X','-q','-A','-t','-v','ON_ERROR_STOP=1','--no-password','--command',sql],env).toString('utf8').trim();
 const lines=output.split(/\r?\n/);if(lines[0]!==source.expectedServerMajor+':on')throw new BackupError('SOURCE_VERSION_OR_READONLY');
 if(lines.length!==2||lines[1]!==source.expectedFingerprint)throw new BackupError('CATALOG_DRIFT');
 return lines[1];
}
function gpgPath(file){const p=file.replaceAll('\\','/');return /^[A-Za-z]:\//.test(p)?'/'+p[0].toLowerCase()+p.slice(2):p;}
function keyHome(){
 // MSYS agent sockets have a short path limit; keep homes outside long artifact paths.
 const home=path.join(root,'.e2e-local/gpg',crypto.randomBytes(8).toString('hex'));
 if(Buffer.byteLength(gpgPath(home)+'/S.gpg-agent.browser')>=100)throw new BackupError('GPG_SOCKET_PATH_TOO_LONG');
 fs.mkdirSync(home,{recursive:true});return home;
}
function gpgArguments(home,args){return ['--homedir',gpgPath(home),'--batch','--no-tty',...args];}
function createIdentity(folder,passphrase,toolset=tools(),bits=3072){
 if(typeof passphrase!=='string'||passphrase.length<20||/[\r\n\0]/.test(passphrase))throw new BackupError('RECOVERY_PASSPHRASE_REQUIRED');
 if(![2048,3072].includes(bits))throw new BackupError('KEY_SIZE');
 const home=keyHome();
 const env=baseEnvironment(),unlock=['--pinentry-mode','loopback','--passphrase-fd','0'];
 sync('KEY_GENERATION_FAILED',toolset.gpg,gpgArguments(home,[...unlock,'--quick-generate-key','RIOVOLEY encrypted backup','rsa'+bits,'encr','2y']),env,Buffer.from(passphrase+'\n'));
 const listed=sync('KEY_LIST_FAILED',toolset.gpg,gpgArguments(home,['--with-colons','--list-keys']),env).toString('utf8');
 const fingerprint=listed.split(/\r?\n/).find(l=>l.startsWith('fpr:'))?.split(':')[9];if(!/^[A-F0-9]{40}$/.test(fingerprint||''))throw new BackupError('KEY_FINGERPRINT_INVALID');
 const recoveryFile=path.join(folder,'recovery-key.asc');
 const secret=sync('RECOVERY_EXPORT_FAILED',toolset.gpg,gpgArguments(home,[...unlock,'--armor','--export-secret-keys',fingerprint]),env,Buffer.from(passphrase+'\n'));
 fs.writeFileSync(recoveryFile,secret,{flag:'wx'});
 const publicFile=path.join(folder,'recipient.asc');fs.writeFileSync(publicFile,sync('PUBLIC_EXPORT_FAILED',toolset.gpg,gpgArguments(home,['--armor','--export',fingerprint]),env),{flag:'wx'});
 return {home,fingerprint,recoveryFile,publicFile,recoveryKeySha256:sha(secret)};
}
function launch(command,args,env){
 const child=cp.spawn(command,args,{env,windowsHide:true});const stderr=[];let count=0;
 child.stderr.on('data',b=>{if(count<1024*1024){stderr.push(b);count+=b.length;}});
 const closed=new Promise(resolve=>{child.once('error',e=>resolve({code:e.code,stderr:Buffer.concat(stderr)}));child.once('close',(code,signal)=>resolve({code,signal,stderr:Buffer.concat(stderr)}));});
 return {child,closed};
}
async function encryptDatabase(folder,env,identity,toolset=tools()){
 const file=path.join(folder,'database.incomplete.pgp');
 const dump=launch(toolset.dump,['--format=custom','--no-password','--lock-wait-timeout=5000'],env);
 const encrypt=launch(toolset.gpg,gpgArguments(identity.home,['--trust-model','always','--cipher-algo','AES256','--recipient',identity.fingerprint,'--encrypt']),baseEnvironment());
 const streams=await Promise.allSettled([pipeline(dump.child.stdout,encrypt.child.stdin),pipeline(encrypt.child.stdout,fs.createWriteStream(file,{flags:'wx'}))]);
 const [a,b]=await Promise.all([dump.closed,encrypt.closed]);
 if(a.code!==0||b.code!==0||streams.some(r=>r.status==='rejected'))throw new BackupError(a.code!==0?'DUMP_FAILED':'ENCRYPTION_FAILED',a.code!==0?a.code:b.code);
 return {file,dumpExitCode:a.code,gpgExitCode:b.code,bytes:fs.statSync(file).size};
}
async function verifyArchive(file,identity,passphrase,toolset=tools(),home=identity.home){
 const decrypt=launch(toolset.gpg,gpgArguments(home,['--pinentry-mode','loopback','--passphrase-fd','0','--decrypt',gpgPath(file)]),baseEnvironment());
 const inspect=launch(toolset.restore,['--list'],baseEnvironment());const output=[];let size=0;
 inspect.child.stdout.on('data',b=>{if(size<16*1024*1024){output.push(b);size+=b.length;}});
 decrypt.child.stdin.end(Buffer.from(passphrase+'\n'));
 // pg_restore --list may close stdin after the TOC. Continue draining GnuPG
 // so integrity verification reaches the end of the encrypted message.
 let streamError=null;
 const drained=new Promise(resolve=>{decrypt.child.stdout.once('end',resolve);decrypt.child.stdout.once('error',e=>{streamError=e;resolve();});});
 const drain=()=>{decrypt.child.stdout.unpipe(inspect.child.stdin);decrypt.child.stdout.resume();};
 inspect.child.stdin.on('error',e=>{if(e.code!=='EPIPE')streamError=e;drain();});inspect.child.stdin.once('close',drain);
 decrypt.child.stdout.pipe(inspect.child.stdin);const [a,b]=await Promise.all([decrypt.closed,inspect.closed,drained]);
 if(a.code!==0||b.code!==0||streamError)throw new BackupError('ARCHIVE_VERIFICATION_FAILED',a.code!==0?a.code:b.code);
 const toc=Buffer.concat(output).toString('utf8');if(!toc.includes('dbname:')||!toc.includes('TABLE DATA'))throw new BackupError('ARCHIVE_CONTENTS_INVALID');
 return {decryptExitCode:a.code,pgRestoreListExitCode:b.code,tocSha256:sha(Buffer.concat(output)),tocEntries:toc.split(/\r?\n/).filter(l=>/^\d+;/.test(l)).length};
}
function importRecovery(folder,identity,passphrase,toolset=tools()){
 const home=keyHome();
 sync('RECOVERY_IMPORT_FAILED',toolset.gpg,gpgArguments(home,['--pinentry-mode','loopback','--passphrase-fd','0','--import',gpgPath(identity.recoveryFile)]),baseEnvironment(),Buffer.from(passphrase+'\n'));return home;
}
async function createProductionBackup(password,passphrase){
 const base=path.join(root,'.e2e-local/institutional-backup'),source=validateSource(JSON.parse(fs.readFileSync(path.join(__dirname,'backup-source.json'),'utf8'))),toolset=tools();
 if(!passphrase||passphrase.length<20)throw new BackupError('RECOVERY_PASSPHRASE_REQUIRED');
 const env=pgEnvironment(source,password,toolset.ca);const fingerprint=checkFingerprint(source,env,toolset);
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15)+'-'+crypto.randomBytes(4).toString('hex');
 const folder=path.join(base,'artifacts',stamp);fs.mkdirSync(folder,{recursive:true});
 const identity=createIdentity(folder,passphrase,toolset);
 let receipt={startedAt:new Date().toISOString(),projectRef,mode:'institutional',sourceFingerprint:fingerprint,recipientFingerprint:identity.fingerprint,status:'IN_PROGRESS',secretsRecorded:false};
 fs.writeFileSync(path.join(folder,'receipt.json'),JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
 try{
  const archived=await encryptDatabase(folder,env,identity,toolset),verification=await verifyArchive(archived.file,identity,passphrase,toolset);
  const recoveryHome=importRecovery(folder,identity,passphrase,toolset);await verifyArchive(archived.file,identity,passphrase,toolset,recoveryHome);
  const finalFile=path.join(folder,'database.pgp');fs.renameSync(archived.file,finalFile);
  receipt={...receipt,finishedAt:new Date().toISOString(),status:'ENCRYPTED_LOGICAL_ARCHIVE_VERIFIED',archive:finalFile,bytes:archived.bytes,sha256:await shaFile(finalFile),recoveryKey:identity.recoveryFile,recoveryKeySha256:identity.recoveryKeySha256,...verification,independentRecoveryKeyVerified:true,isolatedDatabaseRestorePerformed:false,storageObjectsIncluded:false,globalRolesIncluded:false};
 }catch(e){receipt={...receipt,finishedAt:new Date().toISOString(),status:'FAILED_INCOMPLETE_ARTIFACT_PRESERVED',failureStage:e.stage||'UNEXPECTED_ERROR',toolExitCode:e.exitCode??null};throw e;
 }finally{delete env.PGPASSWORD;fs.writeFileSync(path.join(folder,'receipt.json'),JSON.stringify(receipt,null,2)+'\n');}
 return receipt;
}
if(require.main===module){
 if(process.argv.length!==3||process.argv[2]!=='--create'){console.error('Usar el asistente PowerShell; no se aceptan credenciales en argumentos.');process.exitCode=2;}
 else createProductionBackup(process.env.RIOVOLEY_DATABASE_PASSWORD,process.env.RIOVOLEY_BACKUP_PASSPHRASE).then(r=>console.log(JSON.stringify({status:r.status,receipt:path.join(path.dirname(r.archive),'receipt.json'),isolatedRestorePending:true}))).catch(e=>{console.error(JSON.stringify({status:'NOT_COMPLETED',stage:e.stage||'TOOLING_ERROR',toolExitCode:e.exitCode??null,rawDiagnosticsPublished:false}));process.exitCode=1;}).finally(()=>{delete process.env.RIOVOLEY_DATABASE_PASSWORD;delete process.env.RIOVOLEY_BACKUP_PASSPHRASE;});
}
module.exports={validateSource,pgEnvironment,baseEnvironment,checkFingerprint,createIdentity,encryptDatabase,verifyArchive,importRecovery,tools,BackupError,createProductionBackup,gpgPath};
