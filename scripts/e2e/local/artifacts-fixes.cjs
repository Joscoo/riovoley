const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const h = require('./harness.cjs');
const { readLocal } = require('./safety.cjs');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function walk(dir) { return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(dir,d.name)):[path.join(dir,d.name)]); }
const local=readLocal(),build=path.join(h.runtime,local.activeBuild);
h.write('artefactos-compilacion.json',{build:'.e2e-local/'+local.activeBuild,generatedAt:new Date().toISOString(),files:walk(build).map(file=>({file:path.relative(build,file).replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)})),note:'Inventario real de salida. No se publican bundles ni mapas de fuentes del runtime, que contienen configuración exclusiva local.'});
h.write('estado-final-git.txt',cp.execFileSync('git',['status','--short'],{cwd:h.root,encoding:'utf8'}));
h.write('cambios-correciones.diff',cp.execFileSync('git',['diff','--','src/features/attendance/presentation/components/AsistenciasManager.js','src/features/payments/presentation/components/PagosManager.js','src/shared/ui/SortableHeader.js','src/shared/ui/SortableHeader.test.js','tests/e2e/admin.happy-path-controlled.spec.js','tests/e2e/asistencias.guided.review.spec.js','tests/e2e/filters-sorting.tables.spec.js'],{cwd:h.root,encoding:'utf8'}));
h.write('versiones-herramientas.json',{node:process.version,npm:fs.readFileSync(path.join(h.evidence,'versiones-npm.stdout.log'),'utf8').trim(),react:require('react/package.json').version,cra:require('react-scripts/package.json').version,playwright:require('@playwright/test/package.json').version,supabaseJs:require('@supabase/supabase-js/package.json').version,os:cp.execFileSync('cmd.exe',['/c','ver'],{encoding:'utf8',windowsHide:true}).trim()});
