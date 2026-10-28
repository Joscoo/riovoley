[System.Environment]::OSVersion.VersionString
$PSVersionTable.PSVersion.ToString()
Get-Date -Format o
foreach ($auditTool in 'adb','sdkmanager','emulator','gradle','supabase','deno','psql') {
    if (Get-Command $auditTool -ErrorAction SilentlyContinue) {
        Write-Output ($auditTool + ': disponible')
    } else {
        Write-Output ($auditTool + ': ausente en PATH')
    }
}
