const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const cwd=path.join(h.runtime,'spikes','clean-production-'+Date.now());
 fs.mkdirSync(cwd,{recursive:true});
 for(const name of ['.npmrc','package.json','package-lock.json','vendor','scripts/toolchain','scripts/production','tests/unit','tests/integration'])fs.cpSync(path.join(h.root,name),path.join(cwd,name),{recursive:true});
 const cli=path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 await h.run('seguridad/instalacion-limpia',process.execPath,[cli,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd});
 const names=['tests/integration/toolchain.dependencies.test.cjs','tests/integration/toolchain.security-followup.test.cjs','tests/integration/toolchain.loaders-security.test.cjs','tests/integration/toolchain.production-readiness.test.cjs','tests/unit/dev-server-config.test.cjs','tests/unit/production-preflight.test.cjs','tests/integration/toolchain.patterns.test.cjs'];
 await h.run('unitarias/cadena-instalacion-limpia',process.execPath,['--test','--test-concurrency=1',...names],{cwd});
 const result=await h.run('seguridad/audit-instalacion-limpia',process.execPath,[cli,'audit','--json'],{cwd});
 const audit=JSON.parse(result.stdout);assert.equal(audit.metadata.vulnerabilities.total,0);
 h.write('seguridad/instalacion-limpia.json',{directory:path.relative(h.root,cwd),registryAdvisories:audit.metadata.vulnerabilities,localForkCoveredByRegistryAudit:false,scope:'Instalación independiente con npm ci desde lockfile y vendor; contratos Node ejecutados con resolución de sus módulos independientes. No equivale a ejecutar GitHub Actions.'});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
