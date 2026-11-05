param()
$ErrorActionPreference = 'Stop'
$names = @('RIOVOLEY_RESTORE_PASSPHRASE','NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')
$prior = @{}; foreach ($name in $names) { $prior[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
$secret = $null
try {
  Write-Host 'Desbloqueo local de la copia cifrada existente. No solicita la contrasena de PostgreSQL.'
  $secret = Read-Host 'Frase de recuperacion que elegiste al crear el respaldo' -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try { [Environment]::SetEnvironmentVariable('RIOVOLEY_RESTORE_PASSPHRASE',[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer),'Process') }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
  foreach ($name in @('NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')) { [Environment]::SetEnvironmentVariable($name,$null,'Process') }
  & node (Join-Path $PSScriptRoot 'unlock-restore.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'El desbloqueo no termino. Comunica solo el codigo de etapa; no envies la frase.' }
  Write-Host 'Clave desbloqueada localmente y diagnosticos cifrados revisados. Comunica que termino.'
}
finally {
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$prior[$name],'Process') }
  if ($null -ne $secret) { $secret.Dispose() }
}
