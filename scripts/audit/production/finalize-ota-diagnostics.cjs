'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const cp = require('node:child_process'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const read = file => json(path.join(h.evidence, file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const relative = file => path.relative(h.root, file).replaceAll('\\', '/');
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

(async () => {
  assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'ALREADY_SEALED');
  const result = read('RESULTADOS_AUTOMATIZADOS.json'), jest = read('unitarias/jest-cierre.json');
  assert.equal(jest.numTotalTests, 426); assert.equal(jest.numPassedTests, 426);
  assert.equal(jest.numTotalTestSuites, 89); assert.equal(jest.numFailedTests + jest.numPendingTests, 0);
  assert.equal(result.jest.cases, jest.numTotalTests); assert.equal(result.productionChanged, false);
  assert.equal(read('compilacion-web/build-estricto-ota.meta.json').exitCode, 0);
  assert.equal(read('unitarias/jest-cierre.meta.json').exitCode, 0);
  assert.equal(read('unitarias/preflight-regresion-completa.meta.json').exitCode, 0);
  const nativeRed = read('unitarias/ota-ui-rojo-nativo.json');
  assert.equal(nativeRed.numPassedTests, 3); assert.equal(nativeRed.numFailedTests, 4);
  assert.equal(read('unitarias/ota-ui-verde.json').numPassedTests, 7);
  const build = read('compilacion-web/artefactos.json');
  const buildRoot = path.resolve(h.root, build.buildPath);
  assert.ok(buildRoot.startsWith(h.runtime + path.sep), 'BUILD_OUTSIDE_PRIVATE_RUNTIME');
  assert.equal(build.sourceMapCount, 0);
  for (const file of build.files) {
    const target = path.resolve(buildRoot, file.path);
    assert.ok(target.startsWith(buildRoot + path.sep));
    assert.equal(sha(fs.readFileSync(target)), file.sha256, 'BUILD_CHANGED');
  }
  const manifests = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = manifests.flatMap(file => {
    const m = json(file);
    return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 }));
  });
  let index = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (index < previous.length) {
      const entry = previous[index++];
      assert.ok(entry.file.startsWith(h.root + path.sep));
      assert.equal(sha(await fs.promises.readFile(entry.file)), entry.sha256, 'PREVIOUS_EVIDENCE_CHANGED');
    }
  }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const product = changed.filter(f => /^(src|android|supabase|database)\//.test(f));
  assert.deepEqual(product.sort(), ['src/App.js', 'src/App.otaDiagnostics.test.js']);
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  const sources = changed.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  for (const file of sources) {
    const body = fs.readFileSync(path.join(h.root, file), 'utf8');
    assert.ok(!body.includes('\uFFFD'), 'INVALID_UNICODE');
    assert.ok(!body.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE: ' + file);
  }
  h.write('FUENTES_EVALUADAS.json', { checkedAt: new Date().toISOString(), baseCommit: result.baseCommit,
    productSourceChanged: ['src/App.js'], newProductTests: ['src/App.otaDiagnostics.test.js'],
    backendOrDatabaseChanged: false, protectedTestsUnchanged: true,
    files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
  h.write('COMANDOS.json', walk(h.evidence).filter(f => /\.meta(?:-[a-z0-9-]+)?\.json$/i.test(f))
    .map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })));
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
  // Compare known private values only in memory; never publish values or their hashes.
  const known = new Set();
  const collect = (value, name = '') => {
    if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) collect(v, k);
    else if (typeof value === 'string' && value.length >= 12 && /password|secret|token|key/i.test(name)) known.add(value);
  };
  const local = path.join(h.runtime, 'credentials.json');
  if (fs.existsSync(local)) collect(json(local));
  for (const file of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) {
    for (const [name, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, file))))) {
      if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(name) && value.length >= 8) known.add(value);
    }
  }
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files) {
    const body = fs.readFileSync(file, 'utf8');
    if ([...known].some(value => body.includes(value))) issues.push({ file: relative(file), type: 'KNOWN_PRIVATE_VALUE' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|dashboard\/cli\/login\?session_id=[a-f0-9-]{36}/.test(body)) issues.push({ file: relative(file), type: 'SECRET_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ privacyIssues: issues }));
  h.write('PRIVACIDAD.json', { checkedAt: new Date().toISOString(), filesChecked: files.length, issues: 0,
    valuesOrSecretDigestsPublished: false, credentialsRequested: false, institutionalRowsPublished: false,
    scope: 'Expediente y fuentes nuevas/modificadas; patrones acotados y valores locales conocidos comparados en memoria. No es garantía universal ni revisión del historial completo.' });
  h.write('INTEGRIDAD.json', { checkedAt: new Date().toISOString(), priorManifests: manifests.length,
    priorEntries: previous.length, priorEntriesMatching: true, jestCases: 426, jestSuites: 89, nodeCases: 18,
    focusedJestSubset: 7, focusedNodeSubset: 4, buildFilesMatching: build.files.length,
    originalProtectedTestsUnchanged: true, linksChecked: links, brokenLinks: 0,
    documents: 3, institutionalWrites: false, productionChanged: false, nativeArtifactRebuilt: false });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: result.baseCommit, note: 'Excluye manifiesto propio y artefactos privados. No modificar tras sellado.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const entry of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, entry.file))), entry.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, previousManifests: manifests.length, previousEntries: previous.length, privacyIssues: 0, links, productionChanged: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
