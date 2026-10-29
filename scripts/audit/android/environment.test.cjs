const test=require('node:test');
const assert=require('node:assert/strict');
const {commandEnvironment}=require('./context.cjs');
const {environment}=require('./environment.cjs');

test('fija ADB al servidor loopback 5037 y descarta destinos heredados',()=>{
  const {env}=environment({ADB_SERVER_SOCKET:'tcp:remote.invalid:5037',ANDROID_ADB_SERVER_ADDRESS:'remote.invalid',ANDROID_ADB_SERVER_PORT:'9999',ADB_SERVER_PORT:'9998',ANDROID_SERIAL:'production-device'});
  assert.equal(env.ADB_SERVER_SOCKET,'tcp:127.0.0.1:5037');
  for(const key of ['ANDROID_ADB_SERVER_ADDRESS','ANDROID_ADB_SERVER_PORT','ADB_SERVER_PORT','ANDROID_SERIAL']) assert.equal(env[key],undefined);
});
test('conserva overrides CRA para impedir que dotenv reincorpore credenciales institucionales',()=>{
  const env=commandEnvironment({REACT_APP_SUPABASE_ANON_KEY:'offline-placeholder',REACT_APP_SUPABASE_URL:'http://127.0.0.1:55321',REACT_APP_PII_ENCRYPTION_KEY:''},{SUPABASE_SERVICE_ROLE_KEY:'reserved-value',KEYSTORE_PASSWORD:'reserved-value'});
  assert.equal(env.REACT_APP_SUPABASE_ANON_KEY,'offline-placeholder');
  assert.equal(env.REACT_APP_SUPABASE_URL,'http://127.0.0.1:55321');
  assert.equal(env.REACT_APP_PII_ENCRYPTION_KEY,'');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY,undefined);
  assert.equal(env.KEYSTORE_PASSWORD,undefined);
});
