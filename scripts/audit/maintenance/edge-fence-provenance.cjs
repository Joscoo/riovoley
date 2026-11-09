'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const c = require('./edge-fence-context.cjs').read(), h = require('../../e2e/local/harness.cjs');
const sha = b => crypto.createHash('sha256').update(b).digest('hex'), json = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const dir = path.join(h.evidence, 'integracion');
const metas = fs.readdirSync(dir).filter(f => /^edge-(?:cases|server)-(?:red|green).*\.meta\.json$/.test(f)).map(file => ({ file: 'integracion/' + file, ...json(path.join(dir, file)) }));
const runs = fs.readdirSync(dir).filter(f => /^casos-(?:red|green)(?:-[a-z0-9-]+)?\.json$/.test(f)).map(file => {
  const r = json(path.join(dir, file)), time = Date.parse(r.at);
  const cases = metas.filter(m => m.file.startsWith('integracion/edge-cases-' + r.phase) && Date.parse(m.start) <= time && time <= Date.parse(m.end)); assert.equal(cases.length, 1);
  const server = metas.filter(m => m.file.startsWith('integracion/edge-server-' + r.phase) && Date.parse(m.start) <= Date.parse(cases[0].start) && Date.parse(cases[0].end) <= Date.parse(m.end)); assert.equal(server.length, 1);
  return { recordedAt: r.at, phase: r.phase, resultFile: 'integracion/' + file, casesMetaFile: cases[0].file, serverMetaFile: server[0].file,
    executed: r.executed, passed: r.passed, failed: r.failed, exitCode: cases[0].exitCode, durationSeconds: cases[0].durationSeconds, cleanupPassed: r.cleanupPassed };
}).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
assert.ok(runs.length >= 2); const selected = runs.at(-1); assert.equal(selected.phase, 'green'); assert.equal(selected.passed, 57); assert.equal(selected.exitCode, 0);
const previous = json(path.join(h.runtime, 'edge-production/packet.json')), candidate = path.join(c.privateDir, 'candidate-' + Date.now());
assert.ok(!fs.existsSync(candidate), 'NEW_CANDIDATE_REQUIRED'); fs.mkdirSync(candidate);
const files = previous.candidateFiles.map(f => {
  assert.ok(f.file === 'supabase/config.toml' || f.file.startsWith('supabase/functions/')); assert.ok(!/(^|\/)\.env/.test(f.file));
  const repositoryFile = path.resolve(h.root, f.file); assert.ok(repositoryFile.startsWith(h.root + path.sep));
  const fromRepository = f.file !== 'supabase/config.toml' && fs.existsSync(repositoryFile);
  const src = fromRepository ? repositoryFile : path.resolve(h.root, previous.candidateDirectory, f.file);
  assert.ok(fromRepository || src.startsWith(h.runtime + path.sep)); const bytes = fs.readFileSync(src);
  if (!fromRepository) assert.equal(sha(bytes), f.sha256, 'GENERATED_CONFIG_CHANGED');
  const target = path.join(candidate, f.file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes, { flag: 'wx' });
  return { file: f.file, origin: fromRepository ? 'current-repository' : 'previous-generated-configuration', sha256: sha(bytes), previousSha256: f.sha256,
    changedFromPreviousCandidate: sha(bytes) !== f.sha256, privateCopyMatchesSource: sha(fs.readFileSync(target)) === sha(bytes) };
});
assert.equal(files.length, 39); assert.ok(files.every(f => f.privateCopyMatchesSource));
h.write('seguridad/candidato-fuentes-corregido.json', { recordedAt: new Date().toISOString(), privateCandidateDirectory: path.relative(h.root, candidate).replaceAll('\\', '/'),
  files, changedSourceFiles: files.filter(f => f.changedFromPreviousCandidate).map(f => f.file), cloudBundleBuilt: false, deployed: false,
  note: 'Current repository source copies only. Previous private candidate/return artifacts preserved; no Cloud metadata recheck in this step.' });
h.write('integracion/indice-intentos.json', { recordedAt: new Date().toISOString(), runs, selected });
const auditSources = ['edge-fence-context.cjs', 'edge-fence-entry.ts', 'edge-fence-run.cjs', 'edge-fence-cases.cjs', 'edge-fence-provenance.cjs'].map(name => {
  const file = 'scripts/audit/maintenance/' + name; return { file, sha256: sha(fs.readFileSync(path.join(h.root, file))) };
});
h.write('seguridad/procedencia-arnes-corregida.json', { recordedAt: new Date().toISOString(), files: auditSources,
  remoteDependencyDownloadsDuringRuns: false, serveSubstitutedOnlyForListener: true, localReadsReal: true, providerConfigurationSynthetic: true });
console.log(JSON.stringify({ attempts: runs.length, finalCases: 57, candidateFiles: files.length, changedCandidateSources: files.filter(f => f.changedFromPreviousCandidate).length, deployed: false }));
