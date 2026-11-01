param()
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$cli = Join-Path $workspace '.e2e-local/tools/node_modules/@supabase/cli-windows-x64/bin/supabase.exe'
$inspector = Join-Path $workspace 'scripts/audit/production/inspect-edge-secret-names.cjs'
Write-Host 'Consulta de configuracion: sin aplicar SQL, secretos o despliegues.'
& node $inspector --probe
if ($LASTEXITCODE -eq 2) {
  Write-Host 'La CLI requiere iniciar sesion. Sigue su enlace en el navegador con la cuenta del proyecto Riovoley.'
  Write-Host 'No copies tokens, codigos de verificacion o URLs de acceso al chat.'
  & $cli login
  if ($LASTEXITCODE -ne 0) { throw 'No se completo la autenticacion local de la CLI.' }
} elseif ($LASTEXITCODE -ne 0) { throw 'No se pudo comprobar la cuenta. Comunica solo el codigo de etapa.' }
& node $inspector
if ($LASTEXITCODE -ne 0) { throw 'La consulta no termino. Comunica solo el codigo de etapa; no envies salidas sensibles.' }
Write-Host 'Metadatos de configuracion comprobados; no se modificaron secretos o configuraciones.'
