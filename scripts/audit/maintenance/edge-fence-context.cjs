'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const { root, runtime } = require('../../e2e/local/safety.cjs');
const names = ['send-email', 'send-push', 'send-payment-reminders', 'generate-report', 'generate-scheduled-reports', 'delete-report-run', 'sync-mobile-device', 'delete-auth-user', 'update-user-password'];
const pointer = path.join(runtime, 'edge-fence-current.json');
function read() {
  const c = JSON.parse(fs.readFileSync(pointer)); assert.ok(c.evidence.startsWith(path.join(root, 'docs/tesis/evidencias/verificacion-tecnica') + path.sep));
  assert.ok(c.privateDir.startsWith(path.join(runtime, 'edge-fence') + path.sep)); assert.ok(!fs.existsSync(path.join(c.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET'); return c;
}
async function init() {
  const db = await require('../security/local-db.cjs').connect(); const serverVersion = (await db.query('SHOW server_version')).rows[0].server_version; await db.end();
  const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-edge-fence-' + commit.slice(0, 7));
  const privateDir = path.join(runtime, 'edge-fence', stamp); assert.ok(!fs.existsSync(evidence) && !fs.existsSync(privateDir));
  for (const dir of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, dir), { recursive: true });
  fs.mkdirSync(privateDir, { recursive: true });
  const c = { createdAt: new Date().toISOString(), baseCommit: commit, evidence, privateDir, names, port: 6163,
    osRelease: require('node:os').release(), node: process.version, serverVersion, productionChanged: false };
  fs.writeFileSync(pointer, JSON.stringify(c, null, 2)); fs.writeFileSync(path.join(privateDir, 'context.json'), JSON.stringify(c, null, 2), { flag: 'wx' });
  fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
  require('../../e2e/local/harness.cjs').write('CONTEXTO.json', { ...c, evidence: path.relative(root, evidence).replaceAll('\\', '/'), privateDir: path.relative(root, privateDir).replaceAll('\\', '/'),
    api: 'http://127.0.0.1:55321', providerCredentialsUsed: false, providerConfigurationSynthetic: true, cloudRuntimeUsed: false });
  console.log(path.relative(root, evidence));
}
if (require.main === module) init().catch(e => { console.error(JSON.stringify({ stage: 'EDGE_FENCE_SETUP', code: e.code || 'ASSERTION' })); process.exitCode = 1; });
module.exports = { read, names };
