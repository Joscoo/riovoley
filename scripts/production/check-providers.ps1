param([ValidateSet('All','Resend')][string]$Provider = 'All')
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
function Read-PrivateValue([string]$label) {
    $secure = Read-Host $label -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
Write-Host 'Validacion sin entrega: solo lectura Resend, OAuth y FCM validate_only=true.'
Write-Host 'Usa las credenciales EXISTENTES; no genera claves ni modifica Supabase o permisos.'
$names = @('RIOVOLEY_VERIFY_RESEND_KEY','RIOVOLEY_VERIFY_FROM_EMAIL','RIOVOLEY_VERIFY_FCM_PROJECT','RIOVOLEY_VERIFY_FCM_EMAIL','RIOVOLEY_VERIFY_FCM_PRIVATE_KEY')
$previous = @{}
$checkExit = 1
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
try {
    $env:RIOVOLEY_VERIFY_RESEND_KEY = Read-PrivateValue 'RESEND_API_KEY actual'
    $env:RIOVOLEY_VERIFY_FROM_EMAIL = Read-PrivateValue 'FROM_EMAIL actual, incluido nombre visible si lo tiene'
    if ($Provider -eq 'All') {
    $accountPath = (Read-Host 'Ruta local al JSON EXISTENTE de cuenta de servicio Firebase (no google-services.json)').Trim().Trim('"')
    if (-not $accountPath -or $accountPath.Length -gt 1024 -or $accountPath.TrimStart().StartsWith('{')) { throw 'SERVICE_ACCOUNT_JSON_PATH_REQUIRED' }
    if (-not [IO.File]::Exists($accountPath)) { throw 'SERVICE_ACCOUNT_JSON_NOT_FOUND' }
    if (([IO.FileInfo]$accountPath).Length -gt 65536) { throw 'SERVICE_ACCOUNT_JSON_TOO_LARGE' }
    $account = [IO.File]::ReadAllText($accountPath) | ConvertFrom-Json
    if ($account.type -cne 'service_account' -or -not $account.project_id -or -not $account.client_email -or -not $account.private_key) { throw 'SERVICE_ACCOUNT_JSON_FIELDS_REQUIRED' }
    $env:RIOVOLEY_VERIFY_FCM_PROJECT = $account.project_id
    $env:RIOVOLEY_VERIFY_FCM_EMAIL = $account.client_email
    $env:RIOVOLEY_VERIFY_FCM_PRIVATE_KEY = $account.private_key
    }
    if ($Provider -eq 'Resend') { & node (Join-Path $workspace 'scripts/production/check-providers.cjs') --validate-only --resend-only }
    else { & node (Join-Path $workspace 'scripts/production/check-providers.cjs') --validate-only }
    $checkExit = $LASTEXITCODE
    if ($checkExit -eq 0) { Write-Host ('Validacion del alcance ' + $Provider + ' aprobada; no acredita entrega a destinatarios.') }
    elseif ($checkExit -eq 2) { Write-Host 'Comprobacion bloqueada por coincidencia de configuracion o alcance de lectura. No se cambiaron claves.' }
    else { Write-Host 'Comprobacion no aprobada; comunica solo el estado o codigo de etapa, nunca claves o archivos.' }
} catch {
    [Console]::Error.WriteLine('{"stage":"PROVIDER_LOCAL_INPUT_FAILED","rawDiagnosticsPublished":false}')
    $checkExit = 1
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
    $account = $null
    $receipt = @{ finishedAt = [DateTime]::UtcNow.ToString('o'); nodeExitCode = $checkExit; secretValuesRecorded = $false; rawDiagnosticsPublished = $false }
    [IO.File]::WriteAllText((Join-Path $workspace ('.e2e-local/provider-assistant-' + [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds() + '.json')), ($receipt | ConvertTo-Json -Compress))
}
exit $checkExit
