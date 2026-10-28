const fs=require('node:fs');
const path=require('node:path');
const c=require('./context.cjs');
function environment() {
  const javaHome=fs.readdirSync(c.work).map(name=>path.join(c.work,name)).find(file=>fs.existsSync(path.join(file,'bin/java.exe')));
  if(!javaHome) throw new Error('Falta extraer JDK 21');
  const sdk=path.join(c.work,'sdk');
  const env={...process.env,JAVA_HOME:javaHome,ANDROID_HOME:sdk,ANDROID_SDK_ROOT:sdk,ANDROID_USER_HOME:path.join(c.work,'android-user'),GRADLE_USER_HOME:path.join(c.work,'gradle-cache'),GRADLE_OPTS:'-Dorg.gradle.daemon=false',JAVA_TOOL_OPTIONS:'',_JAVA_OPTIONS:'',CAP_PUBLISH:'',CAP_PLUGIN_PUBLISH:''};
  const inheritedPath=process.env.Path||process.env.PATH||'';
  delete env.Path; delete env.PATH;
  env.PATH=path.join(javaHome,'bin')+';'+inheritedPath;
  return {env,javaHome,sdk};
}
module.exports={environment};
