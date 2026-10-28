const http = require('http');
const fs = require('fs');
const path = require('path');
const {out, root, write} = require('../auditar.cjs');
const build = path.join(root, 'build');
const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.json':'application/json','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  let target=path.resolve(build, '.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!target.startsWith(build+path.sep)) target=path.join(build,'index.html');
  if(!fs.existsSync(target)||fs.statSync(target).isDirectory()) target=path.join(build,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream'});
  fs.createReadStream(target).pipe(res);
});
server.listen(3100,'127.0.0.1',()=>{
  write('e2e/servidor.json',{pid:process.pid,start:new Date().toISOString(),url:'http://127.0.0.1:3100',source:'build/',remoteWrites:false});
  console.log('Servidor estático local disponible en 127.0.0.1:3100');
});
