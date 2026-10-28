const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertLocalTarget, buildWebEnv, redact, validatePlaywrightArgs, localDockerEnv, dockerArgs } = require('./safety.cjs');

test('permite solamente el API local dedicado', () => {
  assert.equal(assertLocalTarget('http://127.0.0.1:55321'), 'http://127.0.0.1:55321');
  assert.equal(assertLocalTarget('http://localhost:55321/'), 'http://localhost:55321');
});
test('rechaza producción, puertos de otros proyectos y URLs ambiguas', () => {
  for (const url of ['https://project.supabase.co', 'http://127.0.0.1:54321', 'http://127.0.0.1.evil.test:55321', 'https://127.0.0.1:55321', 'http://user:pass@127.0.0.1:55321', 'http://127.0.0.1:55321/rest/v1', 'http://127.0.0.1:55321?x=1']) {
    assert.throws(() => assertLocalTarget(url), /local|URL|puerto/i, url);
  }
});
test('el frontend no hereda claves ni destinos REACT_APP institucionales', () => {
  const env=buildWebEnv({apiUrl:'http://127.0.0.1:55321',anonKey:'local-public-key',piiEncryptionKey:'test-only-local-encryption'}, {PATH:'path',REACT_APP_SUPABASE_URL:'https://production.supabase.co',REACT_APP_WHATSAPP_ACCESS_TOKEN:'private-secret',SUPABASE_SERVICE_ROLE_KEY:'private-service'});
  assert.equal(env.REACT_APP_SUPABASE_URL,'http://127.0.0.1:55321');
  assert.equal(env.REACT_APP_SUPABASE_ANON_KEY,'local-public-key');
  assert.equal(env.REACT_APP_PII_ENCRYPTION_KEY,'test-only-local-encryption');
  assert.equal(env.REACT_APP_WHATSAPP_ACCESS_TOKEN,'');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY,undefined);
  assert.equal(env.PORT,'6100');
  assert.equal(env.BROWSER,'none');
});
test('redacta tokens, claves locales y datos de login en logs', () => {
  const jwt='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmaXh0dXJlIn0.signature';
  const safe=redact('Bearer '+jwt+' fixture@example.test SecretPassword42!', ['SecretPassword42!']);
  assert.ok(!safe.includes(jwt)); assert.ok(!safe.includes('fixture@example.test')); assert.ok(!safe.includes('SecretPassword42!'));
});
test('no permite cambiar config, reporteros ni servidor mediante argumentos', () => {
  for(const args of [['--config=playwright.config.js'],['--reporter=list'],['tests/e2e/unknown.spec.js']]) assert.throws(()=>validatePlaywrightArgs(args),/argumento/i);
  assert.deepEqual(validatePlaywrightArgs(['--workers=3','--project=desktop-1440']),['--workers=3','--project=desktop-1440']);
});
test('Docker y CLI no heredan un motor remoto ni TLS/contexto externos', () => {
  const env=localDockerEnv({PATH:'path',DOCKER_HOST:'tcp://remote.example:2376',DOCKER_CONTEXT:'remote',DOCKER_TLS_VERIFY:'1',DOCKER_CERT_PATH:'remote-cert'});
  assert.equal(env.DOCKER_HOST,'npipe:////./pipe/dockerDesktopLinuxEngine');
  assert.equal(env.DOCKER_CONTEXT,undefined);assert.equal(env.DOCKER_TLS_VERIFY,undefined);assert.equal(env.DOCKER_CERT_PATH,undefined);
  assert.deepEqual(dockerArgs(['ps']),['--host',env.DOCKER_HOST,'ps']);
  assert.throws(()=>dockerArgs(['--host','tcp://remote.example:2376','ps']),/Docker|destino/i);
});
