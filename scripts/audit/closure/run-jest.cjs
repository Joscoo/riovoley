const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
const mode=process.argv[2]||'access';
const args=[path.join(h.root,'node_modules/react-scripts/bin/react-scripts.js'),'test','--watchAll=false','--runInBand','--json','--outputFile='+path.join(h.evidence,'jest-'+mode+'.json')];
if(mode.startsWith('access')) args.push('--runTestsByPath','src/features/student-dashboard/presentation/components/StudentPanel.access.test.js');
if(mode.startsWith('payments')) args.push('--runTestsByPath','src/features/payments/application/useCases/createPaymentsUseCases.test.js');
if(mode==='coverage') args.push('--coverage','--coverageDirectory='+path.join(h.evidence,'cobertura'));
h.run('unitarias/jest-'+mode,process.execPath,args,{env:{...process.env,CI:'true'},allowFailure:true}).then(r=>{process.exitCode=r.exitCode;});
