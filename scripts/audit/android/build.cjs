const path=require('node:path');
const c=require('./context.cjs');
const {environment}=require('./environment.cjs');
const mode=process.argv[2]||'assemble';
(async()=>{
  const {env}=environment(),cwd=path.join(c.work,'project/android');
  const command=path.join(cwd,'gradlew.bat');
  const tasks={assemble:':app:assembleDebug :app:testDebugUnitTest',lint:':app:lintDebug',instrumentation:':app:assembleDebugAndroidTest',version:'--version'}[mode];
  if(!tasks) throw new Error('Usar assemble, lint, instrumentation o version');
  const rerun=process.argv.includes('--rerun-tasks')?' --rerun-tasks':'';
  const result=await c.run('android/gradle-'+mode,'cmd.exe',['/d','/c',command+' '+tasks+' --no-daemon --console=plain --stacktrace --max-workers=2'+rerun],{cwd,env,allowFailure:true});
  process.exitCode=result.exitCode??1;
})();
