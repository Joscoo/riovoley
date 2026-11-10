import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import path from 'node:path';
import {DeleteAuthUserUseCase} from '../../supabase/functions/_core/auth-admin/application/use-cases/delete-auth-user-use-case.ts';
const entry=path.resolve('supabase/functions/_core/auth-admin/infrastructure/supabase-auth-admin-gateway.ts');
const requireAt=createRequire(entry);
const ts=requireAt('typescript');
function gateway(core:any,profile:any={role:'administrador'}){
 const tables:string[]=[];
 const client={auth:{getUser:async()=>({data:{user:{id:'fixture'}},error:null})},from:(table:string)=>{
  tables.push(table);const result=table==='users'?core:{data:profile,error:null};
  const q={select:()=>q,eq:()=>q,single:async()=>result,maybeSingle:async()=>result};return q;
 }};
 const compiled=ts.transpileModule(fs.readFileSync(entry,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{} as any};
 const loader=(id:string)=>id.startsWith('https://')?{createClient:()=>client}:requireAt(id);
 vm.runInNewContext('(function(require,module,exports,Deno){'+compiled+'\n})',{})(loader,module,module.exports,{env:{get:()=> 'local-contract-test'}});
 return {instance:new module.exports.SupabaseAuthAdminGateway(),tables};
}
test('perfil aislado no autoriza personal cuando no existe usuario canónico',async()=>{
 const g=gateway({data:null,error:{code:'PGRST116'}});
 await assert.rejects(g.instance.requireActor('Bearer test'),(e:any)=>e.status===403&&e.code==='PROFILE_NOT_FOUND');assert.deepEqual(g.tables,['users']);
});
test('suspensión canónica bloquea autorización de personal',async()=>{
 const g=gateway({data:{role:'administrador',suspended:true},error:null});
 await assert.rejects(g.instance.requireActor('Bearer test'),(e:any)=>e.status===403&&e.code==='ACCOUNT_SUSPENDED');
});
test('un atleta canónico no obtiene permisos por un perfil alternativo privilegiado',async()=>{
 const g=gateway({data:{role:'estudiante',suspended:false},error:null},{role:'administrador'});
 await assert.rejects(g.instance.requireActor('Bearer test'),(e:any)=>e.status===403&&e.code==='ROLE_NOT_ALLOWED');assert.deepEqual(g.tables,['users']);
});
for(const role of ['administrador','entrenador'])test('personal activo mantiene autorización: '+role,async()=>{
 const g=gateway({data:{role,suspended:false},error:null});const actor=await g.instance.requireActor('Bearer test');assert.equal(actor.userId,'fixture');assert.equal(actor.role,role);
});
for(const [actorRole,targetRole,allowed] of [
 ['entrenador','administrador',false],['administrador','administrador',false],['entrenador','entrenador',false],['administrador','entrenador',true],['entrenador','estudiante',true],
] as const)test(`eliminación Auth autoriza el objetivo: ${actorRole} → ${targetRole}`,async()=>{
 let deleted=false;
 const gateway={requireActor:async()=>({userId:'actor',role:actorRole}),getDeletionTarget:async()=>({id:'target',role:targetRole}),deleteAuthUser:async()=>{deleted=true;}};
 const request=new DeleteAuthUserUseCase(gateway as any).execute({authorization:'Bearer test',userId:'target'});
 if(allowed)await request;else await assert.rejects(request,(e:any)=>e.status===403&&e.code==='TARGET_NOT_ALLOWED');
 assert.equal(deleted,allowed);
});
