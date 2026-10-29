const h=require('../../e2e/local/harness.cjs');
const {connect}=require('./local-db.cjs');
(async()=>{const db=await connect();try{
 const rows=(await db.query(`SELECT p.oid::regprocedure::text AS signature,pg_get_functiondef(p.oid) AS definition,
 (SELECT json_agg(json_build_object('role',CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,'privilege',a.privilege_type,'grantable',a.is_grantable)) FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) a) AS acl
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('handle_new_user','is_admin','is_admin_or_trainer')`)).rows;
 h.write('seguridad/antes-autorizadores.json',rows);console.log(JSON.stringify({functions:rows.length}));
}finally{await db.end();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
