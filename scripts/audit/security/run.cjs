const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const mode=process.argv[2]||'unit-red',label=process.argv[3]||mode;
let args,folder='unitarias';
if(mode.startsWith('unit')||mode==='deletion')args=['node_modules/react-scripts/bin/react-scripts.js','test','--watchAll=false','--runInBand','--runTestsByPath',mode==='deletion'?'src/features/user-management/infrastructure/repositories/deletion.security.test.js':'src/features/gamification/infrastructure/repositories/security.contract.test.js','--json','--outputFile='+path.join(h.evidence,'unitarias/'+label+'.json')];
else if(mode==='full')args=['node_modules/react-scripts/bin/react-scripts.js','test','--watchAll=false','--runInBand','--coverage','--coverageDirectory='+path.join(h.evidence,'unitarias/cobertura-'+label),'--json','--outputFile='+path.join(h.evidence,'unitarias/'+label+'.json')];
else if(mode==='functional'){folder='integracion';args=['functions/node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap','tests/integration/gamification.local.test.cjs'];}
else if(mode==='access'){folder='integracion';args=['functions/node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap','tests/integration/security.local.test.cjs'];}
else if(mode==='edge')args=['functions/node_modules/tsx/dist/cli.mjs','--test','--test-reporter=tap','tests/unit/credentials-edge.test.ts','tests/unit/authorization-edge.test.ts'];
else throw new Error('Modo no reconocido');
h.run(folder+'/'+label,process.execPath,args,{env:{...process.env,CI:'true',RIOVOLEY_LOCAL_SQL_DRIVER:'pg'},allowFailure:true}).then(r=>{process.exitCode=r.exitCode??1;});
