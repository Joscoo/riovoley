const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const c=require('./context.cjs');
const {environment}=require('./environment.cjs');
(async()=>{
  const {env,javaHome,sdk}=environment();
  fs.mkdirSync(path.join(sdk,'cmdline-tools'),{recursive:true});
  fs.cpSync(path.join(c.work,'cmdline-tools'),path.join(sdk,'cmdline-tools/latest'),{recursive:true});
  const manager=path.join(sdk,'cmdline-tools/latest/bin/sdkmanager.bat');
  await c.run('android/java-21',path.join(javaHome,'bin/java.exe'),['-version'],{env});
  await c.run('android/sdkmanager-version','cmd.exe',['/d','/c',manager+' --version'],{env});
  await c.run('android/sdk-instalar','cmd.exe',['/d','/c',manager+' --sdk_root='+sdk+' platform-tools platforms;android-36 build-tools;35.0.0'],{env,input:'y\n'.repeat(20)});
  await c.run('android/sdk-instalado','cmd.exe',['/d','/c',manager+' --sdk_root='+sdk+' --list_installed'],{env});
  const tracked=cp.execFileSync('git',['ls-files','-z'],{cwd:c.root}).toString().split('\0').filter(Boolean);
  c.write('android/fuentes-iniciales.json',tracked.filter(file=>fs.existsSync(path.join(c.root,file))).map(file=>({file,sha256:c.hash(path.join(c.root,file))})));
  c.write('android/estado-inicial.txt',cp.execFileSync('git',['status','--short'],{cwd:c.root,encoding:'utf8'}));
})();
