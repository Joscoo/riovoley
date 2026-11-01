const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript');
const reporting=path.resolve('supabase/functions/_shared/reporting.ts');
function load(actor){
 const queries=[];const query={select:columns=>{queries.push(columns);return query;},eq:()=>query,maybeSingle:async()=>({data:actor,error:null})};
 const client={auth:{getUser:async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111'}},error:null})},from:()=>query};
 const compiled=ts.transpileModule(fs.readFileSync(reporting,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const module={exports:{}};const loader=id=>id.includes('@supabase/')?{createClient:()=>client}:id.includes('pdf-lib')?{rgb:(r,g,b)=>({r,g,b})}:require(path.resolve(path.dirname(reporting),id));
 const env={SUPABASE_URL:'http://127.0.0.1:55321',SUPABASE_SERVICE_ROLE_KEY:'synthetic',SUPABASE_ANON_KEY:'synthetic'};
 vm.runInNewContext('(function(require,module,exports,Deno){'+compiled+'\nmodule.exports.__checksum=computeSha256Hex;})',{crypto:globalThis.crypto,Uint8Array,ArrayBuffer})(loader,module,module.exports,{env:{get:key=>env[key]}});
 return {api:module.exports,queries};
}
for(const role of ['administrador','entrenador'])test('reportes rechazan personal suspendido antes de operar con service_role: '+role,async()=>{
 const {api,queries}=load({id:'11111111-1111-4111-8111-111111111111',role,suspended:true});
 await assert.rejects(api.getUserRoleFromToken('Bearer synthetic'),e=>e.status===403&&e.code==='ACCOUNT_SUSPENDED');assert.ok(queries[0].includes('suspended'));
});
for(const role of ['administrador','entrenador'])test('reportes conservan autorización de personal activo: '+role,async()=>{
 const {api}=load({id:'11111111-1111-4111-8111-111111111111',role,suspended:false});assert.equal((await api.getUserRoleFromToken('Bearer synthetic')).role,role);
});
test('checksum SHA256 usa los bytes de la subvista, sin prefijo ni sufijo',async()=>{
 const {api}=load(null),bytes=new Uint8Array([0,97,98,99,255]);assert.equal(await api.__checksum(bytes.subarray(1,4)),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
test('checksum copia una vista compartida antes de entregarla a WebCrypto',async()=>{
 const {api}=load(null),bytes=new Uint8Array(new SharedArrayBuffer(3));bytes.set([97,98,99]);assert.equal(await api.__checksum(bytes),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
