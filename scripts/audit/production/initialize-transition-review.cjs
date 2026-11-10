'use strict';
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
const { root, runtime } = require('../../e2e/local/safety.cjs');
const baseCommit = cp.execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const evidence = path.join(root, 'docs/tesis/evidencias/verificacion-tecnica', stamp + '-transicion-lectura-' + baseCommit.slice(0, 7));
const saved = path.join(runtime, 'transition-review', stamp);
assert.ok(!fs.existsSync(evidence) && !fs.existsSync(saved), 'NEW_CONTEXT_REQUIRED');
fs.mkdirSync(saved, { recursive: true });
fs.copyFileSync(path.join(runtime, 'evidence-dir.txt'), path.join(saved, 'previous-evidence-dir.txt'), fs.constants.COPYFILE_EXCL);
for (const name of ['unitarias', 'integracion', 'e2e', 'compilacion-web', 'android', 'seguridad']) fs.mkdirSync(path.join(evidence, name), { recursive: true });
fs.writeFileSync(path.join(runtime, 'evidence-dir.txt'), evidence + '\n');
require('../../e2e/local/harness.cjs').write('CONTEXTO.json', { initializedAt: new Date().toISOString(), baseCommit,
  scope: 'Lectura actual de Supabase/Vercel y verificacion de artefactos preparados; sin cambios institucionales ni tareas de claves.',
  projectId: 'mayvvlkvheagkojunzzb', vercelProject: 'riovoley', vercelTeam: 'joscoos-projects', publicDomain: 'https://riovoley.com',
  productionChanged: false, credentialValuesRequested: false, newFunctionalTests: false,
  note: 'Algunas consultas MCP de este turno preceden a la asignacion del expediente; conservar sus sellos de tiempo originales.' });
console.log(path.relative(root, evidence));
