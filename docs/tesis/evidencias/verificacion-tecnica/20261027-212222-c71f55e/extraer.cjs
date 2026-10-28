const {write, out} = require('./auditar.cjs');
const fs=require('fs');
const path=require('path');
function mcp(file) {
  const source=JSON.parse(fs.readFileSync(path.join(out,file),'utf8'));
  let obj=JSON.parse(source.result.content.find(c=>c.type==='text').text);
  if(typeof obj.result==='string') {
    const match=obj.result.match(/<untrusted-data-[^>]+>\s*(\[[\s\S]*?)\s*<\/untrusted-data-/);
    if(match) return JSON.parse(match[1]);
  }
  return obj.result || obj;
}
const catalog=mcp('seguridad/catalogos-rls.mcp.json')[0].catalog;
write('seguridad/catalogos-rls.json',catalog);
const advisors=mcp('seguridad/asesores.mcp.json');
write('seguridad/asesores.json',advisors);
const functions=mcp('seguridad/funciones-permisos.mcp.json');
write('seguridad/funciones-permisos.json',functions);
if(require.main===module) console.log(JSON.stringify({tables:catalog.tables.length,withoutRls:catalog.tables.filter(t=>!t.rls),focus:catalog.policies.filter(p=>['xp_ledger','login_rewards'].includes(p.tablename)),advisorGroups:advisors.lints.map(l=>({name:l.name,count:l.count,level:l.level})),publicDefiners:catalog.definer_functions.filter(f=>f.schema==='public'&&f.anon_execute).map(f=>f.name),functions:functions.map(f=>({name:f.function_name,args:f.arguments,definition:f.definition})),publicViews:catalog.views.length,viewsWithoutInvoker:catalog.views.filter(v=>!v.options?.includes('security_invoker=true')).map(v=>v.name)},null,2));
module.exports={mcp,catalog,advisors,functions};
