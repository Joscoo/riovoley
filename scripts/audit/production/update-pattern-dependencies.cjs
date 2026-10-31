const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
for(const folder of ['.','functions','riovoley']){
 const file=path.join(root,folder,'package.json'),p=JSON.parse(fs.readFileSync(file));
 const vendor=folder==='.'?'file:vendor/':'file:../vendor/';
 delete p.dependencies['@riovoley/minimatch-compat'];
 p.dependencies.minimatch=vendor+'minimatch-compat';
 p.dependencies['@riovoley/minimatch-engine']='npm:minimatch@11.0.3';
 p.overrides={...p.overrides,minimatch:'$minimatch','glob@>=9.0.0 <14.0.2':'14.0.3'};
 if(folder==='.'){
  delete p.dependencies['@riovoley/deepmerge-hardened'];
  p.dependencies.deepmerge='file:vendor/deepmerge';
  p.overrides.deepmerge='$deepmerge';
  if(!p.scripts['test:toolchain'].includes('toolchain.patterns.test.cjs'))p.scripts['test:toolchain']+=' tests/integration/toolchain.patterns.test.cjs';
 }
 fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
}
