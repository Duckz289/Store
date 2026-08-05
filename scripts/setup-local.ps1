[CmdletBinding()]
param(
  [string]$AdminEmail = "admin@hungphat.local",
  [switch]$SkipInstall,
  [switch]$SkipSeed
)

$ErrorActionPreference = "Stop"
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Test-Path -LiteralPath (Join-Path $workspaceRoot "package.json"))) {
  throw "The script is not running inside the expected workspace."
}

function New-LocalSecret([int]$byteCount = 48) {
  $bytes = New-Object byte[] $byteCount
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return [Convert]::ToBase64String($bytes).TrimEnd("=").Replace("+", "-").Replace("/", "_")
}

function Write-Utf8NoBom([string]$path, [string]$content) {
  [System.IO.File]::WriteAllText(
    $path,
    $content,
    [System.Text.UTF8Encoding]::new($false)
  )
}

Set-Location $workspaceRoot

$rootEnvPath = Join-Path $workspaceRoot ".env"
$backendEnvPath = Join-Path $workspaceRoot "apps\backend\.env"
$storefrontEnvPath = Join-Path $workspaceRoot "apps\storefront\.env.local"
$localDirectory = Join-Path $workspaceRoot ".local"
$credentialPath = Join-Path $localDirectory "admin-credentials.txt"

if (-not (Test-Path -LiteralPath $rootEnvPath)) {
  $postgresPassword = New-LocalSecret 32
  Write-Utf8NoBom $rootEnvPath @"
POSTGRES_DB=hungphat_commerce
POSTGRES_USER=medusa
POSTGRES_PASSWORD=$postgresPassword
POSTGRES_PORT=5433
"@
} else {
  $postgresPassword = (Get-Content -LiteralPath $rootEnvPath | Where-Object { $_ -like "POSTGRES_PASSWORD=*" }) -replace "^POSTGRES_PASSWORD=", ""
}

if ([string]::IsNullOrWhiteSpace($postgresPassword)) {
  throw "POSTGRES_PASSWORD is not configured in .env."
}

if (-not (Test-Path -LiteralPath $backendEnvPath)) {
  $jwtSecret = New-LocalSecret
  $cookieSecret = New-LocalSecret
  $mfaSecret = New-LocalSecret
  Write-Utf8NoBom $backendEnvPath @"
STORE_CORS=http://localhost:8010
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:8010,http://localhost:9000
JWT_SECRET=$jwtSecret
COOKIE_SECRET=$cookieSecret
AUTH_MFA_ENCRYPTION_KEY=$mfaSecret
DATABASE_URL=postgres://medusa:$postgresPassword@localhost:5433/hungphat_commerce
DB_NAME=hungphat_commerce
"@
}

if (-not (Test-Path -LiteralPath $storefrontEnvPath)) {
  Write-Utf8NoBom $storefrontEnvPath @"
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_DEFAULT_REGION=vn
NEXT_PUBLIC_BASE_URL=http://localhost:8010
NODE_ENV=development
"@
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker daemon is not running. Start Docker Desktop and retry."
}

docker compose --env-file $rootEnvPath up -d postgres
if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL could not be started."
}

if (-not $SkipInstall) {
  corepack pnpm install --frozen-lockfile
  if ($LASTEXITCODE -ne 0) {
    throw "Dependency installation failed."
  }
}

Push-Location (Join-Path $workspaceRoot "apps\backend")
try {
  & .\node_modules\.bin\medusa.cmd db:migrate
  if ($LASTEXITCODE -ne 0) {
    throw "Database migration failed."
  }
} finally {
  Pop-Location
}

if (-not $SkipSeed) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $seedOutput = corepack pnpm --filter @dtc/backend run seed 2>&1
    $seedExitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  Write-Host ($seedOutput -join "`n")
  if ($seedExitCode -ne 0) {
    throw "Seed failed. If the database already contains seed data, retry with -SkipSeed."
  }
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  $keyOutput = corepack pnpm --filter @dtc/backend run storefront-key 2>&1
  $keyExitCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $previousErrorActionPreference
}
Write-Host ($keyOutput -join "`n")
if ($keyExitCode -ne 0) {
  throw "Could not read the storefront publishable key."
}

$keyMatch = [regex]::Match(($keyOutput -join "`n"), "STOREFRONT_PUBLISHABLE_KEY=([^\s]+)")
if ($keyMatch.Success) {
  $storefrontEnv = Get-Content -Raw -LiteralPath $storefrontEnvPath
  $storefrontEnv = $storefrontEnv -replace "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*", "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$($keyMatch.Groups[1].Value)"
  Write-Utf8NoBom $storefrontEnvPath $storefrontEnv
} else {
  throw "Publishable key was not found in command output."
}

if (-not (Test-Path -LiteralPath $credentialPath)) {
  New-Item -ItemType Directory -Path $localDirectory -Force | Out-Null
  $adminPassword = New-LocalSecret 24
  Push-Location (Join-Path $workspaceRoot "apps\backend")
  try {
    & .\node_modules\.bin\medusa.cmd user -e $AdminEmail -p $adminPassword
    if ($LASTEXITCODE -ne 0) {
      throw "Local admin creation failed."
    }
  } finally {
    Pop-Location
  }
  Write-Utf8NoBom $credentialPath "Email=$AdminEmail`r`nPassword=$adminPassword`r`n"
}

Write-Host "Local setup completed."
Write-Host "Local admin credentials: $credentialPath"
Write-Host "Run ./scripts/start-local.ps1 to start backend and storefront."
