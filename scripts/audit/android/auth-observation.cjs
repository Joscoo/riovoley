'use strict';
function classifyAuthorization(headers, localAnon) {
  const entry = Object.entries(headers || {}).find(([name]) => name.toLowerCase() === 'authorization');
  const value = typeof entry?.[1] === 'string' ? entry[1] : '';
  const token = value.match(/^Bearer\s+(\S+)$/i)?.[1];
  const out = { headerPresent: Boolean(entry), localAnonMatch: Boolean(token && token === localAnon), declaredRole: 'unknown', subjectPresent: false, signatureVerified: false };
  if (token && token.length <= 8192) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return out;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      if (['anon', 'authenticated', 'service_role'].includes(payload?.role)) out.declaredRole = payload.role;
      out.subjectPresent = typeof payload?.sub === 'string' && payload.sub.length > 0;
    } catch { /* Diagnostic metadata only; never serialize token, claims or parser errors. */ }
  }
  return out;
}
module.exports = { classifyAuthorization };
