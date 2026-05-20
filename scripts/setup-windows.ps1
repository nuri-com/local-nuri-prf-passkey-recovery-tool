$ErrorActionPreference = "Stop"

$Domain = if ($env:DOMAIN) { $env:DOMAIN } else { "nuri.com" }
$Port = if ($env:PORT) { $env:PORT } else { "8443" }
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoDir = Resolve-Path (Join-Path $ScriptDir "..")
$CertDir = if ($env:CERT_DIR) { $env:CERT_DIR } else { Join-Path $RepoDir "certs" }

New-Item -ItemType Directory -Force -Path $CertDir | Out-Null

$CaKey = Join-Path $CertDir "local-ca.key"
$CaCert = Join-Path $CertDir "local-ca.crt"
$DomainKey = Join-Path $CertDir "$Domain.key"
$DomainCsr = Join-Path $CertDir "$Domain.csr"
$DomainCert = Join-Path $CertDir "$Domain.crt"
$DomainExt = Join-Path $CertDir "$Domain.ext"

if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
  throw "OpenSSL is required. Install OpenSSL first, then rerun this script."
}

if (-not (Test-Path $CaKey)) {
  & openssl genrsa -out $CaKey 4096
}

if (-not (Test-Path $CaCert)) {
  & openssl req -x509 -new -nodes -key $CaKey -sha256 -days 3650 -out $CaCert -subj "/CN=Nuri Offline Recovery Local CA"
}

if (-not (Test-Path $DomainKey)) {
  & openssl genrsa -out $DomainKey 2048
}

@"
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=$Domain
DNS.2=*.$Domain
IP.1=127.0.0.1
"@ | Set-Content -NoNewline -Encoding ascii $DomainExt

& openssl req -new -key $DomainKey -out $DomainCsr -subj "/CN=$Domain"
& openssl x509 -req -in $DomainCsr -CA $CaCert -CAkey $CaKey -CAcreateserial -out $DomainCert -days 825 -sha256 -extfile $DomainExt
Remove-Item -Force $DomainCsr

$HostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
$HostsContent = Get-Content $HostsPath -Raw
$EscapedDomain = [regex]::Escape($Domain)
$HostsPattern = "(?m)^\s*127\.0\.0\.1\s+.*(^|\s)$EscapedDomain(\s|`$)"
if ($HostsContent -notmatch $HostsPattern) {
  Add-Content -Path $HostsPath -Value "`r`n127.0.0.1 $Domain"
}

Import-Certificate -FilePath $CaCert -CertStoreLocation Cert:\LocalMachine\Root | Out-Null

Write-Host "Local recovery setup complete."
Write-Host ""
Write-Host "Start the server:"
Write-Host "  .\run.ps1"
Write-Host ""
Write-Host "Open:"
Write-Host "  https://${Domain}:$Port"
