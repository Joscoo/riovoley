'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),privateDir=path.join(root,'.e2e-local/production-migration'),contextFile=path.join(privateDir,'context.json');
function initialize(){
 assert.ok(!fs.existsSync(contextFile),'El contexto ya existe: conservar el expediente anterior');
 const commit=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const stamp=new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);
 const relative='docs/tesis/evidencias/verificacion-tecnica/'+stamp+'-ensayo-sql-'+commit.slice(0,7);
 const evidence=path.join(root,relative);assert.ok(!fs.existsSync(evidence));
 for(const dir of ['unitarias','integracion','e2e','compilacion-web','android','seguridad'])fs.mkdirSync(path.join(evidence,dir),{recursive:true});
 const context={commit,createdAt:new Date().toISOString(),evidence:relative,productionChanged:false,database:'riovoley_release_'+stamp.replace('-','').toLowerCase(),operatingSystem:process.platform,node:process.version};
 fs.mkdirSync(privateDir,{recursive:true});fs.writeFileSync(contextFile,JSON.stringify(context,null,2)+'\n',{flag:'wx'});
 fs.writeFileSync(path.join(evidence,'CONTEXTO.json'),JSON.stringify(context,null,2)+'\n',{flag:'wx'});
 console.log(relative);
}
function read(){const c=JSON.parse(fs.readFileSync(contextFile));assert.match(c.evidence,/^docs\/tesis\/evidencias\/verificacion-tecnica\/\d{8}-\d{6}-ensayo-sql-[a-f0-9]{7}$/);assert.match(c.database,/^riovoley_release_\d{14}$/);const evidence=path.join(root,c.evidence);assert.ok(!fs.existsSync(path.join(evidence,'MANIFIESTO_SHA256.json')),'Expediente sellado');return {...c,evidence};}
function write(name,value){const c=read(),file=path.resolve(c.evidence,name);assert.ok(file.startsWith(c.evidence+path.sep));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',{flag:'wx'});return file;}
function run(label,args){assert.match(label,/^[a-z0-9/-]+$/);const start=new Date(),r=cp.spawnSync(process.execPath,args,{cwd:root,env:process.env,encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024});write(label+'.stdout.log',r.stdout||'');write(label+'.stderr.log',r.stderr||'');write(label+'.meta.json',{command:['node',...args],start:start.toISOString(),end:new Date().toISOString(),durationSeconds:(Date.now()-start)/1000,exitCode:r.status,signal:r.signal,errorCode:r.error?.code});console.log(JSON.stringify({label,exitCode:r.status}));return r;}
if(require.main===module){if(process.argv[2]==='init')initialize();else if(process.argv[2]==='run'){const result=run(process.argv[3],process.argv.slice(4));process.exitCode=result.status??1;}else throw Error('init o run');}
module.exports={root,privateDir,read,write,run};
