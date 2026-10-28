/* Auditoría local: no despliega, no cambia datos remotos. Ejecutar desde la raíz. */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const root = process.cwd();
const out = __dirname;
const rel = p => path.relative(root, p).replaceAll('\\', '/');
const envFiles = fs.readdirSync(root).filter(n => /^\.env($|\.)/.test(n));
const dotenv = require(path.join(root, 'node_modules/dotenv'));
const envs = Object.fromEntries(envFiles.map(n => [n, dotenv.parse(fs.readFileSync(n))]));
const secrets = [...Object.values(envs).flatMap(values=>Object.entries(values)), ...Object.entries(process.env)]
  .filter(([k,v]) => /KEY|SECRET|PASSWORD|TOKEN|EMAIL|DATABASE_URL|DSN/.test(k) && v && v.length >= 8)
  .map(([,v]) => v).sort((a,b) => b.length-a.length);
function redact(s) {
  s = String(s);
  for (const v of secrets) s = s.split(v).join('[REDACTADO]');
  return s.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT_REDACTADO]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[CORREO_REDACTADO]')
    .replaceAll(process.env.USERPROFILE || 'UNUSED_PROFILE', '[PERFIL_LOCAL]')
    .replaceAll(JSON.stringify(process.env.USERPROFILE || 'UNUSED_PROFILE').slice(1,-1), '[PERFIL_LOCAL]');
}
function write(name, value) {
  fs.writeFileSync(path.join(out, name), redact(typeof value === 'string' ? value : JSON.stringify(value,null,2))+'\n');
}
const npm = 'npm.cmd';
async function run(name, command, args, extra={}) {
  const start = new Date();
  const env = {...process.env, FORCE_COLOR:'0', ...extra.env};
  return new Promise(resolve => {
    // cmd is required for .cmd shims on Windows; arguments below are fixed by this script.
    const batch = /\.(cmd|bat)$/i.test(command);
    const executable = batch ? process.env.ComSpec || 'cmd.exe' : command;
    const actual = batch ? ['/d','/s','/c', [command,...args].join(' ')] : args;
    const child = cp.spawn(executable, actual, {cwd:extra.cwd || root, env, windowsHide:true});
    let stdout='', stderr='';
    child.stdout.on('data', d => stdout+=d);
    child.stderr.on('data', d => stderr+=d);
    child.on('error', e => stderr+=e.message);
    child.on('close', (code, signal) => {
      const meta = {command:[command,...args], cwd:rel(extra.cwd||root)||'.', start:start.toISOString(), end:new Date().toISOString(), durationSeconds:(Date.now()-start)/1000, exitCode:code, signal, environmentOverrides:extra.env||{}};
      write(name+'.stdout.log', stdout); write(name+'.stderr.log', stderr); write(name+'.meta.json',meta);
      console.log(JSON.stringify({name, ...meta, stdoutTail:redact(stdout.slice(-1800)), stderrTail:redact(stderr.slice(-1800))}));
      resolve({code,stdout,stderr});
    });
  });
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(d => d.isDirectory() ? (['node_modules','build','.gradle','.git'].includes(d.name)?[]:walk(path.join(dir,d.name))) : [path.join(dir,d.name)]);
}
async function inspect() {
  await run('estado-inicial','git',['status','--porcelain=v1','--untracked-files=all']);
  await run('commit','git',['rev-parse','HEAD']);
  await run('herramientas-node',process.execPath,['--version']);
  await run('herramientas-npm',npm,['--version']);
  await run('android/java','java',['-version']);
  await run('android/javac','javac',['-version']);
  await run('android/gradle-wrapper-version',path.join(root,'android/gradlew.bat'),['--version'],{cwd:path.join(root,'android')});
  const lock = require(path.join(root,'package-lock.json'));
  const pkgs = ['react','react-dom','react-router-dom','react-scripts','tailwindcss','@playwright/test','@supabase/supabase-js','@capacitor/android','@capacitor/cli','@capacitor/core','jest','@testing-library/react'];
  const files=walk(path.join(root,'src')).filter(f => /\.(test|spec)\.[jt]sx?$/.test(f));
  write('inventario.json', {
    inspectedAt:new Date().toISOString(), timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
    os:{platform:process.platform,arch:process.arch,release:require('os').release()},
    lockfileVersion:lock.lockfileVersion, packageVersions:Object.fromEntries(pkgs.map(p=>[p,lock.packages['node_modules/'+p]?.version])),
    scripts:require(path.join(root,'package.json')).scripts,
    fingerprints:Object.fromEntries(['package.json','package-lock.json','playwright.config.js','capacitor.config.json','docs/RESTAURACION_PC_2026-10-22.md',...files.map(rel)].filter(f=>fs.existsSync(f)).map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')])),
    environment:Object.fromEntries(Object.entries(envs).map(([file,values])=>[file,Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v?'CONFIGURADA (valor no registrado)':'VACIA']))])),
    requiredEnvReferences:[...new Set(walk(path.join(root,'src')).concat(walk(path.join(root,'tests')),walk(path.join(root,'supabase/functions'))).filter(f=>/\.[jt]sx?$/.test(f)).flatMap(f=>[...fs.readFileSync(f,'utf8').matchAll(/(?:process\.env\.|Deno\.env\.get\(['"])([A-Z][A-Z0-9_]+)/g)].map(m=>m[1])))].sort(),
    tests:files.map(f=>({file:rel(f), mocks:/jest\.(mock|fn)|mockResolvedValue|mockImplementation/.test(fs.readFileSync(f,'utf8')),titles:[...fs.readFileSync(f,'utf8').matchAll(/\b(?:it|test)\(['"`]([^'"`]+)['"`]/g)].map(m=>m[1])})),
    e2eFiles:walk(path.join(root,'tests/e2e')).filter(f=>/\.spec\.js$/.test(f)).map(rel),
    features:fs.readdirSync('src/features',{withFileTypes:true}).filter(d=>d.isDirectory()).map(d=>d.name),
    workflows:walk(path.join(root,'.github/workflows')).map(rel),
    android:{sdkConfiguredPathExists:fs.existsSync('D:/Apps/AndroidSDK'), defaultSdkExists:fs.existsSync(path.join(process.env.LOCALAPPDATA||'', 'Android/Sdk')),JAVA_HOME_present:!!process.env.JAVA_HOME,ANDROID_HOME_present:!!process.env.ANDROID_HOME,ANDROID_SDK_ROOT_present:!!process.env.ANDROID_SDK_ROOT,wrapper:fs.existsSync('android/gradlew.bat')},
    safeguards:{backend:'Produccion, confirmado por el usuario',remoteWrites:false,authenticationAgainstRealBackend:false}
  });
  write('plan-ejecucion.md','# Plan de auditoría\n\n1. Inventariar pruebas, herramientas y variables (solo nombres).\n2. Ejecutar Jest completo con cobertura, contratos y pruebas Edge con mocks.\n3. Compilar la web; servir localmente sin desplegar.\n4. Playwright público y recuperación simulada: bloquear red externa mediante guardia.\n5. Consultar únicamente catálogos SQL y asesores de seguridad; npm audit sin correcciones.\n6. Verificar Android según requisitos; no instalar herramientas ni sincronizar si falta entorno.\n7. Contrastar cifras de JSON, emitir documentos, revisar datos sensibles y hashes.\n\nNo se ejecutará database/tests/rls_access_matrix.sql: contiene escrituras y usa usuarios reales, aunque tenga rollback. Los E2E de roles, administración y filtros se bloquean por ausencia de entorno descartable.');
}
async function main() {
  const action=process.argv[2];
  if(action==='inspect') return inspect();
  if(action==='unit') return run('unitarias/jest',npm,['test','--','--watchAll=false','--runInBand','--coverage','--coverageDirectory='+rel(path.join(out,'unitarias/coverage')),'--coverageReporters=json-summary','--coverageReporters=json','--coverageReporters=lcov','--coverageReporters=text','--json','--outputFile='+rel(path.join(out,'unitarias/jest-resultados.json'))],{env:{CI:'true'}});
  if(action==='contracts') return run('integracion/contratos',npm,['run','test:contracts','--','--watchAll=false','--runInBand','--json','--outputFile='+rel(path.join(out,'integracion/contratos-resultados.json'))]);
  if(action==='edge') return run('unitarias/auth-edge',npm,['run','test:auth-edge']);
  if(action==='audit') return run('seguridad/npm-audit',npm,['audit','--json']);
  if(action==='audit-functions') return run('seguridad/npm-audit-functions',npm,['audit','--json'],{cwd:path.join(root,'functions')});
  if(action==='build') return run('compilacion-web/build',npm,['run','build']);
  if(action==='functions-build') return run('integracion/functions-build',npm,['run','build'],{cwd:path.join(root,'functions')});
  if(action==='copy') return run('unitarias/copy-quality',npm,['run','check:copy-quality']);
  if(action==='e2e-list') return run('e2e/inventario',process.execPath,['node_modules/@playwright/test/cli.js','test','--list','--reporter=json']);
  if(action==='e2e') return run('e2e/playwright',process.execPath,['node_modules/@playwright/test/cli.js','test','--config='+rel(path.join(out,'e2e/audit.config.cjs'))],{env:{E2E_BASE_URL:'http://127.0.0.1:3100',CI:'true'}});
  throw new Error('Acción desconocida: '+action);
}
if(require.main===module) main().catch(e=>{console.error(redact(e.stack));process.exitCode=1;});
module.exports={out,root,rel,redact,write,walk,run};
