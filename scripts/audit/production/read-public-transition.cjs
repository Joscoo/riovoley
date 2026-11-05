'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
(async () => {
  const rows = [];
  for (const pathname of ['/', '/login', '/reset-password', '/manifest.json']) {
    let url = new URL(pathname, 'https://riovoley.com');
    const startedAt = new Date().toISOString(), redirects = [];
    let response;
    for (let i = 0; i < 4; i++) {
      assert.ok(['riovoley.com', 'www.riovoley.com'].includes(url.hostname) && url.protocol === 'https:' && !url.username && !url.password, 'PUBLIC_TARGET_CHANGED');
      response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const next = new URL(response.headers.get('location'), url); redirects.push({ from: url.href, status: response.status, to: next.href }); url = next;
    }
    const body = Buffer.from(await response.arrayBuffer()), text = body.toString('utf8');
    rows.push({ pathname, startedAt, finishedAt: new Date().toISOString(), finalUrl: url.href,
      status: response.status, redirects, bytes: body.length, bodySha256: crypto.createHash('sha256').update(body).digest('hex'),
      rootElement: /<div[^>]+id=["']root["']/.test(text),
      manifestNamePresent: pathname === '/manifest.json' ? Boolean(JSON.parse(text).name) : null,
      headers: Object.fromEntries(['content-type', 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'referrer-policy', 'content-security-policy'].map(name => [name, response.headers.get(name)])) });
  }
  h.write('seguridad/https-publico-actual.json', { observedAt: new Date().toISOString(), observations: rows,
    methods: ['GET'], javascriptExecuted: false, loginPerformed: false, edgeInvoked: false, productionChanged: false,
    scope: 'Transporte HTTPS con validacion TLS predeterminada, HTML SPA y manifest publico. HTTP200 no demuestra acceso por rol ni funcionamiento integral.' });
  assert.ok(rows.every(r => r.status === 200), 'PUBLIC_HTTP_NOT_200');
  assert.ok(rows.filter(r => r.pathname !== '/manifest.json').every(r => r.rootElement), 'SPA_ROOT_NOT_FOUND');
  console.log(JSON.stringify({ getRequests: rows.length, http200: rows.filter(r => r.status === 200).length, spaRoots: rows.filter(r => r.rootElement).length, javascriptExecuted: false }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
