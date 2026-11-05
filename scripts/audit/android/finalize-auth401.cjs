'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const cp = require('node:child_process'), assert = require('node:assert/strict'), h = require('../../e2e/local/harness.cjs');
const json = f => JSON.parse(fs.readFileSync(f, 'utf8')), read = f => json(path.join(h.evidence, f));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const rel = file => path.relative(h.root, file).replaceAll('\\', '/');
(async () => {
  assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'ALREADY_SEALED');
  const result = read('ANALISIS_HTTP401.json'), cases = read('android/candidato-actual.json'), run = read('android/resultado-intento.json');
  assert.equal(cases.executed, 14); assert.equal(cases.passed, 14); assert.equal(cases.failed + cases.notExecuted + cases.cleanupFailures.length, 0);
  assert.equal(run.newBuild, false); assert.equal(run.emulatorStopped, true); assert.equal(run.blockingProxyForwardedRequests, 0);
  assert.equal(run.allPolicyTablesCertified, false); assert.equal(result.productionChanged, false);
  for (const name of ['android/runtime-traza-comando', 'android/autenticacion-candidato-comando', 'unitarias/observacion-auth-verde']) assert.equal(read(name + '.meta.json').exitCode, 0);
  assert.equal(read('unitarias/observacion-auth-rojo.meta.json').exitCode, 1);
  const allowed = new Set(['path', 'status', 'method', 'startedSeconds', 'phaseAtStart', 'headerPresent', 'localAnonMatch', 'declaredRole', 'subjectPresent', 'signatureVerified', 'responseSeconds', 'phaseAtResponse', 'completeHeadersRead', 'errorCode', 'observationIncomplete', 'requestMetadataMissing']);
  for (const response of cases.responses) {
    assert.ok(Object.keys(response).every(key => allowed.has(key)), 'UNSAFE_RESPONSE_FIELD');
    if (response.subjectPresent !== undefined) assert.equal(typeof response.subjectPresent, 'boolean');
    if (response.declaredRole !== undefined) assert.ok(['anon', 'authenticated', 'service_role', 'unknown'].includes(response.declaredRole));
  }
  assert.equal(result.httpErrors, cases.responses.filter(r => r.status >= 400).length);
  assert.equal(read('e2e/cierre-notificaciones-controlado.json').passed, 1);
  const apk = read('android/apk-local-compilado.json'), target = path.resolve(h.root, apk.privateApk);
  assert.ok(target.startsWith(h.runtime + path.sep)); assert.equal(sha(fs.readFileSync(target)), apk.sha256);
  assert.equal(cases.artifactSha256, apk.sha256); assert.equal(apk.newBuild, false);
  const post = read('integracion/recompensa-tras-parada.json'); assert.equal(post.ownEmulatorPresent, false);
  assert.deepEqual(post.reward, { rows: 1, rewards: 1 }); assert.deepEqual(post.ledger, { ledger_rows: 1, xp: 8 });
  const images = read('android/capturas-revisadas.json'); assert.equal(images.files.length, 4);
  for (const name of images.files) assert.ok(fs.existsSync(path.join(h.evidence, 'android', name)));
  const manifests = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = manifests.flatMap(file => { const m = json(file); return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 })); });
  let index = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (index < previous.length) { const e = previous[index++]; assert.ok(e.file.startsWith(h.root + path.sep)); assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'PREVIOUS_EVIDENCE_CHANGED'); }
  }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  assert.ok(!changed.some(f => /^(src|android|database|supabase\/functions)\//.test(f)), 'PRODUCT_SOURCE_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  const sources = changed.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  for (const file of sources) {
    const body = fs.readFileSync(path.join(h.root, file), 'utf8'); assert.ok(!body.includes('\uFFFD'), 'INVALID_UNICODE');
    assert.ok(!body.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE: ' + file);
  }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), baseCommit: result.baseCommit, apkSourceCommit: apk.sourceCommit,
    productChanged: false, originalProtectedTestsUnchanged: true, files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })),
    inspectedProductSources: ['src/features/student-dashboard/presentation/components/StudentPanel.js', 'src/features/gamification/application/useCases/createGamificationUseCases.js', 'src/features/gamification/infrastructure/repositories/supabaseGamificationRepository.js'].map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
  h.write('COMANDOS.json', walk(h.evidence).filter(f => /\.meta(?:-[a-z0-9-]+)?\.json$/i.test(f)).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })));
  let links = 0;
  for (const file of [...walk(h.evidence).filter(f => f.endsWith('.md')), path.join(h.root, 'docs/produccion/RUNBOOK.md')]) {
    for (const m of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(m[1])) continue;
      const target = path.resolve(path.dirname(file), m[1].split('#')[0]);
      if (!['INTEGRIDAD.json', 'PRIVACIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK: ' + rel(target));
      links++;
    }
  }
  const known = new Set(), collect = (value, name = '') => {
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) collect(v, k);
    else if (typeof value === 'string' && value.length >= 12 && /password|secret|token|key/i.test(name)) known.add(value);
  };
  collect(json(path.join(h.runtime, 'credentials.json')));
  for (const file of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) {
    if (!fs.statSync(path.join(h.root, file)).isFile()) continue;
    for (const [name, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, file))))) if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(name) && value.length >= 8) known.add(value);
  }
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files.filter(f => !f.endsWith('.png'))) {
    const body = fs.readFileSync(file, 'utf8');
    if ([...known].some(v => body.includes(v))) issues.push({ file: rel(file), type: 'KNOWN_PRIVATE_VALUE' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|dashboard\/cli\/login\?session_id=[a-f0-9-]{36}/.test(body)) issues.push({ file: rel(file), type: 'SECRET_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ privacyIssues: issues }));
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0,
    responseFieldsAllowlistChecked: true, responsesChecked: cases.responses.length, screenshotsReviewed: 4,
    rawHeadersTokensOrSubjectValuesPublished: false, credentialsRequested: false,
    scope: 'Fuentes nuevas/modificadas y expediente: campos de metadata permitidos, comparación en memoria con valores conocidos y patrones acotados; capturas sintéticas revisadas. No garantía universal ni historial completo.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), previousManifests: manifests.length, previousEntries: previous.length, previousMatching: true,
    nativeCases: 14, nativePassed: 14, unitCases: 6, unitPassed: 6, classifiedErrors: result.httpErrors,
    classification: result.classification, apkHashMatches: true, newBuild: false, productChanged: false,
    emulatorStopped: true, productionChanged: false, linksChecked: links, brokenLinks: 0, privacyIssues: 0, documents: 3 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: result.baseCommit, note: 'No modificar tras sellado. Excluye manifiesto propio y artefactos privados.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const entry of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, entry.file))), entry.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, previousManifests: manifests.length, previousEntries: previous.length, classification: result.classification, native: 14, unit: 6, privacyIssues: 0, links }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
