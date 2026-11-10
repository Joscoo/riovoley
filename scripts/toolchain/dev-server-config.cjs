'use strict';
const {createRequire}=require('node:module');
const path=require('node:path');

function adaptDevServerConfig(legacy,options={}){
 const host=options.host||'127.0.0.1';
 if(!['localhost','127.0.0.1','::1','[::1]'].includes(host))throw new Error('El servidor de desarrollo requiere un host loopback');
 const port=Number(options.port||3000);
 if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Puerto de desarrollo inválido');
 const {https,onBeforeSetupMiddleware:before,onAfterSetupMiddleware:after,setupMiddlewares:setup,proxy,...rest}=legacy;
 const server=rest.server||{type:https?'https':'http',...(https&&typeof https==='object'?{options:https}:{})};
 const tls=server==='https'||server==='spdy'||['https','spdy'].includes(server.type);
 const origin=(tls?'https':'http')+'://'+(host.includes(':')?'[::1]':host)+':'+port;
 const result={...rest,host:host==='[::1]'?'::1':host,server,allowedHosts:['localhost','127.0.0.1','[::1]'],headers:{...rest.headers,'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, HEAD, OPTIONS','Access-Control-Allow-Headers':'Content-Type'}};
 if(proxy!==undefined){result.proxy=Array.isArray(proxy)?proxy:Object.entries(proxy).map(([context,config])=>({context:[context],...(typeof config==='string'?{target:config}:config)}));}
 result.setupMiddlewares=(middlewares,devServer)=>{
  if(!devServer?.app)throw new Error('Falta la aplicación del servidor de desarrollo');
  before?.(devServer);
  const configured=setup?setup(middlewares,devServer):middlewares;
  if(!Array.isArray(configured))throw new Error('setupMiddlewares debe devolver un array');
  if(!after)return configured;
  const express=createRequire(require.resolve('webpack-dev-server'))('express');
  const router=express.Router(),afterServer=Object.create(devServer);
  Object.defineProperty(afterServer,'app',{value:router});
  after(afterServer);
  return [...configured,{name:'cra-after-middlewares',middleware:router}];
 };
 return result;
}

function installCraLifecycleCompatibility(Server){
 if(typeof Server.prototype.startCallback!=='function')Server.prototype.startCallback=function(callback){const operation=this.start();operation.then(()=>callback(),callback);return operation;};
 if(typeof Server.prototype.close!=='function')Server.prototype.close=function(callback){const operation=this.stop();if(callback)operation.then(()=>callback(),callback);return operation;};
}

function adaptWebpackConfig(config){
 const clientModules=path.resolve(path.dirname(require.resolve('webpack-dev-middleware')),'../client/modules');
 const rules=config.module.rules.map(rule=>rule.oneOf?{...rule,oneOf:[{test:/\.cjs$/,include:clientModules,type:'javascript/auto'},...rule.oneOf]}:rule);
 return {...config,module:{...config.module,rules}};
}
module.exports={adaptDevServerConfig,installCraLifecycleCompatibility,adaptWebpackConfig};
