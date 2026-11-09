'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), cp = require('node:child_process'), assert = require('node:assert/strict');
const safety = require('../../e2e/local/safety.cjs'), { root, runtime } = safety;
const pointer = path.join(runtime, 'service-gate-current.json');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function read() {
  const c = JSON.parse(fs.readFileSync(pointer)); assert.match(c.tag, /^rv-gate-\d{14}-[a-f0-9]{6}$/);
  assert.ok(c.evidence.startsWith(path.join(root, 'docs/tesis/evidencias/verificacion-tecnica') + path.sep));
  assert.ok(!fs.existsSync(path.join(c.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET');
  assert.equal(c.apiUrl, 'http://127.0.0.1:55321'); return c;
}
function latestAttempt() {
  const c = read(), dir = path.join(c.evidence, 'integracion');
  const attempts = fs.readdirSync(dir).filter(f => /^intento-servicios-[a-z0-9-]+\.json$/.test(f)).map(file => {
    const record = JSON.parse(fs.readFileSync(path.join(dir, file))); assert.ok(Number.isFinite(Date.parse(record.recordedAt)));
    for (const key of ['resultFile', 'httpFile', 'observationsFile', 'cleanupFile']) {
      assert.ok(typeof record[key] === 'string' && record[key].startsWith('integracion/'));
      assert.ok(path.resolve(c.evidence, record[key]).startsWith(c.evidence + path.sep));
    }
    return { ...record, file: 'integracion/' + file };
  }).sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  assert.ok(attempts.length > 0, 'SERVICE_ATTEMPT_REQUIRED'); return attempts[0];
}
function docker(args) {
  return cp.spawnSync('docker', safety.dockerArgs(args), { env: safety.localDockerEnv(), windowsHide: true, encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024 });
}
async function initialize() {
  const db = await require('../security/local-db.cjs').connect();
  const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const start = new Date(), stamp = start.toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15), nonce = crypto.randomBytes(3).toString('hex');
  const tag = 'rv-gate-' + stamp.replace('-', '') + '-' + nonce;
  const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-auth-storage-local-' + commit.slice(0, 7)); assert.ok(!fs.existsSync(evidence));
  const info = docker(['inspect', 'supabase_storage_riovoley-e2e-local']); assert.equal(info.status, 0);
  const container = JSON.parse(info.stdout)[0]; assert.equal(container.Name, '/supabase_storage_riovoley-e2e-local'); assert.equal(container.State.Running, true);
  const env = Object.fromEntries(container.Config.Env.map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
  assert.equal(env.STORAGE_BACKEND, 'file'); assert.equal(env.FILE_STORAGE_BACKEND_PATH, '/mnt');
  let serverVersion, baselineFingerprint;
  try {
    serverVersion = (await db.query('SHOW server_version')).rows[0].server_version;
    baselineFingerprint = (await db.query(fs.readFileSync(path.join(root, 'scripts/audit/production/catalog-fingerprint.sql'), 'utf8'))).rows[0].fingerprint;
  } finally { await db.end(); }
  const c = { createdAt: start.toISOString(), baseCommit: commit, tag, nonce, evidence, apiUrl: 'http://127.0.0.1:55321',
    schema: 'rio_service_gate_' + nonce, trigger: 'rio_service_probe_' + nonce, bucketA: tag + '-a', bucketB: tag + '-b',
    privateDir: path.join(runtime, 'service-gate', tag), priorEvidence: fs.readFileSync(path.join(runtime, 'evidence-dir.txt'), 'utf8').trim(),
    osRelease: require('node:os').release(), node: process.version, serverVersion, baselineFingerprint,
    storageImage: container.Config.Image, storageImageId: container.Image, storageBackend: 'file', storageRoot: '/mnt', productionChanged: false };
  for (const dir of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, dir), { recursive: true });
  fs.mkdirSync(c.privateDir, { recursive: true }); fs.writeFileSync(path.join(c.privateDir, 'context.json'), JSON.stringify(c, null, 2), { flag: 'wx' });
  fs.writeFileSync(pointer, JSON.stringify(c, null, 2)); fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
  require('../../e2e/local/harness.cjs').write('CONTEXTO.json', { ...c, evidence: path.relative(root, evidence).replaceAll('\\', '/'),
    privateDir: path.relative(root, c.privateDir).replaceAll('\\', '/'), priorEvidence: path.relative(root, c.priorEvidence).replaceAll('\\', '/'),
    credentialsRequested: false, institutionalRowsUsed: false, messagesSentExternally: false });
  console.log(JSON.stringify({ evidence: path.relative(root, evidence), localApiVerified: true, storageBackend: 'file', productionChanged: false }));
}
if (require.main === module) initialize().catch(e => { console.error(JSON.stringify({ stage: 'SERVICE_GATE_SETUP', code: e.code || 'ASSERTION' })); process.exitCode = 1; });
module.exports = { read, docker, sha, latestAttempt };
