const path=require('node:path');
const fs=require('node:fs');
const crypto=require('node:crypto');
const h=require('./harness.cjs');
const {readLocal,buildWebEnv}=require('./safety.cjs');
const local=readLocal();
if(!local.piiEncryptionKey) {
  local.piiEncryptionKey=crypto.randomBytes(32).toString('base64url');
  fs.writeFileSync(path.join(h.runtime,'credentials.json'),JSON.stringify(local,null,2));
}
const env=buildWebEnv(local);
const buildName='web-build-'+Date.now();
env.BUILD_PATH=path.join(h.runtime,buildName);
h.run('compilacion-'+buildName,process.execPath,[path.join(h.root,'node_modules/react-scripts/scripts/build.js')],{env}).then(()=>{
  const current=readLocal();current.activeBuild=buildName;
  fs.writeFileSync(path.join(h.runtime,'credentials.json'),JSON.stringify(current,null,2));
}).catch(e=>{console.error(e.message);process.exitCode=1;});
