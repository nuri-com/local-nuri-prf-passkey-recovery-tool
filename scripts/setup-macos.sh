#!/usr/bin/env sh
set -eu

DOMAIN="${DOMAIN:-nuri.com}"

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This helper only supports macOS. Use scripts/gen-certs.sh and add trust/hosts manually on this OS." >&2
  exit 1
fi

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CERT_DIR="${CERT_DIR:-$REPO_DIR/certs}"
"$SCRIPT_DIR/gen-certs.sh"

CA_CERT="$CERT_DIR/local-ca.crt"

sudo security add-trusted-cert \
  -d \
  -r trustRoot \
  -k /Library/Keychains/System.keychain \
  "$CA_CERT"

if ! grep -Eq "^[[:space:]]*127\.0\.0\.1[[:space:]].*(^|[[:space:]])$DOMAIN([[:space:]]|$)" /etc/hosts; then
  printf "\n127.0.0.1 %s\n" "$DOMAIN" | sudo tee -a /etc/hosts >/dev/null
fi

sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null || true

cat <<EOF
macOS setup complete.

Open:
  https://$DOMAIN:${PORT:-8443}
EOF
