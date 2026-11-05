'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
const packet = JSON.parse(fs.readFileSync(path.join(h.runtime, 'edge-production/packet.json'), 'utf8'));
const functions = packet.functions.map(fn => {
  const base = path.resolve(h.root, fn.returnDirectory, 'supabase/functions');
  assert.ok(base.startsWith(h.runtime + path.sep), 'RETURN_OUTSIDE_PRIVATE_RUNTIME');
  const files = fn.returnSourceFiles.map(file => {
    const target = path.resolve(base, file.file); assert.ok(target.startsWith(base + path.sep), 'RETURN_FILE_OUTSIDE_PACKET');
    const actual = crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');
    return { file: file.file, sha256: actual, matchesPrepared: actual === file.sha256 };
  });
  return { slug: fn.slug, files, allMatch: files.every(f => f.matchesPrepared) };
});
h.write('seguridad/retorno-edge-archivos-verificados.json', { checkedAt: new Date().toISOString(), functions,
  totalFiles: functions.reduce((n, fn) => n + fn.files.length, 0), allMatch: functions.every(fn => fn.allMatch),
  managedReturnRehearsedThisPhase: false, published: false,
  scope: 'Integridad de fuentes privadas de retorno respecto al manifiesto ensayado; no nueva compilacion, descarga Cloud o reversion gestionada.' });
assert.ok(functions.every(fn => fn.allMatch), 'RETURN_SOURCES_CHANGED');
console.log(JSON.stringify({ functions: functions.length, sourceFilesMatching: functions.reduce((n, fn) => n + fn.files.length, 0), managedReturnPerformed: false }));
