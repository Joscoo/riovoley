const fs=require('node:fs');
const path=require('node:path');
const c=require('./context.cjs');
function environment(inherited=process.env) {
  const javaHome=fs.readdirSync(c.work).map(name=>path.join(c.work,name)).find(file=>fs.existsSync(path.join(file,'bin/java.exe')));
  if(!javaHome) throw new Error('Falta extraer JDK 21');
  const sdk=path.join(c.work,'sdk');
  const env={...inherited,JAVA_HOME:javaHome,ANDROID_HOME:sdk,ANDROID_SDK_ROOT:sdk,ANDROID_USER_HOME:path.join(c.work,'android-user'),GRADLE_USER_HOME:path.join(c.work,'gradle-cache'),GRADLE_OPTS:'-Dorg.gradle.daemon=false',JAVA_TOOL_OPTIONS:'',_JAVA_OPTIONS:'',CAP_PUBLISH:'',CAP_PLUGIN_PUBLISH:''};
  for(const name of Object.keys(env)) if(/^(ADB_SERVER_SOCKET|ANDROID_ADB_SERVER_ADDRESS|ANDROID_ADB_SERVER_PORT|ADB_SERVER_PORT|ANDROID_SERIAL)$/i.test(name)) delete env[name];
  env.ADB_SERVER_SOCKET='tcp:127.0.0.1:5037';
  const inheritedPath=inherited.Path||inherited.PATH||'';
  delete env.Path; delete env.PATH;
  env.PATH=path.join(javaHome,'bin')+';'+inheritedPath;
  return {env,javaHome,sdk};
}
module.exports={environment};
