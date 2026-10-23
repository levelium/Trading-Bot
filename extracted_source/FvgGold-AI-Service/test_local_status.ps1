# Authenticated status test for the local FvgGold AI service.
# Run from PowerShell inside the FvgGold-AI-Service folder.
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) {
    Write-Host 'Missing .env. Copy .env.example to .env and configure it first.' -ForegroundColor Red
    exit 1
}
$tokenLine = Get-Content $envFile | Where-Object { $_ -match '^\s*AI_SERVICE_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine) {
    Write-Host 'AI_SERVICE_TOKEN is missing from .env.' -ForegroundColor Red
    exit 1
}
$token = ($tokenLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
if (-not $token -or $token -match 'REPLACE_|CHANGE_ME|placeholder') {
    Write-Host 'Replace the AI_SERVICE_TOKEN placeholder in .env first.' -ForegroundColor Red
    exit 1
}
$headers = @{ 'X-Service-Token' = $token }
try {
    $result = Invoke-RestMethod -Method Get -Uri 'http://127.0.0.1:8787/status' -Headers $headers -TimeoutSec 5
    $result | ConvertTo-Json -Depth 8
    if ($result.ok -ne $true) { exit 2 }
    Write-Host 'Authenticated status check succeeded.' -ForegroundColor Green
} catch {
    Write-Host "Status check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Check that the Python service is running and that the EA uses the exact same token as .env.' -ForegroundColor Yellow
    exit 1
}
