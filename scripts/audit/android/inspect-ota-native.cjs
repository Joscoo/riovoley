'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const assert = require('node:assert/strict'), crypto = require('node:crypto');
const h = require('../../e2e/local/harness.cjs'), { readLocal } = require('../../e2e/local/safety.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const native = JSON.parse(fs.readFileSync(path.join(h.runtime, 'native-local-current.json')));
const receipt = JSON.parse(fs.readFileSync(path.join(h.evidence, 'android/apk-local-compilado.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(native.apk)).digest('hex'), receipt.sha256);
const local = readLocal(), known = new Set([local.serviceRoleKey, ...Object.values(local.accounts).map(a => a.password)]);
for (const name of fs.readdirSync(h.root).filter(n => /^\.env(?:\.|$)/.test(n) && !n.includes('example'))) {
  const file = path.join(h.root, name);
  if (!fs.statSync(file).isFile()) continue;
  for (const [key, value] of Object.entries(require('dotenv').parse(fs.readFileSync(file)))) {
    if (/KEY|TOKEN|SECRET|PASSWORD|PHONE|EMAIL/.test(key) && value.length >= 12 && ![local.anonKey, local.piiEncryptionKey].includes(value)) known.add(value);
  }
}
const source = String.raw`import sys,json,zipfile,pathlib
sys.path.insert(0,str(pathlib.Path.cwd()/'scripts/audit/android'))
from scan_archive import contains_sensitive
inputs=json.load(sys.stdin); issues=[]; checked=0; maps=[]; panel=[]
with zipfile.ZipFile(sys.argv[1]) as archive:
 for entry in archive.infolist():
  if entry.is_dir(): continue
  checked+=1; data=archive.read(entry.filename)
  if entry.filename.startswith('assets/public/') and entry.filename.endswith('.map'): maps.append(entry.filename)
  if entry.filename.startswith('assets/public/') and entry.filename.endswith('.js') and b'Estado OTA Android' in data: panel.append(entry.filename)
  for value in inputs['allowedLocalClientInputs']:
   for encoding in ('utf-8','utf-16-le','utf-16-be'): data=data.replace(value.encode(encoding),b'[LOCAL_CLIENT_FIXTURE]')
  if contains_sensitive(data,inputs['forbidden']): issues.append(entry.filename)
print(json.dumps({'archiveMembersChecked':checked,'unresolved':issues,'publicSourceMaps':maps,'otaPanelLiteralInJavaScript':panel}))`;
const scan = cp.spawnSync('python', ['-c', source, native.apk], { cwd: h.root, windowsHide: true, encoding: 'utf8',
  input: JSON.stringify({ forbidden: [...known].filter(v => typeof v === 'string' && v.length >= 12), allowedLocalClientInputs: [local.anonKey, local.piiEncryptionKey] }), maxBuffer: 4 * 1024 * 1024 });
if (scan.status !== 0) console.error(JSON.stringify({ stage: 'PRIVATE_APK_SCAN_FAILED', errorClass: (scan.stderr || '').match(/([A-Za-z]+Error):/)?.[1] || scan.error?.code || 'UNKNOWN', diagnosticsContainNoValues: true }));
assert.equal(scan.status, 0, 'PRIVATE_APK_SCAN_FAILED');
const result = JSON.parse(scan.stdout);
h.write('seguridad/privacidad-apk-local.json', { checkedAt: new Date().toISOString(), ...result,
  expectedLocalClientInputsAllowedOnlyInPrivateApk: true, institutionalOrServerValuesPublished: false,
  scope: 'Miembros ZIP descomprimidos: valores institucionales conocidos de dotenv, clave server y passwords locales prohibidos; patrón JWT con exclusión exacta de anon local. Entradas anon/PII locales solo se toleran en el APK privado, nunca se publican. No es garantía universal.' });
assert.equal(result.unresolved.length, 0, 'UNEXPECTED_PRIVATE_VALUES_IN_APK');
assert.equal(result.publicSourceMaps.length, 0, 'UNEXPECTED_PUBLIC_MAPS');
// An omitted CRA variable can leave the guarded branch as text in the bundle.
// Literal presence is recorded; actual visibility is asserted in native WebView.
for (const name of ['web-build', 'capacitor-sync', 'gradle', 'signature']) {
  for (const stream of ['stdout', 'stderr']) {
    let text = fs.readFileSync(path.join(native.work, name + '.' + stream + '.private.log'), 'utf8');
    if (process.env.USERPROFILE) text = text.replaceAll(process.env.USERPROFILE, '[PERFIL_LOCAL]').replaceAll(process.env.USERPROFILE.replaceAll('\\', '/'), '[PERFIL_LOCAL]');
    h.write((name === 'web-build' ? 'compilacion-web/' : 'android/') + name + '.' + stream + '.log', text);
  }
}
h.write('android/fuentes-y-artefacto.json', { checkedAt: new Date().toISOString(), sourceCommit: receipt.sourceCommit,
  appSourceMatchesInitialContext: JSON.parse(fs.readFileSync(path.join(h.evidence, 'CONTEXTO.json'))).appSourceSha256 === crypto.createHash('sha256').update(fs.readFileSync(path.join(h.root, 'src/App.js'))).digest('hex'),
  apkSha256: receipt.sha256, bytes: receipt.bytes, panelTextFiles: result.otaPanelLiteralInJavaScript.length, sourceMaps: 0,
  diagnosticsFlag: 'omitted', literalAbsenceIsNotAVisibilityRequirement: true,
  signedWithProductionIdentity: false, distributed: false, nativeBuildExecuted: true });
console.log(JSON.stringify({ state: 'APROBADO', archiveMembersChecked: result.archiveMembersChecked, issues: 0, otaPanelLiteralFiles: result.otaPanelLiteralInJavaScript.length, publicSourceMaps: 0, uiVisibilityRequiresRuntimeCheck: true }));
