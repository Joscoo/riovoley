'use strict';
// Four read probes and synthetic local logins. No institutional calls or business writes.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { createClient } = require('@supabase/supabase-js');
const { readLocal } = require('../../e2e/local/safety.cjs'), h = require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
(async () => {
  const local = readLocal(), results = [];
  const request = async (role, token) => {
    const url = new URL('/rest/v1/gamification_student_achievements?select=id&limit=0', local.apiUrl);
    assert.equal(url.origin, 'http://127.0.0.1:55321');
    const r = await fetch(url, { headers: { apikey: local.anonKey, Authorization: 'Bearer ' + token }, redirect: 'error', signal: AbortSignal.timeout(15000) });
    const body = await r.json();
    results.push({ role, method: 'GET', limit: 0, status: r.status, returnedRows: Array.isArray(body) ? body.length : null, errorCode: body.code || null });
  };
  await request('anon', local.anonKey);
  for (const role of ['admin', 'trainer', 'student']) {
    const client = createClient(local.apiUrl, local.anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      assert.equal(new URL(typeof input === 'string' ? input : input.url).origin, local.apiUrl);
      return fetch(input, { ...init, redirect: 'error' });
    } } });
    try {
      const { data, error } = await client.auth.signInWithPassword({ email: local.accounts[role].email, password: local.accounts[role].password });
      assert.equal(error, null, 'LOCAL_SIGNIN_FAILED');
      await request(role, data.session.access_token);
    } finally { await client.auth.signOut(); }
  }
  h.write('integracion/sondas-logros-locales.json', { at: new Date().toISOString(), results,
    requests: 4, authenticatedExpected200: 3, anonymousExpectedDenied: true, limitZeroOnly: true,
    businessRowsRead: 0, institutionContacted: false,
    observedNative401CauseAttributed: false,
    limitation: 'Sondas actuales independientes: no capturaron el token ni la fase de las dos respuestas 401 del flujo nativo anterior; no establecen su causa.' });
  assert.ok([401, 403].includes(results[0].status), 'ANON_NOT_DENIED');
  assert.ok(results.slice(1).every(r => r.status === 200 && r.returnedRows === 0), 'AUTHENTICATED_READ_FAILED');
  console.log(JSON.stringify({ probes: 4, passed: 4, failed: 0, native401CauseAttributed: false }));
})().catch(() => { console.error('LOCAL_ACHIEVEMENT_PROBE_FAILED'); process.exitCode = 1; });
