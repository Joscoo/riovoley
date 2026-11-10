'use strict';
// Only fixed loopback and a uniquely owned new database. No cloud connection option.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('./sql-context.cjs');
const {Client}=require(path.join(h.root,'.e2e-local/sql-driver/node_modules/pg'));
const marker='RIOVOLEY isolated production-schema rehearsal; synthetic data only';
function client(database){assert.match(database,/^riovoley_release_\d{14}$/);return new Client({host:'127.0.0.1',port:55322,user:'postgres',password:process.env.RIOVOLEY_LOCAL_DB_PASSWORD||'postgres',database,ssl:false,connectionTimeoutMillis:5000,query_timeout:30000});}
async function connectLab(){const c=h.read(),db=client(c.database);await db.connect();try{const r=await db.query("SELECT current_database() AS name,shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()");assert.equal(r.rows[0].name,c.database);assert.equal(r.rows[0].marker,marker);return db;}catch(e){await db.end();throw e;}}
async function setup(){
 const c=h.read(),{connect}=require('../security/local-db.cjs'),source=await connect();
 const suffix=process.argv[2]==='replay'?'-replay':'';
 const authFunctions=(await source.query("SELECT pg_get_functiondef(oid) AS definition FROM pg_proc WHERE oid IN ('auth.uid()'::regprocedure,'auth.role()'::regprocedure,'auth.jwt()'::regprocedure)")).rows;
 try{assert.equal((await source.query('SELECT 1 FROM pg_database WHERE datname=$1',[c.database])).rowCount,0,'Base existente: no sobrescribir');await source.query('CREATE DATABASE "'+c.database+'" TEMPLATE template0');await source.query('COMMENT ON DATABASE "'+c.database+'" IS '+"'"+marker+"'");}finally{await source.end();}
 const db=await connectLab();
 try{
 await db.query(`CREATE SCHEMA auth;CREATE SCHEMA extensions;
 CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,encrypted_password character varying(255),raw_user_meta_data jsonb DEFAULT '{}'::jsonb,raw_app_meta_data jsonb DEFAULT '{}'::jsonb,last_sign_in_at timestamptz,created_at timestamptz DEFAULT now());
 GRANT USAGE ON SCHEMA auth TO anon,authenticated,service_role;
 ${authFunctions.map(f=>f.definition+';').join('\n')}`);
 h.write('integracion/auth-laboratorio'+suffix+'.json',{origin:'Funciones auth.uid/role/jwt copiadas como DDL del Supabase local verificado; tabla auth.users mínima sin filas institucionales.',functions:authFunctions.map(f=>f.definition.split('\n')[0]),sessionValidation:false,httpAuthExercised:false});
 const snapshot=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json'))),{buildSchema}=require('../../e2e/local/schema.cjs');
 await db.query(buildSchema(snapshot));
 // Preserve captured function ACL grant options explicitly (the general schema builder predates them).
 const pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions.json'))),{qi}=require('../../e2e/local/schema.cjs');
 for(const f of pc.preconditions.functions)for(const a of f.acl)if(a.grantable)await db.query(`GRANT ${a.privilege} ON FUNCTION ${qi(f.schema)}.${qi(f.name)}(${f.identity_args}) TO ${a.role==='PUBLIC'?'PUBLIC':qi(a.role)} WITH GRANT OPTION`);
 // Match complete relation/schema ACL and function defaults of the migration owner.
 if(pc.access)await require('./sql-access.cjs').alignAccess(db,pc.access);
 else{await db.query('REVOKE ALL ON SCHEMA security FROM authenticated');if(pc.preconditions.security_schema_authenticated_usage)await db.query('GRANT USAGE ON SCHEMA security TO authenticated');}
 const query=fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'),actual=(await db.query(query)).rows[0].fingerprint;
 h.write('integracion/reconstruccion'+suffix+'.json',{database:c.database,baselineFingerprint:pc.fingerprint,actualFingerprint:actual,tables:snapshot.tables.length,functions:snapshot.functions.length,policies:snapshot.policies.length,views:snapshot.views.length,localVersion:(await db.query('SHOW server_version')).rows[0].server_version});
 assert.equal(actual,pc.fingerprint,'La reconstruccion debe conservar la huella institucional antes del ensayo');
 console.log(JSON.stringify({database:c.database,baselineMatches:true,institutionalRowsCopied:0}));
 }finally{await db.end();}
}
async function withActor(db,actor,operation,role='authenticated'){
 assert.ok(['authenticated','anon'].includes(role));await db.query('BEGIN');
 try{await db.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify({sub:actor,role})]);await db.query('SET LOCAL ROLE '+role);const result=await operation(db);await db.query('COMMIT');return result;}catch(e){await db.query('ROLLBACK');throw e;}
}
async function maintenance(db){await db.query("SELECT set_config('riovoley.release.approval','reviewed-maintenance:mayvvlkvheagkojunzzb',false),set_config('riovoley.release.window','closed-to-clients',false)");}
async function alignAuth(){
 const db=await connectLab();try{
  const s=JSON.parse(fs.readFileSync(path.join(h.privateDir,'catalog.json')));
  await db.query('BEGIN');
  for(const t of s.triggers.filter(t=>t.schema==='auth'))await db.query('DROP TRIGGER '+require('../../e2e/local/schema.cjs').qi(t.name)+' ON auth.users');
  await db.query('ALTER TABLE auth.users ALTER COLUMN encrypted_password TYPE character varying(255)');
  for(const t of s.triggers.filter(t=>t.schema==='auth'))await db.query(t.definition);
  await db.query('COMMIT');
  const actual=(await db.query(fs.readFileSync(path.join(__dirname,'catalog-fingerprint.sql'),'utf8'))).rows[0].fingerprint;
  const pc=JSON.parse(fs.readFileSync(path.join(h.privateDir,'preconditions.json')));
  h.write('integracion/reconstruccion-alineada.json',{actualFingerprint:actual,expectedFingerprint:pc.fingerprint,authPasswordColumn:'character varying(255)',productionChanged:false});assert.equal(actual,pc.fingerprint);
  console.log(JSON.stringify({baselineMatches:true}));
 }finally{await db.end();}
}
if(require.main===module)(process.argv[2]==='align-auth'?alignAuth():setup()).catch(e=>{console.error(e);process.exitCode=1;});
module.exports={connectLab,withActor,maintenance};
