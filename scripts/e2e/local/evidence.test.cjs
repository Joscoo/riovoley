const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {allocateRun,writeNew,emptyEdgeEnv}=require('./evidence.cjs');
test('dos ejecuciones normales no comparten ni limpian evidencias',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'riovoley-evidence-'));
  const first=allocateRun(dir,'smoke');fs.writeFileSync(path.join(first.directory,'original.txt'),'keep');
  const second=allocateRun(dir,'smoke');
  assert.notEqual(first.directory,second.directory);
  assert.equal(fs.readFileSync(path.join(first.directory,'original.txt'),'utf8'),'keep');
  assert.throws(()=>allocateRun(dir,'smoke',first.label),/existe|evidencia/i);
});
test('logs repetidos se preservan y el entorno Edge siempre se genera vacío',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'riovoley-logs-'));
  const first=writeNew(dir,'result.json','first');
  const second=writeNew(dir,'result.json','second');
  assert.notEqual(first,second);assert.equal(fs.readFileSync(first,'utf8'),'first');
  fs.writeFileSync(path.join(dir,'edge.env'),'RESEND_API_KEY=external');
  const edge=emptyEdgeEnv(dir);
  assert.notEqual(edge,path.join(dir,'edge.env'));
  assert.ok(!fs.readFileSync(edge,'utf8').includes('RESEND_API_KEY'));
  assert.equal(fs.readFileSync(path.join(dir,'edge.env'),'utf8'),'RESEND_API_KEY=external');
});
