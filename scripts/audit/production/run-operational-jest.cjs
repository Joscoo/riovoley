'use strict';
// Local repeat of the product suites; synthetic loopback inputs, no dotenv or login.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),h=require('../../e2e/local/harness.cjs'),b=require('../../production/backup.cjs');
assert.ok(!fs.existsSync(path.join(h.evidence,'MANIFIESTO_SHA256.json')),'NEW_EVIDENCE_REQUIRED');
const env={...b.baseEnvironment(),CI:'true',NODE_ENV:'test',REACT_APP_SUPABASE_URL:'http://127.0.0.1:55321',REACT_APP_SUPABASE_ANON_KEY:'audit-public-synthetic-placeholder',REACT_APP_APP_URL:'http://127.0.0.1:3000',REACT_APP_PII_ENCRYPTION_KEY:'audit-synthetic-pii-not-used-for-real-data'};
h.run('unitarias/jest-cierre',process.execPath,['--require','./scripts/production/cra-release-preload.cjs','node_modules/react-scripts/bin/react-scripts.js','test','--watchAll=false','--runInBand','--coverage','--coverageReporters=json-summary','--coverageDirectory='+path.join(h.evidence,'unitarias/cobertura-cierre'),'--json','--outputFile='+path.join(h.evidence,'unitarias/jest-cierre.json')],{env,allowFailure:true}).then(r=>process.exitCode=r.exitCode??1);
