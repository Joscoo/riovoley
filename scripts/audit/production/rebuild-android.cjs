const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs');
(async()=>{
 const pointer=path.join(h.runtime,'android-audit-context.json'),prior=JSON.parse(fs.readFileSync(pointer));
 assert.equal(prior.root,h.root);assert.equal(prior.base,h.evidence);
 const apk=path.join(prior.work,'project/android/app/build/outputs/apk/debug/app-debug.apk');
 const preserved=path.join(h.runtime,'artifacts','android-pre-patterns-'+Date.now()+'.apk');fs.mkdirSync(path.dirname(preserved),{recursive:true});fs.copyFileSync(apk,preserved,fs.constants.COPYFILE_EXCL);
 h.write('android/apk-primer-build-preservado.json',{originalFile:path.relative(h.root,apk),preservedFile:path.relative(h.root,preserved),sha256:crypto.createHash('sha256').update(fs.readFileSync(preserved)).digest('hex'),private:true});
 const base=path.join(h.evidence,'android/definitivo');fs.mkdirSync(base,{recursive:true});
 fs.copyFileSync(pointer,path.join(h.runtime,'android-before-patterns-'+Date.now()+'.json'));
 fs.writeFileSync(pointer,JSON.stringify({...prior,base}));
 h.write('android/fuentes-recompilacion.json',Object.fromEntries(['package.json','package-lock.json','vercel.json'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(h.root,f))).digest('hex')])));
 await h.run('android/definitivo/sincronizar',process.execPath,['scripts/audit/android/stage.cjs','final']);
 await h.run('android/definitivo/compilar',process.execPath,['scripts/audit/android/build.cjs','assemble','--rerun-tasks']);
 await h.run('android/definitivo/inspeccionar', 'python',['scripts/audit/closure/check-dependencies-apk.py']);
 await h.run('android/definitivo/privacidad','python',['scripts/audit/android/privacy.py','--apk',apk,'--report','android/privacidad-apk.json']);
 await h.run('android/definitivo/firma',process.execPath,['scripts/audit/production/verify-offline-apk.cjs']);
})().catch(e=>{console.error(e.message);process.exitCode=1;});
