param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$clearBytes = [Text.Encoding]::UTF8.GetBytes([Console]::In.ReadToEnd())
try {
    $cipherBytes = [Security.Cryptography.ProtectedData]::Protect($clearBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    $recovered = [Security.Cryptography.ProtectedData]::Unprotect($cipherBytes, $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    $matches = [Convert]::ToBase64String($recovered) -ceq [Convert]::ToBase64String($clearBytes)
    if (-not $matches) { throw 'LOCAL_PROTECTION_ROUNDTRIP_FAILED' }
    [Console]::Out.Write((@{ ciphertext = [Convert]::ToBase64String($cipherBytes); roundTripMatches = $matches } | ConvertTo-Json -Compress))
} finally {
    if ($clearBytes) { [Array]::Clear($clearBytes, 0, $clearBytes.Length) }
    if ($recovered) { [Array]::Clear($recovered, 0, $recovered.Length) }
}
