const a=require('./auditar.cjs');
const fs=require('fs');
const path=require('path');
(async()=>{
  await a.run('herramientas-sistema-inline','powershell.exe',['-NoProfile','-Command',fs.readFileSync(path.join(a.out,'entorno.ps1'),'utf8')]);
  const server=JSON.parse(fs.readFileSync(path.join(a.out,'e2e/servidor.json')));
  const script='$auditProcess = Get-CimInstance Win32_Process -Filter "ProcessId = '+server.pid+'"; if ($auditProcess -and $auditProcess.CommandLine -like "*servidor-local.cjs*") { Stop-Process -Id '+server.pid+'; Write-Output "Servidor local de auditoria detenido" } else { Write-Output "Servidor de auditoria ya no activo con ese PID; no se detuvo otro proceso" }';
  await a.run('e2e/servidor-cierre','powershell.exe',['-NoProfile','-Command',script]);
})();
