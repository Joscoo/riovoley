'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), cp = require('node:child_process'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs'), json = f => JSON.parse(fs.readFileSync(f, 'utf8')), read = f => json(path.join(h.evidence, f));
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const git = args => cp.execFileSync('git', args, { cwd: h.root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const rel = f => path.relative(h.root, f).replaceAll('\\', '/');
(async () => {
  assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'ALREADY_SEALED');
  const summary = read('RESULTADOS_AUTOMATIZADOS.json'), cloud = read('seguridad/supabase-catalogo-actual.json');
  const artifacts = read('seguridad/artefactos-sql-edge-verificados.json'), returns = read('seguridad/retorno-edge-archivos-verificados.json');
  const host = read('seguridad/vercel-actual.json'), web = read('seguridad/https-publico-actual.json'), operation = read('OPERACION_PROPUESTA.json');
  assert.equal(summary.productionChanged, false); assert.equal(summary.productionReady, false); assert.equal(summary.functionalTestsNew, 0);
  assert.equal(cloud.project.id, 'mayvvlkvheagkojunzzb'); assert.equal(cloud.fingerprint, '15b9d9e869fb5113263c485714009878');
  assert.equal(cloud.catalog.read_only, 'on'); assert.equal(cloud.catalog.daily_reward_rpc_present, false);
  assert.ok(cloud.catalog.rls.length === 2 && cloud.catalog.rls.every(t => t.enabled && t.policies === 1));
  for (const name of ['duplicate_student_user_groups', 'duplicate_daily_login_groups', 'daily_login_null_refs', 'noncanonical_roles']) assert.equal(cloud.catalog[name], 0);
  assert.equal(host.project.accountId, 'team_hhFsXPWPvpQakRvHpejCGAFU'); assert.equal(host.project.id, host.deployment.projectId);
  assert.equal(host.project.name, 'riovoley'); assert.equal(host.deployment.readyState, 'READY');
  assert.equal(host.deployment.gitSha, 'e469db5608fb77071b6a9ee3db253c28dae734dd');
  assert.equal(web.observations.length, 4); assert.ok(web.observations.every(r => r.status === 200)); assert.equal(web.javascriptExecuted, false);
  assert.equal(operation.productionExecutionAuthorized, false); assert.equal(operation.responsibleConfirmed, true);
  assert.equal(operation.androidDistributionIncluded, false); assert.equal(operation.reservedMinutes, 90);
  assert.equal((Date.parse(operation.windowEndUtc) - Date.parse(operation.windowStartUtc)) / 60000, 90);
  for (const f of artifacts.sql) assert.equal(hash(fs.readFileSync(path.join(h.root, f.file))), f.sha256);
  assert.equal(artifacts.sql.length, 4); assert.ok(artifacts.sql.every(f => f.matchesReviewed));
  assert.equal(artifacts.edge.length, 9); assert.ok(artifacts.edge.every(f => f.matchesPreparedReturnHash && f.verifyJwt && f.status === 'ACTIVE'));
  assert.equal(artifacts.candidateFiles.length, 39); assert.ok(artifacts.candidateFiles.every(f => f.privateHashMatches));
  assert.equal(returns.totalFiles, 51); assert.equal(returns.allMatch, true);
  const api = read('seguridad/consultas-mcp.json'); assert.equal(api.length, 6); assert.ok(api.every(r => !r.toolIsError));
  assert.equal(read('seguridad/consulta-permisos.meta.json').toolIsError, false);
  for (const f of ['consulta-catalogo.sql', 'consulta-huella.sql', 'consulta-permisos.sql']) assert.ok(fs.readFileSync(path.join(h.evidence, 'seguridad', f), 'utf8').startsWith('BEGIN TRANSACTION READ ONLY;'));
  for (const f of ['seguridad/http-publico-comando.meta.json', 'seguridad/artefactos-comando.meta.json', 'seguridad/artefactos-cierre-comando.meta.json', 'seguridad/retorno-edge-comando.meta.json']) assert.equal(read(f).exitCode, 0);
  const backup = read('seguridad/respaldos-recibos-actuales.json'); assert.equal(backup.sql.ciphertextHashMatchesReceipt, true); assert.equal(backup.archiveUnlocked, false); assert.equal(backup.freshBackupPerformed, false);
  const prior = walk(path.join(h.root, 'docs/tesis/evidencias')).filter(f => path.basename(f) === 'MANIFIESTO_SHA256.json');
  const previous = prior.flatMap(file => { const m = json(file); return (m.entries || [...m.evidenceFiles || [], ...m.additionalTestSources || []]).map(e => ({ file: path.resolve(path.dirname(file), e.file), sha256: e.sha256 })); });
  let index = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (index < previous.length) { const e = previous[index++]; assert.ok(e.file.startsWith(h.root + path.sep)); assert.equal(hash(await fs.promises.readFile(e.file)), e.sha256, 'HISTORICAL_EVIDENCE_CHANGED'); }
  }));
  const changed = [...new Set([...git(['diff', 'HEAD', '--name-only', '-z']).split('\0'), ...git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0')].filter(Boolean))];
  assert.ok(!changed.some(f => /^(src|android|database|supabase\/functions|public)\//.test(f)), 'PRODUCT_OR_PROPOSAL_CHANGED');
  assert.equal(git(['diff', 'HEAD', '--', 'tests/e2e/audit.protected-routes.spec.js', 'src/features/gamification/application/useCases/gamification.audit.integration.test.js']), '');
  const sources = changed.filter(f => !f.startsWith('docs/tesis/evidencias/'));
  for (const file of sources) {
    const body = fs.readFileSync(path.join(h.root, file), 'utf8'); assert.ok(!body.includes('\uFFFD'), 'INVALID_UNICODE');
    assert.ok(!body.split(/\r?\n/).some(line => /[\t ]+$/.test(line)), 'TRAILING_WHITESPACE: ' + file);
  }
  h.write('FUENTES_EVALUADAS.json', { at: new Date().toISOString(), baseCommit: summary.baseCommit, productChanged: false, sqlProposalChanged: false,
    files: sources.map(file => ({ file, sha256: hash(fs.readFileSync(path.join(h.root, file))) })) });
  h.write('COMANDOS.json', walk(h.evidence).filter(f => /\.meta(?:-[a-z0-9-]+)?\.json$/i.test(f)).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), ...json(file) })));
  let links = 0;
  for (const file of [...walk(h.evidence).filter(f => f.endsWith('.md')), path.join(h.root, 'docs/produccion/RUNBOOK.md')]) {
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (/^https?:\/\//.test(match[1])) continue;
      const target = path.resolve(path.dirname(file), match[1].split('#')[0]);
      if (!['INTEGRIDAD.json', 'PRIVACIDAD.json', 'MANIFIESTO_SHA256.json'].includes(path.basename(target))) assert.ok(fs.existsSync(target), 'BROKEN_LINK: ' + rel(target));
      links++;
    }
  }
  const known = new Set(), collect = (v, name = '') => {
    if (v && typeof v === 'object') for (const [k, value] of Object.entries(v)) collect(value, k);
    else if (typeof v === 'string' && v.length >= 12 && /password|secret|token|key/i.test(name)) known.add(v);
  };
  collect(json(path.join(h.runtime, 'credentials.json')));
  for (const file of fs.readdirSync(h.root).filter(f => /^\.env(?:\.|$)/.test(f) && !f.includes('example'))) {
    if (!fs.statSync(path.join(h.root, file)).isFile()) continue;
    for (const [name, value] of Object.entries(require('dotenv').parse(fs.readFileSync(path.join(h.root, file))))) if (/PASSWORD|TOKEN|SECRET|PRIVATE_KEY|PII_ENCRYPTION_KEY|PHONE|EMAIL/.test(name) && value.length >= 8) known.add(value);
  }
  const files = [...walk(h.evidence), ...sources.map(f => path.join(h.root, f))], issues = [];
  for (const file of files) {
    const body = fs.readFileSync(file, 'utf8');
    if ([...known].some(v => body.includes(v))) issues.push({ file: rel(file), type: 'KNOWN_PRIVATE_VALUE' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\r?\n[A-Za-z0-9+/=\r\n]{80,}|eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}|sb_secret_[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(body)) issues.push({ file: rel(file), type: 'PRIVATE_PATTERN' });
  }
  assert.equal(issues.length, 0, JSON.stringify({ privacyIssues: issues }));
  h.write('PRIVACIDAD.json', { at: new Date().toISOString(), filesChecked: files.length, issues: 0,
    credentialValuesRequested: false, businessRowsPublished: false, accountEmailsPublished: false,
    encryptedArchivesUnlocked: false, scope: 'Archivos nuevos/modificados comparados con valores locales conocidos y patrones acotados. Metadatos proyectados sin cuentas personales o filas; no garantia universal ni historial completo.' });
  h.write('INTEGRIDAD.json', { at: new Date().toISOString(), priorManifests: prior.length, priorEntries: previous.length, priorEntriesMatching: true,
    sqlMatching: 4, edgeMetadataHashesMatching: 9, candidateFilesMatching: 39, returnSourceFilesMatching: 51,
    mcpMainReadReceipts: 7, publicGet200: 4, newFunctionalTestCases: 0, newBuild: false,
    originalProtectedTestsUnchanged: true, productChanged: false, sqlProposalChanged: false,
    windowMinutesProposed: 90, productionExecutionAuthorized: false, productionChanged: false,
    linksChecked: links, brokenLinks: 0, privacyIssues: 0, originalRequestedDocuments: 3, proposalDocuments: 1 });
  const entries = walk(h.evidence).map(file => ({ file: path.relative(h.evidence, file).replaceAll('\\', '/'), bytes: fs.statSync(file).size, sha256: hash(fs.readFileSync(file)) })).sort((a, b) => a.file.localeCompare(b.file));
  fs.writeFileSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json'), JSON.stringify({ createdAt: new Date().toISOString(), algorithm: 'SHA-256', baseCommit: summary.baseCommit, note: 'Excluye manifiesto propio y artefactos privados. No modificar tras sellado.', entries }, null, 2) + '\n', { flag: 'wx' });
  for (const e of entries) assert.equal(hash(fs.readFileSync(path.join(h.evidence, e.file))), e.sha256);
  console.log(JSON.stringify({ sealed: true, entries: entries.length, priorManifests: prior.length, priorEntries: previous.length, privacyIssues: 0, links, productionChanged: false, productionAuthorized: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
