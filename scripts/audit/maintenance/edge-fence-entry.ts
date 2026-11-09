// Audit bootstrap only. Production handlers are imported unchanged by the generated entry.
const nativeFetch = globalThis.fetch;
const stats = { localReads: [] as unknown[], localWritesBlocked: [] as unknown[], externalAttempts: [] as unknown[], nativeProbes: [] as unknown[] };
let active = 'idle';
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (url.origin === 'http://127.0.0.1:55321') {
    if (!['GET', 'HEAD'].includes(method) || !['/auth/v1/user', '/rest/v1/users'].includes(url.pathname)) {
      stats.localWritesBlocked.push({ handler: active, method, path: url.pathname }); throw new Error('AUDIT_LOCAL_WRITE_BLOCKED');
    }
    const response = await nativeFetch(input, { ...init, redirect: 'error' }); stats.localReads.push({ handler: active, method, path: url.pathname, status: response.status }); return response;
  }
  stats.externalAttempts.push({ handler: active, method, hostname: url.hostname });
  // Deno's allow/deny flags, independently checked through native probes, enforce this boundary.
  return nativeFetch(input, { ...init, redirect: 'error' });
};
(globalThis as any).__auditStart = async (names: string[]) => {
  const handlers = (globalThis as any).__auditHandlers;
  const server = Deno.serve({ hostname: '127.0.0.1', port: 6163 }, async req => {
    const p = new URL(req.url).pathname;
    if (p === '/__health') return Response.json({ ready: true, handlers: handlers.length });
    if (p === '/__stats') return Response.json({ ...stats, providerEnvironment: { resendSynthetic: Deno.env.get('RESEND_API_KEY') === 'AUDIT_SYNTHETIC_NOT_A_PROVIDER_CREDENTIAL',
      fcmConfigured: Boolean(Deno.env.get('FCM_PRIVATE_KEY')), schedulerConfigured: Boolean(Deno.env.get('REPORTS_SCHEDULER_SECRET')) } });
    if (p === '/__stop' && req.method === 'POST') { setTimeout(() => server.shutdown(), 0); return Response.json({ stopping: true }); }
    if (p === '/__probe/resend' || p === '/__probe/fcm') {
      const hostname = p.endsWith('resend') ? 'api.resend.com' : 'fcm.googleapis.com';
      try { await nativeFetch('https://' + hostname, { redirect: 'error', signal: AbortSignal.timeout(2000) }); return Response.json({ denied: false }, { status: 500 }); }
      catch (e) { const record = { hostname, denied: e instanceof Deno.errors.NotCapable, errorName: (e as Error).name }; stats.nativeProbes.push(record); return Response.json(record); }
    }
    if (p === '/__probe/local-write') {
      active = 'safety-probe';
      try { await fetch('http://127.0.0.1:55321/rest/v1/users', { method: 'POST', body: '{}' }); return Response.json({ denied: false }, { status: 500 }); }
      catch (e) { return Response.json({ denied: (e as Error).message === 'AUDIT_LOCAL_WRITE_BLOCKED' }); } finally { active = 'idle'; }
    }
    const i = names.indexOf(p.slice(1)); if (i < 0) return new Response('unknown', { status: 404 });
    active = names[i]; try { return await handlers[i](req); } finally { active = 'idle'; }
  });
  await server.finished;
};
