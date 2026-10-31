const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const load=()=>require('../../scripts/toolchain/dev-server-config.cjs');

test('Dev server adapta opciones antiguas y restringe host/CORS sin mutar la configuración original',()=>{
 const legacy={https:false,host:'0.0.0.0',allowedHosts:'all',headers:{'Access-Control-Allow-Origin':'*',Custom:'kept'},onBeforeSetupMiddleware(){},onAfterSetupMiddleware(){}};
 const out=load().adaptDevServerConfig(legacy,{host:'127.0.0.1',port:6101});
 assert.equal(out.https,undefined);assert.equal(out.onBeforeSetupMiddleware,undefined);assert.equal(out.onAfterSetupMiddleware,undefined);
 assert.equal(out.server.type,'http');assert.equal(out.host,'127.0.0.1');assert.deepEqual(out.allowedHosts,['localhost','127.0.0.1','[::1]']);
 assert.equal(out.headers['Access-Control-Allow-Origin'],'http://127.0.0.1:6101');assert.equal(out.headers.Custom,'kept');
 assert.equal(legacy.allowedHosts,'all');assert.equal(legacy.headers['Access-Control-Allow-Origin'],'*');
});

test('Dev server conserva TLS explícito en la opción server actual',()=>{
 const https={key:Buffer.from('synthetic-key'),cert:Buffer.from('synthetic-certificate')};
 const out=load().adaptDevServerConfig({https},{host:'localhost',port:3000});
 assert.equal(out.server.type,'https');assert.equal(out.server.options,https);assert.equal(out.headers['Access-Control-Allow-Origin'],'https://localhost:3000');
});

test('Dev server mantiene orden before, middleware normal y after en HTTP real',async()=>{
 const express=require('express'),app=express();
 const out=load().adaptDevServerConfig({onBeforeSetupMiddleware(server){server.app.use((req,_res,next)=>{req.order=['before'];next();});},onAfterSetupMiddleware(server){server.app.use((req,res)=>{req.order.push('after');res.json(req.order);});}},{host:'127.0.0.1',port:3000});
 const normal={name:'normal',middleware(req,_res,next){req.order.push('normal');next();}};
 for(const item of out.setupMiddlewares([normal],{app}))app.use(item.middleware||item);
 const server=http.createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{const response=await fetch('http://127.0.0.1:'+server.address().port);assert.deepEqual(await response.json(),['before','normal','after']);}
 finally{await new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}
});

test('Dev server conserva una función setupMiddlewares preexistente',()=>{
 const app=require('express')(),seen=[];
 const out=load().adaptDevServerConfig({onBeforeSetupMiddleware(){seen.push('before');},setupMiddlewares(items){seen.push('setup');return [...items,{name:'custom',middleware(){}}];},onAfterSetupMiddleware(){seen.push('after');}},{host:'127.0.0.1',port:3000});
 const result=out.setupMiddlewares([],{app});assert.deepEqual(seen,['before','setup','after']);assert.equal(result[0].name,'custom');assert.equal(result.length,2);
});

test('Dev server convierte mapas proxy y conserva arrays ya modernos',()=>{
 const adapt=load().adaptDevServerConfig;
 const out=adapt({proxy:{'/api':{target:'http://127.0.0.1:55321',ws:true}}},{host:'127.0.0.1',port:3000});
 assert.deepEqual(out.proxy,[{context:['/api'],target:'http://127.0.0.1:55321',ws:true}]);
 const modern=[{context:['/api'],target:'http://127.0.0.1:55321'}];assert.equal(adapt({proxy:modern},{host:'127.0.0.1',port:3000}).proxy,modern);
});

test('Dev server rechaza un host público o comodín en el perfil local',()=>{
 for(const host of ['0.0.0.0','example.org','192.168.1.2'])assert.throws(()=>load().adaptDevServerConfig({}, {host,port:3000}),/loopback/i);
});

test('Compatibilidad CRA traduce close a stop y startCallback a start sin alterar API existentes',async()=>{
 class Modern{async start(){this.started=true;}async stop(){this.stopped=true;}}
 load().installCraLifecycleCompatibility(Modern);const instance=new Modern();
 await new Promise((resolve,reject)=>instance.startCallback(e=>e?reject(e):resolve()));assert.equal(instance.started,true);
 await instance.close();assert.equal(instance.stopped,true);
 class Existing{close(){return 'original';}startCallback(){return 'original';}}
 const close=Existing.prototype.close,start=Existing.prototype.startCallback;load().installCraLifecycleCompatibility(Existing);assert.equal(Existing.prototype.close,close);assert.equal(Existing.prototype.startCallback,start);
});

test('Dev server preserva opciones modernas y elimina proxy ausente',()=>{
 const out=load().adaptDevServerConfig({hot:true,devMiddleware:{publicPath:'/'},proxy:undefined},{host:'localhost',port:3000});
 assert.equal(out.hot,true);assert.deepEqual(out.devMiddleware,{publicPath:'/'});assert.equal(Object.hasOwn(out,'proxy'),false);
});

test('CRA conserva módulos CommonJS del cliente HMR y permite su importación nominal',async()=>{
 const fs=require('node:fs'),path=require('node:path'),webpack=require('webpack');
 const root=path.resolve(__dirname,'../../.e2e-local/toolchain-fixtures');fs.mkdirSync(root,{recursive:true});
 const dir=fs.mkdtempSync(path.join(root,'cra-cjs-'));
 const middlewareRoot=path.resolve(path.dirname(require.resolve('webpack-dev-middleware')),'..');
 const logger=path.join(middlewareRoot,'client/modules/logger/Logger.cjs');
 fs.writeFileSync(path.join(dir,'entry.mjs'),'import { Logger } from '+JSON.stringify(logger.replaceAll('\\','/'))+'; export const actual = typeof Logger;');
 const original={mode:'development',target:'node',context:dir,entry:'./entry.mjs',output:{path:path.join(dir,'out'),filename:'result.cjs',library:{type:'commonjs2'}},module:{rules:[{oneOf:[{test:/\.(js|mjs)$/,type:'javascript/auto'},{exclude:[/^$/,/\.html$/,/\.json$/],type:'asset/resource'}]}]}};
 const config=load().adaptWebpackConfig(original);
 assert.equal(original.module.rules[0].oneOf.length,2);
 const compiler=webpack(config);
 try{
  const stats=await new Promise((resolve,reject)=>compiler.run((e,s)=>e?reject(e):resolve(s)));
  assert.equal(stats.hasErrors(),false,stats.toString({all:false,errors:true}));
  assert.equal(require(path.join(dir,'out/result.cjs')).actual,'function');
 }finally{await new Promise((resolve,reject)=>compiler.close(e=>e?reject(e):resolve()));}
});
