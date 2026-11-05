const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const script = path.resolve(__dirname, '../../scripts/production/preflight.cjs');
const jwt = (role, extra = {}) => [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ role, exp: 4102444800, ...extra })).toString('base64url'),
  'synthetic_signature_not_a_real_key',
].join('.');
const frontend = () => ({
  REACT_APP_SUPABASE_URL: 'https://synthetic-project.supabase.co',
  REACT_APP_SUPABASE_ANON_KEY: jwt('anon'),
  REACT_APP_APP_URL: 'https://app.riovoley.org',
  REACT_APP_PII_ENCRYPTION_KEY: 'synthetic-existing-pii-key-do-not-rotate-2026',
});
const backend = () => ({
  SUPABASE_URL: 'https://synthetic-project.supabase.co',
  SUPABASE_ANON_KEY: jwt('anon'),
  SUPABASE_SERVICE_ROLE_KEY: jwt('service_role'),
  RESEND_API_KEY: 're_synthetic_private_key_only_for_test',
  FROM_EMAIL: 'noreply@riovoley.org',
  FCM_PROJECT_ID: 'synthetic-project',
  FCM_CLIENT_EMAIL: 'synthetic@synthetic-project.iam.gserviceaccount.com',
  FCM_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nsynthetic\n-----END PRIVATE KEY-----',
  REPORTS_SCHEDULER_SECRET: 'synthetic-scheduler-secret-for-test-2026',
});
function run(env = {}, args = ['--profile', 'frontend', '--structure'], cwd) {
  // Inherit no application or machine credentials, even when tests run on an operator PC.
  return spawnSync(process.execPath, [script, ...args], {
    env: { SystemRoot: process.env.SystemRoot || '', ...env },
    cwd,
    encoding: 'utf8',
    timeout: 10000,
  });
}

test('missing production configuration blocks and names every required frontend field', () => {
  const r = run();
  assert.equal(r.status, 1);
  for (const name of Object.keys(frontend())) assert.match(r.stdout, new RegExp(name));
  assert.match(r.stdout, /STRUCTURE: BLOCKED/);
  assert.match(r.stdout, /AUTHORIZATION: BLOCKED/);
});

test('valid legacy anon and publishable frontend keys pass structure without leaking values', () => {
  for (const key of [jwt('anon'), 'sb_publishable_synthetic_public_key_123456']) {
    const env = { ...frontend(), REACT_APP_SUPABASE_ANON_KEY: key };
    const r = run(env);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /STRUCTURE: VALID/);
    assert.match(r.stdout, /AUTHORIZATION: BLOCKED/);
    assert.match(r.stdout, /PII_CONTINUITY: OPERATOR_CHECK_REQUIRED/);
    for (const value of Object.values(env)) assert.ok(!r.stdout.includes(value));
  }
});

test('elevated, malformed, expired and user-session keys cannot be frontend keys', () => {
  for (const key of [jwt('service_role'), jwt('authenticated'), jwt('anon', { exp: 1 }),
    'sb_secret_synthetic_DO_NOT_PRINT_123456', 'invalid.DO_NOT_PRINT.key',
    'eyJhbGciOiJub25lIn0.' + Buffer.from('{"role":"anon","exp":4102444800}').toString('base64url') + '.signature']) {
    const r = run({ ...frontend(), REACT_APP_SUPABASE_ANON_KEY: key });
    assert.equal(r.status, 1);
    assert.ok(!r.stdout.includes(key));
    assert.ok(!r.stderr.includes(key));
  }
});

test('private or unknown React build variables block even outside frontend profile', () => {
  for (const extra of [
    { REACT_APP_WHATSAPP_ACCESS_TOKEN: 'synthetic-private-whatsapp' },
    { REACT_APP_SUPABASE_SERVICE_ROLE_KEY: jwt('service_role') },
    { REACT_APP_CUSTOM_CONFIGURATION: 'synthetic-unknown-value' },
    { REACT_APP_VERSION: jwt('service_role') },
  ]) {
    const r = run({ ...backend(), ...extra }, ['--profile', 'backend', '--structure']);
    assert.equal(r.status, 1);
    for (const value of Object.values(extra)) assert.ok(!r.stdout.includes(value));
  }
});

test('production URLs reject credentials, local targets, paths, query and unencrypted origins', () => {
  for (const url of ['http://app.riovoley.org', 'https://user:password@app.riovoley.org',
    'https://localhost', 'https://127.0.0.1', 'https://10.0.0.1', 'https://[::1]',
    'https://app.riovoley.org?token=synthetic', 'https://app.riovoley.org/#token',
    'https://app.riovoley.org/path', 'https://app.invalid']) {
    const r = run({ ...frontend(), REACT_APP_APP_URL: url });
    assert.equal(r.status, 1, url);
    assert.ok(!r.stdout.includes(url));
  }
});

test('template and empty PII configuration cannot pass production readiness', () => {
  for (const value of ['', 'replace_with_a_strong_random_secret', 'a'.repeat(32)]) {
    const r = run({ ...frontend(), REACT_APP_PII_ENCRYPTION_KEY: value });
    assert.equal(r.status, 1);
    assert.ok(!r.stdout.includes(value) || value === '');
  }
});

test('an existing shorter PII key remains structurally accepted without suggesting a rotation', () => {
  const r = run({ ...frontend(), REACT_APP_PII_ENCRYPTION_KEY: 'existing-legacy-key' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /PII_CONTINUITY: OPERATOR_CHECK_REQUIRED/);
});

test('backend checks required provider configuration and privileged key role without network', () => {
  const valid = backend();
  const result = run(valid, ['--profile', 'backend', '--structure']);
  assert.equal(result.status, 0);
  for (const value of Object.values(valid)) assert.ok(!(result.stdout + result.stderr).includes(value));
  for (const name of Object.keys(valid)) {
    const r = run({ ...valid, [name]: '' }, ['--profile', 'backend', '--structure']);
    assert.equal(r.status, 1, name);
  }
  assert.equal(run({ ...valid, SUPABASE_SERVICE_ROLE_KEY: jwt('anon') }, ['--profile', 'backend', '--structure']).status, 1);
});

test('debug log activation blocks a production build but explicit false is allowed', () => {
  for (const name of ['REACT_APP_ENABLE_SQL_AUDIT', 'REACT_APP_ENABLE_WEB_VITALS_LOG']) {
    assert.equal(run({ ...frontend(), [name]: 'true' }).status, 1);
    assert.equal(run({ ...frontend(), [name]: 'false' }).status, 0);
  }
});

test('native requires frontend configuration, signing inputs and explicit production channel', () => {
  const valid = { ...frontend(), KEYSTORE_PASSWORD: 'synthetic-store-password',
    KEY_PASSWORD: 'synthetic-key-password', REACT_APP_CAPGO_DEFAULT_CHANNEL: 'production' };
  assert.equal(run(valid, ['--profile', 'native', '--structure']).status, 0);
  for (const name of ['KEYSTORE_PASSWORD', 'KEY_PASSWORD', 'REACT_APP_CAPGO_DEFAULT_CHANNEL']) {
    assert.equal(run({ ...valid, [name]: '' }, ['--profile', 'native', '--structure']).status, 1);
  }
});

test('native preserves established signing passwords rather than imposing an incompatible rotation', () => {
  const r = run({ ...frontend(), KEYSTORE_PASSWORD: 'abc123', KEY_PASSWORD: 'def456',
    REACT_APP_CAPGO_DEFAULT_CHANNEL: 'production' }, ['--profile', 'native', '--structure']);
  assert.equal(r.status, 0);
});

test('all profile rejects backend/frontend mismatch and legacy JWT project mismatch', () => {
  const valid = { ...frontend(), ...backend(), KEYSTORE_PASSWORD: 'synthetic-store-password',
    KEY_PASSWORD: 'synthetic-key-password', REACT_APP_CAPGO_DEFAULT_CHANNEL: 'production' };
  assert.equal(run(valid, ['--profile', 'all', '--structure']).status, 0);
  assert.equal(run({ ...valid, SUPABASE_URL: 'https://other-project.supabase.co' }, ['--profile', 'all', '--structure']).status, 1);
  assert.equal(run({ ...frontend(), REACT_APP_SUPABASE_ANON_KEY: jwt('anon', { ref: 'other-project' }) }).status, 1);
});

test('default mode never authorizes deployment from structural success or supplied approval flags', () => {
  const r = run({ ...frontend(), RIOVOLEY_APPROVED: 'true', RIOVOLEY_BACKUP_DONE: 'true' }, ['--profile', 'frontend']);
  assert.equal(r.status, 2);
  assert.match(r.stdout, /STRUCTURE: VALID/);
  assert.match(r.stdout, /BACKUP: OPERATOR_EVIDENCE_REQUIRED/);
  assert.match(r.stdout, /APPROVAL: EXPLICIT_FINAL_APPROVAL_REQUIRED/);
  const unknown = run(frontend(), ['--approve', 'synthetic-secret-argument']);
  assert.equal(unknown.status, 1);
  assert.ok(!(unknown.stdout + unknown.stderr).includes('synthetic-secret-argument'));
});

test('preflight does not discover dotenv files and never echoes parser exceptions', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'riovoley-preflight-'));
  try {
    fs.writeFileSync(path.join(cwd, '.env'), Object.entries(frontend()).map(([k, v]) => `${k}=${v}`).join('\n'));
    const r = run({}, ['--profile', 'frontend', '--structure'], cwd);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /STRUCTURE: BLOCKED/);
    assert.equal(r.stderr, '');
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
