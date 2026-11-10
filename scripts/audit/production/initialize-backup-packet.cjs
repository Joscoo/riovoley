const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),runtime=path.join(root,'.e2e-local'),privateDir=path.join(runtime,'institutional-backup');
const commit=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',cwd:root}).trim(),stamp=new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);
const evidence=path.join(root,'docs/tesis/evidencias/verificacion-tecnica',stamp+'-backup-cifrado-'+commit.slice(0,7));assert.ok(!fs.existsSync(evidence));
for(const folder of ['unitarias','integracion','e2e','compilacion-web','android','seguridad'])fs.mkdirSync(path.join(evidence,folder),{recursive:true});
fs.mkdirSync(privateDir,{recursive:true});const pointer=path.join(runtime,'evidence-dir.txt');fs.copyFileSync(pointer,path.join(privateDir,'evidence-before.txt'),fs.constants.COPYFILE_EXCL);fs.writeFileSync(pointer,evidence+'\n');
const h=require('../../e2e/local/harness.cjs');h.write('CONTEXTO.json',{commit,createdAt:new Date().toISOString(),scope:'Preparar exportacion PostgreSQL cifrada con entrada local de credenciales; validar con datos sinteticos. No modificar produccion, secretos o permisos.',productionChanged:false,institutionalPasswordAvailableToUser:true,passwordSuppliedToAgent:false});
fs.writeFileSync(path.join(privateDir,'context.json'),JSON.stringify({commit,evidence,createdAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});console.log(path.relative(root,evidence));
