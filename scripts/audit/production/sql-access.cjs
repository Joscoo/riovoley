'use strict';
const {qi}=require('../../e2e/local/schema.cjs');
const role=r=>r==='PUBLIC'?'PUBLIC':qi(r);
// Used only after connectLab verifies the fixed loopback target and database marker.
async function alignAccess(db,access){
 await db.query('BEGIN');try{
 for(const s of access.schemas){await db.query(`ALTER SCHEMA ${qi(s.name)} OWNER TO ${qi(s.owner)}`);const roles=new Set(['PUBLIC','anon','authenticated','service_role',...s.acl.map(a=>a.role)]);await db.query(`REVOKE ALL ON SCHEMA ${qi(s.name)} FROM ${[...roles].map(role).join(',')}`);for(const a of s.acl)await db.query(`GRANT ${a.privilege} ON SCHEMA ${qi(s.name)} TO ${role(a.role)}${a.grantable?' WITH GRANT OPTION':''}`);}
 for(const t of access.relations){const kind=t.kind==='S'?'SEQUENCE':t.kind==='v'?'VIEW':'TABLE',target=qi(t.schema)+'.'+qi(t.name);await db.query(`ALTER ${kind} ${target} OWNER TO ${qi(t.owner)}`);const roles=new Set(['PUBLIC','anon','authenticated','service_role',...t.acl.map(a=>a.role)]);await db.query(`REVOKE ALL ON ${t.kind==='S'?'SEQUENCE':'TABLE'} ${target} FROM ${[...roles].map(role).join(',')}`);for(const a of t.acl)await db.query(`GRANT ${a.privilege} ON ${t.kind==='S'?'SEQUENCE':'TABLE'} ${target} TO ${role(a.role)}${a.grantable?' WITH GRANT OPTION':''}`);}
 for(const d of (access.function_defaults||[]).filter(d=>d.owner==='postgres')){const prefix=`ALTER DEFAULT PRIVILEGES FOR ROLE ${qi(d.owner)}${d.schema?' IN SCHEMA '+qi(d.schema):''}`;const roles=new Set(['PUBLIC','anon','authenticated','service_role',...d.acl.map(a=>a.role)]);await db.query(`${prefix} REVOKE ALL ON FUNCTIONS FROM ${[...roles].map(role).join(',')}`);for(const a of d.acl)await db.query(`${prefix} GRANT ${a.privilege} ON FUNCTIONS TO ${role(a.role)}${a.grantable?' WITH GRANT OPTION':''}`);}
 await db.query('COMMIT');}catch(e){await db.query('ROLLBACK');throw e;}
}
module.exports={alignAccess};
