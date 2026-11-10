const h=require('../../e2e/local/harness.cjs');
const {connect}=require('./local-db.cjs');
(async()=>{const db=await connect();try{
 h.write('seguridad/conexion-local.json',{host:'127.0.0.1',port:55322,projectId:'riovoley-e2e-local',authAndDatabaseIdentityMatched:true,method:'pg8.23.1; Docker Desktop Windows API no responde; no cambia el motor ni sus permisos'});
 const functions=(await db.query(`SELECT p.oid::regprocedure::text AS signature,pg_get_functiondef(p.oid) AS definition,p.prosecdef,p.proconfig,p.proacl::text,pg_get_userbyid(p.proowner) AS owner,
 (SELECT json_agg(json_build_object('role',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,'privilege',a.privilege_type,'grantable',a.is_grantable)) FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a) AS acl
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('soft_delete_payment','restore_payment','audit_payments','purchase_gamification_item','equip_gamification_item','unequip_gamification_item') ORDER BY p.proname,p.oid`)).rows;
 h.write('seguridad/antes-funciones.json',functions);
 h.write('seguridad/antes-politicas.json',(await db.query("SELECT * FROM pg_policies WHERE schemaname IN ('core','billing','gamification','profiles') ORDER BY schemaname,tablename,policyname")).rows);
 h.write('seguridad/antes-grants.json',(await db.query("SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.table_privileges WHERE table_schema IN ('core','billing','gamification','profiles','public') ORDER BY table_schema,table_name,grantee,privilege_type")).rows);
 console.log(JSON.stringify({identity:'verified local only',functions:functions.length}));
}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
