$ErrorActionPreference = 'Stop'
$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$bat = Join-Path $serviceDir 'start_service.bat'
if (-not (Test-Path (Join-Path $serviceDir '.env'))) {
    throw 'Missing .env. Copy .env.example to .env and configure it before installing autostart.'
}
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$bat`"" -WorkingDirectory $serviceDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName 'FvgGold AI Service' -Action $action -Trigger $trigger -Settings $settings -Description 'Local Gemini approval service for FvgGold MT5 EA' -Force | Out-Null
Write-Host 'Scheduled task created. It starts at user logon. Keep the MT5 Windows user session signed in for continuous trading.'
