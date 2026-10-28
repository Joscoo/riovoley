const h=require('../../e2e/local/harness.cjs');
(async()=>{
  for(const [action,label] of [['public','publicas-finales'],['pending','paneles-finales'],['mutations','mutaciones-finales'],['boundaries','limites-finales']]) {
    await h.run('regresion/'+label,process.execPath,['scripts/e2e/local/run.cjs',action,'--label='+label,'--workers=2'],{allowFailure:true});
  }
})();
