param()
$ErrorActionPreference = 'Stop'
$backupWorkspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$previousLocation = Get-Location
$names = @('RIOVOLEY_DATABASE_PASSWORD','RIOVOLEY_BACKUP_PASSPHRASE','NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')
$priorValues = @{}
foreach ($name in $names) { $priorValues[$name] = [Environment]::GetEnvironmentVariable($name,'Process') }
function Read-PlainSecret([Security.SecureString]$secret) {
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
  try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
$databaseSecret = $null; $recoverySecret = $null; $confirmationSecret = $null
try {
  Set-Location -LiteralPath $backupWorkspace
  Write-Host 'RIOVOLEY: copia PostgreSQL cifrada; sin cambios de esquema o registros.'
  Write-Host 'La copia SQL no incluye los archivos de Storage ni sustituye el ensayo de restauracion.'
  Write-Host 'Guarda la frase de recuperacion en tu gestor privado; no se mostrara ni se guardara en registros.'
  $databaseSecret = Read-Host 'Contrasena ACTUAL de PostgreSQL (no la del usuario RIOVOLEY)' -AsSecureString
  $recoverySecret = Read-Host 'Nueva frase para proteger la clave del respaldo (minimo 20 caracteres)' -AsSecureString
  $confirmationSecret = Read-Host 'Repite la frase de recuperacion' -AsSecureString
  $first = Read-PlainSecret $recoverySecret
  $second = Read-PlainSecret $confirmationSecret
  if ($first.Length -lt 20 -or $first -cne $second) { throw 'La frase es demasiado corta o no coincide.' }
  [Environment]::SetEnvironmentVariable('RIOVOLEY_DATABASE_PASSWORD',(Read-PlainSecret $databaseSecret),'Process')
  [Environment]::SetEnvironmentVariable('RIOVOLEY_BACKUP_PASSPHRASE',$first,'Process')
  foreach ($name in @('NODE_OPTIONS','NODE_DEBUG','NODE_DEBUG_NATIVE')) { [Environment]::SetEnvironmentVariable($name,$null,'Process') }
  $first = $null; $second = $null
  Write-Host 'Validando destino y creando copia cifrada. Puede tardar varios minutos.'
  & node (Join-Path $PSScriptRoot 'backup.cjs') --create
  if ($LASTEXITCODE -ne 0) { throw 'El respaldo no termino. Conserva el recibo y comunica solo el codigo de etapa, sin contrasenas.' }
  Write-Host 'Archivo cifrado verificado. Custodia recovery-key.asc por separado con su frase.'
  Write-Host 'Sigue pendiente restaurar la copia en un destino aislado y respaldar los objetos Storage.'
}
finally {
  foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name,$priorValues[$name],'Process') }
  foreach ($secret in @($databaseSecret,$recoverySecret,$confirmationSecret)) { if ($null -ne $secret) { $secret.Dispose() } }
  Set-Location -LiteralPath $previousLocation.Path
}
