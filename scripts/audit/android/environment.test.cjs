const test=require('node:test');
const assert=require('node:assert/strict');
const {commandEnvironment}=require('./context.cjs');
test('conserva overrides CRA para impedir que dotenv reincorpore credenciales institucionales',()=>{
  const env=commandEnvironment({REACT_APP_SUPABASE_ANON_KEY:'offline-placeholder',REACT_APP_SUPABASE_URL:'http://127.0.0.1:55321',REACT_APP_PII_ENCRYPTION_KEY:''},{SUPABASE_SERVICE_ROLE_KEY:'reserved-value',KEYSTORE_PASSWORD:'reserved-value'});
  assert.equal(env.REACT_APP_SUPABASE_ANON_KEY,'offline-placeholder');
  assert.equal(env.REACT_APP_SUPABASE_URL,'http://127.0.0.1:55321');
  assert.equal(env.REACT_APP_PII_ENCRYPTION_KEY,'');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY,undefined);
  assert.equal(env.KEYSTORE_PASSWORD,undefined);
});
