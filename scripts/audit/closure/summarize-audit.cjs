const fs=require('node:fs');
const path=require('node:path');
const h=require('../../e2e/local/harness.cjs');
for(const name of ['raiz','functions','auxiliar']) {
  const after=JSON.parse(fs.readFileSync(path.join(h.evidence,'seguridad/npm-'+name+'-after.json')));
  const raw=fs.readFileSync(path.join(h.evidence,'seguridad/npm-'+name+'-plan.stdout.log'),'utf8');
  const before=JSON.parse(raw.slice(raw.indexOf('{'))).audit;
  const direct=Object.values(after.vulnerabilities||{}).filter(v=>v.isDirect||v.severity==='high').map(v=>({name:v.name,severity:v.severity,direct:v.isDirect,range:v.range,fix:v.fixAvailable}));
  h.write('seguridad/comparacion-'+name+'.json',{before:before.metadata.vulnerabilities,after:after.metadata.vulnerabilities,remaining:direct});
  console.log(JSON.stringify({name,before:before.metadata.vulnerabilities,after:after.metadata.vulnerabilities,remaining:direct}));
}
