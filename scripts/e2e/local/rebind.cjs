// Compatibilidad con el diagnóstico inicial: usar el manager y sus guardias.
const h=require('./harness.cjs');
(async()=>{
  await h.run('red-local/manager-start',process.execPath,['scripts/e2e/local/manage.cjs','start']);
  console.log('Stack local validado por el manager; datos locales conservados.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});
