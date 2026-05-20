#!/usr/bin/env sh
set -eu

DOMAIN="${DOMAIN:-nuri.com}"
PORT="${PORT:-8443}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CERT_DIR="${CERT_DIR:-$REPO_DIR/certs}"
CA_CERT="$CERT_DIR/local-ca.crt"

"$SCRIPT_DIR/gen-certs.sh"

add_hosts_entry() {
  if grep -Eq "^[[:space:]]*127\.0\.0\.1[[:space:]].*(^|[[:space:]])$DOMAIN([[:space:]]|$)" /etc/hosts; then
    return
  fi

  printf "\n127.0.0.1 %s\n" "$DOMAIN" | sudo tee -a /etc/hosts >/dev/null
}

setup_macos() {
  sudo security add-trusted-cert \
    -d \
    -r trustRoot \
    -k /Library/Keychains/System.keychain \
    "$CA_CERT"

  add_hosts_entry
  sudo dscacheutil -flushcache
  sudo killall -HUP mDNSResponder 2>/dev/null || true
}

setup_linux() {
  add_hosts_entry

  if command -v update-ca-certificates >/dev/null 2>&1; then
    sudo install -m 0644 "$CA_CERT" "/usr/local/share/ca-certificates/nuri-offline-recovery-local-ca.crt"
    sudo update-ca-certificates
    return
  fi

  if command -v trust >/dev/null 2>&1; then
    sudo trust anchor "$CA_CERT"
    return
  fi

  cat <<EOF
Could not find update-ca-certificates or trust.

Hosts entry was added, but you still need to trust this CA manually:
  $CA_CERT
EOF
}

case "$(uname -s)" in
  Darwin)
    setup_macos
    ;;
  Linux)
    setup_linux
    ;;
  MINGW*|MSYS*|CYGWIN*)
    cat <<EOF
Windows detected.

Run PowerShell as Administrator and execute:
  Add-Content -Path C:\\Windows\\System32\\drivers\\etc\\hosts -Value "127.0.0.1 $DOMAIN"
  Import-Certificate -FilePath "$CA_CERT" -CertStoreLocation Cert:\\LocalMachine\\Root

Then start the server:
  ./run.sh
EOF
    exit 0
    ;;
  *)
    cat <<EOF
Unsupported OS: $(uname -s)

Manual setup:
  1. Trust this CA in the browser/OS: $CA_CERT
  2. Add this hosts entry: 127.0.0.1 $DOMAIN
  3. Run: ./run.sh
EOF
    exit 0
    ;;
esac

cat <<EOF
Local recovery setup complete.

Start the server:
  ./run.sh

Open:
  https://$DOMAIN:$PORT
EOF
