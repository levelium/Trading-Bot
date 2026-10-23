# Install Auto-Start Scheduled Task for FvgGold AI Trader on Windows VPS
$ErrorActionPreference = 'Stop'
$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bat = Join-Path $serviceDir 'start_service.bat'

if (-not (Test-Path (Join-Path $serviceDir '.env'))) {
    throw 'Missing .env. Copy .env.example to .env and configure AI_SERVICE_TOKEN before installing autostart.'
}

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$bat`"" -WorkingDirectory $serviceDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask -TaskName 'FvgGold AI Service' -Action $action -Trigger $trigger -Settings $settings -Description 'FvgGold AI Trader approval service for MetaTrader 5' -Force | Out-Null
Write-Host '[SUCCESS] Scheduled task "FvgGold AI Service" registered.' -ForegroundColor Green
Write-Host 'The service will automatically start whenever your Windows VPS user signs in.' -ForegroundColor White
Write-Host 'Ensure your Windows VPS user session remains active for continuous MT5 execution.' -ForegroundColor Yellow
