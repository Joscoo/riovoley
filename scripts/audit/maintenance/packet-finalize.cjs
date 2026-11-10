'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), cp = require('node:child_process'), assert = require('node:assert/strict');
const ctx = require('./packet-context.cjs'), gate = require('./packet-gate.cjs'), c = ctx.read(), h = require('../../e2e/local/harness.cjs');
const json = f => JSON.parse(fs.readFileSync(f, 'utf8')), read = f => json(path.join(h.evidence, f));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex'), rel = f => path.relative(h.root, f).replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
(async () => {
  assert.equal(c.evidence, h.evidence); assert.equal(c.baseCommit, git(['rev-parse', 'HEAD']).trim());
  const attempt = ctx.latestAttempt(), summary = read('RESULTADOS_AUTOMATIZADOS.json');
  const controls = read(attempt.controlsFile), result = read(attempt.resultFile), state = read(attempt.stateFile), ops = read(attempt.operationsFile);
  assert.equal(controls.completed, true); assert.equal(controls.executed, 22); assert.equal(controls.passed, 22); assert.equal(controls.failed, 0);
  assert.deepEqual(controls.checks, result.checks); assert.equal(summary.finalControls.passed, 22);
  assert.deepEqual(summary.runs.map(r => [r.executed, r.passed, r.failed, r.exitCode]), [[20, 19, 1, 1], [18, 17, 1, 1], [22, 22, 0, 0], [22, 22, 0, 0]]);
  assert.equal(summary.productionChanged, false); assert.equal(summary.releaseReady, false); assert.equal(summary.previousWindowExpired, true);
  assert.equal(summary.toolingUnitCases, 3); assert.equal(read('unitarias/seleccion-intentos.meta.json').exitCode, 0);
  assert.match(fs.readFileSync(path.join(h.evidence, 'unitarias/seleccion-intentos.stdout.log'), 'utf8'), /# tests 3\r?\n[\s\S]*# pass 3\r?\n# fail 0/);
  assert.equal(state.tables, 48); assert.equal(state.rows, 68); assert.equal(state.sequences, 7); assert.equal(state.gateRemoved, true);
  assert.equal(state.finalFingerprint, '15b9d9e869fb5113263c485714009878');
  const fingerprints = read(attempt.fingerprintFile), mapping = Object.fromEntries(fingerprints.states.map(s => [s.openFingerprint, s.closedFingerprint]));
  assert.equal(Object.keys(mapping).length, 3);
  const variants = read(attempt.variantManifestFile).variants;
  const old = json(path.join(h.root, 'docs/tesis/evidencias/verificacion-tecnica/20261105-160424-transicion-lectura-d2b43e4/seguridad/artefactos-sql-edge-verificados.json'));
  assert.equal(variants.length, 4);
  for (const v of variants) {
    const bytes = fs.readFileSync(path.join(h.root, v.file)); assert.equal(sha(bytes), old.sql.find(f => f.file === v.file).sha256);
    assert.equal(sha(bytes), v.sourceSha256); assert.equal(v.originalBodyPreservedBytewise, true); assert.equal(v.executedPersistedBytes, true);
    const generated = gate.createVariant(bytes.toString('utf8'), mapping, fingerprints.gateDigest).sql + '\n';
    const persisted = fs.readFileSync(path.join(h.evidence, v.evidenceFile), 'utf8'); assert.equal(persisted, generated); assert.equal(sha(persisted), v.variantSha256);
    assert.equal(ops.find(o => o.label === 'integrado-' + v.label && !o.expectedFailure).sqlSha256, v.variantSha256);
  }
  assert.ok(ops.filter(o => o.expectedFailure).every(o => ['55000', 'P0001'].includes(o.sqlState)));
  const db = await ctx.connect(); try { assert.equal(await ctx.fingerprint(db), state.finalFingerprint); assert.deepEqual(await ctx.contents(db, await ctx.inventory(db)), c.sourceContent);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname=$1", [gate.gateName])).rows[0].n, 0);
    assert.equal((await db.query("SELECT to_regnamespace('gate_guard') AS schema")).rows[0].schema, null); } finally { await db.end(); }
  const source = await ctx.connect(true); try { assert.equal(await ctx.fingerprint(source), c.sourceFingerprint); assert.deepEqual(await ctx.contents(source, await ctx.inventory(source)), c.sourceContent); } finally { await source.end(); }
  assert.equal(read('seguridad/revision-independiente.json').unresolvedFindings, 0);
  h.write('COMANDOS.json', { terminalCommands: walk(h.evidence).filter(f => f.endsWith('.meta.json')).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })),
    finalAttempt: attempt, sqlDriverOperations: attempt.operationsFile, setup: { command: 'node scripts/audit/maintenance/packet-context.cjs', exitCodeObserved: 0 },
    note: 'ECONNREFUSED preflight before Docker startup and setup result recorded from tool output; no invented process durations. Final SQL artifact hashes equal executed bytes.' });
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = prior.flatMap(file => { const m = json(file); return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 })); });
  let index = 0; await Promise.all(Array.from({ length: 12 }, async () => { while (index < previous.length) { const e = previous[index++]; assert.ok(e.file.startsWith(h.root + path.sep)); assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED'); } }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const sources = changed.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  const allowed = ['docs/produccion/RUNBOOK.md', 'docs/superpowers/plans/2026-11-05-maintenance-packet-integration.md', 'tests/unit/maintenance-packet-attempt.test.cjs', ...['packet-context', 'packet-gate', 'packet-rehearse', 'packet-report', 'packet-finalize'].map(n => 'scripts/audit/maintenance/' + n + '.cjs')];
  assert.ok(sources.every(f => allowed.includes(f)), 'UNEXPECTED_SOURCE_CHANGE');
  const partial = 'docs/tesis/evidencias/verificacion-tecnica/20261105-210719-paquete-barrera-57a1e7b/';
  assert.ok(changed.filter(f => f.startsWith('docs/tesis/evidencias/')).every(f => f.startsWith(rel(h.evidence) + '/') || [partial + 'CONTEXTO.json', partial + 'NOTA_CONTINUIDAD.md'].includes(f)), 'OTHER_EVIDENCE_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  for (const file of sources) { const text = fs.readFileSync(path.join(h.root, file), 'utf8'); assert.ok(!text.includes('\uFFFD')); assert.ok(!text.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE'); }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), productChanged: false, originalSqlChanged: false, files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
  const extra = ['CONTEXTO.json', 'NOTA_CONTINUIDAD.md'].map(file => path.join(h.root, partial, file));
  let links = 0;
  for (const file of [...walk(h.evidence).filter(f => f.endsWith('.md')), extra[1], path.join(h.root, 'docs/produccion/RUNBOOK.md')]) for (const match of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    if (/^https?:\/\//.test(match[1])) continue; const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
    if (!['INTEGRIDAD.json', 'PRIVACIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK'); links++;
  }
  const known = new Set(), collect = (v, key = '') => { if (v && typeof v === 'object') for (const [k, value] of Object.entries(v)) collect(value, k); else if (typeof v === 'string' && v.length >= 12 && /password|secret|token|key/i.test(key)) known.add(v); };
  collect(json(path.join(h.runtime, 'credentials.json')));
  for (const file of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) if (fs.statSync(path.join(h.root, file)).isFile()) {
    for (const [key, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, file))))) if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(key) && value.length >= 8) known.add(value);
  }
  const files = [...walk(h.evidence), ...extra, ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files) { const body = fs.readFileSync(file, 'utf8'); if ([...known].some(v => body.includes(v))) issues.push({ file: rel(file), type: 'KNOWN_PRIVATE_VALUE' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body)) issues.push({ file: rel(file), type: 'PRIVATE_PATTERN' }); }
  assert.equal(issues.length, 0, JSON.stringify({ issues }));
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0, institutionalRowsPublished: false, credentialValuesRequested: false,
    scope: 'New/modified files, current evidence and preserved partial context checked against known local private values and bounded patterns; not universal guarantee.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: previous.length, priorEntriesMatching: true,
    finalControls: 22, passed: 22, failed: 0, attemptsNotSummed: true, exactFinalAttemptLinked: true, persistedVariantBytesExecuted: true,
    originalSqlHashesUnchanged: 4, syntheticTables: 48, syntheticRows: 68, sequences: 7, cloneSourceUnchanged: true, localGateRemoved: true,
    linksChecked: links, brokenLinks: 0, privacyIssues: 0, productChanged: false, productionChanged: false, newAcademicDocuments: 3 });
  const entries = [...walk(h.evidence), ...extra].map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: c.baseCommit,
    note: 'Includes two preserved files from the partial Nov5 context via relative paths; excludes this manifest. Immutable after sealing.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const e of entries) assert.equal(sha(fs.readFileSync(path.resolve(h.evidence, e.file))), e.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: previous.length, linksChecked: links, privacyIssues: 0, finalControls: 22, productionChanged: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
