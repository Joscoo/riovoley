const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const {environment}=require('./environment.cjs');
(async()=>{
 const {env,sdk}=environment();
 await h.run('android/dispositivos-iniciales',path.join(sdk,'platform-tools/adb.exe'),['devices','-l'],{env,timeoutMs:15000});
 const db=await require('../security/local-db.cjs').connect();
 try {
  const r=await db.query('SELECT current_database() AS database, version() AS version');
  h.write('android/backend-local-verificado.json',{localIdentityVerified:true,endpoint:'http://127.0.0.1:55321',database:r.rows[0]});
 } finally {await db.end();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
