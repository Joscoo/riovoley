const { test } = require('node:test'), assert = require('node:assert/strict');
const api = () => require('../../scripts/audit/android/auth-observation.cjs');
const token = payload => 'fixture.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.signature';
test('clasifica anon local sin devolver su valor', () => {
  const value = token({ role: 'anon' }), out = api().classifyAuthorization({ authorization: 'Bearer ' + value }, value);
  assert.deepEqual(out, { headerPresent: true, localAnonMatch: true, declaredRole: 'anon', subjectPresent: false, signatureVerified: false });
  assert.ok(!JSON.stringify(out).includes(value));
});
test('conserva solo rol permitido y presencia de sub para authenticated', () => {
  const payload = { role: 'authenticated', sub: 'synthetic-private-subject', email: 'synthetic@example.test', session_id: 'private-session' };
  const value = token(payload), out = api().classifyAuthorization({ authorization: 'Bearer ' + value }, 'local-fixture');
  assert.equal(out.declaredRole, 'authenticated'); assert.equal(out.subjectPresent, true);
  for (const secret of [value, payload.sub, payload.email, payload.session_id]) assert.ok(!JSON.stringify(out).includes(secret));
});
test('no acepta roles arbitrarios como texto de salida', () => {
  const out = api().classifyAuthorization({ authorization: 'Bearer ' + token({ role: 'sensitive-arbitrary-role', sub: 'id' }) }, 'local-fixture');
  assert.equal(out.declaredRole, 'unknown'); assert.ok(!JSON.stringify(out).includes('sensitive-arbitrary-role'));
});
test('distingue ausencia de cabecera de cabecera no JWT', () => {
  assert.equal(api().classifyAuthorization({}, 'local-fixture').headerPresent, false);
  const out = api().classifyAuthorization({ authorization: 'Basic private-string' }, 'local-fixture');
  assert.equal(out.headerPresent, true); assert.equal(out.declaredRole, 'unknown'); assert.equal(out.subjectPresent, false);
});
test('maneja payload malformado sin copiar errores ni datos', () => {
  const out = api().classifyAuthorization({ authorization: 'Bearer fixture.invalid.signature' }, 'local-fixture');
  assert.equal(out.declaredRole, 'unknown'); assert.equal(out.signatureVerified, false);
});
test('acepta mayusculas en nombre y esquema sin publicar credenciales', () => {
  const value = token({ role: 'service_role' }), out = api().classifyAuthorization({ Authorization: 'bearer ' + value }, 'local-fixture');
  assert.equal(out.declaredRole, 'service_role'); assert.equal(out.localAnonMatch, false); assert.ok(!JSON.stringify(out).includes(value));
});
