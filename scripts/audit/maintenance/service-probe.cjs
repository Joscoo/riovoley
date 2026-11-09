'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const safety = require('../../e2e/local/safety.cjs'), context = require('./service-context.cjs'), h = require('../../e2e/local/harness.cjs');
const c = context.read(); assert.equal(c.evidence, h.evidence);
assert.match(c.nonce, /^[a-f0-9]{6}$/); assert.equal(c.schema, 'rio_service_gate_' + c.nonce); assert.equal(c.trigger, 'rio_service_probe_' + c.nonce);
assert.equal(c.bucketA, c.tag + '-a'); assert.equal(c.bucketB, c.tag + '-b');
const config = safety.readLocal(), checks = [], http = [], observations = [];
const owned = { emails: [c.tag + '-a@example.test', c.tag + '-b@example.test'], users: [], buckets: [], objects: ['baseline.bin', 'new.bin', 'moved.bin', 'relocated.bin'], ownership: c.tag };
const bytes = Buffer.from('RIOVOLEY disposable local Storage sentinel v1\n');
const changedBytes = Buffer.from('RIOVOLEY disposable local Storage sentinel v2\n');
const qi = name => { assert.match(name, /^[a-z_][a-z0-9_]*$/); return '"' + name + '"'; };
const ql = value => "'" + value.replaceAll("'", "''") + "'";
let db, gateInstalled = false, admin, subject, control, sessionA, beforeAuth, beforeDisk, baselineFingerprint;
const cleanup = { gateReleased: false, authUsersRemoved: false, bucketsRemoved: false, residualOwnedPhysicalFiles: null, errors: [] };
const ownershipFile = path.join(c.privateDir, 'fixtures-' + Date.now() + '.json');
function persistOwnership() { fs.writeFileSync(ownershipFile, JSON.stringify(owned, null, 2)); }
function client(key) {
  return createClient(c.apiUrl, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: async (input, options) => {
    const url = new URL(typeof input === 'string' ? input : input.url); assert.equal(url.origin, c.apiUrl);
    const start = Date.now(); const response = await fetch(input, { ...options, redirect: 'error', signal: AbortSignal.timeout(18000) });
    http.push({ at: new Date().toISOString(), method: options?.method || 'GET', path: url.pathname.replace(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/g, '[fixture]'), status: response.status, durationMs: Date.now() - start });
    return response;
  } } });
}
async function check(name, operation, critical = false) {
  const start = Date.now();
  try { const detail = await operation(); checks.push({ name, state: 'APROBADO', durationMs: Date.now() - start, detail: detail || null }); }
  catch (error) { checks.push({ name, state: 'FALLIDO', durationMs: Date.now() - start, code: error.code || 'ASSERTION', reason: /Missing expected rejection/.test(error.message || '') ? 'MISSING_EXPECTED_REJECTION' : /^[A-Z_]+$/.test(error.message || '') ? error.message : 'UNEXPECTED_LOCAL_RESULT' }); if (critical) throw error; }
}
async function authSnapshot(id) {
  const rows = [];
  for (const table of ['users', 'sessions', 'refresh_tokens', 'identities']) {
    const field = table === 'users' ? 'id::text' : 'user_id::text';
    const r = (await db.query("SELECT count(*)::int AS rows,md5(COALESCE(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),'')) AS digest FROM auth." + qi(table) + ' t WHERE ' + field + '=$1', [id])).rows[0];
    rows.push({ table, ...r });
  }
  return { rows: rows.map(r => ({ table: r.table, rows: r.rows })), digest: context.sha(JSON.stringify(rows)) };
}
function disk(bucket) {
  assert.ok([c.bucketA, c.bucketB].includes(bucket));
  const r = context.docker(['exec', 'supabase_storage_riovoley-e2e-local', 'find', '/mnt', '-type', 'f', '-path', '*/' + bucket + '/*', '-exec', 'sha256sum', '{}', '+']);
  assert.equal(r.status, 0, 'OWNED_DISK_INVENTORY_FAILED');
  const entries = r.stdout.split(/\r?\n/).filter(Boolean).map(line => {
    const m = line.match(/^([a-f0-9]{64})\s+(.+)$/); assert.ok(m); assert.ok(m[2].startsWith('/mnt/') && m[2].includes('/' + bucket + '/'));
    return { file: m[2], sha256: m[1] };
  }).sort((a, b) => a.file.localeCompare(b.file));
  return { files: entries.length, digest: context.sha(JSON.stringify(entries)), entries };
}
async function download(bucket, object = 'baseline.bin') {
  const r = await admin.storage.from(bucket).download(object); assert.ok(!r.error, 'STORAGE_DOWNLOAD_FAILED');
  return context.sha(Buffer.from(await r.data.arrayBuffer()));
}
async function install() {
  assert.match(owned.users[0], /^[a-f0-9-]{36}$/);
  await db.query('BEGIN');
  try {
    await db.query("SET LOCAL lock_timeout='2s';CREATE SCHEMA " + qi(c.schema));
    await db.query(`CREATE FUNCTION ${qi(c.schema)}.reject_owned_write() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $gate$
    DECLARE row_data jsonb; old_data jsonb='{}'::jsonb; scoped boolean;
    BEGIN
      IF session_user='postgres' AND current_user='postgres' AND current_setting('role')='none' THEN
        IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
      END IF;
      IF TG_OP='DELETE' THEN row_data=to_jsonb(OLD); ELSE row_data=to_jsonb(NEW); END IF;
      IF TG_OP='UPDATE' THEN old_data=to_jsonb(OLD); END IF;
      IF TG_TABLE_SCHEMA='auth' THEN
        IF TG_TABLE_NAME='users' THEN scoped=COALESCE(row_data->>'id'=${ql(owned.users[0])},false) OR COALESCE(old_data->>'id'=${ql(owned.users[0])},false);
        ELSE scoped=COALESCE(row_data->>'user_id'=${ql(owned.users[0])},false) OR COALESCE(old_data->>'user_id'=${ql(owned.users[0])},false); END IF;
      ELSE
        IF TG_TABLE_NAME='buckets' THEN scoped=COALESCE(row_data->>'id'=${ql(c.bucketA)},false) OR COALESCE(old_data->>'id'=${ql(c.bucketA)},false);
        ELSE scoped=COALESCE(row_data->>'bucket_id'=${ql(c.bucketA)},false) OR COALESCE(old_data->>'bucket_id'=${ql(c.bucketA)},false); END IF;
      END IF;
      IF scoped THEN RAISE EXCEPTION USING ERRCODE='55000',MESSAGE='RIOVOLEY_LOCAL_SERVICE_GATE'; END IF;
      IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END $gate$;REVOKE ALL ON SCHEMA ${qi(c.schema)} FROM PUBLIC;REVOKE ALL ON FUNCTION ${qi(c.schema)}.reject_owned_write() FROM PUBLIC;`);
    for (const table of ['auth.users', 'auth.sessions', 'auth.refresh_tokens', 'storage.objects', 'storage.buckets'])
      await db.query('CREATE TRIGGER ' + qi(c.trigger) + ' BEFORE INSERT OR UPDATE OR DELETE ON ' + table + ' FOR EACH ROW EXECUTE FUNCTION ' + qi(c.schema) + '.reject_owned_write()');
    await db.query('COMMIT'); gateInstalled = true;
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
async function release() {
  if (gateInstalled) {
    await db.query('BEGIN');
    try {
      await db.query("SET LOCAL lock_timeout='2s'");
      for (const table of ['auth.users', 'auth.sessions', 'auth.refresh_tokens', 'storage.objects', 'storage.buckets']) await db.query('DROP TRIGGER ' + qi(c.trigger) + ' ON ' + table);
      await db.query('DROP FUNCTION ' + qi(c.schema) + '.reject_owned_write();DROP SCHEMA ' + qi(c.schema) + ';COMMIT;'); gateInstalled = false;
    } catch (e) { await db.query('ROLLBACK'); throw e; }
  }
  assert.equal((await db.query('SELECT count(*)::int AS n FROM pg_trigger WHERE tgname=$1', [c.trigger])).rows[0].n, 0); cleanup.gateReleased = true;
}
async function setup() {
  db = await require('../security/local-db.cjs').connect();
  baselineFingerprint = (await db.query(fs.readFileSync(path.join(h.root, 'scripts/audit/production/catalog-fingerprint.sql'), 'utf8'))).rows[0].fingerprint;
  admin = client(config.serviceRoleKey); subject = client(config.anonKey); control = client(config.anonKey);
  persistOwnership();
  for (const email of owned.emails) {
    const r = await admin.auth.admin.createUser({ email, password: config.accounts.student.password, email_confirm: true, user_metadata: { role: 'estudiante', full_name: 'Auditoria local descartable' } });
    assert.ok(!r.error && r.data.user?.id, 'FIXTURE_AUTH_CREATE_FAILED'); owned.users.push(r.data.user.id); persistOwnership();
  }
  for (const bucket of [c.bucketA, c.bucketB]) {
    const r = await admin.storage.createBucket(bucket, { public: false }); assert.ok(!r.error, 'FIXTURE_BUCKET_CREATE_FAILED'); owned.buckets.push(bucket); persistOwnership();
    const up = await admin.storage.from(bucket).upload('baseline.bin', bytes, { contentType: 'application/octet-stream' }); assert.ok(!up.error, 'FIXTURE_STORAGE_UPLOAD_FAILED');
  }
}
async function run() {
  await check('creacion-fixtures-exclusivamente-locales', setup, true);
  await check('login-abierto-cuenta-seleccionada', async () => {
    const r = await subject.auth.signInWithPassword({ email: owned.emails[0], password: config.accounts.student.password }); assert.ok(!r.error && r.data.session, 'AUTH_BASELINE_LOGIN_FAILED'); sessionA = r.data.session;
  }, true);
  await check('login-abierto-cuenta-control', async () => { const r = await control.auth.signInWithPassword({ email: owned.emails[1], password: config.accounts.student.password }); assert.ok(!r.error, 'AUTH_CONTROL_LOGIN_FAILED'); }, true);
  await check('descarga-baseline-bytes-sinteticos', async () => {
    assert.equal(await download(c.bucketA), context.sha(bytes)); const baseline = disk(c.bucketA);
    assert.equal(baseline.files, 1, 'BASELINE_DISK_FILE_NOT_FOUND'); assert.equal(baseline.entries[0].sha256, context.sha(bytes), 'BASELINE_DISK_HASH_MISMATCH');
  }, true);
  beforeAuth = await authSnapshot(owned.users[0]); beforeDisk = disk(c.bucketA); observations.push({ stage: 'baseline', auth: beforeAuth, disk: beforeDisk });
  await check('instalacion-cinco-disparadores-condicionales', install, true);
  await check('login-seleccionado-rechazado', async () => { const r = await subject.auth.signInWithPassword({ email: owned.emails[0], password: config.accounts.student.password }); assert.ok(r.error, 'AUTH_GATE_DID_NOT_REJECT_LOGIN'); return { status: r.error.status || null }; });
  await check('refresh-seleccionado-rechazado', async () => { const r = await subject.auth.refreshSession({ refresh_token: sessionA.refresh_token }); assert.ok(r.error, 'AUTH_GATE_DID_NOT_REJECT_REFRESH'); return { status: r.error.status || null }; });
  await check('jwt-previo-conserva-lectura-durante-cierre-de-escrituras', async () => { const r = await admin.auth.getUser(sessionA.access_token); assert.ok(!r.error && r.data.user.id === owned.users[0], 'AUTH_PRIOR_JWT_READ_FAILED'); });
  await check('borrado-auth-seleccionado-rechazado', async () => { const r = await admin.auth.admin.deleteUser(owned.users[0]); assert.ok(r.error, 'AUTH_GATE_DID_NOT_REJECT_DELETE'); });
  await check('login-cuenta-control-no-afectado', async () => { const r = await control.auth.signInWithPassword({ email: owned.emails[1], password: config.accounts.student.password }); assert.ok(!r.error, 'AUTH_CONTROL_FROZEN_UNEXPECTEDLY'); });
  await check('subida-nueva-storage-seleccionada-rechazada', async () => { const r = await admin.storage.from(c.bucketA).upload('new.bin', changedBytes); assert.ok(r.error, 'STORAGE_GATE_DID_NOT_REJECT_UPLOAD'); });
  await check('upsert-storage-seleccionado-rechazado', async () => { const r = await admin.storage.from(c.bucketA).upload('baseline.bin', changedBytes, { upsert: true }); assert.ok(r.error, 'STORAGE_GATE_DID_NOT_REJECT_UPSERT'); });
  await check('reasignacion-sql-no-elude-alcance-del-bucket-anterior', async () => {
    const { Client } = require(path.join(h.runtime, 'sql-driver/node_modules/pg'));
    const storageDb = new Client({ host: '127.0.0.1', port: 55322, database: 'postgres', user: 'supabase_storage_admin',
      password: process.env.RIOVOLEY_LOCAL_DB_PASSWORD || 'postgres', ssl: false, connectionTimeoutMillis: 5000, query_timeout: 10000 });
    await storageDb.connect(); await storageDb.query('BEGIN');
    try {
      assert.equal((await storageDb.query('SELECT session_user')).rows[0].session_user, 'supabase_storage_admin');
      await assert.rejects(() => storageDb.query("UPDATE storage.objects SET bucket_id=$1,name='relocated.bin' WHERE bucket_id=$2 AND name='baseline.bin'", [c.bucketB, c.bucketA]),
        error => error.code === '55000' && error.message === 'RIOVOLEY_LOCAL_SERVICE_GATE');
    } finally { await storageDb.query('ROLLBACK'); await storageDb.end(); }
  });
  await check('borrado-storage-seleccionado-rechazado', async () => { const r = await admin.storage.from(c.bucketA).remove(['baseline.bin']); assert.ok(r.error, 'STORAGE_GATE_DID_NOT_REJECT_DELETE'); });
  await check('movimiento-http-entre-buckets-rechazado', async () => { const r = await admin.storage.from(c.bucketA).move('baseline.bin', 'moved.bin', { destinationBucket: c.bucketB }); assert.ok(r.error, 'STORAGE_GATE_DID_NOT_REJECT_MOVE'); });
  await check('subida-bucket-control-no-afectada', async () => { const r = await admin.storage.from(c.bucketB).upload('new.bin', changedBytes); assert.ok(!r.error, 'STORAGE_CONTROL_FROZEN_UNEXPECTEDLY'); });
  await check('filas-auth-seleccionadas-sin-cambios', async () => { assert.deepEqual(await authSnapshot(owned.users[0]), beforeAuth, 'AUTH_GATE_ALLOWED_ROW_CHANGE'); });
  await check('metadatos-storage-seleccionados-conservados', async () => { const r = await admin.storage.from(c.bucketA).list(); assert.ok(!r.error); assert.deepEqual(r.data.map(o => o.name).sort(), ['baseline.bin']); });
  await check('bytes-descargables-originales-conservados', async () => { assert.equal(await download(c.bucketA), context.sha(bytes), 'STORAGE_GATE_CHANGED_DOWNLOAD_BYTES'); });
  const afterDisk = disk(c.bucketA); observations.push({ stage: 'after-frozen-operations', auth: await authSnapshot(owned.users[0]), disk: afterDisk });
  await check('inventario-fisico-owned-sin-cambios', async () => { assert.deepEqual(afterDisk, beforeDisk, 'STORAGE_GATE_CHANGED_PHYSICAL_BYTES'); });
  await check('retirada-de-barrera', release, true);
  await check('login-seleccionado-restablecido', async () => { const r = await subject.auth.signInWithPassword({ email: owned.emails[0], password: config.accounts.student.password }); assert.ok(!r.error, 'AUTH_POST_GATE_LOGIN_FAILED'); });
  await check('subida-storage-restablecida', async () => { const r = await admin.storage.from(c.bucketA).upload('new.bin', changedBytes); assert.ok(!r.error, 'STORAGE_POST_GATE_UPLOAD_FAILED'); assert.equal(await download(c.bucketA, 'new.bin'), context.sha(changedBytes)); });
  await check('movimiento-http-restablecido-y-bytes-conservados', async () => { const r = await admin.storage.from(c.bucketA).move('baseline.bin', 'moved.bin', { destinationBucket: c.bucketB }); assert.ok(!r.error, 'STORAGE_POST_GATE_MOVE_FAILED'); assert.equal(await download(c.bucketB, 'moved.bin'), context.sha(bytes)); });
}
async function finish() {
  if (db) try { await release(); } catch (e) { cleanup.errors.push({ stage: 'gate-release', code: e.code || 'ASSERTION' }); }
  if (admin && cleanup.gateReleased) {
    for (const bucket of owned.buckets) try {
      const r = await admin.storage.from(bucket).remove(owned.objects); assert.ok(!r.error);
      const empty = await admin.storage.emptyBucket(bucket); assert.ok(!empty.error);
      const removed = await admin.storage.deleteBucket(bucket); assert.ok(!removed.error);
    } catch (e) { cleanup.errors.push({ stage: 'owned-bucket-cleanup', code: e.code || 'ASSERTION' }); }
    for (const id of owned.users) try {
      const r = await admin.auth.admin.deleteUser(id); assert.ok(!r.error); await db.query('DELETE FROM core.users WHERE id=$1', [id]);
    } catch (e) { cleanup.errors.push({ stage: 'owned-user-cleanup', code: e.code || 'ASSERTION' }); }
    cleanup.authUsersRemoved = Number((await db.query('SELECT count(*)::int AS n FROM auth.users WHERE id=ANY($1::uuid[])', [owned.users])).rows[0].n) === 0;
    cleanup.bucketsRemoved = Number((await db.query('SELECT count(*)::int AS n FROM storage.buckets WHERE id=ANY($1::text[])', [owned.buckets])).rows[0].n) === 0;
    cleanup.coreUsersRemoved = Number((await db.query('SELECT count(*)::int AS n FROM core.users WHERE id=ANY($1::uuid[])', [owned.users])).rows[0].n) === 0;
    cleanup.residualOwnedPhysicalFiles = [disk(c.bucketA), disk(c.bucketB)].reduce((sum, d) => sum + d.files, 0);
  }
  if (db) { cleanup.catalogFingerprintRestored = (await db.query(fs.readFileSync(path.join(h.root, 'scripts/audit/production/catalog-fingerprint.sql'), 'utf8'))).rows[0].fingerprint === baselineFingerprint; await db.end(); }
}
(async () => {
  let failure;
  try { await run(); } catch (e) { failure = e; }
  finally {
    try { await finish(); } catch (e) { cleanup.errors.push({ stage: 'cleanup-final', code: e.code || 'ASSERTION' }); }
    const cleanupPassed = cleanup.gateReleased && cleanup.authUsersRemoved && cleanup.bucketsRemoved && cleanup.coreUsersRemoved && cleanup.catalogFingerprintRestored && cleanup.residualOwnedPhysicalFiles === 0 && cleanup.errors.length === 0;
    const relative = file => path.relative(h.evidence, file).replaceAll('\\', '/');
    const httpFile = relative(h.write('integracion/http-servicios.json', { requests: http, headersPublished: false, bodiesPublished: false, externalRequestsAllowed: false }));
    const observationsFile = relative(h.write('integracion/observaciones-auth-storage.json', observations));
    const cleanupFile = relative(h.write('integracion/limpieza-fixtures.json', { ...cleanup, mandatoryPostconditionsPassed: Boolean(cleanupPassed) }));
    const result = { at: new Date().toISOString(), executed: checks.length, passed: checks.filter(t => t.state === 'APROBADO').length, failed: checks.filter(t => t.state === 'FALLIDO').length,
      completed: !failure, errorCode: failure?.code || null, checks, cleanupPassed: Boolean(cleanupPassed), productionChanged: false, messagesSentExternally: false,
      newProviderKeysGenerated: false, existingPasswordsChanged: false, discardableAccountsCreated: owned.users.length, localFixturePasswordReused: true };
    const resultFile = relative(h.write('integracion/resultados-servicios.json', result));
    const manifest = relative(h.write('integracion/intento-servicios-' + Date.now() + '.json', { recordedAt: new Date().toISOString(), httpFile, observationsFile, cleanupFile, resultFile,
      completed: result.completed, passed: result.passed, failed: result.failed, cleanupPassed: Boolean(cleanupPassed) }));
    console.log(JSON.stringify({ executed: result.executed, passed: result.passed, failed: result.failed, completed: result.completed, manifest,
      gateReleased: cleanup.gateReleased, cleanupPassed: Boolean(cleanupPassed), cleanupErrors: cleanup.errors.length, residualOwnedPhysicalFiles: cleanup.residualOwnedPhysicalFiles, productionChanged: false }));
    if (failure || result.failed || !cleanupPassed) process.exitCode = 1;
  }
})();
