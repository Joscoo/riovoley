const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const binary=path.join(h.runtime,'deno-tool/node_modules/@deno/win32-x64/deno.exe');
h.run('integracion/deno-typecheck',binary,['check','--no-config','supabase/functions/_core/auth-admin/application/require-active-staff.ts','supabase/functions/_core/auth-admin/infrastructure/supabase-auth-admin-gateway.ts','supabase/functions/delete-auth-user/index.ts','supabase/functions/send-push/index.ts'],{env:{...process.env,DENO_DIR:path.join(h.runtime,'deno-cache'),DENO_NO_PROMPT:'1'},allowFailure:true,timeoutMs:180000}).then(r=>{process.exitCode=r.exitCode??1;});
