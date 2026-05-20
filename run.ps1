$ErrorActionPreference = "Stop"

$Domain = if ($env:DOMAIN) { $env:DOMAIN } else { "nuri.com" }
$Port = if ($env:PORT) { $env:PORT } else { "8443" }
$HostName = if ($env:HOST) { $env:HOST } else { "127.0.0.1" }
$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RepoDir

if (-not (Test-Path "certs\$Domain.crt") -or -not (Test-Path "certs\$Domain.key")) {
  & ".\scripts\setup-windows.ps1"
}

Write-Host "Starting offline recovery server."
Write-Host ""
Write-Host "Open this URL in the browser that can access the user's passkey:"
Write-Host "  https://${Domain}:$Port"
Write-Host ""
Write-Host "Before WebAuthn will work, the browser host must trust certs\local-ca.crt"
Write-Host "and resolve $Domain to 127.0.0.1."

$env:DOMAIN = $Domain
$env:PORT = $Port
$env:HOST = $HostName
node src/server.mjs
