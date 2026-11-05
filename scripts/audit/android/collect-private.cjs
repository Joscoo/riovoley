const fs=require('node:fs');
const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const c=require('./context.cjs');
const {environment}=require('./environment.cjs');
(async()=>{
 const label=process.argv[2]||'cierre';require('node:assert/strict').match(label,/^[a-z0-9-]+$/);
 const {env,sdk}=environment(),project=path.join(c.work,'project/android');
 const apk=path.join(project,'app/build/outputs/apk/debug/app-debug.apk');
 await h.run('android/apk-privado-privacidad-'+label, 'python',['scripts/audit/android/inspect-private.py','--label',label]);
 await h.run('android/apk-badging-'+label,path.join(sdk,'build-tools/35.0.0/aapt.exe'),['dump','badging',apk],{env});
 await h.run('android/apk-firma-'+label,process.env.ComSpec,['/d','/c',path.join(sdk,'build-tools/35.0.0/apksigner.bat')+' verify --verbose --print-certs '+apk],{env});
 const directory=path.join(project,'app/build/test-results/testDebugUnitTest'),results=[];
 for(const name of fs.readdirSync(directory).filter(n=>n.endsWith('.xml'))){
  const xml=fs.readFileSync(path.join(directory,name),'utf8');
  const attrs=Object.fromEntries([...xml.match(/<testsuite\s[^>]+>/)[0].matchAll(/([\w.-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
  results.push({suite:attrs.name,tests:Number(attrs.tests),failures:Number(attrs.failures),errors:Number(attrs.errors),skipped:Number(attrs.skipped),seconds:Number(attrs.time)});
  h.write('android/junit-'+label+'/'+name,xml);
 }
 h.write('android/junit-'+label+'/resumen.json',{results,scope:'Prueba de plantilla addition_isCorrect; no representa cobertura funcional de Android.'});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
