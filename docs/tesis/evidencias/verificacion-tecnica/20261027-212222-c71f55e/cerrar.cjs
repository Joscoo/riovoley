const a = require('./auditar.cjs');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
(async () => {
  await Promise.all([
    a.run('herramientas-sistema','powershell.exe',['-NoProfile','-File',path.join(a.out,'entorno.ps1')]),
    a.run('herramientas-git','git',['--version']),
    a.run('herramientas-python','python',['--version']),
    a.run('integridad-tracked','git',['diff','--exit-code']),
    a.run('estado-final','git',['status','--short','--untracked-files=normal']),
  ]);
  const inventory=JSON.parse(fs.readFileSync(path.join(a.out,'inventario.json')));
  const versions=Object.fromEntries(Object.keys(inventory.packageVersions).map(name=>{
    const file=path.join(a.root,'node_modules',name,'package.json');
    return [name,fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).version:null];
  }));
  a.write('versiones-instaladas.json',versions);
  const files=a.walk(path.join(a.root,'build')).map(file=>({file:a.rel(file),bytes:fs.statSync(file).size,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
  a.write('compilacion-web/artefactos.json',{observedAt:new Date().toISOString(),directory:'build/',files:files.length,totalBytes:files.reduce((n,f)=>n+f.bytes,0),artifacts:files});
  a.write('compilacion-web/asset-manifest.json',fs.readFileSync('build/asset-manifest.json','utf8'));
  a.write('android/alcance.json',{observedAt:new Date().toISOString(),capacitorDoctorExitCode:0,java:'25.0.4.1',gradleWrapper:'8.14.3',agp:'8.13.0',minSdk:24,compileSdk:36,targetSdk:36,configuredSdkExists:false,defaultSdkExists:false,syncExecuted:false,nativeBuildExecuted:false,deviceTestsExecuted:false,reason:'SDK no localizado ni configurado; adb/emulator ausentes en PATH. JDK 25 no está en la combinación soportada con Gradle 8.14.3.',apkProducedByAudit:false,iosProjectPresent:fs.existsSync('ios')});
})();
