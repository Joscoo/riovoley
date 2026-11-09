'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createClient } = require('@supabase/supabase-js');
const ctx = require('./edge-fence-context.cjs'), c = ctx.read(), h = require('../../e2e/local/harness.cjs'), { readLocal } = require('../../e2e/local/safety.cjs');
const catalog = require('./packet-context.cjs'), local = readLocal(), phase = process.argv[2]; assert.ok(['red', 'green'].includes(phase));
const checks = [], responses = [], clients = [], tokens = {};
let db, baseline, after, stats, setupError, cleanupPassed = false;
async function check(name, operation) {
  const start = Date.now();
  try { const detail = await operation(); checks.push({ name, state: 'APROBADO', durationMs: Date.now() - start, detail: detail || null }); }
  catch (e) { checks.push({ name, state: 'FALLIDO', durationMs: Date.now() - start, code: e.code || 'ASSERTION', expected: typeof e.expected === 'number' ? e.expected : null,
    actual: typeof e.actual === 'number' ? e.actual : null }); }
}
async function request(name, method = 'POST', token, body = {}) {
  assert.ok(c.names.includes(name)); const start = Date.now();
  const r = await fetch('http://127.0.0.1:6163/' + name, { method, redirect: 'error', signal: AbortSignal.timeout(12000),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
  let data; if (r.headers.get('content-type')?.includes('application/json')) data = await r.json(); else await r.text();
  responses.push({ name, method, status: r.status, code: typeof data?.code === 'string' ? data.code : null, durationMs: Date.now() - start });
  return { status: r.status, code: data?.code, cors: r.headers.get('access-control-allow-origin') };
}
async function diagnostic(pathname) { const r = await fetch('http://127.0.0.1:6163/' + pathname, { redirect: 'error', signal: AbortSignal.timeout(4000) }); assert.equal(r.status, 200); return r.json(); }
async function run() {
  db = await require('../security/local-db.cjs').connect();
  for (const role of ['admin', 'student']) {
    const client = createClient(local.apiUrl, local.anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, options) => {
      const u = new URL(typeof input === 'string' ? input : input.url); assert.equal(u.origin, 'http://127.0.0.1:55321'); return fetch(input, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) });
    } } });
    const r = await client.auth.signInWithPassword(local.accounts[role]); assert.ok(!r.error && r.data.session, 'LOCAL_FIXTURE_LOGIN_FAILED');
    tokens[role] = r.data.session.access_token; clients.push(client);
  }
  const businessSchemas = new Set(['audit', 'billing', 'core', 'gamification', 'profiles', 'public', 'public_content', 'reporting', 'security', 'training']);
  const tables = (await catalog.inventory(db)).filter(t => businessSchemas.has(t.schema)); baseline = await catalog.contents(db, tables);
  if (phase === 'red') {
    await check('sync-mobile-device sin token debe responder 401', async () => { assert.equal((await request('sync-mobile-device')).status, 401); });
    await check('sync-mobile-device token invalido debe responder 401', async () => { assert.equal((await request('sync-mobile-device', 'POST', 'invalid')).status, 401); });
  } else {
    for (const name of c.names) {
      await check(name + ' OPTIONS', async () => { const r = await request(name, 'OPTIONS'); assert.equal(r.status, 200); assert.ok(r.cors); });
      await check(name + ' GET rechazado', async () => { const r = await request(name, 'GET'); assert.equal(r.status, 405); assert.equal(r.code, 'METHOD_NOT_ALLOWED'); });
    }
    const authenticated = c.names.filter(n => n !== 'send-payment-reminders');
    for (const name of authenticated) await check(name + ' sin sesion', async () => { const r = await request(name); assert.equal(r.status, 401); if (name === 'sync-mobile-device') assert.equal(r.code, 'AUTH_REQUIRED'); });
    for (const name of authenticated) await check(name + ' token invalido', async () => { const r = await request(name, 'POST', 'invalid'); assert.equal(r.status, 401); if (name === 'sync-mobile-device') assert.equal(r.code, 'AUTH_INVALID'); });
    for (const name of authenticated) await check(name + ' rol atleta', async () => { assert.equal((await request(name, 'POST', tokens.student)).status, name === 'sync-mobile-device' ? 400 : 403); });
    for (const name of authenticated.filter(n => n !== 'generate-scheduled-reports')) await check(name + ' admin cuerpo vacio no escribe', async () => { assert.equal((await request(name, 'POST', tokens.admin)).status, 400); });
    await check('recordatorios sin scheduler configurado', async () => { const r = await request('send-payment-reminders'); assert.equal(r.status, 503); assert.equal(r.code, 'SCHEDULER_NOT_CONFIGURED'); });
    await check('correo autorizado con proveedor cercado no confirma entrega', async () => {
      const r = await request('send-email', 'POST', tokens.admin, { to: 'audit@example.test', subject: 'Fixture local de salida bloqueada', html: '<p>Contenido sintetico de auditoria</p>' });
      assert.equal(r.status, 503); assert.equal(r.code, 'EMAIL_PROVIDER_UNAVAILABLE');
    });
    for (const provider of ['resend', 'fcm']) await check('Deno niega red nativa a ' + provider, async () => { const r = await diagnostic('__probe/' + provider); assert.equal(r.denied, true); assert.equal(r.errorName, 'NotCapable'); });
    await check('instrumentacion rechaza escritura local', async () => { assert.equal((await diagnostic('__probe/local-write')).denied, true); });
    stats = await diagnostic('__stats');
    await check('entorno proveedor exclusivamente sintetico', async () => { assert.equal(stats.providerEnvironment.resendSynthetic, true); assert.equal(stats.providerEnvironment.fcmConfigured, false); assert.equal(stats.providerEnvironment.schedulerConfigured, false); });
    await check('handlers no intentan escrituras locales', async () => { assert.equal(stats.localWritesBlocked.filter(r => r.handler !== 'safety-probe').length, 0); });
  }
  after = await catalog.contents(db, tables);
  if (phase === 'green') await check('tablas y secuencias de negocio sin cambios', async () => { assert.deepEqual(after, baseline); });
  else assert.deepEqual(after, baseline);
  stats ||= await diagnostic('__stats');
}
(async () => {
  try { await run(); } catch (e) { setupError = e; }
  finally {
    try { for (const client of clients) { const r = await client.auth.signOut({ scope: 'local' }); assert.ok(!r.error); } cleanupPassed = true; } catch { cleanupPassed = false; }
    if (db) await db.end();
    const sources = c.names.map(name => ({ name, file: 'supabase/functions/' + name + '/index.ts', sha256: require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(h.root, 'supabase/functions', name, 'index.ts'))).digest('hex') }));
    const result = { at: new Date().toISOString(), phase, executed: checks.length, passed: checks.filter(t => t.state === 'APROBADO').length,
      failed: checks.filter(t => t.state === 'FALLIDO').length, completed: !setupError, setupErrorCode: setupError?.code || null,
      checks, responses, stats, baseline, after, cleanupPassed, sources, realAuthAndRest: true, providerConfigurationSynthetic: true, cloudRuntimeUsed: false, productionChanged: false };
    h.write('integracion/casos-' + phase + '.json', result); console.log(JSON.stringify({ phase, executed: result.executed, passed: result.passed, failed: result.failed, completed: result.completed, cleanupPassed, setupErrorCode: result.setupErrorCode }));
    if (setupError || result.failed || !cleanupPassed) process.exitCode = 1;
  }
})();
