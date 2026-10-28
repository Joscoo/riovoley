const test=require('node:test');
const assert=require('node:assert/strict');
test('la integración local impide que fetch siga redirecciones hacia servicios externos',async()=>{
  const original=globalThis.fetch;let options;
  globalThis.fetch=async(_input,received)=>{options=received;return new Response('',{status:302,headers:{location:'https://example.invalid/redirect'}});};
  try {
    require('../integration/local-fixture.cjs');
    await globalThis.fetch('http://127.0.0.1:55321/local-guard-check',{redirect:'follow'});
    assert.equal(options.redirect,'error');
  } finally {globalThis.fetch=original;}
});
