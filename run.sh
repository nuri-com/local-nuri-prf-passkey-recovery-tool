#!/usr/bin/env sh
set -eu

DOMAIN="${DOMAIN:-nuri.com}"
PORT="${PORT:-8443}"
HOST="${HOST:-127.0.0.1}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$SCRIPT_DIR"

if [ ! -f "certs/$DOMAIN.crt" ] || [ ! -f "certs/$DOMAIN.key" ]; then
  ./scripts/gen-certs.sh
fi

cat <<EOF
Starting offline recovery server.

Open this URL in the browser that can access the user's passkey:
  https://$DOMAIN:$PORT

Before WebAuthn will work, the browser host must trust certs/local-ca.crt
and resolve $DOMAIN to 127.0.0.1.
EOF

HOST="$HOST" PORT="$PORT" DOMAIN="$DOMAIN" node src/server.mjs
