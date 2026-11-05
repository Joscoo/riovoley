'use strict';
// Real local APIs and unchanged compiled client; delay real announcement responses only.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict'), { chromium } = require('playwright'), { expect } = require('@playwright/test');
const h = require('../../e2e/local/harness.cjs'), { readLocal } = require('../../e2e/local/safety.cjs');
const { classifyAuthorization } = require('./auth-observation.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
(async () => {
  const local = readLocal(), native = JSON.parse(fs.readFileSync(path.join(h.runtime, 'native-local-current.json')));
  const db = await require('../security/local-db.cjs').connect(); await db.end();
  const base = path.join(native.project, 'build-safe'), held = [], responses = [], pending = [], started = Date.now();
  const expectCancelled = process.argv.includes('--expect-cancelled'), lateAchievementRequests = [];
  let browser, phase = 'setup', passed = false, release;
  const gate = new Promise(resolve => { release = resolve; });
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
  const server = http.createServer((req, res) => {
    let file = path.resolve(base, '.' + decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname));
    if (!file.startsWith(base + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(base, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 360, height: 720 } }), page = await context.newPage();
    const starts = new WeakMap();
    page.on('request', request => {
      const metadata = { phaseAtStart: phase, startedSeconds: (Date.now() - started) / 1000 }; starts.set(request, metadata);
      if (new URL(request.url()).origin === local.apiUrl && new URL(request.url()).pathname === '/rest/v1/gamification_student_achievements' && phase === 'logged-out:admin') lateAchievementRequests.push({ ...metadata, ...classifyAuthorization(request.headers(), local.anonKey) });
    });
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin !== local.apiUrl) return;
      const item = { path: url.pathname, status: response.status(), method: response.request().method(), ...starts.get(response.request()), phaseAtResponse: phase };
      responses.push(item);
      if (response.status() >= 400) pending.push((async () => {
        Object.assign(item, classifyAuthorization(await response.request().allHeaders(), local.anonKey));
        const body = await response.json(); if (/^[A-Z0-9_]{1,12}$/.test(body.code || '')) item.errorCode = body.code;
      })());
    });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === origin) return route.continue();
      if (url.origin !== local.apiUrl) return route.abort();
      if (url.pathname === '/rest/v1/announcements' && route.request().method() === 'GET') {
        const real = await route.fetch(); held.push({ path: url.pathname, realStatus: real.status(), heldAtSeconds: (Date.now() - started) / 1000 });
        await gate; return route.fulfill({ response: real });
      }
      return route.continue();
    });
    phase = 'login:admin'; await page.goto(origin + '/login');
    await page.evaluate(() => localStorage.setItem('riovoley:panel-guide:admin', JSON.stringify({ version: '2026-06-22', status: 'dismissed' })));
    await page.locator('input[type=email]').fill(local.accounts.admin.email);
    await page.locator('input[type=password]').fill(local.accounts.admin.password);
    await page.locator('form button[type=submit]').click();
    await expect(page).toHaveURL(/\/admin(?:[?#]|$)/, { timeout: 60000 });
    await expect(page.getByRole('button', { name: 'Abrir guia del panel' })).toBeVisible({ timeout: 60000 });
    await expect.poll(() => held.length, { timeout: 30000 }).toBeGreaterThan(0);
    phase = 'logout:admin';
    const menu = page.getByRole('button', { name: 'Abrir menú', exact: true }); if (await menu.isVisible()) await menu.click();
    const logout = page.waitForResponse(r => r.url().startsWith(local.apiUrl + '/auth/v1/logout') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /cerrar sesi/i }).click(); assert.ok([200, 204].includes((await logout).status()));
    await expect.poll(() => page.evaluate(() => Object.keys(localStorage).filter(k => /^sb-.*-auth-token$/.test(k)).length)).toBe(0);
    phase = 'logged-out:admin'; release();
    if (expectCancelled) {
      await page.waitForTimeout(1500);
      assert.equal(lateAchievementRequests.length, 0, 'ACHIEVEMENT_REQUEST_AFTER_CANCEL');
    } else await expect.poll(() => responses.filter(r => r.path === '/rest/v1/gamification_student_achievements' && r.status === 401).length, { timeout: 30000 }).toBeGreaterThan(0);
    await Promise.all(pending);
    const errors = responses.filter(r => r.path === '/rest/v1/gamification_student_achievements' && r.status === 401);
    assert.ok(errors.every(r => r.localAnonMatch && r.declaredRole === 'anon' && !r.subjectPresent && r.errorCode === '42501' && r.phaseAtStart === 'logged-out:admin'));
    passed = true;
  } catch { process.exitCode = 1; }
  finally {
    release(); await Promise.allSettled(pending);
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    h.write(expectCancelled ? 'e2e/cierre-notificaciones-corregido.json' : 'e2e/cierre-notificaciones-controlado.json', { at: new Date().toISOString(), tests: 1, passed: passed ? 1 : 0, failed: passed ? 0 : 1,
      seconds: (Date.now() - started) / 1000, heldRealResponses: held, responses,
      expectCancelled, lateAchievementRequests, absenceObservationWindowMs: expectCancelled ? 1500 : null,
      compiledSourceCommit: JSON.parse(fs.readFileSync(path.join(native.work, 'receipt.json'))).sourceCommit,
      intervention: 'Se retuvo la entrega de respuestas GET announcements reales hasta completar logout y ausencia de token local. Sin modificar contenido, cabeceras de peticion ni logica del cliente.',
      browser: 'Chromium escritorio con viewport movil; no es una nueva ejecucion Android',
      backend: 'Auth/REST/PostgreSQL locales reales', newBuild: false, productionChanged: false, businessWrites: false,
      historical401DirectlyAttributed: false });
    console.log(JSON.stringify({ controlledTests: 1, passed: passed ? 1 : 0, failed: passed ? 0 : 1, heldRealResponses: held.length, achievement401: responses.filter(r => r.path === '/rest/v1/gamification_student_achievements' && r.status === 401).length }));
  }
})().catch(() => { console.error('LOCAL_CONTROLLED_SIGNOUT_FAILED'); process.exitCode = 1; });
