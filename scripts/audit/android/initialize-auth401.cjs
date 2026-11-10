'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const { root, runtime } = require('../../e2e/local/safety.cjs');
const commit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', cwd: root }).trim();
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-http401-' + commit.slice(0, 7));
const saved = path.join(runtime, 'native-auth401-contexts', stamp);
assert.ok(!fs.existsSync(evidence) && !fs.existsSync(saved)); fs.mkdirSync(saved, { recursive: true });
for (const file of ['evidence-dir.txt', 'native-local-current.json', 'android-audit-context.json', 'emulator-audit.json']) fs.copyFileSync(path.join(runtime, file), path.join(saved, file), fs.constants.COPYFILE_EXCL);
for (const name of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, name), { recursive: true });
fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
const h = require('../../e2e/local/harness.cjs'), native = JSON.parse(fs.readFileSync(path.join(runtime, 'native-local-current.json')));
const receipt = JSON.parse(fs.readFileSync(path.join(native.work, 'receipt.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(native.apk)).digest('hex'), receipt.sha256);
h.write('CONTEXTO.json', { startedAt: new Date().toISOString(), baseCommit: commit,
  scope: 'Diagnostico HTTP401 local con APK existente; sin nuevas claves, compilacion o cambios institucionales.',
  newBuild: false, apkSourceCommit: receipt.sourceCommit, productionChanged: false, credentialsRequested: false });
h.write('android/apk-local-compilado.json', { ...receipt, newBuild: false,
  reference: '../20261104-225654-android-ota-c9a3079/android/apk-local-compilado.json',
  note: 'Referencia al APK privado existente, hash comprobado; no es una compilacion de esta fase.' });
console.log(path.relative(root, evidence));
