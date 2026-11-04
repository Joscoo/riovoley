'use strict';
// Android's ip command can retain a directly connected emulator subnet when
// asked for default routes. Permit only explicit loopback/emulator link routes;
// defaults, gateways, specific public routes and unknown output fail closed.
function assessOfflineRoutes(ipv4,ipv6){
 if(typeof ipv4!=='string'||typeof ipv6!=='string')return {safe:false,invalidInput:true};
 const lines=s=>s.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),v4=lines(ipv4),v6=lines(ipv6);
 function allowed(line,family){
  if(/\bvia\b/.test(line))return false;
  const match=line.match(/^(\S+) dev (wlan0|eth0|lo)(?:\s|$)/);if(!match)return false;
  const [,prefix,device]=match;
  if(device==='lo')return family===4?['127.0.0.0/8','127.0.0.1'].includes(prefix):prefix==='::1';
  return family===4?prefix==='10.0.2.0/24'&&/\bscope link\b/.test(line):prefix==='fe80::/64';
 }
 const rejected=v4.filter(x=>!allowed(x,4)).length+v6.filter(x=>!allowed(x,6)).length;
 return {safe:rejected===0,ipv4RouteCount:v4.length,ipv6RouteCount:v6.length,rejectedRouteCount:rejected};
}
module.exports={assessOfflineRoutes};
