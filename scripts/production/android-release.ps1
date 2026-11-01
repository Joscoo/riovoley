param()
$ErrorActionPreference = 'Stop'
$names = @('RIOVOLEY_APK_STORE_PASSWORD','RIOVOLEY_APK_KEY_PASSWORD','NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')
$prior = @{}; foreach ($name in $names) { $prior[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
$store = $null; $alias = $null
function Set-SigningInput([string]$name,[Security.SecureString]$secret) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try { [Environment]::SetEnvironmentVariable($name,[Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer),'Process') }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
try {
  Write-Host 'Compilacion release local con el keystore existente; no instala, sube ni publica paquetes.'
  Write-Host 'Estas son las contrasenas de firma Android, no las de PostgreSQL o del respaldo GPG.'
  $store = Read-Host 'Contrasena ACTUAL del keystore' -AsSecureString
  $alias = Read-Host 'Contrasena ACTUAL del alias my-key-alias' -AsSecureString
  Set-SigningInput 'RIOVOLEY_APK_STORE_PASSWORD' $store
  Set-SigningInput 'RIOVOLEY_APK_KEY_PASSWORD' $alias
  foreach ($name in @('NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')) { [Environment]::SetEnvironmentVariable($name,$null,'Process') }
  & node (Join-Path $PSScriptRoot 'android-release.cjs')
  if ($LASTEXITCODE -ne 0) { throw 'La compilacion no termino. Comunica solo el codigo de etapa; los logs se conservaron cifrados.' }
  Write-Host 'APK release firmado y verificado, conservado en el directorio privado. No fue distribuido.'
}
finally {
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$prior[$name],'Process') }
  foreach ($secret in @($store,$alias)) { if ($null -ne $secret) { $secret.Dispose() } }
}
