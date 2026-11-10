const fs=require('node:fs');
const path=require('node:path');
const h=require('./harness.cjs');
require('./safety.cjs').readLocal();
const destination=path.join(h.runtime,'stack/supabase/functions');
fs.cpSync(path.join(h.root,'supabase/functions'),destination,{recursive:true,filter:file=>!path.basename(file).startsWith('.env')});
const envFile=require('./evidence.cjs').emptyEdgeEnv(h.runtime);
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!/^SUPABASE_|^RESEND_|^FCM_|^WHATSAPP_/.test(key)));
h.run('edge-functions/serve',h.cli,['functions','serve','--workdir',path.join(h.runtime,'stack'),'--network-id','riovoley-e2e-loopback','--env-file',envFile],{env,privateOutput:true}).catch(e=>{console.error(e.message);process.exitCode=1;});
