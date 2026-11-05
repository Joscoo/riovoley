'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict'), cp = require('node:child_process');
const lab = require('./lab.cjs'), c = lab.context(), h = require('../../e2e/local/harness.cjs');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8')), read = file => json(path.join(h.evidence, file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rel = file => path.relative(h.root, file).replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
(async () => {
  assert.equal(h.evidence, c.evidence); assert.equal(c.baseCommit, git(['rev-parse', 'HEAD']).trim());
  const s = read('RESULTADOS_AUTOMATIZADOS.json'), final = read('integracion/estado-final-laboratorio.json');
  const refs = read('seguridad/propuestas-sql-sin-cambios.json'), identities = read('integracion/identidades-sql.json');
  assert.deepEqual(s.phases.map(p => [p.tests, p.passed, p.failed, p.exitCode]), [[5, 5, 0, 0], [1, 0, 1, 1], [44, 44, 0, 0], [47, 47, 0, 0]]);
  assert.ok(s.phases.every(p => p.skipped === 0 && p.cancelled === 0));
  assert.equal(s.productionChanged, false); assert.equal(s.releaseReady, false);
  assert.equal(s.fullMaintenanceIsolationEstablished, false); assert.equal(s.realPostgres, true); assert.equal(s.mockedRepositories, false);
  assert.equal(s.syntheticRelations, 7); assert.equal(s.newBuilds, 0);
  assert.equal(final.activeGateTriggers, 0); assert.equal(final.gateSchemaAbsent, true);
  assert.deepEqual(final.tables, read('integracion/fixture-antes.json').tables);
  for (const phase of s.phases) assert.equal(read('integracion/fixture-despues-' + (phase.label === 'green-final' ? 'green' : phase.label) + '.json').matchesBefore, true);
  assert.equal(identities.actors.length, 5);
  for (const actor of lab.actors) {
    const row = identities.actors.find(r => r.actor === actor.name); assert.ok(row);
    assert.equal(row.session_user, actor.login); assert.equal(row.current_user, actor.role || actor.login); assert.equal(row.database, c.database);
  }
  const db = await lab.connect();
  try {
    assert.deepEqual(await lab.snapshot(db), final.tables);
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname='riovoley_local_write_gate'")).rows[0].n, 0);
    assert.equal((await db.query("SELECT to_regnamespace('gate_guard') AS schema")).rows[0].schema, null);
  } finally { await db.end(); }
  assert.equal(refs.files.length, 4);
  for (const f of refs.files) { assert.equal(f.matchesReviewed, true); assert.equal(sha(fs.readFileSync(path.join(h.root, f.file))), f.sha256); }
  assert.equal(read('seguridad/revision-independiente.json').blockingFindings, 0);
  const phases = s.phases.map(p => ({ phase: p.label, environment: { RIOVOLEY_GATE_PHASE: p.label === 'green-final' ? 'green' : p.label },
    ...read('integracion/' + p.label + '.meta.json') }));
  h.write('COMANDOS.json', { phases, setupCommand: 'node scripts/audit/maintenance/lab.cjs', reportCommand: 'node scripts/audit/maintenance/report.cjs',
    sealCommand: 'node scripts/audit/maintenance/finalize.cjs', setupExitCodeObserved: 0, reportExitCodeObserved: 0,
    scope: 'Phase terminal stdout/stderr and exit codes are preserved. Setup/report codes observed in tool returns; no invented durations.' });
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(file => path.basename(file) === 'MANIFIESTO_SHA256.json');
  const entriesBefore = prior.flatMap(file => {
    const m = json(file);
    return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 }));
  });
  let index = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (index < entriesBefore.length) {
      const e = entriesBefore[index++]; assert.ok(e.file.startsWith(h.root + path.sep));
      assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED');
    }
  }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const sources = changed.filter(file => !file.startsWith('docs/tesis/evidencias/'));
  const allowed = ['docs/produccion/RUNBOOK.md', 'docs/superpowers/plans/2026-11-05-maintenance-gate-local.md',
    'scripts/audit/maintenance/lab.cjs', 'scripts/audit/maintenance/gate.cjs', 'scripts/audit/maintenance/report.cjs',
    'scripts/audit/maintenance/finalize.cjs', 'tests/integration/maintenance-gate.local.test.cjs'];
  assert.ok(sources.every(file => allowed.includes(file)), 'UNEXPECTED_SOURCE_CHANGE');
  assert.ok(changed.filter(file => file.startsWith('docs/tesis/evidencias/')).every(file => file.startsWith(rel(h.evidence) + '/')), 'OTHER_EVIDENCE_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  for (const file of sources) {
    const text = fs.readFileSync(path.join(h.root, file), 'utf8');
    assert.ok(!text.includes('\uFFFD')); assert.ok(!text.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE');
  }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), productChanged: false, productionSqlChanged: false,
    files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
  let links = 0;
  for (const file of [...walk(h.evidence).filter(f => f.endsWith('.md')), path.join(h.root, 'docs/produccion/RUNBOOK.md')]) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(match[1])) continue;
      const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
      if (!['INTEGRIDAD.json', 'PRIVACIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK: ' + rel(target));
      links++;
    }
  }
  const known = new Set(), collect = (v, key = '') => {
    if (v && typeof v === 'object') for (const [k, value] of Object.entries(v)) collect(value, k);
    else if (typeof v === 'string' && v.length >= 12 && /password|secret|token|key/i.test(key)) known.add(v);
  };
  collect(json(path.join(h.runtime, 'credentials.json')));
  for (const file of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) {
    if (!fs.statSync(path.join(h.root, file)).isFile()) continue;
    for (const [key, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, file))))) {
      if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(key) && value.length >= 8) known.add(value);
    }
  }
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files) {
    const body = fs.readFileSync(file, 'utf8');
    if ([...known].some(v => body.includes(v))) issues.push({ file: rel(file), type: 'KNOWN_PRIVATE_VALUE' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body)) issues.push({ file: rel(file), type: 'PRIVATE_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ issues }));
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0,
    knownLocalValuesAndPatternsChecked: true, institutionalRowsCopied: 0, institutionalRowsPublished: false,
    credentialValuesRequested: false, scope: 'New/modified files and this evidence packet only; not a universal privacy guarantee.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: entriesBefore.length,
    priorEntriesMatching: true, linksChecked: links, brokenLinks: 0, privacyIssues: 0,
    finalRealPostgresCases: 47, passed: 47, failed: 0, skipped: 0, phasesNotSummed: true,
    syntheticSnapshotsUnchanged: true, localGateRemoved: true, productionSqlHashesUnchanged: 4,
    originalProtectedTestsUnchanged: true, productChanged: false, productionChanged: false, newAcademicDocuments: 3 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: c.baseCommit,
    note: 'Excludes this manifest and private artifacts. Do not modify after sealing.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const e of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, e.file))), e.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: entriesBefore.length,
    privacyIssues: 0, linksChecked: links, finalPostgresPassed: 47, productionChanged: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
