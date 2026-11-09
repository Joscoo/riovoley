'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { pathToFileURL } = require('node:url');
const ctx = require('./edge-fence-context.cjs'), c = ctx.read(), h = require('../../e2e/local/harness.cjs'), { readLocal } = require('../../e2e/local/safety.cjs');
const phase = process.argv[2]; assert.ok(['red', 'green'].includes(phase));
(async () => {
  const local = readLocal(), dir = path.join(c.privateDir, phase); fs.mkdirSync(dir, { recursive: true });
  const shim = path.join(dir, 'serve.ts'), entry = path.join(dir, 'entry.ts'), map = path.join(dir, 'imports.json');
  fs.writeFileSync(shim, 'export const serve=(handler:unknown)=>{((globalThis as any).__auditHandlers ||= []).push(handler)};\n');
  fs.writeFileSync(map, JSON.stringify({ imports: { 'https://deno.land/std@0.168.0/http/server.ts': pathToFileURL(shim).href } }));
  fs.writeFileSync(entry, 'await import(' + JSON.stringify(pathToFileURL(path.join(__dirname, 'edge-fence-entry.ts')).href) + ');\n' + c.names.map(name => 'await import(' + JSON.stringify(pathToFileURL(path.join(h.root, 'supabase/functions', name, 'index.ts')).href) + ');').join('\n') + '\nawait (globalThis as any).__auditStart(' + JSON.stringify(c.names) + ');\n');
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/SUPABASE|RESEND|FCM|TOKEN|SECRET|PASSWORD|GOOGLE_APPLICATION_CREDENTIALS|FROM_EMAIL/.test(key)));
  Object.assign(env, { SUPABASE_URL: local.apiUrl, SUPABASE_ANON_KEY: local.anonKey, SUPABASE_SERVICE_ROLE_KEY: local.serviceRoleKey,
    RESEND_API_KEY: 'AUDIT_SYNTHETIC_NOT_A_PROVIDER_CREDENTIAL', FROM_EMAIL: 'audit@example.test', REPORTS_SCHEDULER_SECRET: '',
    FCM_PROJECT_ID: '', FCM_CLIENT_EMAIL: '', FCM_PRIVATE_KEY: '', DENO_DIR: path.join(h.runtime, 'deno-cache'), DENO_NO_PROMPT: '1' });
  const args = ['run', '--no-config', '--cached-only', '--no-prompt', '--import-map=' + map,
    '--allow-net=127.0.0.1:55321,127.0.0.1:6163', '--deny-net=api.resend.com,fcm.googleapis.com,oauth2.googleapis.com,accounts.google.com',
    '--allow-env', '--allow-read=' + path.join(h.runtime, 'deno-cache'), entry];
  const server = h.run('integracion/edge-server-' + phase, path.join(h.runtime, 'deno-tool/node_modules/@deno/win32-x64/deno.exe'), args, { env, allowFailure: true, timeoutMs: 120000 });
  let ready = false;
  try {
    for (let i = 0; i < 35 && !ready; i++) { try { const r = await fetch('http://127.0.0.1:6163/__health', { signal: AbortSignal.timeout(400) }); ready = r.ok && (await r.json()).handlers === 9; } catch {} if (!ready) await new Promise(r => setTimeout(r, 350)); }
    assert.ok(ready, 'EDGE_FENCE_SERVER_NOT_READY');
    const r = await h.run('integracion/edge-cases-' + phase, process.execPath, ['scripts/audit/maintenance/edge-fence-cases.cjs', phase], { allowFailure: true, timeoutMs: 70000 }); process.exitCode = r.exitCode;
  } finally {
    if (ready) await fetch('http://127.0.0.1:6163/__stop', { method: 'POST', signal: AbortSignal.timeout(2000) }).catch(() => {});
    if ((await server).exitCode !== 0) process.exitCode = 1;
  }
})().catch(e => { console.error(JSON.stringify({ stage: 'EDGE_FENCE', code: e.code || 'ASSERTION', reason: e.code ? undefined : e.message })); process.exitCode = 1; });
