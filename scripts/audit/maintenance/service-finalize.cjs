'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const context = require('./service-context.cjs'), c = context.read(), h = require('../../e2e/local/harness.cjs');
const json = f => JSON.parse(fs.readFileSync(f, 'utf8')), read = f => json(path.join(h.evidence, f));
const sha = b => crypto.createHash('sha256').update(b).digest('hex'), rel = f => path.relative(h.root, f).replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
(async () => {
  assert.equal(c.evidence, h.evidence); assert.equal(c.baseCommit, git(['rev-parse', 'HEAD']).trim());
  const a = context.latestAttempt(), result = read(a.resultFile), cleanup = read(a.cleanupFile), obs = read(a.observationsFile), http = read(a.httpFile), summary = read('RESULTADOS_AUTOMATIZADOS.json');
  assert.equal(result.executed, 24); assert.equal(result.passed, 24); assert.equal(result.failed, 0); assert.equal(result.completed, true); assert.equal(result.cleanupPassed, true);
  assert.equal(summary.selectedAttempt, a.file); assert.equal(summary.productionChanged, false); assert.equal(summary.releaseReady, false);
  assert.deepEqual(summary.runs.map(r => [r.executed, r.passed, r.failed, r.exitCode]), [[21, 21, 0, 0], [22, 21, 1, 1], [22, 21, 1, 1], [24, 24, 0, 0]]);
  for (const key of ['gateReleased', 'authUsersRemoved', 'coreUsersRemoved', 'bucketsRemoved', 'catalogFingerprintRestored', 'mandatoryPostconditionsPassed']) assert.equal(cleanup[key], true);
  assert.equal(cleanup.errors.length, 0); assert.equal(cleanup.residualOwnedPhysicalFiles, 0);
  assert.deepEqual(obs[0].auth, obs[1].auth); assert.deepEqual(obs[0].disk, obs[1].disk); assert.equal(obs[0].disk.files, 1);
  assert.equal(obs[0].disk.entries[0].sha256, sha(Buffer.from('RIOVOLEY disposable local Storage sentinel v1\n')));
  assert.equal(http.requests.length, 34); assert.equal(summary.http.Auth.requests, 12); assert.equal(summary.http.Storage.requests, 22);
  assert.deepEqual(summary.http.Auth.statuses, { 200: 9, 500: 3 }); assert.deepEqual(summary.http.Storage.statuses, { 200: 18, 500: 4 });
  assert.equal(read('seguridad/revision-independiente.json').unresolvedFindings, 0); assert.equal(read('seguridad/configuracion-auth-local.json').smtpLocalVerified, true);
  const privateFiles = fs.readdirSync(c.privateDir).filter(f => /^fixtures(?:-\d+)?\.json$/.test(f)).map(f => path.join(c.privateDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  assert.ok(privateFiles.length > 0); const ownership = json(privateFiles[0]); assert.equal(ownership.ownership, c.tag); assert.equal(ownership.users.length, 2);
  assert.deepEqual(ownership.buckets, [c.bucketA, c.bucketB]); assert.ok(ownership.emails.every(e => e.startsWith(c.tag + '-') && e.endsWith('@example.test')));
  const db = await require('../security/local-db.cjs').connect();
  try {
    assert.equal((await db.query('SELECT count(*)::int AS n FROM auth.users WHERE id=ANY($1::uuid[])', [ownership.users])).rows[0].n, 0);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM core.users WHERE id=ANY($1::uuid[])', [ownership.users])).rows[0].n, 0);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM storage.buckets WHERE id=ANY($1::text[])', [ownership.buckets])).rows[0].n, 0);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM pg_trigger WHERE tgname=$1', [c.trigger])).rows[0].n, 0);
    assert.equal((await db.query('SELECT to_regnamespace($1) AS schema', [c.schema])).rows[0].schema, null);
    assert.equal((await db.query(fs.readFileSync(path.join(h.root, 'scripts/audit/production/catalog-fingerprint.sql'), 'utf8'))).rows[0].fingerprint, c.baselineFingerprint);
  } finally { await db.end(); }
  for (const bucket of ownership.buckets) { const r = context.docker(['exec', 'supabase_storage_riovoley-e2e-local', 'find', '/mnt', '-type', 'f', '-path', '*/' + bucket + '/*', '-print']); assert.equal(r.status, 0); assert.equal(r.stdout.trim(), ''); }
  h.write('COMANDOS.json', { terminal: walk(h.evidence).filter(f => f.endsWith('.meta.json')).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })),
    selectedAttempt: a, setupCommand: 'node scripts/audit/maintenance/service-context.cjs', setupExitCodeObserved: 0,
    reportCommand: 'node scripts/audit/maintenance/service-report.cjs', reportExitCodeObserved: 0, note: 'Raw HTTP headers and bodies intentionally not published; codes, timings and selected fields preserved.' });
  const oldSql = json(path.join(h.root, 'docs/tesis/evidencias/verificacion-tecnica/20261105-160424-transicion-lectura-d2b43e4/seguridad/artefactos-sql-edge-verificados.json'));
  for (const f of oldSql.sql) assert.equal(sha(fs.readFileSync(path.join(h.root, f.file))), f.sha256);
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = prior.flatMap(file => { const m = json(file); return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 })); });
  let i = 0; await Promise.all(Array.from({ length: 12 }, async () => { while (i < previous.length) { const e = previous[i++]; assert.ok(e.file.startsWith(h.root + path.sep)); assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED'); } }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const sources = changed.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  const allowed = ['docs/produccion/RUNBOOK.md', 'docs/superpowers/plans/2026-11-09-auth-storage-local-isolation.md', ...['service-context', 'service-probe', 'service-report', 'service-finalize'].map(n => 'scripts/audit/maintenance/' + n + '.cjs')];
  assert.ok(sources.every(f => allowed.includes(f)), 'UNEXPECTED_SOURCE_CHANGE');
  assert.ok(changed.filter(f => f.startsWith('docs/tesis/evidencias/')).every(f => f.startsWith(rel(h.evidence) + '/')), 'OTHER_EVIDENCE_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  for (const f of sources) { const text = fs.readFileSync(path.join(h.root, f), 'utf8'); assert.ok(!text.includes('\uFFFD')); assert.ok(!text.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE'); }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), productChanged: false, productionSqlChanged: false, files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
  let links = 0;
  for (const file of [...walk(h.evidence).filter(f => f.endsWith('.md')), path.join(h.root, 'docs/produccion/RUNBOOK.md')]) for (const m of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^https?:\/\//.test(m[1])) continue; const target = path.resolve(path.dirname(file), m[1].split('#')[0]);
    if (!['COMANDOS.json', 'PRIVACIDAD.json', 'INTEGRIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK'); links++;
  }
  const known = new Set(), collect = (v, key = '') => { if (v && typeof v === 'object') for (const [k, value] of Object.entries(v)) collect(value, k); else if (typeof v === 'string' && v.length >= 12 && /password|secret|token|key/i.test(key)) known.add(v); };
  collect(json(path.join(h.runtime, 'credentials.json')));
  for (const f of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) if (fs.statSync(path.join(h.root, f)).isFile()) {
    for (const [key, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, f))))) if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(key) && value.length >= 8) known.add(value);
  }
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files) {
    const body = fs.readFileSync(file, 'utf8'); if ([...known].some(v => body.includes(v))) issues.push({ file: rel(file), type: 'KNOWN_PRIVATE_VALUE' });
    // Source literals under reserved example.test are synthetic fixture templates, not personal addresses.
    const scanned = sources.includes(rel(file)) ? body.replace(/[A-Z0-9._%+-]+@example\.test/gi, '[SYNTHETIC_FIXTURE_TEMPLATE]') : body;
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(scanned)) issues.push({ file: rel(file), type: 'PRIVATE_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ issues }));
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0, credentialsRequested: false, newProviderKeysGenerated: false,
    existingPasswordsChanged: false, rawAuthTokensPublished: false, institutionalRowsPublished: false, syntheticExampleTestSourceLiteralsAllowed: true,
    scope: 'Current evidence and changed source files, known private values and bounded patterns; example.test source templates are explicitly synthetic. Not universal privacy guarantee.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: previous.length, priorEntriesMatching: true,
    finalControls: 24, passed: 24, failed: 0, attemptsNotSummed: true, authHttpResponses: 12, storageHttpResponses: 22, baselinePhysicalFiles: 1,
    ownedRowsAndPhysicalBytesUnchangedDuringGate: true, mandatoryCleanupPassed: true, ownTriggersRemaining: 0, ownAuthUsersRemaining: 0, ownBucketsRemaining: 0,
    originalSqlHashesUnchanged: 4, productChanged: false, productionChanged: false, linksChecked: links, brokenLinks: 0, privacyIssues: 0, newAcademicDocuments: 3 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ at: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: c.baseCommit,
    note: 'Excludes this manifest and private runtime ownership records. Do not modify after sealing.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const e of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, e.file))), e.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: previous.length, linksChecked: links, privacyIssues: 0,
    finalControls: 24, cleanupVerified: true, productionChanged: false }));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
