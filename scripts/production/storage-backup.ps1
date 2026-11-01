param()
$ErrorActionPreference = 'Stop'
$names = @('RIOVOLEY_STORAGE_SERVER_KEY','RIOVOLEY_RESTORE_PASSPHRASE','NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')
$prior = @{}; foreach ($name in $names) { $prior[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
$key = $null; $phrase = $null
function Set-PrivateProcessValue([string]$name,[Security.SecureString]$secret) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try { [Environment]::SetEnvironmentVariable($name,[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer),'Process') }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
try {
  Write-Host 'Respaldo de Storage: solo GET, cifrado y copia de bytes a un contenedor local sin red.'
  Write-Host 'Usa una clave de servidor existente del proyecto Riovoley; no una clave publica ni una contrasena.'
  $key = Read-Host 'Clave service_role o sb_secret del proyecto' -AsSecureString
  $phrase = Read-Host 'Frase de recuperacion elegida al crear el respaldo PostgreSQL' -AsSecureString
  Set-PrivateProcessValue 'RIOVOLEY_STORAGE_SERVER_KEY' $key
  Set-PrivateProcessValue 'RIOVOLEY_RESTORE_PASSPHRASE' $phrase
  foreach ($name in @('NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')) { [Environment]::SetEnvironmentVariable($name,$null,'Process') }
  & node (Join-Path $PSScriptRoot 'storage-backup.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'La copia no termino. Comunica solo el codigo de etapa; no envies claves ni archivos.' }
  Write-Host 'Copia cifrada y recuperacion de bytes comprobadas. No se modificaron objetos institucionales.'
}
finally {
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$prior[$name],'Process') }
  foreach ($secret in @($key,$phrase)) { if ($null -ne $secret) { $secret.Dispose() } }
}
