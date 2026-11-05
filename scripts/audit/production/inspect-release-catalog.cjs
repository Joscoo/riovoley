'use strict';
// Fixed aggregate READ ONLY query. No business rows, provider values or SQL mutations.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict'),h=require('../../e2e/local/harness.cjs'),b=require('../../production/backup.cjs');
const query=`BEGIN READ ONLY;
SELECT json_build_object(
 'rls',(SELECT json_agg(x ORDER BY x.table_name) FROM (SELECT c.relname AS table_name,c.relrowsecurity AS enabled,c.relforcerowsecurity AS forced,(SELECT count(*) FROM pg_policy p WHERE p.polrelid=c.oid) AS policies FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='gamification' AND c.relname IN ('xp_ledger','login_rewards')) x),
 'dailyRewardRpcPresent',to_regprocedure('public.claim_daily_login_reward()') IS NOT NULL,
 'postgresSuperuser',(SELECT rolsuper FROM pg_roles WHERE rolname='postgres'),
 'relationsWithoutOwnerRoleUsage',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','core','billing','training','gamification','reporting') AND c.relkind IN ('r','p','v','m','S') AND NOT pg_has_role('postgres',c.relowner,'USAGE')),
 'functionOwnersWithoutRoleUsage',(SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','core','billing','training','gamification','reporting') AND NOT pg_has_role('postgres',p.proowner,'USAGE')),
 'schemasWithoutCreate',(SELECT count(*) FROM pg_namespace n WHERE n.nspname IN ('public','security','gamification') AND NOT has_schema_privilege('postgres',n.oid,'CREATE'))
) AS audit_summary;
COMMIT;`;
try {
 assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'NEW_EVIDENCE_REQUIRED');
 const startedAt=new Date().toISOString(),args=['db','query','--linked','--project-ref','mayvvlkvheagkojunzzb','--output','json',query],r=cp.spawnSync(path.join(h.runtime,'tools/node_modules/@supabase/cli-windows-x64/bin/supabase.exe'),args,{cwd:h.root,env:b.baseEnvironment(),windowsHide:true,encoding:'utf8',maxBuffer:4*1024*1024,timeout:60000});
 h.write('seguridad/catalogo-lectura.meta.json',{command:['supabase',...args],startedAt,finishedAt:new Date().toISOString(),exitCode:r.status,rawOutputSaved:false});assert.equal(r.status,0,'CATALOG_READ_FAILED');
 const output=JSON.parse(r.stdout),rows=Array.isArray(output)?output:output.rows||output.result||output.data;
 assert.ok(Array.isArray(rows)&&rows.length===1,'CATALOG_RESULT_SHAPE');let summary=rows[0].audit_summary;if(typeof summary==='string')summary=JSON.parse(summary);
 assert.ok(Array.isArray(summary?.rls)&&summary.rls.length===2,'RLS_TABLES_NOT_OBSERVED');
 h.write('seguridad/catalogo-liberacion-actual.json',{checkedAt:new Date().toISOString(),source:'Supabase CLI Management API; BEGIN READ ONLY / SELECT / COMMIT',...summary,productionChanged:false,businessRowsRead:false,policiesPredicatesNotValidatedByFlag:true,managedRuntimeBusinessFlowsExecuted:false});
 console.log(JSON.stringify({status:'CATALOG_READ_ONLY_VERIFIED',tables:summary.rls.length,dailyRewardRpcPresent:summary.dailyRewardRpcPresent,productionChanged:false}));
} catch(e) {console.error(JSON.stringify({stage:/^[A-Z_]+$/.test(e.message)?e.message:'CATALOG_READ_FAILED',rawErrorsPublished:false}));process.exitCode=1;}
