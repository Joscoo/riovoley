'use strict';
// Strict web build with synthetic inputs; no dotenv, provider calls or signing.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const h = require('../../e2e/local/harness.cjs');
const { baseEnvironment } = require('../../production/backup.cjs');

(async () => {
  assert.ok(!fs.existsSync(path.join(h.evidence, 'MANIFIESTO_SHA256.json')), 'NEW_EVIDENCE_REQUIRED');
  const relativeBuild = '.e2e-local/ota-release-checks/' + new Date().toISOString().replace(/[:.]/g, '-') + '/build-web';
  const env = { ...baseEnvironment(), CI: 'true', NODE_ENV: 'production', GENERATE_SOURCEMAP: 'false',
    REACT_APP_SUPABASE_URL: 'http://127.0.0.1:55321', REACT_APP_SUPABASE_ANON_KEY: 'audit-public-synthetic-placeholder',
    REACT_APP_APP_URL: 'http://127.0.0.1:3000', REACT_APP_PII_ENCRYPTION_KEY: 'audit-synthetic-pii-not-used-for-real-data',
    REACT_APP_ENABLE_OTA_DIAGNOSTICS: 'false', BUILD_PATH: relativeBuild };
  const result = await h.run('compilacion-web/build-estricto-ota', process.execPath,
    ['--require', './scripts/production/cra-release-preload.cjs', 'node_modules/react-scripts/scripts/build.js'],
    { env, allowFailure: true });
  if (result.exitCode !== 0) { process.exitCode = result.exitCode || 1; return; }
  const build = path.resolve(h.root, relativeBuild), files = [];
  function visit(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(target);
      else {
        const bytes = fs.readFileSync(target);
        files.push({ path: path.relative(build, target).replace(/\\/g, '/'), bytes: bytes.length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
      }
    }
  }
  visit(build);
  const maps = files.filter(f => f.path.endsWith('.map'));
  const panelTextFiles = files.filter(f => f.path.endsWith('.js') && fs.readFileSync(path.join(build, f.path), 'utf8').includes('Estado OTA Android')).map(f => f.path);
  h.write('compilacion-web/artefactos.json', { recordedAt: new Date().toISOString(), node: process.version,
    buildPath: relativeBuild, syntheticConfiguration: true, dotenvLoaded: false, otaDiagnostics: false,
    fileCount: files.length, totalBytes: files.reduce((n, f) => n + f.bytes, 0), sourceMapCount: maps.length,
    diagnosticPanelLiteralInJavaScript: panelTextFiles, files, nativeBuild: false, deployed: false });
  assert.equal(maps.length, 0, 'UNEXPECTED_PUBLIC_SOURCE_MAPS');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
