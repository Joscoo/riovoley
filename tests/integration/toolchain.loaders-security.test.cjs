const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const webpack=require('webpack');
const scratch=()=>{
 const dir=path.resolve(__dirname,'../../.e2e-local/toolchain-fixtures');
 fs.mkdirSync(dir,{recursive:true});return fs.mkdtempSync(path.join(dir,'run-'));
};

// WDS 6 removed SockJS/UUID. Keep their historical results in the evidence,
// and verify the transport actually used now instead of restoring dead code.
async function withSocket(limit,callback){
 const WS=createRequire(require.resolve('webpack-dev-server'))('ws');
 const server=new WS.WebSocketServer({host:'127.0.0.1',port:0,maxPayload:limit});
 server.on('connection',socket=>{socket.on('error',()=>{});socket.on('message',data=>socket.send(data.toString()));});
 await new Promise((resolve,reject)=>{server.once('listening',resolve);server.once('error',reject);});
 const client=new WS('ws://127.0.0.1:'+server.address().port);
 try{await new Promise((resolve,reject)=>{client.once('open',resolve);client.once('error',reject);});await callback(client);}
 finally{client.terminate();for(const socket of server.clients)socket.terminate();await new Promise(resolve=>server.close(resolve));}
}

test('WebSocket del servidor conserva intercambio real de texto y cierre normal',{timeout:5000},async()=>{
 await withSocket(128,async client=>{
  const message=new Promise((resolve,reject)=>{client.once('message',data=>resolve(data.toString()));client.once('error',reject);});
  client.send('toolchain-fixture');assert.equal(await message,'toolchain-fixture');
  const closed=new Promise(resolve=>client.once('close',resolve));client.close(1000);assert.equal(await closed,1000);
 });
});

test('WebSocket del servidor rechaza un mensaje que supera el límite configurado',{timeout:5000},async()=>{
 await withSocket(8,async client=>{const closed=new Promise(resolve=>client.once('close',resolve));client.send('123456789');assert.equal(await closed,1009);});
});

test('SVGO del cargador SVG elimina enlaces ejecutables con namespace y tabulador codificado',async()=>{
 const loaderRequire=createRequire(require.resolve('@svgr/webpack'));
 const svgo=createRequire(loaderRequire.resolve('@svgr/plugin-svgo'))('svgo');
 const svg='<svg xmlns="http://www.w3.org/2000/svg" xmlns:s="http://www.w3.org/2000/svg"><s:a href="javascript:alert(1)"><text>A</text></s:a><a href="java&#9;script:alert(1)"><text>B</text></a></svg>';
 const result=typeof svgo==='function'
  ? await new svgo({plugins:[{removeScriptElement:true}]}).optimize(svg)
  : svgo.optimize(svg,{plugins:['removeScriptElement']});
 assert.doesNotMatch(result.data,/java(?:[\t\n\r]|&#(?:9|10|13);)*script:/i);
});

test('SVG conserva ReactComponent, título, ref, viewBox y URL de archivo con las opciones CRA',async()=>{
 const dir=scratch();
 fs.writeFileSync(path.join(dir,'entry.js'),"export { ReactComponent, default } from './fixture.svg';");
 fs.writeFileSync(path.join(dir,'fixture.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>');
 const output=path.join(dir,'out');
 const compiler=webpack({mode:'production',target:'node',context:dir,entry:'./entry.js',externals:{react:'commonjs '+require.resolve('react')},output:{path:output,filename:'bundle.cjs',publicPath:'/',library:{type:'commonjs2'}},module:{rules:[{test:/\.svg$/,use:[{loader:require.resolve('@svgr/webpack'),options:{prettier:false,svgo:false,svgoConfig:{plugins:[{removeViewBox:false}]},titleProp:true,ref:true}},{loader:require.resolve('file-loader'),options:{name:'static/media/[name].[hash].[ext]'}}]}]}});
 try{
  const stats=await new Promise((resolve,reject)=>compiler.run((e,s)=>e?reject(e):resolve(s)));
  assert.equal(stats.hasErrors(),false,stats.toString({all:false,errors:true}));
  const built=require(path.join(output,'bundle.cjs'));
  assert.match(built.default,/^\/static\/media\/fixture\.[a-f0-9]+\.svg$/);
  assert.equal(typeof built.ReactComponent.render,'function');
  const markup=require('react-dom/server').renderToStaticMarkup(require('react').createElement(built.ReactComponent,{title:'Fixture técnico',id:'fixture-svg'}));
  assert.match(markup,/viewBox="0 0 24 24"/);assert.match(markup,/Fixture técnico/);assert.match(markup,/id="fixture-svg"/);
 }finally{await new Promise((resolve,reject)=>compiler.close(e=>e?reject(e):resolve()));}
});

test('PostCSS del resolvedor CSS no incorpora contenido de un mapa absoluto sin from',async()=>{
 const postcss=createRequire(require.resolve('resolve-url-loader'))('postcss');
 const dir=scratch(),file=path.join(dir,'fixture.map'),marker='SYNTHETIC_MAP_ONLY_20261030';
 fs.writeFileSync(file,JSON.stringify({version:3,file:'fixture.css',sources:['fixture.scss'],sourcesContent:[marker],names:[],mappings:'AAAA'}));
 const result=await postcss([]).process('a{}\n/*# sourceMappingURL='+file.replaceAll('\\','/')+' */',{map:{inline:false}});
 const content=JSON.stringify(result.map?.toJSON()||{});
 assert.equal(content.includes(marker),false);
});

test('Resolve URL Loader conserva CSS, URL de recurso y mapa con las opciones existentes',async()=>{
 const dir=scratch(),file=path.join(dir,'fixture.css'),asset=path.join(dir,'asset.png');
 fs.writeFileSync(asset,Buffer.from([0]));
 const css='.fixture { background: url("./asset.png?size=1#fragment"); }';
 const {SourceMapGenerator}=require('source-map'),generator=new SourceMapGenerator({file});
 generator.addMapping({generated:{line:1,column:0},original:{line:1,column:0},source:file});generator.setSourceContent(file,css);
 const result=await new Promise((resolve,reject)=>{
  const options={sourceMap:true};
  const context={context:dir,resourcePath:file,query:options,sourceMap:true,fs,cacheable(){},getOptions(){return options;},emitWarning(){},emitError:reject,async(){return (e,content,map)=>e?reject(e):resolve({content,map});}};
  require('resolve-url-loader').call(context,css,generator.toJSON());
 });
 assert.match(result.content,/asset\.png\?size=1#fragment/);assert.ok(result.map);assert.ok(result.map.sourcesContent.includes(css));
});

test('Middleware sirve el bundle y rechaza escapar del directorio con publicPath sin barra final',async()=>{
 const dir=scratch();fs.writeFileSync(path.join(dir,'entry.js'),'module.exports=42;');
 const output=path.join(dir,'out'),compiler=webpack({mode:'development',context:dir,entry:'./entry.js',output:{path:output,filename:'main.js',publicPath:'/assets'}});
 const createMiddleware=createRequire(require.resolve('webpack-dev-server'))('webpack-dev-middleware');
 const middleware=createMiddleware(compiler,{publicPath:'/assets',stats:false});
 try{
  const stats=await new Promise(resolve=>middleware.waitUntilValid(resolve));
  assert.equal(stats.hasErrors(),false);
  middleware.context.outputFileSystem.writeFileSync(path.join(dir,'outside.txt'),'SYNTHETIC_OUTSIDE_ONLY');
  // Middleware 8 returns a descriptor, not the previous filename string.
  // Comparing the complete descriptor formats a cyclic compiler/filesystem graph.
  const resolved=await middleware.getFilenameFromUrl('/assets/main.js');
  assert.equal(resolved.filename,path.join(output,'main.js'));
  await assert.rejects(middleware.getFilenameFromUrl('/assets../outside.txt'),error=>error.statusCode===403);
 }finally{
  await new Promise((resolve,reject)=>middleware.close(e=>e?reject(e):resolve()));
  await new Promise((resolve,reject)=>compiler.close(e=>e?reject(e):resolve()));
 }
});
