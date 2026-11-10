'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const c = require('./edge-fence-context.cjs').read(), h = require('../../e2e/local/harness.cjs');
const json = f => JSON.parse(fs.readFileSync(f, 'utf8')), read = f => json(path.join(h.evidence, f));
const sha = b => crypto.createHash('sha256').update(b).digest('hex'), rel = f => path.relative(h.root, f).replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
(async () => {
  assert.equal(c.evidence, h.evidence); assert.equal(c.baseCommit, git(['rev-parse', 'HEAD']).trim());
  const index = read('integracion/indice-intentos.json'), summary = read('RESULTADOS_AUTOMATIZADOS.json');
  assert.deepEqual(index.runs.map(r => [r.executed, r.passed, r.failed, r.exitCode]), [[2, 0, 2, 1], [57, 57, 0, 0], [57, 57, 0, 0]]);
  assert.deepEqual(index.selected, index.runs.at(-1)); const result = read(index.selected.resultFile), stats = result.stats;
  assert.equal(result.passed, 57); assert.equal(result.failed, 0); assert.equal(result.cleanupPassed, true); assert.equal(result.completed, true);
  assert.deepEqual(result.baseline, result.after); assert.equal(result.baseline.tables, 47); assert.equal(result.baseline.rows, 4598); assert.equal(result.baseline.sequences, 10);
  assert.equal(result.responses.length, 51); assert.equal(stats.localReads.length, 38);
  assert.equal(stats.localWritesBlocked.length, 1); assert.equal(stats.localWritesBlocked[0].handler, 'safety-probe');
  assert.equal(stats.externalAttempts.length, 1); assert.equal(stats.externalAttempts[0].hostname, 'api.resend.com');
  assert.equal(stats.nativeProbes.length, 2); assert.ok(stats.nativeProbes.every(p => p.denied && p.errorName === 'NotCapable'));
  assert.equal(stats.providerEnvironment.resendSynthetic, true); assert.equal(stats.providerEnvironment.fcmConfigured, false); assert.equal(stats.providerEnvironment.schedulerConfigured, false);
  assert.equal(summary.productionChanged, false); assert.equal(summary.releaseReady, false); assert.equal(summary.contracts.passed, 35);
  for (const f of ['integracion/contratos-edge.meta.json', 'integracion/sync-typecheck.meta.json', 'integracion/sync-typecheck-candidato-corregido.meta.json', 'integracion/procedencia-candidato-corregido.meta.json']) assert.equal(read(f).exitCode, 0);
  for (const run of index.runs) {
    const server = read(run.serverMetaFile); assert.equal(server.exitCode, 0);
    assert.ok(server.command.includes('--cached-only') && server.command.includes('--no-config') && server.command.includes('--no-prompt'));
    assert.ok(server.command.includes('--allow-net=127.0.0.1:55321,127.0.0.1:6163'));
    assert.ok(server.command.includes('--deny-net=api.resend.com,fcm.googleapis.com,oauth2.googleapis.com,accounts.google.com'));
    assert.ok(!server.command.some(a => /^--allow-(all|run|write|ffi)(=|$)/.test(a) || a === '-A'));
  }
  const red = read(index.runs[0].resultFile); assert.ok(red.checks.every(t => t.expected === 401 && t.actual === 500));
  for (const source of result.sources) assert.equal(sha(fs.readFileSync(path.join(h.root, source.file))), source.sha256);
  const changedFile = 'supabase/functions/sync-mobile-device/index.ts';
  const oldBytes = cp.execFileSync('git', ['show', c.baseCommit + ':' + changedFile], { cwd: h.root });
  const recordedOld = red.sources.find(f => f.file === changedFile).sha256;
  assert.ok([sha(oldBytes), sha(oldBytes.toString('utf8').replace(/\r?\n/g, '\r\n'))].includes(recordedOld), 'RED_SOURCE_NOT_BOUND_TO_BASE_COMMIT');
  assert.notEqual(recordedOld, result.sources.find(f => f.file === changedFile).sha256);
  const candidate = read('seguridad/candidato-fuentes-corregido.json'); assert.equal(candidate.files.length, 39); assert.deepEqual(candidate.changedSourceFiles, [changedFile]);
  assert.equal(candidate.files.filter(f => f.origin === 'current-repository').length, 28);
  assert.equal(candidate.files.filter(f => f.origin === 'previous-generated-configuration').length, 11);
  const deploymentConfig = fs.readFileSync(path.join(h.root, candidate.privateCandidateDirectory, 'supabase/config.toml'), 'utf8');
  assert.equal((deploymentConfig.match(/verify_jwt = true/g) || []).length, 9);
  assert.ok(!deploymentConfig.includes('[api]') && !deploymentConfig.includes('[db]'));
  const candidateRoot = path.resolve(h.root, candidate.privateCandidateDirectory); assert.ok(candidateRoot.startsWith(c.privateDir + path.sep));
  for (const f of candidate.files) {
    assert.equal(sha(fs.readFileSync(path.join(candidateRoot, f.file))), f.sha256);
    if (f.origin === 'current-repository') assert.equal(sha(fs.readFileSync(path.join(h.root, f.file))), f.sha256);
    else assert.equal(f.sha256, f.previousSha256);
  }
  assert.equal(read('seguridad/revision-independiente.json').unresolvedFindings, 0);
  let serverStopped = false; try { await fetch('http://127.0.0.1:6163/__health', { signal: AbortSignal.timeout(800) }); } catch { serverStopped = true; } assert.equal(serverStopped, true);
  h.write('COMANDOS.json', { commands: walk(h.evidence).filter(f => f.endsWith('.meta.json')).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })),
    selectedAttempt: index.selected, note: 'Server environment values are not recorded. Logs preserve runtime deprecation warning and real process exit codes.' });
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = prior.flatMap(file => { const m = json(file); return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 })); });
  let i = 0; await Promise.all(Array.from({ length: 12 }, async () => { while (i < previous.length) { const e = previous[i++]; assert.ok(e.file.startsWith(h.root + path.sep)); assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED'); } }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const sources = changed.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  const allowed = [changedFile, 'docs/produccion/RUNBOOK.md', 'docs/superpowers/plans/2026-11-09-edge-readonly-fence.md',
    ...['edge-fence-context.cjs', 'edge-fence-entry.ts', 'edge-fence-run.cjs', 'edge-fence-cases.cjs', 'edge-fence-provenance.cjs', 'edge-fence-report.cjs', 'edge-fence-finalize.cjs'].map(f => 'scripts/audit/maintenance/' + f)];
  assert.ok(sources.every(f => allowed.includes(f)), 'UNEXPECTED_SOURCE_CHANGE');
  assert.ok(changed.filter(f => f.startsWith('docs/tesis/evidencias/')).every(f => f.startsWith(rel(h.evidence) + '/')), 'OTHER_EVIDENCE_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  for (const f of sources) { const t = fs.readFileSync(path.join(h.root, f), 'utf8'); assert.ok(!t.includes('\uFFFD')); assert.ok(!t.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE'); }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), sourceProductChange: changedFile, frontendChanged: false, institutionalPermissionsChanged: false,
    files: sources.map(file => ({ file, sha256: sha(fs.readFileSync(path.join(h.root, file))) })) });
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
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8'); if ([...known].some(v => text.includes(v))) issues.push({ file: rel(f), type: 'KNOWN_PRIVATE_VALUE' });
    const body = sources.includes(rel(f)) ? text.replace(/[A-Z0-9._%+-]+@example\.test/gi, '[SYNTHETIC_TEMPLATE]') : text;
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body)) issues.push({ file: rel(f), type: 'PRIVATE_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ issues }));
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0, credentialValuesRequested: false, actualProviderCredentialsUsed: false,
    providerConfigurationSynthetic: true, runtimeHeadersAndBodiesNotPublished: true, syntheticExampleTestSourceLiteralsAllowed: true,
    scope: 'Current evidence and changed source, bounded patterns/known values; not universal privacy guarantee.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: previous.length, priorEntriesMatching: true,
    finalControls: 57, passed: 57, failed: 0, syntheticContracts: 35, typechecksPassed: 2, candidateFilesMatching: 39,
    handlerHttpResponses: 51, realLocalReads: 38, handlerWritesAttempted: 0, nativeProviderDenials: 2,
    source401RegressionFixed: true, businessSnapshotsMatch: true, localServerStopped: true, cloudDeployed: false,
    linksChecked: links, brokenLinks: 0, privacyIssues: 0, productionChanged: false, newAcademicDocuments: 3 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ at: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: c.baseCommit,
    note: 'Excludes this manifest and private cache/candidate files; shared-source and audit-source hashes included in evidence. Immutable after sealing.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const e of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, e.file))), e.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: previous.length, finalControls: 57, contracts: 35,
    privacyIssues: 0, linksChecked: links, productionChanged: false }));
})().catch(e => { console.error(e.message); process.exitCode = 1; });
