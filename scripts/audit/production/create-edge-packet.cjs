'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs'),privateDir=path.join(h.runtime,'edge-production'),cloud=JSON.parse(fs.readFileSync(path.join(privateDir,'cloud-sources.json')));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex'),walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const write=(file,content)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content,{flag:'wx'});};
const candidate=path.join(privateDir,'packets/candidate');assert.ok(!fs.existsSync(candidate));fs.mkdirSync(candidate,{recursive:true});
fs.cpSync(path.join(h.root,'supabase/functions'),path.join(candidate,'supabase/functions'),{recursive:true,filter:file=>!path.basename(file).startsWith('.env')});
write(path.join(candidate,'supabase/functions/deno.lock'),fs.readFileSync(path.join(privateDir,'candidate.deno.lock')));
write(path.join(candidate,'supabase/config.toml'),'project_id = "riovoley-release-prepared"\n'+cloud.functions.map(f=>`\n[functions.${f.slug}]\nverify_jwt = ${f.verify_jwt}\n`).join(''));
const rows=[];
for(const fn of cloud.functions){
 assert.match(fn.slug,/^[a-z][a-z0-9-]+$/);assert.equal(fn.verify_jwt,true);
 write(path.join(candidate,'supabase/functions',fn.slug,'deno.json'),JSON.stringify({lock:{path:'../deno.lock',frozen:true}},null,2)+'\n');
 const files=fn.files;assert.ok(files.length);const entry=files.find(f=>fn.entrypoint_path.replaceAll('\\','/').endsWith('/'+f.name))||files.find(f=>f.name===fn.slug+'/index.ts')||files.find(f=>f.name.endsWith('/source/index.ts'));assert.ok(entry,'No se pudo resolver entrypoint '+fn.slug);
 const restored=path.join(privateDir,'packets/return',fn.slug),entryDir=path.posix.dirname(entry.name),root=path.join(restored,'supabase/functions');let dependencies=0;const omittedTypeImports=[];
 const restoredFiles=[];
 for(const file of files){assert.ok(!path.posix.isAbsolute(file.name));const relative=path.posix.normalize(path.posix.join(fn.slug,path.posix.relative(entryDir,file.name)));assert.ok(!relative.startsWith('../')&&!path.posix.isAbsolute(relative));const target=path.resolve(root,relative);assert.ok(target.startsWith(root+path.sep));write(target,file.content);restoredFiles.push({file:relative,sha256:hash(file.content)});}
 const ts=require('typescript');
 for(const file of walk(root)){
  const parsed=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  for(const statement of parsed.statements){if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;const specifier=statement.moduleSpecifier.text;if(!specifier.startsWith('.'))continue;const target=path.resolve(path.dirname(file),specifier);assert.ok(target.startsWith(root+path.sep));
   if(!fs.existsSync(target)){const clause=statement.importClause;const typeOnly=clause?.isTypeOnly||(!clause?.name&&clause?.namedBindings&&ts.isNamedImports(clause.namedBindings)&&clause.namedBindings.elements.every(e=>e.isTypeOnly));assert.ok(typeOnly,'Dependencia runtime de retorno ausente '+fn.slug+': '+specifier);omittedTypeImports.push({file:path.relative(root,file).replaceAll('\\','/'),specifier});}else dependencies++;
  }
 }
 write(path.join(restored,'supabase/config.toml'),`project_id = "riovoley-return-prepared"\n[functions.${fn.slug}]\nverify_jwt = true\n`);
 const localMain=fs.readFileSync(path.join(h.root,'supabase/functions',fn.slug,'index.ts'),'utf8');
 rows.push({slug:fn.slug,cloudVersion:fn.version,verifyJwt:fn.verify_jwt,cloudBundleSha256:fn.ezbr_sha256,cloudEntrypointSourceSha256:hash(entry.content),candidateEntrypointSourceSha256:hash(localMain),sameEntrypointAfterLfNormalization:entry.content.replace(/\r\n/g,'\n')===localMain.replace(/\r\n/g,'\n'),returnSourceFiles:restoredFiles,relativeImportsVerified:dependencies,omittedTypeImports,returnDirectory:path.relative(h.root,restored).replaceAll('\\','/')});
}
const names=new Set();for(const file of walk(path.join(candidate,'supabase/functions')).filter(f=>f.endsWith('.ts')))for(const m of fs.readFileSync(file,'utf8').matchAll(/Deno\.env\.get\(['"]([A-Z0-9_]+)['"]\)/g))names.add(m[1]);
const manifest={createdAt:new Date().toISOString(),baseCommit:JSON.parse(fs.readFileSync(path.join(privateDir,'context.json'))).commit,cloudObservedAt:cloud.observedAt,projectId:cloud.projectId,productionDeployed:false,functions:rows,requiredEnvNames:[...names].sort(),candidateDirectory:path.relative(h.root,candidate).replaceAll('\\','/'),candidateFiles:walk(candidate).map(file=>({file:path.relative(candidate,file).replaceAll('\\','/'),sha256:hash(fs.readFileSync(file))})),returnScope:'Fuentes descargadas y configuración JWT por función; no reproducción binaria del bundle ni ensayo gestionado de retorno.'};
fs.writeFileSync(path.join(privateDir,'packet.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});h.write('seguridad/paquete-edge.json',manifest);h.write('integracion/deno-candidato.lock',fs.readFileSync(path.join(privateDir,'candidate.deno.lock'),'utf8'));console.log(JSON.stringify({functions:rows.length,candidateFiles:manifest.candidateFiles.length,differentEntrypoints:rows.filter(r=>!r.sameEntrypointAfterLfNormalization).length,requiredEnvNames:manifest.requiredEnvNames,productionDeployed:false}));
