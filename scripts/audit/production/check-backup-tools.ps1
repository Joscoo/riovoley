param()
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../..'))
$tokens = $null; $parseErrors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $workspace 'scripts/production/backup-assistant.ps1'),[ref]$tokens,[ref]$parseErrors)
if (@($parseErrors).Count -ne 0) { throw 'PowerShell parse failed' }
$hidden = @($ast.FindAll({param($n) $n -is [System.Management.Automation.Language.CommandAst] -and $n.GetCommandName() -eq 'Read-Host' -and $n.Extent.Text -match 'AsSecureString'},$true)).Count
if ($hidden -ne 3 -or @($ast.ParamBlock.Parameters).Count -ne 0) { throw 'Unexpected assistant input contract' }
$pgDir = Join-Path $workspace '.e2e-local/backup-tools/postgres17'
$dumpVersion = & (Join-Path $pgDir 'pg_dump.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'pg_dump unavailable' }
$restoreVersion = & (Join-Path $pgDir 'pg_restore.exe') --version
if ($LASTEXITCODE -ne 0) { throw 'pg_restore unavailable' }
$gpgVersion = (& 'C:/Program Files/Git/usr/bin/gpg.exe' --version | Select-Object -First 1)
if ($LASTEXITCODE -ne 0) { throw 'gpg unavailable' }
$nodeVersion = & node --version
$npmVersion = & npm.cmd --version
[pscustomobject]@{checkedAt=[DateTime]::UtcNow.ToString('o'); PowerShell=$PSVersionTable.PSVersion.ToString(); OS=[Environment]::OSVersion.VersionString; Node=$nodeVersion; npm=$npmVersion; pg_dump=$dumpVersion; pg_restore=$restoreVersion; gpg=$gpgVersion; parseErrors=0; hiddenInputPrompts=$hidden; credentialsRequested=$false; institutionalConnectionAttempted=$false} | ConvertTo-Json
