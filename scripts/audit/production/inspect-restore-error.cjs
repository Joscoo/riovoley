'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),b=require('../../production/backup.cjs');
const root=path.resolve(__dirname,'../../..'),dir=path.join(root,'.e2e-local/institutional-restore');
function diagnose(home){
if(!home)home=path.resolve(root,JSON.parse(fs.readFileSync(path.join(dir,'inspection.json'))).keyHome);
const errors=fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()).flatMap(e=>fs.readdirSync(path.join(dir,e.name)).filter(f=>f.endsWith('.stderr.pgp')).map(f=>path.join(dir,e.name,f)));
const results=[];for(const file of errors){const r=cp.spawnSync(b.tools().gpg,['--homedir',b.gpgPath(home),'--batch','--no-tty','--pinentry-mode','error','--decrypt',b.gpgPath(file)],{env:b.baseEnvironment(),windowsHide:true,maxBuffer:8*1024*1024});if(r.status!==0){results.push({case:path.basename(path.dirname(file)),requiresLocalUnlock:true});continue;}
 const category=require('../../production/restore-guards.cjs').diagnosticCategory(r.stdout.toString('utf8'));
 results.push({case:path.basename(path.dirname(file)),stage:path.basename(file),category,rowDetailsPublished:false});
}return results;}
if(require.main===module)console.log(JSON.stringify(diagnose()));
module.exports={diagnose};
