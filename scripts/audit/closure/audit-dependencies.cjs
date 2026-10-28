const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const mode=process.argv[2]||'before';
const cli=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
(async()=>{
  for(const [label,folder] of [['raiz','.'],['functions','functions'],['auxiliar','riovoley']]) {
    const args=mode==='plan'?['audit','fix','--dry-run','--ignore-scripts','--json']:['audit','--json'];
    const result=await h.run('seguridad/npm-'+label+'-'+mode,process.execPath,[cli,...args],{cwd:path.join(h.root,folder),allowFailure:true});
    try {h.write('seguridad/npm-'+label+'-'+mode+'.json',JSON.parse(result.stdout));}catch{}
  }
})();
