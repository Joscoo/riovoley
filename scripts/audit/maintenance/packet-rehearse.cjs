'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ctx = require('./packet-context.cjs'), gate = require('./packet-gate.cjs'), h = require('../../e2e/local/harness.cjs');
const c = ctx.read(); assert.equal(h.evidence, c.evidence);
const base = '15b9d9e869fb5113263c485714009878', main = '500d15ffa5fa23aeddb47e5c21cd1d13', full = '38434a2af96ad410967032b00a0828ac';
const specs = [
  ['principal-avance', '20261031211612_riovoley_security_production_proposal.sql', base, main],
  ['reportes-avance', '20261101013935_reporting_service_grants_proposal.sql', main, full],
  ['reportes-retorno', '20261101013935_reporting_service_return_proposal.sql', full, main],
  ['principal-retorno', '20261031211612_riovoley_security_return_proposal.sql', main, base]
].map(([label, name, before, after]) => ({ label, name, before, after, file: 'database/security/production-proposal/' + name }));
const checks = [], mapping = {}, states = [], variants = [], operations = [];
let db, tables, initial;
let finalArtifacts;
const relative = file => path.relative(h.evidence, file).replaceAll('\\', '/');
async function check(name, operation) {
  const start = Date.now();
  try { const detail = await operation(); checks.push({ name, state: 'APROBADO', durationMs: Date.now() - start, detail: detail || null }); }
  catch (error) { checks.push({ name, state: 'FALLIDO', durationMs: Date.now() - start, errorCode: error.code || 'ASSERTION' }); throw error; }
}
async function execute(label, text, expected) {
  const startedAt = new Date().toISOString(), begin = Date.now();
  let error;
  try { await db.query(text); } catch (e) { error = e; await db.query('ROLLBACK'); }
  operations.push({ label, startedAt, finishedAt: new Date().toISOString(), durationMs: Date.now() - begin,
    sqlSha256: ctx.sha(text), sqlState: error?.code || null, expectedFailure: Boolean(expected), rawOutputPublished: false });
  if (expected) { assert.ok(error, 'EXPECTED_REJECTION_MISSING'); assert.equal(error.code, expected.code); assert.match(error.message, expected.message); }
  else if (error) throw error;
}
async function unchanged() { assert.deepEqual(await ctx.contents(db, tables), initial, 'SYNTHETIC_DATA_OR_SEQUENCE_CHANGED'); }
async function probe() {
  await execute('probe-authenticated', 'BEGIN;SET LOCAL ROLE authenticated;SELECT gate_guard.probe_write();COMMIT;',
    { code: '55000', message: /^RIOVOLEY_LOCAL_WRITE_GATE$/ });
}
async function measure(expected) {
  assert.equal(await ctx.fingerprint(db), expected); await gate.install(db, tables);
  const closedFingerprint = await ctx.fingerprint(db), gateDigest = await gate.digest(db);
  mapping[expected] = closedFingerprint; states.push({ openFingerprint: expected, closedFingerprint, gateDigest });
  await probe(); await unchanged(); await gate.remove(db, tables); assert.equal(await ctx.fingerprint(db), expected);
}
async function run() {
  db = await ctx.connect(); await db.query('SET search_path=public,extensions'); tables = await ctx.inventory(db);
  initial = await ctx.contents(db, tables); assert.deepEqual(initial, c.sourceContent);
  await db.query("SELECT set_config('riovoley.release.approval','reviewed-maintenance:mayvvlkvheagkojunzzb',false),set_config('riovoley.release.window','closed-to-clients',false)");
  await check('normalizacion-retorno-reportes', async () => { await execute('preparacion-reportes-retorno', fs.readFileSync(path.join(h.root, specs[2].file), 'utf8')); assert.equal(await ctx.fingerprint(db), main); await unchanged(); });
  await check('normalizacion-retorno-principal', async () => { await execute('preparacion-principal-retorno', fs.readFileSync(path.join(h.root, specs[3].file), 'utf8')); assert.equal(await ctx.fingerprint(db), base); await unchanged(); });
  await check('referencia-huella-inicial-con-barrera', () => measure(base));
  for (let index = 0; index < specs.length; index++) {
    const spec = specs[index];
    await check('referencia-' + spec.label, async () => {
      await execute('referencia-' + spec.label, fs.readFileSync(path.join(h.root, spec.file), 'utf8')); assert.equal(await ctx.fingerprint(db), spec.after); await unchanged();
    });
    if (index < 2) await check('referencia-medicion-' + spec.label, () => measure(spec.after));
  }
  const gateDigest = states[0].gateDigest; assert.ok(states.every(s => s.gateDigest === gateDigest), 'GATE_METADATA_CHANGED_BETWEEN_STATES');
  await check('instalacion-integrada', async () => { await gate.install(db, tables); assert.equal(await ctx.fingerprint(db), mapping[base]); assert.equal(await gate.digest(db), gateDigest); await probe(); });
  await check('original-rechaza-deriva-con-barrera', async () => {
    await execute('original-incompatible-con-barrera', fs.readFileSync(path.join(h.root, specs[0].file), 'utf8'), { code: 'P0001', message: /Deriva del catalogo/ });
    assert.equal(await ctx.fingerprint(db), mapping[base]); await unchanged();
  });
  await check('generacion-variantes-sin-cambios-funcionales', async () => {
    for (const spec of specs) {
      const bytes = fs.readFileSync(path.join(h.root, spec.file));
      const v = gate.createVariant(bytes.toString('utf8'), mapping, gateDigest);
      const file = 'integracion/variantes-locales/' + spec.name;
      const allocated = h.write(file, v.sql);
      const persisted = fs.readFileSync(allocated, 'utf8');
      assert.equal(persisted, v.sql + '\n', 'PERSISTED_SQL_WAS_REDACTED_OR_CHANGED');
      variants.push({ ...spec, evidenceFile: path.relative(h.evidence, allocated).replaceAll('\\', '/'), sourceSha256: ctx.sha(bytes), variantSha256: ctx.sha(fs.readFileSync(allocated)),
        guardsRebased: v.guardsRebased, originalBodyPreservedBytewise: v.originalBodyPreservedBytewise, executedPersistedBytes: true, sql: persisted });
    }
  });
  await check('guarda-funcion-alterada', async () => {
    const original = (await db.query("SELECT pg_get_functiondef('gate_guard.reject_write()'::regprocedure) AS sql")).rows[0].sql;
    try {
      await db.query('CREATE OR REPLACE FUNCTION gate_guard.reject_write() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$ BEGIN RETURN NULL; END $$');
      await execute('funcion-alterada-rechazada', variants[0].sql, { code: 'P0001', message: /^LOCAL_GATE_CATALOG_DRIFT$/ });
    } finally { await db.query(original); }
    assert.equal(await gate.digest(db), gateDigest); await unchanged();
  });
  await check('guarda-disparador-deshabilitado', async () => {
    const table = ctx.qi(tables[0].schema) + '.' + ctx.qi(tables[0].name);
    try {
      await db.query('ALTER TABLE ' + table + ' DISABLE TRIGGER ' + gate.gateName);
      await execute('disparador-deshabilitado-rechazado', variants[0].sql, { code: 'P0001', message: /^LOCAL_GATE_CATALOG_DRIFT$/ });
    } finally { await db.query('ALTER TABLE ' + table + ' ENABLE TRIGGER ' + gate.gateName); }
    assert.equal(await gate.digest(db), gateDigest); await unchanged();
  });
  await check('guarda-tabla-nueva-no-inventariada', async () => {
    try {
      await db.query('CREATE TABLE public.riovoley_unlisted_gate_probe(id integer)');
      await execute('tabla-no-inventariada-rechazada', variants[0].sql, { code: 'P0001', message: /^LOCAL_GATE_CATALOG_DRIFT$/ });
    } finally { await db.query('DROP TABLE public.riovoley_unlisted_gate_probe'); }
    assert.equal(await gate.digest(db), gateDigest); assert.equal(await ctx.fingerprint(db), mapping[base]);
  });
  for (let index = 0; index < variants.length; index++) {
    const v = variants[index];
    if (index === 2) await check('retorno-principal-anticipado-rechazado', async () => {
      await execute('orden-retorno-incorrecto', variants[3].sql, { code: 'P0001', message: /Deriva del catalogo/ });
      assert.equal(await ctx.fingerprint(db), mapping[full]); await unchanged();
    });
    await check('integrado-' + v.label, async () => {
      await execute('integrado-' + v.label, v.sql); assert.equal(await ctx.fingerprint(db), mapping[v.after]);
      assert.equal(await gate.digest(db), gateDigest); await probe(); await unchanged();
    });
  }
  await check('retirada-final-y-catalogo-original', async () => {
    await gate.remove(db, tables); assert.equal(await ctx.fingerprint(db), base); await unchanged();
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_trigger WHERE tgname=$1", [gate.gateName])).rows[0].n, 0);
    assert.equal((await db.query("SELECT to_regnamespace('gate_guard') AS schema")).rows[0].schema, null);
  });
  await check('origen-sintetico-intacto', async () => {
    const source = await ctx.connect(true);
    try { assert.equal(await ctx.fingerprint(source), c.sourceFingerprint); assert.deepEqual(await ctx.contents(source, await ctx.inventory(source)), c.sourceContent); }
    finally { await source.end(); }
  });
  finalArtifacts = {
    fingerprintFile: relative(h.write('integracion/huellas-con-barrera.json', { states, gateDigest, scope: 'Measured synthetic laboratory catalog states, not Cloud observations.' })),
    variantManifestFile: relative(h.write('integracion/variantes-manifiesto.json', { variants: variants.map(({ sql, ...v }) => v), originalFilesModified: false, localOnly: true })),
    stateFile: relative(h.write('integracion/estado-final.json', { ...initial, sourceIntact: true, finalFingerprint: base, gateRemoved: true, databasePreserved: true,
      institutionalRowsCopied: 0, productionChanged: false, managedServicesExercised: false })),
    resultFile: relative(h.write('integracion/resultado-final.json', { recordedAt: new Date().toISOString(), executed: checks.length, passed: checks.length, failed: 0,
      checks, completed: true, originalBodyPreservedBytewise: true, productionChanged: false }))
  };
}
(async () => {
  let failed;
  try { await run(); } catch (e) { failed = e; }
  finally {
    if (db) await db.end();
    const controlsFile = relative(h.write('integracion/controles.json', { recordedAt: new Date().toISOString(), checks, executed: checks.length,
      passed: checks.filter(t => t.state === 'APROBADO').length, failed: checks.filter(t => t.state === 'FALLIDO').length,
      completed: !failed, errorCode: failed?.code || null }));
    const operationsFile = relative(h.write('integracion/operaciones-sql.json', operations));
    const attempt = { recordedAt: new Date().toISOString(), completed: !failed, executed: checks.length, controlsFile, operationsFile, ...finalArtifacts };
    h.write(failed ? 'integracion/intento-fallido.json' : 'integracion/intento-final.json', attempt);
  }
  console.log(JSON.stringify({ executed: checks.length, passed: checks.filter(t => t.state === 'APROBADO').length,
    failed: checks.filter(t => t.state === 'FALLIDO').length, completed: !failed, errorCode: failed?.code || null, productionChanged: false }));
  if (failed) process.exitCode = 1;
})();
