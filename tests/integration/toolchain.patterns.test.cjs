const test=require('node:test'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const fs=require('node:fs'),path=require('node:path');
for(const consumer of ['glob','eslint','filelist'])test(consumer+': minimatch conserva API callable y nombrada con motor corregido',()=>{
 const local=createRequire(require.resolve(consumer)),match=local('minimatch');
 assert.equal(typeof match,'function');assert.equal(typeof match.minimatch,'function');
 assert.equal(match('src/component.test.js','src/**/!(*.spec).js'),true);
 assert.equal(match('src/.hidden.js','src/**/*.js'),false);
 assert.equal(match('src/.hidden.js','src/**/*.js',{dot:true}),true);
 assert.equal(new match.Minimatch('**/*.test.js').match('src/test/a.test.js'),true);
 assert.deepEqual(match.match(['a.js','b.css'],'*.js'),['a.js']);
 assert.equal(match.defaults({nocase:true})('A.JS','*.js'),true);
 assert.equal(match.minimatch('b.css','*.js'),false);
 const engine=local('@riovoley/minimatch-engine/package.json');assert.equal(engine.version,'11.0.3');
});
test('glob heredado conserva callbacks y API sync con patrones del motor corregido',async()=>{
 const glob=require('glob');assert.equal(typeof glob,'function');assert.equal(typeof glob.sync,'function');
 const cwd=path.resolve(__dirname,'../../vendor/deepmerge');
 const expected=fs.readdirSync(cwd).filter(f=>f.endsWith('.json')).sort();
 assert.deepEqual(glob.sync('*.json',{cwd}).sort(),expected);
 const result=await new Promise((resolve,reject)=>glob('*.json',{cwd},(e,r)=>e?reject(e):resolve(r)));
 assert.deepEqual(result.sort(),expected);
});
test('glob de Capacitor admite API async y cancela antes de recorrer',async()=>{
 const r=createRequire(require.resolve('@capacitor/cli')),glob=r('glob');
 assert.equal(r('glob/package.json').version,'14.0.3');
 const cwd=path.resolve(__dirname,'../../vendor/deepmerge');
 assert.deepEqual((await glob.glob('*.json',{cwd})).sort(),fs.readdirSync(cwd).filter(f=>f.endsWith('.json')).sort());
 const controller=new AbortController();controller.abort(new Error('audit-abort'));
 let reads=0;
 const fake={...fs,readdir:(...args)=>{reads++;return fs.readdir(...args);},readdirSync:(...args)=>{reads++;return fs.readdirSync(...args);}};
 await assert.rejects(glob.glob('**/*',{cwd,signal:controller.signal,fs:fake}),/audit-abort/);
 assert.equal(reads,0);
});
test('patrón de amplificación finaliza con límite externo de recursos',()=>{
 const cp=require('node:child_process');
 const code="const {minimatch}=require('@riovoley/minimatch-engine');minimatch('x','a/'+('**/../'.repeat(16))+'z',{optimizationLevel:2});";
 const result=cp.spawnSync(process.execPath,['--max-old-space-size=96','-e',code],{cwd:path.resolve(__dirname,'../..'),timeout:4000,windowsHide:true});
 assert.equal(result.error,undefined);assert.equal(result.status,0,String(result.stderr));
});
