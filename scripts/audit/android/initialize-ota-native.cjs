'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { root, runtime } = require('../../e2e/local/safety.cjs');
const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const notificationFix = process.argv.includes('--notifications-cancel');
const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + (notificationFix ? '-notifications-cancel-' : '-android-ota-') + commit.slice(0, 7));
const saved = path.join(runtime, 'native-ota-contexts', stamp);
assert.ok(!fs.existsSync(evidence) && !fs.existsSync(saved), 'NEW_CONTEXT_REQUIRED');
fs.mkdirSync(saved, { recursive: true });
for (const name of ['evidence-dir.txt', 'native-local-current.json', 'android-audit-context.json', 'emulator-audit.json']) {
  const source = path.join(runtime, name);
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(saved, name), fs.constants.COPYFILE_EXCL);
}
for (const name of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, name), { recursive: true });
fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
require('../../e2e/local/harness.cjs').write('CONTEXTO.json', { startedAt: new Date().toISOString(), baseCommit: commit,
  scope: notificationFix ? 'Correccion de continuaciones de notificaciones tras logout, regresion y compilacion local.' : 'Reconstruccion debug y verificacion WebView del candidato OTA contra laboratorio descartable existente.',
  appSourceSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'src/App.js'))).digest('hex'),
  productionChanged: false, credentialsRequested: false, releaseSigningUsed: false, deployed: false,
  previousPointersPreserved: path.relative(root, saved).replaceAll('\\', '/') });
console.log(path.relative(root, evidence));
