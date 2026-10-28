const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const {runtime,readLocal}=require('./safety.cjs');
const local=readLocal();
const buildName=local.activeBuild||'web-build';
if(!/^web-build(?:-\d+)?$/.test(buildName)) throw new Error('Directorio de build local inválido');
const base=path.join(runtime,buildName);
if(!fs.existsSync(path.join(base,'index.html'))) throw new Error('Ejecutar primero build.cjs para generar el build local');
const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let file=path.resolve(base,'.'+decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname));
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory()) file=path.join(base,'index.html');
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});
server.listen(6100,'127.0.0.1',()=>console.log('Build E2E local disponible en http://127.0.0.1:6100'));
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
