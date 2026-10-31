const path=require('node:path');
const h=require('../../e2e/local/harness.cjs'),c=require('../android/context.cjs');
const {environment}=require('../android/environment.cjs');
(async()=>{
 const {env,sdk}=environment(),apk=path.join(c.work,'project/android/app/build/outputs/apk/debug/app-debug.apk');
 await h.run('android/apk-badging-definitivo',path.join(sdk,'build-tools/35.0.0/aapt.exe'),['dump','badging',apk],{env});
 await h.run('android/apk-firma-definitivo',process.env.ComSpec,['/d','/c',path.join(sdk,'build-tools/35.0.0/apksigner.bat')+' verify --verbose --print-certs '+apk],{env});
 await h.run('android/definitivo/herramientas-offline',process.execPath,['scripts/audit/android/build.cjs','version']);
 h.write('android/perfil-inspeccion.json',{scope:'APK offline: endpoint loopback, clave placeholder sin validez. Se comprueban bytes empaquetados, privacidad completa ZIP y firma debug. El inspector de APK autenticado exige una anon local real y no es aplicable a este perfil.',authenticatedInspectorApplicable:false,artifactDistributed:false});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
