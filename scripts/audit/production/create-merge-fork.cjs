const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const h=require('../../e2e/local/harness.cjs');
const packageFile=require.resolve('deepmerge/package.json');
const original=JSON.parse(fs.readFileSync(packageFile));
assert.equal(original.name,'deepmerge');assert.equal(original.version,'4.3.1');
const source=fs.readFileSync(require.resolve('deepmerge'),'utf8');
const destination=path.join(h.root,'vendor/deepmerge');
assert.ok(!fs.existsSync(destination),'La copia local existente debe conservarse; no sobrescribirla');
const replacements=[
 ['function mergeObject(target, source, options) {',"function setOwn(destination, key, value) {\n\tObject.defineProperty(destination, key, {value: value, writable: true, enumerable: true, configurable: true});\n}\n\nfunction mergeObject(target, source, options) {"],
 ['getKeys(target).forEach(function(key) {',"getKeys(target).forEach(function(key) {\n\t\t\tif (key === '__proto__') return"],
 ['if (propertyIsUnsafe(target, key)) {',"if (key === '__proto__' || propertyIsUnsafe(target, key)) {"],
 ['destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);','setOwn(destination, key, cloneUnlessOtherwiseSpecified(target[key], options));'],
 ['destination[key] = getMergeFunction(key, options)(target[key], source[key], options);','setOwn(destination, key, getMergeFunction(key, options)(target[key], source[key], options));'],
 ['destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);','setOwn(destination, key, cloneUnlessOtherwiseSpecified(source[key], options));'],
];
let code=source;
for(const [before,after]of replacements){assert.equal(code.split(before).length,2,before);code=code.replace(before,after);}
code='// Local downstream security change; see ORIGIN.json, README.md and LICENSE.\n'+code;
fs.mkdirSync(destination,{recursive:true});
fs.writeFileSync(path.join(destination,'index.cjs'),code);
for(const [from,to]of [['license.txt','LICENSE'],['index.d.ts','index.d.ts']])fs.copyFileSync(path.join(path.dirname(packageFile),from),path.join(destination,to),fs.constants.COPYFILE_EXCL);
fs.writeFileSync(path.join(destination,'package.json'),JSON.stringify({name:'@riovoley/deepmerge-hardened',version:'4.3.1-riovoley.1',private:true,description:'Private downstream copy of deepmerge 4.3.1 with a tested prototype-write guard',main:'index.cjs',types:'index.d.ts',license:'MIT',files:['index.cjs','index.d.ts','LICENSE','ORIGIN.json','README.md']},null,2)+'\n');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const locked=JSON.parse(fs.readFileSync(path.join(h.root,'package-lock.json'))).packages['node_modules/deepmerge'];
const provenance={upstream:{name:original.name,version:original.version,url:'https://github.com/TehShrike/deepmerge',registryTarball:locked.resolved,registryIntegrity:locked.integrity,cjsSha256:sha(source)},downstream:{name:'@riovoley/deepmerge-hardened',version:'4.3.1-riovoley.1',cjsSha256:sha(code),private:true},changes:['Reject __proto__ keys in both target and source copy loops','Define own data properties without invoking inherited setters'],upstreamReleaseClaimed:false,registryAuditCoversLocalCode:false};
fs.writeFileSync(path.join(destination,'ORIGIN.json'),JSON.stringify(provenance,null,2)+'\n');
h.write('seguridad/procedencia-deepmerge.json',provenance);
console.log(JSON.stringify({created:'vendor/deepmerge',upstream:original.version,downstream:'4.3.1-riovoley.1',registryAuditCoversLocalCode:false}));
