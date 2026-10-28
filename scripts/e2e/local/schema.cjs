const allowed = new Set(['audit','billing','core','gamification','profiles','public','public_content','reporting','security','training']);
const qi = name => '"'+String(name).replaceAll('"','""')+'"';
const ql = value => "'"+String(value).replaceAll("'","''")+"'";
const name = item => qi(item.schema)+'.'+qi(item.name);
const role = value => value.toUpperCase()==='PUBLIC'?'PUBLIC':qi(value);
function buildSchema(snapshot) {
  for (const schema of snapshot.schemas || []) if (!allowed.has(schema)) throw new Error('No restaurar esquema administrado: '+schema);
  const sql=['BEGIN;', 'SET check_function_bodies = false;', 'SET search_path = public, extensions;', 'CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;', 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;'];
  for (const schema of snapshot.schemas || []) sql.push(`CREATE SCHEMA IF NOT EXISTS ${qi(schema)};`);
  for (const t of snapshot.enums || []) sql.push(`CREATE TYPE ${name(t)} AS ENUM (${t.labels.map(ql).join(',')});`);
  for (const s of snapshot.sequences || []) {
    const max=Number.isSafeInteger(s.max)?String(s.max):(s.type==='bigint'?'9223372036854775807':String(s.max));
    const min=Number.isSafeInteger(s.min)?String(s.min):(s.type==='bigint'?'-9223372036854775808':String(s.min));
    sql.push(`CREATE SEQUENCE ${name(s)} AS ${s.type} INCREMENT ${s.increment} MINVALUE ${min} MAXVALUE ${max} START ${s.start} CACHE ${s.cache} ${s.cycle?'CYCLE':'NO CYCLE'};`);
  }
  // check_function_bodies=false permite definir rutinas que referencian tablas futuras.
  // En cambio, columnas GENERATED requieren que su función exista al crear la tabla.
  for (const f of snapshot.functions || []) sql.push(f.definition.replace(/;?\s*$/,';'));
  // PostgreSQL permite cambiar la volatilidad DESPUÉS de crear una columna stored.
  // Para reconstruir ese estado válido existente, se usa IMMUTABLE solo durante
  // CREATE TABLE y se restaura íntegra la definición capturada antes del COMMIT.
  const generatedExpressions=(snapshot.tables||[]).flatMap(t=>t.columns.filter(c=>c.generated).map(c=>c.default));
  const generatedFunctions=(snapshot.functions||[]).filter(f=>generatedExpressions.some(expression=>expression.includes(f.name+'(')));
  for (const f of generatedFunctions) sql.push(`ALTER FUNCTION ${name(f)}(${f.identity_args}) IMMUTABLE;`);
  for (const t of snapshot.tables || []) {
    const columns=t.columns.map(c=>`${qi(c.name)} ${c.type}${c.identity?` GENERATED ${c.identity==='a'?'ALWAYS':'BY DEFAULT'} AS IDENTITY`:c.generated?` GENERATED ALWAYS AS (${c.default}) STORED`:c.default?` DEFAULT ${c.default}`:''}${c.notnull?' NOT NULL':''}`);
    sql.push(`CREATE TABLE ${name(t)} (\n${columns.join(',\n')}\n);`);
  }
  for (const f of generatedFunctions) sql.push(f.definition.replace(/^CREATE FUNCTION/,'CREATE OR REPLACE FUNCTION').replace(/;?\s*$/,';'));
  // PostgreSQL exige índices únicos/PK antes de crear claves foráneas.
  for (const foreign of [false,true]) for (const t of snapshot.tables || []) for (const k of t.constraints || []) {
    if ((k.type==='f')===foreign) sql.push(`ALTER TABLE ${name(t)} ADD CONSTRAINT ${qi(k.name)} ${k.definition};`);
  }
  for (const index of snapshot.indexes || []) sql.push(index.replace(/;?\s*$/,';'));
  const pending=[...(snapshot.views || [])], done=new Set();
  while (pending.length) {
    const index=pending.findIndex(v=>(v.dependencies || []).every(d=>done.has(d.schema+'.'+d.name)));
    if (index<0) throw new Error('Ciclo o dependencia de vistas fuera del snapshot');
    const [v]=pending.splice(index,1);
    sql.push(`CREATE VIEW ${name(v)}${v.options?.length?' WITH ('+v.options.join(',')+')':''} AS ${v.definition.replace(/;?\s*$/,';')}`);
    done.add(v.schema+'.'+v.name);
  }
  for (const t of snapshot.tables || []) {
    if (t.rls) sql.push(`ALTER TABLE ${name(t)} ENABLE ROW LEVEL SECURITY;`);
    if (t.force_rls) sql.push(`ALTER TABLE ${name(t)} FORCE ROW LEVEL SECURITY;`);
  }
  for (const p of snapshot.policies || []) sql.push(`CREATE POLICY ${qi(p.policyname)} ON ${qi(p.schemaname)}.${qi(p.tablename)} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(role).join(',')}${p.qual?' USING ('+p.qual+')':''}${p.with_check?' WITH CHECK ('+p.with_check+')':''};`);
  for (const t of snapshot.triggers || []) {
    if (!allowed.has(t.schema) && !(t.schema==='auth'&&['on_auth_user_created','trigger_sync_first_login_on_password_change','trigger_sync_last_login_from_auth'].includes(t.name))) throw new Error('Trigger fuera del alcance permitido');
    sql.push(`DROP TRIGGER IF EXISTS ${qi(t.name)} ON ${qi(t.schema)}.${qi(t.table)};`, t.definition.replace(/;?\s*$/,';'));
  }
  for (const s of snapshot.sequences || []) if (s.owner_table) sql.push(`ALTER SEQUENCE ${name(s)} OWNED BY ${s.owner_table.split('.').map(qi).join('.')}.${qi(s.owner_column)};`);
  for (const t of [...snapshot.tables||[],...snapshot.views||[]]) sql.push(`REVOKE ALL ON TABLE ${name(t)} FROM PUBLIC, anon, authenticated, service_role;`);
  for (const g of snapshot.schema_grants || []) sql.push(`GRANT ${g.privilege} ON SCHEMA ${qi(g.schema)} TO ${role(g.role)};`);
  for (const g of snapshot.grants || []) sql.push(`GRANT ${g.privilege} ON ${g.kind==='S'?'SEQUENCE':'TABLE'} ${name(g)} TO ${role(g.role)};`);
  for (const f of snapshot.functions || []) {
    sql.push(`REVOKE ALL ON FUNCTION ${name(f)}(${f.identity_args}) FROM PUBLIC, anon, authenticated, service_role;`);
    for (const g of f.grants || []) if (['PUBLIC','anon','authenticated','service_role'].includes(g.role)) sql.push(`GRANT ${g.privilege} ON FUNCTION ${name(f)}(${f.identity_args}) TO ${role(g.role)};`);
  }
  sql.push("NOTIFY pgrst, 'reload schema';", 'COMMIT;');
  return sql.join('\n')+'\n';
}
module.exports={buildSchema,qi,ql};
