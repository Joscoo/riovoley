#!/usr/bin/env node
'use strict';

// Read only the process environment supplied by the operator. No dotenv, disk,
// network, DB, provider calls, deployment, or approval override exists here.
const { isIP } = require('node:net');
const profiles = new Set(['frontend', 'backend', 'native', 'all']);
const publicNames = new Set([
  'REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY', 'REACT_APP_APP_URL',
  'REACT_APP_PII_ENCRYPTION_KEY', 'REACT_APP_WHATSAPP_ACCESS_TOKEN',
  'REACT_APP_WHATSAPP_PHONE_NUMBER_ID', 'REACT_APP_WHATSAPP_BUSINESS_ACCOUNT_ID',
  'REACT_APP_CLUB_ADMIN_PHONE', 'REACT_APP_CLUB_COACH_PHONE', 'REACT_APP_CLUB_EMERGENCY_PHONE',
  'REACT_APP_CAPGO_DEFAULT_CHANNEL', 'REACT_APP_VERSION',
  'REACT_APP_ENABLE_SQL_AUDIT', 'REACT_APP_ENABLE_WEB_VITALS_LOG',
]);

function present(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
function nonTemplate(value, minimum = 1) {
  return present(value) && value === value.trim() && value.length >= minimum &&
    !/(replace[_ -]?with|placeholder|your[_ -]|tu_access|tu_phone|tu_business|changeme|^<|^\$\{)/i.test(value) &&
    new Set(value).size > 4;
}
function productionOrigin(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    // Only DNS names: do not pretend to verify private networks or DNS resolution.
    return url.protocol === 'https:' && !url.username && !url.password &&
      !url.search && !url.hash && url.pathname === '/' && !url.port &&
      !isIP(host) && !host.includes(':') && host.includes('.') &&
      !/(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host) &&
      /^[a-z0-9.-]+$/.test(host) && value === value.trim();
  } catch { return false; }
}
function legacyClaims(value) {
  if (!present(value) || value.length > 16384) return null;
  const parts = value.split('.');
  if (parts.length !== 3 || parts.some(p => !/^[a-zA-Z0-9_-]+$/.test(p))) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (header.alg !== 'HS256' || !claims || typeof claims !== 'object') return null;
    return claims;
  } catch { return null; }
}
function key(value, role, origin) {
  const prefix = role === 'anon' ? 'sb_publishable_' : 'sb_secret_';
  if (typeof value === 'string' && new RegExp('^' + prefix + '[a-zA-Z0-9_-]{16,}$').test(value)) return true;
  const claims = legacyClaims(value);
  if (!claims || claims.role !== role || !Number.isFinite(claims.exp) || claims.exp * 1000 <= Date.now()) return false;
  if (claims.ref !== undefined) {
    try {
      const host = new URL(origin).hostname;
      if (host.endsWith('.supabase.co') && claims.ref !== host.split('.')[0]) return false;
    } catch { return false; }
  }
  return true; // Payload inspection only; no cryptographic signature/auth verification.
}
function elevated(value) {
  return typeof value === 'string' && (value.includes('sb_secret_') || legacyClaims(value)?.role === 'service_role');
}

function assess(env, profile = 'frontend') {
  const checks = [];
  const add = (name, valid, failure = 'INVALID_OR_MISSING') => checks.push({ name, status: valid ? 'VALID' : failure });
  const required = (name, validator = nonTemplate) => add(name, validator(env[name]));
  // Inspect public build variables in every profile. Never echo unknown names,
  // URL origins, parser messages or any supplied values, including on failure.
  for (const name of Object.keys(env).filter(n => n.startsWith('REACT_APP_')).sort()) {
    if (!publicNames.has(name)) add('UNKNOWN_REACT_APP_NAME', false, 'UNREVIEWED_PUBLIC_VARIABLE');
    else if (present(env[name]) && (name === 'REACT_APP_WHATSAPP_ACCESS_TOKEN' || elevated(env[name]))) {
      add(name, false, 'SECRET_IN_PUBLIC_BUILD');
    }
  }
  if (['frontend', 'native', 'all'].includes(profile)) {
    required('REACT_APP_SUPABASE_URL', productionOrigin);
    required('REACT_APP_SUPABASE_ANON_KEY', v => key(v, 'anon', env.REACT_APP_SUPABASE_URL));
    required('REACT_APP_APP_URL', productionOrigin);
    // Existing data depends on this exact key; a new length rule must not
    // encourage rotation without a separate data migration.
    required('REACT_APP_PII_ENCRYPTION_KEY', v => nonTemplate(v));
    for (const name of ['REACT_APP_ENABLE_SQL_AUDIT', 'REACT_APP_ENABLE_WEB_VITALS_LOG']) {
      if (present(env[name])) add(name, env[name] === 'false', 'DISABLE_PRODUCTION_DEBUG_LOGGING');
    }
  }
  if (['backend', 'all'].includes(profile)) {
    required('SUPABASE_URL', productionOrigin);
    required('SUPABASE_ANON_KEY', v => key(v, 'anon', env.SUPABASE_URL));
    required('SUPABASE_SERVICE_ROLE_KEY', v => key(v, 'service_role', env.SUPABASE_URL));
    required('RESEND_API_KEY', v => nonTemplate(v, 16) && v.startsWith('re_'));
    required('FROM_EMAIL', v => nonTemplate(v) && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(v));
    required('FCM_PROJECT_ID', v => nonTemplate(v) && /^[a-z][a-z0-9-]+$/.test(v));
    required('FCM_CLIENT_EMAIL', v => nonTemplate(v) && /^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(v));
    required('FCM_PRIVATE_KEY', v => nonTemplate(v, 32) && /^-----BEGIN PRIVATE KEY-----/.test(v) && /-----END PRIVATE KEY-----\s*$/.test(v));
    required('REPORTS_SCHEDULER_SECRET', v => nonTemplate(v, 32));
  }
  if (['native', 'all'].includes(profile)) {
    required('KEYSTORE_PASSWORD', v => nonTemplate(v));
    required('KEY_PASSWORD', v => nonTemplate(v));
    required('REACT_APP_CAPGO_DEFAULT_CHANNEL', v => v === 'production');
  }
  if (profile === 'all') add('SUPABASE_PROJECT_ALIGNMENT',
    productionOrigin(env.SUPABASE_URL) && productionOrigin(env.REACT_APP_SUPABASE_URL) &&
    new URL(env.SUPABASE_URL).origin === new URL(env.REACT_APP_SUPABASE_URL).origin);
  return { checks, valid: profiles.has(profile) && checks.every(c => c.status === 'VALID') };
}

function main(args, env) {
  let profile = 'frontend';
  let structureOnly = false;
  let profileSeen = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--profile' && !profileSeen && profiles.has(args[i + 1])) {
      profile = args[++i]; profileSeen = true;
    } else if (args[i] === '--structure' && !structureOnly) structureOnly = true;
    else {
      console.log('ARGUMENTS: INVALID\nSTRUCTURE: BLOCKED\nAUTHORIZATION: BLOCKED');
      return 1;
    }
  }
  const result = assess(env, profile);
  console.log('SOURCE: PROCESS_ENV_EXPLICIT_ONLY');
  for (const check of result.checks) console.log(check.name + ': ' + check.status);
  console.log('STRUCTURE: ' + (result.valid ? 'VALID' : 'BLOCKED'));
  console.log('KEY_AUTHENTICITY: NOT_VERIFIED');
  console.log('PII_CONTINUITY: OPERATOR_CHECK_REQUIRED');
  console.log('BACKUP: OPERATOR_EVIDENCE_REQUIRED');
  console.log('APPROVAL: EXPLICIT_FINAL_APPROVAL_REQUIRED');
  console.log('AUTHORIZATION: BLOCKED');
  return !result.valid ? 1 : structureOnly ? 0 : 2;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2), process.env);
module.exports = { assess };
