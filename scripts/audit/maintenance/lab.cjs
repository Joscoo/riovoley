'use strict';
// No cloud host, arbitrary database, role modification or destructive cleanup option.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { root, runtime } = require('../../e2e/local/safety.cjs');
const { Client } = require(path.join(runtime, 'sql-driver/node_modules/pg'));
const marker = 'RIOVOLEY synthetic SQL maintenance gate only';
const pointer = path.join(runtime, 'maintenance-gate-current.json');
const relations = ['public.gate_probe', 'gamification.gate_probe', 'auth.gate_probe', 'storage.gate_probe', 'public.gate_partition', 'public.gate_partition_low', 'public.gate_partition_high'];
const actors = [
  { name: 'anon', login: 'authenticator', role: 'anon' },
  { name: 'authenticated', login: 'authenticator', role: 'authenticated' },
  { name: 'service_role', login: 'authenticator', role: 'service_role' },
  { name: 'supabase_auth_admin', login: 'supabase_auth_admin' },
  { name: 'supabase_storage_admin', login: 'supabase_storage_admin' }
];
function context() {
  const c = JSON.parse(fs.readFileSync(pointer));
  assert.match(c.database, /^riovoley_gate_\d{14}_[a-f0-9]{6}$/);
  assert.ok(c.evidence.startsWith(path.join(root, 'docs/tesis/evidencias/verificacion-tecnica') + path.sep));
  assert.ok(!fs.existsSync(path.join(c.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET');
  return c;
}
function makeClient(database, login = 'postgres') {
  assert.match(database, /^riovoley_gate_\d{14}_[a-f0-9]{6}$/);
  assert.ok(['postgres', 'authenticator', 'supabase_auth_admin', 'supabase_storage_admin'].includes(login));
  return new Client({ host: '127.0.0.1', port: 55322, database, user: login,
    password: process.env.RIOVOLEY_LOCAL_DB_PASSWORD || 'postgres', ssl: false,
    connectionTimeoutMillis: 5000, query_timeout: 10000, application_name: 'riovoley_local_gate_rehearsal' });
}
async function connect(login = 'postgres') {
  const c = context(), db = makeClient(c.database, login);
  await db.connect();
  try {
    const r = await db.query("SELECT current_database() AS name,shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=current_database()");
    assert.equal(r.rows[0].name, c.database); assert.equal(r.rows[0].marker, marker);
    return db;
  } catch (error) { await db.end(); throw error; }
}
async function actorConnection(actor) {
  assert.ok(actors.includes(actor));
  const db = await connect(actor.login);
  try { if (actor.role) await db.query('SET ROLE ' + actor.role); return db; }
  catch (error) { await db.end(); throw error; }
}
async function rollbackQuery(db, query) {
  await db.query('BEGIN');
  try { return await db.query(query); } finally { await db.query('ROLLBACK'); }
}
async function snapshot(db) {
  const entries = [];
  for (const table of relations) {
    const rows = (await db.query('SELECT id,value FROM ' + table + ' ORDER BY id')).rows;
    entries.push({ table, rows: rows.length, sha256: crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex') });
  }
  return entries;
}
async function initialize() {
  const source = await require('../security/local-db.cjs').connect();
  const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const database = 'riovoley_gate_' + stamp.replace('-', '') + '_' + crypto.randomBytes(3).toString('hex');
  const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-barrera-sql-local-' + commit.slice(0, 7));
  assert.ok(!fs.existsSync(evidence));
  const c = { createdAt: new Date().toISOString(), baseCommit: commit, database, evidence,
    priorEvidence: fs.readFileSync(path.join(runtime, 'evidence-dir.txt'), 'utf8').trim(), productionChanged: false,
    institutionalRowsCopied: 0, host: '127.0.0.1', port: 55322, osRelease: require('node:os').release(), node: process.version };
  try {
    assert.equal((await source.query('SELECT 1 FROM pg_database WHERE datname=$1', [database])).rowCount, 0);
    await source.query('CREATE DATABASE "' + database + '" TEMPLATE template0');
    await source.query('COMMENT ON DATABASE "' + database + '" IS ' + "'" + marker + "'");
    c.serverVersion = (await source.query('SHOW server_version')).rows[0].server_version;
  } finally { await source.end(); }
  for (const dir of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, dir), { recursive: true });
  const privateDir = path.join(runtime, 'maintenance-gate', database); fs.mkdirSync(privateDir, { recursive: true });
  fs.writeFileSync(path.join(privateDir, 'context.json'), JSON.stringify(c, null, 2), { flag: 'wx' });
  fs.writeFileSync(pointer, JSON.stringify(c, null, 2));
  fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
  const db = await connect();
  try {
    await db.query('CREATE SCHEMA gamification; CREATE SCHEMA auth; CREATE SCHEMA storage');
    for (const table of relations.slice(0, 4)) await db.query('CREATE TABLE ' + table + ' (id integer PRIMARY KEY,value integer NOT NULL);INSERT INTO ' + table + ' VALUES(1,100)');
    await db.query(`CREATE TABLE public.gate_partition(id integer,value integer NOT NULL) PARTITION BY RANGE(id);
      CREATE TABLE public.gate_partition_low PARTITION OF public.gate_partition FOR VALUES FROM(0) TO(10);
      CREATE TABLE public.gate_partition_high PARTITION OF public.gate_partition FOR VALUES FROM(10) TO(20);
      INSERT INTO public.gate_partition VALUES(1,100),(11,100);
      CREATE VIEW public.gate_view WITH(security_invoker=true) AS SELECT * FROM public.gate_probe;
      CREATE FUNCTION public.gate_definer_write() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS 'INSERT INTO public.gate_probe VALUES(2,200)';
      REVOKE ALL ON FUNCTION public.gate_definer_write() FROM PUBLIC;`);
    const roles = 'anon,authenticated,service_role,supabase_auth_admin,supabase_storage_admin';
    await db.query('GRANT CONNECT ON DATABASE "' + database + '" TO authenticator,supabase_auth_admin,supabase_storage_admin');
    await db.query('GRANT USAGE ON SCHEMA public,gamification,auth,storage TO ' + roles);
    await db.query('GRANT SELECT,INSERT,UPDATE,DELETE,TRUNCATE ON ' + relations.join(',') + ' TO ' + roles);
    await db.query('GRANT SELECT,INSERT,UPDATE,DELETE ON public.gate_view TO ' + roles);
    await db.query('GRANT EXECUTE ON FUNCTION public.gate_definer_write() TO ' + roles);
    const h = require('../../e2e/local/harness.cjs');
    h.write('CONTEXTO.json', { ...c, evidence: path.relative(root, evidence).replaceAll('\\', '/'), priorEvidence: path.relative(root, c.priorEvidence).replaceAll('\\', '/'),
      rolesModifiedGlobally: false, fixtureRelations: relations, httpAuthExercised: false, storageBytesExercised: false, mocksUsed: false });
    h.write('integracion/fixture-antes.json', { tables: await snapshot(db), fixtureOnly: true });
    console.log(JSON.stringify({ evidence: path.relative(root, evidence), database, serverVersion: c.serverVersion, fixtureRelations: relations.length, productionChanged: false }));
  } finally { await db.end(); }
}
if (require.main === module) initialize().catch(error => { console.error(JSON.stringify({ stage: 'LOCAL_FIXTURE_SETUP', code: error.code || 'ASSERTION', message: error.code ? undefined : error.message })); process.exitCode = 1; });
module.exports = { context, connect, actorConnection, rollbackQuery, snapshot, relations, actors, marker };
