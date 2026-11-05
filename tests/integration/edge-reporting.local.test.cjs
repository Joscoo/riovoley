const {test,before}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const nativeFetch=globalThis.fetch,{local,admin,ok,fixture}=require('./local-fixture.cjs'),{createClient}=require('@supabase/supabase-js');
let adminToken,suspendedAdminToken,suspendedTrainerToken,athleteToken,runId,storedArtifact;
const code='audit_roster_'+crypto.randomBytes(8).toString('hex'),today=new Date().toISOString().slice(0,10);
const post=(name,token,body={})=>{assert.ok(['generate-report','delete-report-run','send-payment-reminders'].includes(name));return nativeFetch('http://127.0.0.1:6162/'+name,{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body),redirect:'error'});};
before(async()=>{
 const roles=[['administrador',false],['administrador',true],['entrenador',true],['estudiante',false]],tokens=[];
 for(const [role,suspended] of roles){const f=await fixture();ok(await admin.from('users').update({role,suspended}).eq('id',f.user.id));const client=createClient(local.apiUrl,local.anonKey,{auth:{persistSession:false,autoRefreshToken:false}});tokens.push(ok(await client.auth.signInWithPassword({email:f.email,password:f.password})).session.access_token);}
 [adminToken,suspendedAdminToken,suspendedTrainerToken,athleteToken]=tokens;
 const buckets=ok(await admin.storage.listBuckets());if(!buckets.some(b=>b.name==='reports'))ok(await admin.storage.createBucket('reports',{public:false}));
 const db=await require('../../scripts/audit/security/local-db.cjs').connect();
 try{await db.query("INSERT INTO reporting.report_definitions(code,name,renderer,source_kind,timezone,is_active) VALUES($1,'Ensayo local','pdf','student_roster_snapshot','America/Guayaquil',true)",[code]);}finally{await db.end();}
});
test('R01: generar reporte sin sesión devuelve401',async()=>assert.equal((await post('generate-report',null)).status,401));
test('R02: administrador suspendido no genera ni crea ejecuciones',async()=>{const r=await post('generate-report',suspendedAdminToken,{report_code:code,period_start:today,period_end:today});assert.equal(r.status,403);assert.equal((await r.json()).code,'ACCOUNT_SUSPENDED');assert.equal(ok(await admin.from('report_runs').select('id').eq('report_code',code)).length,0);});
test('R03: entrenador suspendido no genera reportes',async()=>assert.equal((await post('generate-report',suspendedTrainerToken)).status,403));
test('R04: atleta no genera reportes administrativos',async()=>assert.equal((await post('generate-report',athleteToken)).status,403));
test('R05: personal suspendido no elimina ejecuciones por HTTP',async()=>assert.equal((await post('delete-report-run',suspendedAdminToken,{run_id:crypto.randomUUID()})).status,403));
test('R06: recordatorios sin secreto se bloquean sin contactar proveedor',async()=>{const r=await post('send-payment-reminders',null);assert.equal(r.status,503);assert.equal((await r.json()).code,'SCHEDULER_NOT_CONFIGURED');});
test('R07: reporte real persiste snapshot, PDF y checksum en servicios locales',async()=>{
 const response=await post('generate-report',adminToken,{report_code:code,period_start:today,period_end:today}),result=await response.json();assert.equal(response.status,200,result.code);runId=result.data.run_id;assert.ok(runId);
 const row=ok(await admin.from('report_runs').select('*').eq('id',runId).single());assert.equal(row.status,'ready');assert.ok(row.snapshot_json.rows.some(r=>r.full_name==='Fixture Cierre'));assert.equal(row.snapshot_json.totals.total_students,row.snapshot_json.rows.length);
 const artifact=ok(await admin.from('report_artifacts').select('*').eq('run_id',runId).single());storedArtifact=artifact;const bytes=Buffer.from(await ok(await admin.storage.from(artifact.storage_bucket).download(artifact.storage_path)).arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.equal(bytes.length,Number(artifact.file_size));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),artifact.checksum);
 require('../../scripts/e2e/local/harness.cjs').write('integracion/reporte-roster-'+code+'.json',{syntheticOnly:true,runId,reportCode:code,status:row.status,sourceKind:'student_roster_snapshot',rowCount:row.snapshot_json.rows.length,totalStudents:row.snapshot_json.totals.total_students,expectedSyntheticNamePresent:true,pdfBytes:bytes.length,sha256:artifact.checksum,storageBucket:artifact.storage_bucket,personalFieldsRecorded:false});
});
test('R08: repetir reporte usa caché y mantiene ejecución única',async()=>{assert.ok(runId);const response=await post('generate-report',adminToken,{report_code:code,period_start:today,period_end:today}),result=await response.json();assert.equal(response.status,200);assert.equal(result.data.run_id,runId);assert.equal(result.data.cached,true);});
test('R09: administrador elimina solo el reporte sintético y su artefacto',async()=>{assert.ok(runId);const r=await post('delete-report-run',adminToken,{run_id:runId});assert.equal(r.status,200);assert.equal(ok(await admin.from('report_runs').select('id').eq('id',runId)).length,0);assert.equal(ok(await admin.from('report_artifacts').select('id').eq('run_id',runId)).length,0);const deleted=await admin.storage.from(storedArtifact.storage_bucket).download(storedArtifact.storage_path);assert.match(deleted.error?.message||'',/not.?found/i);});
