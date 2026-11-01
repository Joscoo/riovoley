param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$request = [Console]::In.ReadToEnd() | ConvertFrom-Json
$cipher = [IO.File]::ReadAllBytes($request.artifact)
$clear = [Security.Cryptography.ProtectedData]::Unprotect($cipher, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
try {
    $payload = [Text.Encoding]::UTF8.GetString($clear) | ConvertFrom-Json
    if ($payload.project -cne 'mayvvlkvheagkojunzzb' -or $payload.name -cne 'REPORTS_SCHEDULER_SECRET') { throw 'PRIVATE_PAYLOAD_IDENTITY_MISMATCH' }
    $sha = [Security.Cryptography.SHA256]::Create()
    try { $digest = ([BitConverter]::ToString($sha.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload.value)))).Replace('-', '').ToLowerInvariant() } finally { $sha.Dispose() }
    $matches = $digest -ceq $request.expectedDigest
    $issues = @()
    foreach ($file in $request.scanFiles) {
        $body = [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($file))
        if ($body.Contains($payload.value)) { $issues += $file }
    }
    [Console]::Out.Write((@{ dpapiArtifactRecovered = $true; identityMatches = $true; digestMatchesCurrent = $matches; scanFiles = @($request.scanFiles).Count; issueFiles = $issues; cleartextPublished = $false; digestPublished = $false } | ConvertTo-Json -Compress))
} finally {
    [Array]::Clear($clear, 0, $clear.Length)
    $payload = $null
    $digest = $null
}
