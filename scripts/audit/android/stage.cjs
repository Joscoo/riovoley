const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const c=require('./context.cjs');
const stage=path.join(c.work,'project');
const final=process.argv[2]==='final';
fs.mkdirSync(stage,{recursive:true});
const skip=new Set(['.gradle','build','local.properties','google-services.json','capacitor-cordova-android-plugins']);
fs.cpSync(path.join(c.root,'android'),path.join(stage,'android'),{recursive:true,filter:file=>!skip.has(path.basename(file)) && !/\.(keystore|jks)$/i.test(file) && !file.includes(path.join('assets','public'))});
const native=['@capacitor/android','@capacitor/app','@capacitor/browser','@capacitor/filesystem','@capacitor/preferences','@capacitor/push-notifications','@capacitor/share','@capgo/capacitor-updater'];
const dependencies=[...native,'@capacitor/core','@capacitor/synapse'];
for(const name of dependencies) fs.cpSync(path.join(c.root,'node_modules',name),path.join(stage,'node_modules',name),{recursive:true,filter:file=>!['.gradle','build','node_modules'].includes(path.basename(file)) || file===path.join(c.root,'node_modules',name)});
const config=JSON.parse(fs.readFileSync(path.join(c.root,'capacitor.config.json')));
// Configuración de empaquetado de prueba: no actualizar desde canales externos.
config.plugins.CapacitorUpdater.autoUpdate=false;
if(final) config.webDir='build-safe';
fs.writeFileSync(path.join(stage,'capacitor.config.json'),JSON.stringify(config,null,2));
fs.writeFileSync(path.join(stage,'package.json'),fs.readFileSync(path.join(c.root,'package.json')));
fs.writeFileSync(path.join(stage,'android/local.properties'),'sdk.dir='+path.join(c.work,'sdk').replaceAll('\\','/').replaceAll(':','\\:')+'\n');
const env=require('../../e2e/local/safety.cjs').buildWebEnv({apiUrl:'http://127.0.0.1:55321',anonKey:'riovoley-audit-offline-placeholder',piiEncryptionKey:''});
env.BUILD_PATH=path.join(stage,config.webDir);
(async()=>{
  await c.run('compilacion-web/build-auditoria',process.execPath,[path.join(c.root,'node_modules/react-scripts/scripts/build.js')],{env});
  await c.run('android/capacitor-sync',process.execPath,[path.join(c.root,'node_modules/@capacitor/cli/bin/capacitor'),'sync','android'],{cwd:stage});
  await c.run('android/capacitor-plugins',process.execPath,[path.join(c.root,'node_modules/@capacitor/cli/bin/capacitor'),'ls','android'],{cwd:stage});
  c.write('android/configuracion-'+(final?'final':'aislada')+'.json',{stage:path.relative(c.root,stage),web:'Build nuevo de las fuentes actuales; endpoint loopback y clave placeholder sin validez; PII key vacía. Su contenido se comprueba en PRIVACIDAD.json antes de la entrega.',nativeSources:'Copia de android y módulos Android instalados, sin modificar originales.',appId:config.appId,updaterOverride:{autoUpdate:false},omitted:['keystore de publicación','google-services.json','local.properties original','cachés y builds previos'],nativeModules:native.map(name=>({name,version:require(path.join(c.root,'node_modules',name,'package.json')).version}))});
})();
