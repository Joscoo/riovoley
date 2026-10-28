const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const h = require('./harness.cjs');
(async () => {
  const previous = path.join(h.evidence,'INTEGRIDAD.json');
  if (fs.existsSync(previous)) h.write('integridad-preliminar.json',JSON.parse(fs.readFileSync(previous)));
  await h.run('cierre-integridad',process.execPath,['scripts/e2e/local/integrity-fixes.cjs']);
  // h.run añade sus propios logs al finalizar: incorporarlos al manifiesto final.
  const manifestPath = path.join(h.evidence,'MANIFIESTO_SHA256.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath));
  for (const name of ['cierre-integridad.stdout.log','cierre-integridad.stderr.log','cierre-integridad.meta.json']) {
    const file=path.join(h.evidence,name);
    if(!manifest.entries.some(e=>e.file===name)) manifest.entries.push({file:name,bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
  }
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  for (const entry of manifest.entries) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(h.evidence,entry.file))).digest('hex'),entry.sha256,entry.file);
  console.log(JSON.stringify({manifestFiles:manifest.entries.length,mismatches:0}));
})();
