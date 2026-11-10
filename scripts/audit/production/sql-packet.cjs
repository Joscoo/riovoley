'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {qi,ql}=require('../../e2e/local/schema.cjs');
const h=require('./sql-context.cjs');
const schemas="'audit','billing','core','gamification','profiles','public','public_content','reporting','security','training'";
const fn=f=>qi(f.schema)+'.'+qi(f.name)+'('+f.identity_args+')';
const helpers=['guard_user_privileges','preserve_wallet_spending','guard_active_gamification_actor','guard_staff_sources','guard_cosmetic_unlock','is_active_staff','is_active_admin','is_active_user'];
function reserved(snapshot){
 assert.ok(!(snapshot.functions||[]).some(f=>f.name==='claim_daily_login_reward'||helpers.includes(f.name)||f.name.endsWith('_legacy_bigint')),'Objeto existente reservado al paquete');
 assert.ok(!(snapshot.policies||[]).some(p=>p.policyname.startsWith('rio_')),'Policy existente reservada');
 assert.ok(!(snapshot.triggers||[]).some(t=>t.name.startsWith('rio_')),'Trigger existente reservado');
 assert.ok(!(snapshot.indexes||[]).some(i=>/\brio_/.test(i)),'Indice existente reservado');
}
function guard(query,expected){
 assert.match(expected,/^[a-f0-9]{32}$/);const inner=query.trim().replace(/;$/,'');
 return `SET LOCAL lock_timeout='5s';\nSET LOCAL statement_timeout='120s';\nSET LOCAL search_path=public,extensions;\nDO $release_guard$\nDECLARE actual text;\nBEGIN\n IF current_user <> 'postgres' THEN RAISE EXCEPTION 'Ejecutar como postgres para conservar propietarios y ACL previstas'; END IF;\n IF current_setting('riovoley.release.approval',true) IS DISTINCT FROM 'reviewed-maintenance:mayvvlkvheagkojunzzb' OR current_setting('riovoley.release.window',true) IS DISTINCT FROM 'closed-to-clients' THEN\n RAISE EXCEPTION 'Paquete pendiente de autorizacion expresa, respaldo y ventana sin clientes';\n END IF;\n SELECT fingerprint INTO actual FROM (${inner}) captured;\n IF actual IS DISTINCT FROM '${expected}' THEN RAISE EXCEPTION 'Deriva del catalogo: abortar y reconstruir el paquete'; END IF;\nEND;\n$release_guard$;\n`;
}
function forwardSQL(snapshot,pc,query,localSQL){
 reserved(snapshot);
 assert.match(localSQL,/DO \$guard\$/);assert.match(localSQL,/COMMIT;\s*$/);
 // Retain the proven local RLS/view checks, replace only its scope guard.
 const start=localSQL.indexOf('DO $guard$'),end=localSQL.indexOf('$guard$;',start)+8;
 assert.ok(end>start+8);const localGuard=localSQL.slice(start,end).replace(/ IF current_setting\('riovoley\.audit\.local_project',true\)[\s\S]*? END IF;\r?\n/,'');
 assert.ok(!localGuard.includes('audit.local_project'));
 const prerequisites=`DO $preconditions$ BEGIN
 IF EXISTS(SELECT user_id FROM core.students WHERE user_id IS NOT NULL GROUP BY user_id HAVING count(*)>1) THEN RAISE EXCEPTION 'Identidades duplicadas: resolver por procedimiento separado'; END IF;
 IF EXISTS(SELECT student_id,source_ref FROM gamification.xp_ledger WHERE source_type='daily_login' AND source_ref IS NOT NULL GROUP BY student_id,source_ref HAVING count(*)>1) THEN RAISE EXCEPTION 'XP diario duplicado: resolver por procedimiento separado'; END IF;
 IF EXISTS(SELECT 1 FROM gamification.xp_ledger WHERE source_type='daily_login' AND source_ref IS NULL) THEN RAISE EXCEPTION 'XP diario sin fecha de referencia: revision manual requerida'; END IF;
 IF EXISTS(SELECT 1 FROM core.users WHERE role IS NULL OR role NOT IN ('administrador','admin','entrenador','usuario','estudiante')) THEN RAISE EXCEPTION 'Roles no canonicos: revision manual requerida'; END IF;
 END; $preconditions$;\n`;
 const changes=[];
 for(const f of pc.preconditions.functions.filter(f=>!f.config?.some(x=>x.startsWith('search_path=')))){
  // All captured bodies were reviewed; object references are schema qualified.
  const legacy=['soft_delete_payment','restore_payment'].includes(f.name)&&/bigint/.test(f.identity_args);
  changes.push(`ALTER FUNCTION ${fn({...f,name:f.name+(legacy?'_legacy_bigint':'')})} SET search_path='';`);
 }
 changes.push('REVOKE ALL ON FUNCTION public.admin_insert_user(uuid,text,text,text,text,date,text) FROM PUBLIC,anon;',
 'GRANT EXECUTE ON FUNCTION public.admin_insert_user(uuid,text,text,text,text,date,text) TO authenticated;');
 const body=localSQL.slice(end).replace(/COMMIT;\s*$/,'');
 return `-- PROPUESTA: NO APLICADA A PRODUCCION. Fuera de migraciones automaticas.\n-- Marcadores operativos no sustituyen la autorizacion institucional.\nBEGIN;\n${guard(query,pc.fingerprint)}${localGuard}\n${prerequisites}${body}\n${changes.join('\n')}\nNOTIFY pgrst,'reload schema';\nCOMMIT;\n`;
}
function returnSQL(snapshot,pc,query,appliedFingerprint){
 const sql=['-- RETORNO DE ESQUEMA: no borra XP, recompensas ni datos generados tras el avance.','-- Restituye permisos anteriores: requiere decision y ventana propias, no retorno automatico.','BEGIN;',guard(query,appliedFingerprint),
 `DO $remove$ DECLARE p record; BEGIN FOR p IN SELECT schemaname,tablename,policyname FROM pg_policies WHERE left(policyname,4)='rio_' AND schemaname IN (${schemas}) LOOP EXECUTE format('DROP POLICY %I ON %I.%I',p.policyname,p.schemaname,p.tablename); END LOOP; END; $remove$;`,
 `DO $remove$ DECLARE item record; BEGIN FOR item IN SELECT n.nspname,c.relname,trg.tgname FROM pg_trigger trg JOIN pg_class c ON c.oid=trg.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT trg.tgisinternal AND left(trg.tgname,4)='rio_' AND n.nspname IN (${schemas}) LOOP EXECUTE format('DROP TRIGGER %I ON %I.%I',item.tgname,item.nspname,item.relname); END LOOP; END; $remove$;`,
 'DROP FUNCTION public.claim_daily_login_reward();','DROP INDEX gamification.rio_daily_login_once;','DROP INDEX core.rio_student_user_identity;',
 'ALTER FUNCTION public.soft_delete_payment_legacy_bigint(bigint) RENAME TO soft_delete_payment;','ALTER FUNCTION public.restore_payment_legacy_bigint(bigint) RENAME TO restore_payment;'];
 for(const f of snapshot.functions){
  const original=pc.preconditions.functions.find(p=>p.schema===f.schema&&p.name===f.name&&p.identity_args===f.identity_args);assert.ok(original,'Falta ACL original '+fn(f));
  sql.push(f.definition.trim().replace(/;?$/,';'),`ALTER FUNCTION ${fn(f)} OWNER TO ${qi(f.owner)};`);
  // Include every original grantee, including grant options; no assumptions on PUBLIC defaults.
  const roles=new Set(['PUBLIC','anon','authenticated','service_role',...original.acl.map(a=>a.role)]);
  sql.push(`REVOKE ALL ON FUNCTION ${fn(f)} FROM ${[...roles].map(r=>r==='PUBLIC'?'PUBLIC':qi(r)).join(',')};`);
  for(const a of original.acl)sql.push(`GRANT ${a.privilege} ON FUNCTION ${fn(f)} TO ${a.role==='PUBLIC'?'PUBLIC':qi(a.role)}${a.grantable?' WITH GRANT OPTION':''};`);
 }
 for(const name of helpers)sql.push(`DROP FUNCTION security.${qi(name)}();`);
 if(!pc.preconditions.security_schema_authenticated_usage)sql.push('REVOKE USAGE ON SCHEMA security FROM authenticated;');
 sql.push(guard(query,pc.fingerprint),"NOTIFY pgrst,'reload schema';",'COMMIT;');
 return sql.join('\n')+'\n';
}
function build(){
 const snapshot=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json'))),pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions.json'))),query=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'),local=fs.readFileSync(path.join(h.root,'database/security/local/20261029141114_riovoley_security_local.sql'),'utf8');
 const sql=forwardSQL(snapshot,pc,query,local);
 // CLI creates the migration name; the file is then moved to the proposal directory.
 const cli=path.join(h.root,'.e2e-local/tools/node_modules/supabase/dist/supabase.js'),work=path.join(h.privateDir,'cli');fs.mkdirSync(work,{recursive:true});
 const r=h.run('seguridad/cli-migration-new',[cli,'migration','new','riovoley_security_production_proposal','--workdir',work]);assert.equal(r.status,0);
 const sourceDir=path.join(work,'supabase/migrations'),files=fs.readdirSync(sourceDir).filter(f=>/^\d{14}_riovoley_security_production_proposal\.sql$/.test(f));assert.equal(files.length,1);
 const dir=path.join(h.root,'database/security/production-proposal');fs.mkdirSync(dir,{recursive:true});
 const target=path.join(dir,files[0]);assert.ok(!fs.existsSync(target));fs.renameSync(path.join(sourceDir,files[0]),target);fs.writeFileSync(target,sql);
 const packet={createdAt:new Date().toISOString(),forward:path.relative(h.root,target).replaceAll('\\','/'),baselineFingerprint:pc.fingerprint,sha256:crypto.createHash('sha256').update(sql).digest('hex'),productionApplied:false};
 fs.writeFileSync(path.join(h.privateDir,'packet.json'),JSON.stringify(packet,null,2)+'\n',{flag:'wx'});
 h.write('seguridad/paquete-inicial.json',packet);h.write('seguridad/catalogo-aplicacion.json',snapshot);h.write('seguridad/precondiciones-institucionales.json',pc);h.write('seguridad/advisores-institucionales.json',JSON.parse(fs.readFileSync(path.join(h.privateDir,'advisors.json'))));
 console.log(JSON.stringify({created:packet.forward,productionApplied:false}));
}
if(require.main===module)build();
module.exports={forwardSQL,returnSQL,guard};
