'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..'),runtime=path.join(root,'.e2e-local'),privateDir=path.join(runtime,'edge-production');
const commit=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),stamp=new Date().toISOString().replace(/[-:]/g,'').replace('T','-').slice(0,15);
const evidence=path.join(root,'docs/tesis/evidencias/verificacion-tecnica',stamp+'-edge-preparacion-'+commit.slice(0,7));assert.ok(!fs.existsSync(evidence));
for(const dir of ['unitarias','integracion','e2e','compilacion-web','android','seguridad'])fs.mkdirSync(path.join(evidence,dir),{recursive:true});
const pointer=path.join(runtime,'evidence-dir.txt');fs.copyFileSync(pointer,path.join(privateDir,'evidence-before.txt'),fs.constants.COPYFILE_EXCL);fs.writeFileSync(pointer,evidence+'\n');
const h=require('../../e2e/local/harness.cjs');h.write('CONTEXTO.json',{commit,createdAt:new Date().toISOString(),scope:'Preparacion de artefactos Edge y retorno; lectura Cloud de codigo y pruebas HTTP exclusivamente locales. No despliegue ni invocacion institucional.',productionChanged:false,apiLocal:'http://127.0.0.1:55321',httpHandlerLocal:'http://127.0.0.1:6161',previousEvidencePreserved:true});
fs.writeFileSync(path.join(privateDir,'context.json'),JSON.stringify({commit,evidence,createdAt:new Date().toISOString()},null,2)+'\n',{flag:'wx'});console.log(path.relative(root,evidence));
