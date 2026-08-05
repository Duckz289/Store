[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $workspaceRoot

if (-not (Test-Path -LiteralPath (Join-Path $workspaceRoot ".env"))) {
  throw "Local configuration is missing. Run ./scripts/setup-local.ps1 first."
}

docker compose --env-file .env up -d postgres
if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL could not be started."
}

$logDirectory = Join-Path $workspaceRoot ".local"
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$corepack = (Get-Command corepack.cmd).Source
$backendPort = Get-NetTCPConnection -State Listen -LocalPort 9000 -ErrorAction SilentlyContinue
if (-not $backendPort) {
  $backend = Start-Process `
    -FilePath $corepack `
    -ArgumentList @("pnpm", "--dir", "apps/backend", "run", "dev") `
    -WorkingDirectory $workspaceRoot `
    -RedirectStandardOutput (Join-Path $logDirectory "backend.stdout.log") `
    -RedirectStandardError (Join-Path $logDirectory "backend.stderr.log") `
    -WindowStyle Hidden `
    -PassThru
  Set-Content -LiteralPath (Join-Path $logDirectory "backend.pid") -Value $backend.Id
  Write-Host "Backend PID: $($backend.Id) - http://localhost:9000/app"
} else {
  Write-Host "Backend is already listening on http://localhost:9000"
}

$storefrontPort = Get-NetTCPConnection -State Listen -LocalPort 8010 -ErrorAction SilentlyContinue
if (-not $storefrontPort) {
  $storefront = Start-Process `
    -FilePath $corepack `
    -ArgumentList @("pnpm", "--dir", "apps/storefront", "run", "dev") `
    -WorkingDirectory $workspaceRoot `
    -RedirectStandardOutput (Join-Path $logDirectory "storefront.stdout.log") `
    -RedirectStandardError (Join-Path $logDirectory "storefront.stderr.log") `
    -WindowStyle Hidden `
    -PassThru
  Set-Content -LiteralPath (Join-Path $logDirectory "storefront.pid") -Value $storefront.Id
  Write-Host "Storefront PID: $($storefront.Id) - http://localhost:8010"
} else {
  Write-Host "Storefront is already listening on http://localhost:8010"
}

Write-Host "Logs: $logDirectory"
