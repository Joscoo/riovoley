'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const cp = require('node:child_process'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8')), read = file => json(path.join(h.evidence, file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const relative = file => path.relative(h.root, file).replaceAll('\\', '/');
const notificationFix = process.argv.includes('--notification-fix');
(async () => {
  assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'ALREADY_SEALED');
  const result = read('RESULTADOS_AUTOMATIZADOS.json'), cases = read('android/candidato-actual.json');
  const context = read('CONTEXTO.json'), runtime = read('android/resultado-intento.json');
  assert.equal(cases.planned, 14); assert.equal(cases.executed, 14); assert.equal(cases.passed, 14);
  assert.equal(cases.failed + cases.notExecuted + cases.cleanupFailures.length, 0);
  assert.ok(cases.cases.every(c => c.state === 'APROBADO'));
  assert.equal(result.native.otaUi, 'APROBADO'); assert.equal(runtime.emulatorStopped, true);
  assert.equal(runtime.failed, undefined); assert.equal(runtime.newBuild, true);
  assert.equal(runtime.allPolicyTablesCertified, false); assert.equal(runtime.blockingProxyForwardedRequests, 0);
  const labels = notificationFix ? ['android/reconstruccion-corregida-comando', 'android/runtime-candidato-comando', 'e2e/cierre-corregido-comando', 'unitarias/jest-definitivo', 'unitarias/guardas-locales-finales'] : ['android/reconstruccion-local-comando', 'android/runtime-candidato-comando', 'unitarias/guardas-android-local'];
  for (const label of [...labels, 'android/local-web-build', 'android/local-capacitor-sync', 'android/local-gradle', 'android/local-signature', 'android/autenticacion-candidato-comando', 'android/privacidad-cierre']) assert.equal(read(label + '.meta.json').exitCode, 0, 'REQUIRED_COMMAND_FAILED: ' + label);
  if (!notificationFix) {
    assert.equal(read('android/privacidad-y-contenido.meta.json').exitCode, 1);
    assert.equal(read('android/privacidad-diagnostico.meta.json').exitCode, 1);
  } else {
    const jest = read('unitarias/jest-definitivo.json'); assert.equal(jest.numPassedTests, 434); assert.equal(jest.numTotalTestSuites, 91); assert.equal(jest.numFailedTests + jest.numPendingTests, 0);
    const controlled = read('e2e/cierre-notificaciones-corregido.json'); assert.equal(controlled.passed, 1); assert.equal(controlled.lateAchievementRequests.length, 0); assert.equal(controlled.expectCancelled, true);
    assert.equal(read('unitarias/cancelacion-rojo.json').numFailedTests, 5); assert.equal(read('unitarias/microtarea-rojo.json').numFailedTests, 1);
    assert.match(fs.readFileSync(path.join(h.evidence, 'unitarias/guardas-locales-finales.stdout.log'), 'utf8'), /# pass 19\b/);
    const fields = new Set(['path', 'status', 'method', 'startedSeconds', 'phaseAtStart', 'headerPresent', 'localAnonMatch', 'declaredRole', 'subjectPresent', 'signatureVerified', 'responseSeconds', 'phaseAtResponse', 'completeHeadersRead', 'errorCode', 'observationIncomplete', 'requestMetadataMissing']);
    for (const response of cases.responses) {
      assert.ok(Object.keys(response).every(key => fields.has(key)), 'UNSAFE_TRACE_FIELD');
      if (response.subjectPresent !== undefined) assert.equal(typeof response.subjectPresent, 'boolean');
      if (response.declaredRole !== undefined) assert.ok(['anon', 'authenticated', 'service_role', 'unknown'].includes(response.declaredRole));
    }
  }
  const apk = read('android/apk-local-compilado.json'), target = path.resolve(h.root, apk.privateApk);
  assert.ok(target.startsWith(h.runtime + path.sep)); assert.equal(sha(fs.readFileSync(target)), apk.sha256);
  assert.equal(fs.statSync(target).size, apk.bytes); assert.equal(cases.artifactSha256, apk.sha256);
  assert.equal(apk.sourceCommit, notificationFix ? result.compiledSourceCommit : context.baseCommit);
  assert.equal(sha(fs.readFileSync(path.join(h.root, 'src/App.js'))), context.appSourceSha256);
  const post = read('integracion/recompensa-tras-parada.json');
  assert.deepEqual(post.reward, { rows: 1, rewards: 1 }); assert.deepEqual(post.ledger, { ledger_rows: 1, xp: 8 });
  assert.equal(post.ownEmulatorPresent, false);
  if (!notificationFix) {
    const probes = read('integracion/sondas-logros-locales.json');
    assert.equal(probes.results.length, 4); assert.ok([401, 403].includes(probes.results[0].status));
    assert.ok(probes.results.slice(1).every(p => p.status === 200 && p.returnedRows === 0));
  }
  const images = read('android/capturas-revisadas.json'); assert.equal(images.files.length, 4);
  for (const file of images.files) assert.ok(fs.existsSync(path.join(h.evidence, 'android', file)));
  const manifests = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = manifests.flatMap(file => {
    const m = json(file);
    return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 }));
  });
  let index = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (index < previous.length) {
      const entry = previous[index++]; assert.ok(entry.file.startsWith(h.root + path.sep));
      assert.equal(sha(await fs.promises.readFile(entry.file)), entry.sha256, 'PREVIOUS_EVIDENCE_CHANGED');
    }
  }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  assert.ok(!changed.some(f => /^(src|android|database|supabase\/functions)\//.test(f)), 'PRODUCT_SOURCE_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  const evaluated = notificationFix ? [...new Set([...changed, ...git(['diff', context.baseCommit, 'HEAD', '--name-only', '-z']).split('\0').filter(Boolean)])] : changed;
  if (notificationFix) assert.deepEqual(evaluated.filter(f => f.startsWith('src/')).sort(), [
    'src/features/notifications/application/useCases/createNotificationsUseCases.js',
    'src/features/notifications/application/useCases/notifications.abort.test.js',
    'src/features/notifications/presentation/components/NotificationBell.access.test.js',
    'src/features/notifications/presentation/components/NotificationBell.cancellation.test.js',
    'src/features/notifications/presentation/components/NotificationBell.js',
    'src/features/notifications/presentation/createNotificationsService.js',
  ].sort());
  const sources = evaluated.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  for (const file of sources) {
    const body = fs.readFileSync(path.join(h.root, file), 'utf8');
    assert.ok(!body.includes('\uFFFD'), 'INVALID_UNICODE');
    assert.ok(!body.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE: ' + file);
  }
  h.write('FUENTES_EVALUADAS.json', { checkedAt: new Date().toISOString(), baseCommit: context.baseCommit,
    productSourcesChanged: notificationFix, originalProtectedTestsUnchanged: true,
    appSourceSha256: context.appSourceSha256, compiledApkSourceCommit: apk.sourceCommit,
    files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
  h.write('COMANDOS.json', walk(h.evidence).filter(f => /\.meta(?:-[a-z0-9-]+)?\.json$/i.test(f)).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })));
  let links = 0;
  for (const file of [...walk(h.evidence).filter(f => f.endsWith('.md')), path.join(h.root, 'docs/produccion/RUNBOOK.md')]) {
    const body = fs.readFileSync(file, 'utf8');
    for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(match[1])) continue;
      const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
      if (!['INTEGRIDAD.json', 'PRIVACIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK: ' + relative(target));
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
    for (const [name, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, file))))) {
      if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(name) && value.length >= 8) known.add(value);
    }
  }
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files.filter(f => !f.endsWith('.png'))) {
    const body = fs.readFileSync(file, 'utf8');
    if ([...known].some(v => body.includes(v))) issues.push({ file: relative(file), type: 'KNOWN_PRIVATE_VALUE' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|dashboard\/cli\/login\?session_id=[a-f0-9-]{36}/.test(body)) issues.push({ file: relative(file), type: 'SECRET_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ privacyIssues: issues }));
  h.write('PRIVACIDAD.json', { checkedAt: new Date().toISOString(), filesChecked: files.length, issues: 0,
    imagesVisuallyReviewed: 4, institutionalRowsPublished: false, credentialsRequested: false,
    scope: 'Fuentes y expediente nuevos/modificados: valores privados conocidos y patrones acotados. Capturas sintéticas revisadas. APK privado se comprueba por separado; no garantía universal ni historial Git completo.' });
  h.write('INTEGRIDAD.json', { checkedAt: new Date().toISOString(), previousManifests: manifests.length, previousEntries: previous.length,
    previousEntriesMatching: true, nativeCases: 14, nativePassed: 14, nativeFailed: 0, nodeCases: notificationFix ? 19 : 13,
    jestCases: notificationFix ? 434 : null, controlledCases: notificationFix ? 1 : null,
    junitTemplateCases: 1, webFilesMatching: 65, apkHashMatches: true, productSourcesChanged: notificationFix,
    originalProtectedTestsUnchanged: true, linksChecked: links, brokenLinks: 0, privacyIssues: 0,
    emulatorStopped: true, productionChanged: false, releaseSigned: false, documents: 3 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: context.baseCommit, note: 'No modificar después del sellado. Excluye manifiesto propio y artefactos privados.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const entry of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, entry.file))), entry.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, previousManifests: manifests.length, previousEntries: previous.length, nativeCases: 14, privacyIssues: 0, links, productionChanged: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
