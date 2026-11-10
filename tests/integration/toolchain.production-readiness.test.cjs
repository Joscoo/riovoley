const test=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const consumers=['jest-config','@svgr/plugin-svgo','fork-ts-checker-webpack-plugin','@rollup/plugin-node-resolve'];
const payload=()=>JSON.parse('{"__proto__":{"unexpectedInheritedFlag":true}}');
const scenarios=[
 ['destino sin prototipo',()=>[Object.create(null),payload(),false]],
 ['placeholder null',()=>[{session:null},{session:payload()},true]],
 ['placeholder undefined',()=>[{session:undefined},{session:payload()},true]],
 ['clave propia en destino',()=>[payload(),{},false]],
];
for(const consumer of consumers){
 const merge=createRequire(require.resolve(consumer))('deepmerge');
 for(const [name,fixture]of scenarios)test(`${consumer}: merge evita propiedades heredadas inyectadas con ${name}`,()=>{
  const [target,source,nested]=fixture(),output=merge(target,source),result=nested?output.session:output;
  assert.equal(Object.getPrototypeOf(result),Object.prototype);
  assert.equal(result.unexpectedInheritedFlag,undefined);
  assert.equal(Object.hasOwn(result,'__proto__'),false);
  assert.equal(({}).unexpectedInheritedFlag,undefined);
 });
 test(`${consumer}: conserva clonación, arrays, símbolos y merge.all`,()=>{
  const symbol=Symbol('config'),date=new Date('2026-10-30T00:00:00Z'),regex=/fixture/;
  const a={nested:{x:1},list:[{x:1}],date,regex,[symbol]:{a:1}};
  const b={nested:{y:2},list:[{y:2}],[symbol]:{b:2}};
  const out=merge(a,b);
  assert.deepEqual(out.nested,{x:1,y:2});assert.notEqual(out.nested,a.nested);
  assert.deepEqual(out.list,[{x:1},{y:2}]);assert.notEqual(out.list[0],a.list[0]);
  assert.deepEqual(out[symbol],{a:1,b:2});assert.equal(out.date,date);assert.equal(out.regex,regex);
  assert.deepEqual(merge.all([{a:1},{nested:{x:1}},{nested:{y:2}}]),{a:1,nested:{x:1,y:2}});
 });
 test(`${consumer}: conserva customMerge, arrayMerge y clone:false`,()=>{
  const a={nested:{a:1},list:[1]},b={nested:{b:2},list:[2]};
  const out=merge(a,b,{customMerge:key=>key==='nested'?()=>({custom:true}):undefined,arrayMerge:(_target,source,options)=>{assert.equal(typeof options.cloneUnlessOtherwiseSpecified,'function');return source;}});
  assert.deepEqual(out.nested,{custom:true});assert.equal(out.list,b.list);
  const unchanged={item:{a:1}};assert.equal(merge({},unchanged,{clone:false}).item,unchanged.item);
 });
}

test('Deepmerge local conserva procedencia, licencia y digest del código revisado',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const resolved=createRequire(require.resolve('jest-config')).resolve('deepmerge/package.json');
 const dir=path.dirname(resolved),pkg=JSON.parse(fs.readFileSync(resolved));
 assert.equal(pkg.name,'@riovoley/deepmerge-hardened');assert.equal(pkg.private,true);
 const origin=JSON.parse(fs.readFileSync(path.join(dir,'ORIGIN.json')));
 assert.equal(origin.upstream.name,'deepmerge');assert.equal(origin.upstream.version,'4.3.1');
 assert.equal(origin.downstream.version,pkg.version);assert.equal(origin.registryAuditCoversLocalCode,false);assert.equal(origin.upstreamReleaseClaimed,false);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,'index.cjs'))).digest('hex');assert.equal(hash,origin.downstream.cjsSha256);
 assert.match(fs.readFileSync(path.join(dir,'LICENSE'),'utf8'),/The MIT License/);
 assert.match(fs.readFileSync(path.join(dir,'README.md'),'utf8'),/npm audit no evalúa el código local/);
});
