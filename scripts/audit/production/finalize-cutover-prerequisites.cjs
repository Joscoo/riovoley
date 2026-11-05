'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict'), cp = require('node:child_process');
const h = require('../../e2e/local/harness.cjs');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const read = file => json(path.join(h.evidence, file));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const rel = file => path.relative(h.root, file).replaceAll('\\', '/');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
(async () => {
  assert.match(path.basename(h.evidence), /^\d{8}-\d{6}-prerrequisitos-corte-[a-f0-9]{7}$/);
  assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'SEALED_PACKET');
  const c = read('CONTEXTO.json'), b = read('seguridad/respaldos-administrados.json');
  const s = read('RESULTADOS_AUTOMATIZADOS.json'), old = read('seguridad/respaldo-logico-existente.json');
  const refs = read('seguridad/canales-cliente-revisados.json'), org = read('seguridad/plan-organizacion-mcp.json');
  const p = read('seguridad/proyecto-organizacion-mcp.json');
  assert.equal(c.baseCommit, git(['rev-parse', 'HEAD']).trim());
  assert.equal(c.projectId, 'mayvvlkvheagkojunzzb'); assert.equal(p.projectId, c.projectId);
  assert.equal(p.name, 'Riovoley APP'); assert.equal(org.name, 'Riovoley'); assert.equal(org.toolIsError, false);
  assert.equal(s.managedBackupRead.exitCode, b.exitCode); assert.equal(b.exitCode, 0); assert.equal(b.responseRecognized, true);
  assert.equal(b.backupsReturnedNull, true); assert.equal(b.listedBackupCount, null);
  assert.equal(b.physicalRecoveryMetadataEmpty, true); assert.equal(b.pitrEnabled, false);
  assert.equal(s.organizationPlan, org.plan); assert.equal(org.plan, 'free');
  assert.equal(s.newFunctionalTests, 0); assert.equal(s.newBuilds, 0); assert.equal(s.releaseReady, false);
  assert.equal(s.productionChanged, false); assert.equal(s.productionExecutionAuthorized, false);
  assert.equal(old.ciphertextMatchesReceipt, true); assert.equal(old.encryptedBytes, 1418439);
  assert.equal(old.archiveUnlocked, false); assert.equal(old.newRestorePerformed, false);
  assert.equal(refs.references.length, 7); assert.equal(refs.globalWriteGateDemonstrated, false);
  for (const r of refs.references) assert.equal(sha(fs.readFileSync(path.join(h.root, r.file))), r.sha256);
  const previousSummary = json(path.join(h.root, 'docs/tesis/evidencias/verificacion-tecnica/20261105-152944-notifications-cancel-e903a31/RESULTADOS_AUTOMATIZADOS.json'));
  assert.equal(previousSummary.jest.cases, 434); assert.equal(previousSummary.jest.suites, 91);
  assert.equal(previousSummary.controlled.passed, 1); assert.equal(previousSummary.native.passed, 14);
  const meta = walk(h.evidence).filter(file => file.endsWith('.meta.json')).map(file => ({ file: rel(file), ...json(file) }));
  assert.ok(meta.filter(m => Object.hasOwn(m, 'exitCode')).every(m => m.exitCode === 0));
  assert.equal(read('seguridad/respaldos-administrados.meta.json').command.join(' '), '.e2e-local/tools/node_modules/@supabase/cli-windows-x64/bin/supabase.exe backups list --project-ref mayvvlkvheagkojunzzb --output json');
  h.write('COMANDOS.json', meta);
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(file => path.basename(file) === 'MANIFIESTO_SHA256.json');
  const entriesBefore = prior.flatMap(file => {
    const m = json(file);
    return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 }));
  });
  let index = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (index < entriesBefore.length) {
      const e = entriesBefore[index++];
      assert.ok(e.file.startsWith(h.root + path.sep));
      assert.equal(sha(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED');
    }
  }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  const sources = changed.filter(file => !file.startsWith('docs/tesis/evidencias/'));
  const allowed = ['docs/produccion/RUNBOOK.md', 'docs/superpowers/plans/2026-11-05-cutover-prerequisites.md',
    'scripts/audit/production/check-cutover-prerequisites.cjs', 'scripts/audit/production/report-cutover-prerequisites.cjs', 'scripts/audit/production/finalize-cutover-prerequisites.cjs'];
  assert.ok(sources.every(file => allowed.includes(file)), 'UNEXPECTED_SOURCE_CHANGE');
  assert.ok(changed.filter(file => file.startsWith('docs/tesis/evidencias/')).every(file => file.startsWith(rel(h.evidence) + '/')), 'OTHER_EVIDENCE_CHANGED');
  for (const file of sources) {
    const text = fs.readFileSync(path.join(h.root, file), 'utf8');
    assert.ok(!text.includes('\uFFFD')); assert.ok(!text.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE');
  }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), productChanged: false, sqlProposalChanged: false,
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
    knownLocalValuesAndPatternsChecked: true, businessRowsPublished: false, rawCliDiagnosticsPublished: false,
    credentialValuesRequested: false, scope: 'New/modified files and this evidence packet only; not a universal privacy guarantee.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: entriesBefore.length,
    priorEntriesMatching: true, linksChecked: links, brokenLinks: 0, privacyIssues: 0, staticSourceHashesMatching: 7,
    functionalAntecedentCountsVerified: true, newFunctionalTests: 0, newBuilds: 0,
    productChanged: false, sqlProposalChanged: false, productionChanged: false, executionAuthorized: false,
    newAcademicDocuments: 3, newOperationalCriteria: 1 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: sha(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: c.baseCommit,
    note: 'Excludes this manifest and private artifacts. Do not modify after sealing.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const e of entries) assert.equal(sha(fs.readFileSync(path.join(h.evidence, e.file))), e.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: entriesBefore.length,
    privacyIssues: 0, linksChecked: links, productionChanged: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
