const p=require('path'),fs=require('fs'),h=require('../../e2e/local/harness.cjs');
(async()=>{
 const cwd=p.join(h.runtime,'spikes','direct-pattern-'+Date.now());fs.mkdirSync(cwd,{recursive:true});
 fs.cpSync('vendor',p.join(cwd,'vendor'),{recursive:true});fs.writeFileSync(p.join(cwd,'.npmrc'),'install-links=true');
 fs.writeFileSync(p.join(cwd,'package.json'),JSON.stringify({name:'ci-probe',version:'1.0.0',private:true,dependencies:{glob:'7.2.3',eslint:'8.57.1',filelist:'1.0.4',minimatch:'file:vendor/minimatch-compat','@riovoley/minimatch-engine':'npm:minimatch@11.0.3'},overrides:{minimatch:'$minimatch'}}));
 const cli=p.join(p.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js');
 await h.run('seguridad/spike-direct-pattern',process.execPath,[cli,'install','--ignore-scripts','--no-audit','--no-fund'],{cwd});
 await h.run('seguridad/spike-direct-pattern-ci',process.execPath,[cli,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd});
 await h.run('seguridad/spike-direct-pattern-resolve',process.execPath,['-e',"const r=require('node:module').createRequire(require.resolve('eslint'));console.log(typeof r('minimatch'));console.log(require('glob').sync('vendor/*'));"],{cwd});
})().catch(e=>{console.error(e.message);process.exitCode=1});
