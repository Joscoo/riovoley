const h=require('../../e2e/local/harness.cjs');
(async()=>{
 for(const [label,script,args] of [
  ['seguridad/preflight-final','scripts/audit/security/apply-local.cjs',['preflight']],
  ['seguridad/rollback-final','scripts/audit/security/apply-local.cjs',['rollback']],
  ['seguridad/rollback-comparacion-final','scripts/audit/security/check-rollback.cjs',[]],
  ['seguridad/reaplicar-final','scripts/audit/security/apply-local.cjs',['apply']],
  ['seguridad/inspeccion-final','scripts/audit/security/inspect.cjs',[]],
  ['integracion/comprobar-acceso-final','scripts/audit/security/run.cjs',['access','acceso-final']],
  ['integracion/comprobar-funcional-final','scripts/audit/security/run.cjs',['functional','funcional-final']],
  ['unitarias/comprobar-edge-final','scripts/audit/security/run.cjs',['edge','edge-final']],
  ['integracion/comprobar-http-final','scripts/audit/security/edge-http.cjs',[]],
 ])await h.run(label,process.execPath,[script,...args]);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
