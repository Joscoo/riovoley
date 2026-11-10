const {test}=require('node:test'),assert=require('node:assert/strict');
const {validateSource,pgEnvironment,gpgPath}=require('../../scripts/production/backup.cjs');
const valid={projectRef:'mayvvlkvheagkojunzzb',host:'db.mayvvlkvheagkojunzzb.supabase.co',port:5432,database:'postgres',username:'postgres',sslmode:'verify-full',expectedFingerprint:'15b9d9e869fb5113263c485714009878',expectedServerMajor:17};
test('acepta únicamente el proyecto directo esperado con TLS verificado',()=>assert.deepEqual(validateSource(valid),valid));
for(const [key,value] of [['host','db.other.supabase.co'],['port',6543],['database','other'],['username','other'],['sslmode','require'],['expectedFingerprint','']])test('rechaza destino o control incorrecto: '+key,()=>assert.throws(()=>validateSource({...valid,[key]:value})));
test('rechaza credenciales persistidas dentro de la configuración',()=>assert.throws(()=>validateSource({...valid,password:'synthetic'})));
test('convierte rutas Windows para el GnuPG MSYS instalado sin perder espacios',()=>assert.equal(gpgPath('D:\\Private Folder\\keyring'),'/d/Private Folder/keyring'));
test('no hereda opciones, contraseñas o conexiones PostgreSQL del proceso',()=>{
 const old={...process.env};try{Object.assign(process.env,{PGHOSTADDR:'untrusted',PGSERVICE:'untrusted',NODE_OPTIONS:'untrusted',FCM_PRIVATE_KEY:'synthetic-provider'});const env=pgEnvironment(valid,'synthetic-database-password','C:/synthetic-ca.crt');assert.equal(env.PGHOSTADDR,undefined);assert.equal(env.PGSERVICE,undefined);assert.equal(env.NODE_OPTIONS,undefined);assert.equal(env.FCM_PRIVATE_KEY,undefined);assert.equal(env.PGSSLMODE,'verify-full');assert.match(env.PGOPTIONS,/default_transaction_read_only=on/);assert.equal(env.PGPASSWORD,'synthetic-database-password');}finally{for(const k of Object.keys(process.env))if(!(k in old))delete process.env[k];Object.assign(process.env,old);}
});
