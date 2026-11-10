'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { root, runtime } = require('../../e2e/local/safety.cjs');
const { Client } = require(path.join(runtime, 'sql-driver/node_modules/pg'));
const marker = 'RIOVOLEY synthetic catalog maintenance integration only';
const sourceMarker = 'RIOVOLEY isolated production-schema rehearsal; synthetic data only';
const pointer = path.join(runtime, 'maintenance-packet-current.json');
const fingerprintQuery = fs.readFileSync(path.join(root, 'scripts/audit/production/catalog-fingerprint.sql'), 'utf8');
const qi = name => { assert.match(name, /^[a-z_][a-z0-9_]*$/); return '"' + name + '"'; };
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function pickLatestAttempt(attempts) {
  assert.ok(attempts.length > 0, 'FINAL_ATTEMPT_REQUIRED');
  for (const attempt of attempts) {
    assert.match(attempt.file, /^integracion\/intento-final(?:-[a-z0-9-]+)?\.json$/);
    assert.equal(attempt.completed, true);
    assert.match(attempt.recordedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    assert.ok(Number.isFinite(Date.parse(attempt.recordedAt)));
  }
  return [...attempts].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
}
function latestAttempt() {
  const c = read(), dir = path.join(c.evidence, 'integracion');
  return pickLatestAttempt(fs.readdirSync(dir).filter(f => /^intento-final(?:-[a-z0-9-]+)?\.json$/.test(f))
    .map(file => ({ ...json(path.join(dir, file)), file: 'integracion/' + file })));
}
function read() {
  const c = json(pointer); assert.match(c.database, /^riovoley_gatepacket_\d{14}_[a-f0-9]{6}$/);
  assert.match(c.sourceDatabase, /^riovoley_release_\d{14}$/);
  assert.ok(c.evidence.startsWith(path.join(root, 'docs/tesis/evidencias/verificacion-tecnica') + path.sep));
  assert.ok(!fs.existsSync(path.join(c.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET'); return c;
}
async function connect(source = false) {
  const c = read(), database = source ? c.sourceDatabase : c.database;
  const db = new Client({ host: '127.0.0.1', port: 55322, user: 'postgres', password: process.env.RIOVOLEY_LOCAL_DB_PASSWORD || 'postgres',
    database, ssl: false, connectionTimeoutMillis: 5000, query_timeout: 30000, application_name: 'riovoley_synthetic_gatepacket' });
  await db.connect();
  try {
    const row = (await db.query("SELECT current_database() AS name,session_user,current_user,current_setting('role') AS role,shobj_description(oid,'pg_database') AS marker,(SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user) AS bypassrls FROM pg_database WHERE datname=current_database()")).rows[0];
    assert.equal(row.name, database); assert.equal(row.marker, source ? sourceMarker : marker);
    assert.equal(row.session_user, 'postgres'); assert.equal(row.current_user, 'postgres'); assert.equal(row.role, 'none'); assert.equal(row.bypassrls, true);
    return db;
  } catch (error) { await db.end(); throw error; }
}
async function fingerprint(db) { return (await db.query(fingerprintQuery)).rows[0].fingerprint; }
async function inventory(db) {
  return (await db.query("SELECT n.nspname AS schema,c.relname AS name,c.relkind AS kind,EXISTS(SELECT 1 FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attname='id' AND a.attgenerated='' AND NOT a.attisdropped) AS id_column FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN('r','p') AND n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN('information_schema','extensions') ORDER BY n.nspname,c.relname")).rows;
}
async function contents(db, tables) {
  const tableHashes = [];
  for (const table of tables) {
    const target = qi(table.schema) + '.' + qi(table.name);
    const r = (await db.query("SELECT count(*)::int AS rows,md5(COALESCE(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),'')) AS digest FROM " + target + ' t')).rows[0];
    tableHashes.push({ table: table.schema + '.' + table.name, ...r });
  }
  const sequences = (await db.query("SELECT n.nspname AS schema,c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='S' AND n.nspname NOT LIKE 'pg_%' AND n.nspname NOT IN('information_schema','extensions') ORDER BY 1,2")).rows;
  const sequenceStates = [];
  for (const seq of sequences) sequenceStates.push({ sequence: seq.schema + '.' + seq.name,
    ...(await db.query('SELECT last_value::text AS last_value,is_called FROM ' + qi(seq.schema) + '.' + qi(seq.name))).rows[0] });
  return { tables: tableHashes.length, rows: tableHashes.reduce((sum, t) => sum + t.rows, 0),
    contentsSha256: sha(JSON.stringify(tableHashes)), sequences: sequenceStates.length, sequencesSha256: sha(JSON.stringify(sequenceStates)) };
}
async function initialize() {
  const verified = await require('../security/local-db.cjs').connect();
  const previous = json(path.join(runtime, 'production-migration/context.json'));
  assert.match(previous.database, /^riovoley_release_\d{14}$/);
  const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const database = 'riovoley_gatepacket_' + stamp.replace('-', '') + '_' + crypto.randomBytes(3).toString('hex');
  const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-paquete-barrera-' + commit.slice(0, 7));
  assert.ok(!fs.existsSync(evidence));
  const c = { createdAt: new Date().toISOString(), baseCommit: commit, database, sourceDatabase: previous.database, evidence,
    priorEvidence: fs.readFileSync(path.join(runtime, 'evidence-dir.txt'), 'utf8').trim(), productionChanged: false, institutionalRowsCopied: 0,
    host: '127.0.0.1', port: 55322, osRelease: require('node:os').release(), node: process.version };
  const source = new Client({ host: '127.0.0.1', port: 55322, user: 'postgres', password: process.env.RIOVOLEY_LOCAL_DB_PASSWORD || 'postgres',
    database: previous.database, ssl: false, connectionTimeoutMillis: 5000, query_timeout: 15000 });
  await source.connect();
  try {
    const state = (await source.query("SELECT shobj_description(oid,'pg_database') AS marker,(SELECT count(*)::int FROM pg_stat_activity WHERE datname=current_database() AND pid<>pg_backend_pid()) AS other_connections FROM pg_database WHERE datname=current_database()")).rows[0];
    assert.equal(state.marker, sourceMarker); assert.equal(state.other_connections, 0);
    c.sourceFingerprint = await fingerprint(source); assert.equal(c.sourceFingerprint, '38434a2af96ad410967032b00a0828ac');
    c.sourceContent = await contents(source, await inventory(source));
    c.serverVersion = (await source.query('SHOW server_version')).rows[0].server_version;
  } finally { await source.end(); }
  try {
    await verified.query('CREATE DATABASE ' + qi(database) + ' TEMPLATE ' + qi(previous.database));
    await verified.query('COMMENT ON DATABASE ' + qi(database) + " IS '" + marker + "'");
  } finally { await verified.end(); }
  for (const dir of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, dir), { recursive: true });
  const privateDir = path.join(runtime, 'maintenance-packet', database); fs.mkdirSync(privateDir, { recursive: true });
  fs.writeFileSync(path.join(privateDir, 'context.json'), JSON.stringify(c, null, 2), { flag: 'wx' }); fs.writeFileSync(pointer, JSON.stringify(c, null, 2));
  fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
  require('../../e2e/local/harness.cjs').write('CONTEXTO.json', { ...c,
    evidence: path.relative(root, evidence).replaceAll('\\', '/'), priorEvidence: path.relative(root, c.priorEvidence).replaceAll('\\', '/'),
    source: 'Previously marked synthetic catalog laboratory; no institutional restore used', institutionalRestoreUsed: false,
    institutionalRestoreContainerStatus: 'Not rechecked by this setup command',
    cloneSourceModified: false, newInstitutionalBackup: false, archiveUnlocked: false });
  console.log(JSON.stringify({ evidence: path.relative(root, evidence), sourceFingerprint: c.sourceFingerprint,
    syntheticTables: c.sourceContent.tables, syntheticRows: c.sourceContent.rows, sequences: c.sourceContent.sequences, productionChanged: false }));
}
if (require.main === module) initialize().catch(error => { console.error(JSON.stringify({ stage: 'SYNTHETIC_PACKET_SETUP', code: error.code || 'ASSERTION',
  message: error.code ? undefined : error.message })); process.exitCode = 1; });
module.exports = { read, connect, fingerprint, inventory, contents, fingerprintQuery, qi, sha, marker, pickLatestAttempt, latestAttempt };
