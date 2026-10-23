<#
.SYNOPSIS
    Comprehensive diagnostic and status check for FvgGold AI Trader service.
    Works for both local Windows VPS (127.0.0.1:8787) and remote Shared Hosting (HTTPS).
.DESCRIPTION
    Tests public /health and authenticated /status endpoints.
    Verifies token presence and formatting.
#>
param (
    [string]$BaseUrl = "http://127.0.0.1:8787"
)

$ErrorActionPreference = 'Stop'
Write-Host "=== FvgGold AI Trader Status & Authentication Diagnostics ===" -ForegroundColor Cyan
Write-Host "Target Endpoint: $BaseUrl" -ForegroundColor Gray

# Step 1: Check .env file
$envFile = Join-Path $PSScriptRoot '.env'
if (-not (Test-Path $envFile)) {
    Write-Host "[FAIL] Missing .env file in $PSScriptRoot" -ForegroundColor Red
    Write-Host "       Copy .env.example to .env and configure AI_SERVICE_TOKEN." -ForegroundColor Yellow
    exit 1
}

$tokenLine = Get-Content $envFile | Where-Object { $_ -match '^\s*AI_SERVICE_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine) {
    Write-Host "[FAIL] AI_SERVICE_TOKEN key is missing from .env." -ForegroundColor Red
    exit 1
}

$token = ($tokenLine -split '=', 2)[1].Trim().Trim('"').Trim("'")
if (-not $token -or $token -match 'REPLACE_|CHANGE_ME|placeholder') {
    Write-Host "[FAIL] AI_SERVICE_TOKEN is still set to placeholder: '$token'" -ForegroundColor Red
    Write-Host "       Generate a secure random token in PowerShell with:" -ForegroundColor Yellow
    Write-Host "       python -c ""import secrets; print(secrets.token_urlsafe(48))""" -ForegroundColor White
    exit 1
}

if ($token.Length -lt 32) {
    Write-Host "[WARN] AI_SERVICE_TOKEN length is $($token.Length) characters. Minimum 32 recommended." -ForegroundColor Yellow
} else {
    Write-Host "[OK] Local token loaded ($($token.Length) characters, prefix: $($token.Substring(0, 4))...)" -ForegroundColor Green
}

# Step 2: Test Public /health (Uptime check without auth)
Write-Host "`nChecking public /health..." -NoNewline
try {
    $healthUri = "$($BaseUrl.TrimEnd('/'))/health"
    $healthRes = Invoke-RestMethod -Method Get -Uri $healthUri -TimeoutSec 5
    Write-Host " [SUCCESS]" -ForegroundColor Green
    Write-Host "  Service: $($healthRes.service) v$($healthRes.version) | Model: $($healthRes.model)" -ForegroundColor Gray
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure Python service is running on $BaseUrl or check firewall / URL." -ForegroundColor Yellow
    exit 1
}

# Step 3: Test Unauthenticated /status (Verify that authentication is active and fails closed)
Write-Host "`nTesting unauthenticated /status call (verifying protection)..." -NoNewline
try {
    $unauthUri = "$($BaseUrl.TrimEnd('/'))/status"
    $unauthRes = Invoke-RestMethod -Method Get -Uri $unauthUri -TimeoutSec 5
    Write-Host " [UNEXPECTED 200 OK]" -ForegroundColor Red
    Write-Host "  WARNING: /status endpoint answered without authentication!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host " [PROTECTED - HTTP 401 as expected]" -ForegroundColor Green
    } else {
        Write-Host " [HTTP $($_.Exception.Response.StatusCode.value__)]" -ForegroundColor Yellow
    }
}

# Step 4: Test Authenticated /status with X-Service-Token
Write-Host "`nTesting authenticated /status with X-Service-Token header..." -NoNewline
$headers = @{
    'X-Service-Token' = $token
    'User-Agent'      = 'FvgGold-Diagnostics/2.2'
}

try {
    $statusUri = "$($BaseUrl.TrimEnd('/'))/status"
    $statusRes = Invoke-RestMethod -Method Get -Uri $statusUri -Headers $headers -TimeoutSec 6
    Write-Host " [SUCCESS]" -ForegroundColor Green
    Write-Host "--------------------------------------------------------" -ForegroundColor Gray
    Write-Host "  Active:              $($statusRes.active)" -ForegroundColor $(if($statusRes.active){"Green"}else{"Yellow"})
    Write-Host "  Status:              $($statusRes.status)" -ForegroundColor White
    Write-Host "  Gemini Keys Active:  $($statusRes.configured_keys)" -ForegroundColor White
    Write-Host "  Database Type:       $($statusRes.database_type)" -ForegroundColor White
    Write-Host "  MT5 Connected:       $($statusRes.mt5_connected_recently) (Age: $($statusRes.heartbeat_age_seconds)s)" -ForegroundColor White
    Write-Host "--------------------------------------------------------" -ForegroundColor Gray
    Write-Host "[SUCCESS] Service is operating and ready for MT5 EA connection!" -ForegroundColor Green
    Write-Host "Ensure the MT5 EA 'AIServiceToken' is set to the exact same token value." -ForegroundColor Cyan
} catch {
    Write-Host " [FAILED]" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
