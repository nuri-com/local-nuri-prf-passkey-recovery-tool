#!/usr/bin/env sh
set -eu

DOMAIN="${DOMAIN:-nuri.com}"
OPENSSL="${OPENSSL:-openssl}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CERT_DIR="${CERT_DIR:-$REPO_DIR/certs}"

mkdir -p "$CERT_DIR"

CA_KEY="$CERT_DIR/local-ca.key"
CA_CERT="$CERT_DIR/local-ca.crt"
DOMAIN_KEY="$CERT_DIR/$DOMAIN.key"
DOMAIN_CSR="$CERT_DIR/$DOMAIN.csr"
DOMAIN_CERT="$CERT_DIR/$DOMAIN.crt"
DOMAIN_EXT="$CERT_DIR/$DOMAIN.ext"

if [ ! -f "$CA_KEY" ]; then
  "$OPENSSL" genrsa -out "$CA_KEY" 4096
fi

if [ ! -f "$CA_CERT" ]; then
  "$OPENSSL" req \
    -x509 \
    -new \
    -nodes \
    -key "$CA_KEY" \
    -sha256 \
    -days 3650 \
    -out "$CA_CERT" \
    -subj "/CN=Nuri Offline Recovery Local CA"
fi

if [ ! -f "$DOMAIN_KEY" ]; then
  "$OPENSSL" genrsa -out "$DOMAIN_KEY" 2048
fi

cat > "$DOMAIN_EXT" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage=digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=@alt_names

[alt_names]
DNS.1=$DOMAIN
DNS.2=*.$DOMAIN
IP.1=127.0.0.1
EOF

"$OPENSSL" req \
  -new \
  -key "$DOMAIN_KEY" \
  -out "$DOMAIN_CSR" \
  -subj "/CN=$DOMAIN"

"$OPENSSL" x509 \
  -req \
  -in "$DOMAIN_CSR" \
  -CA "$CA_CERT" \
  -CAkey "$CA_KEY" \
  -CAcreateserial \
  -out "$DOMAIN_CERT" \
  -days 825 \
  -sha256 \
  -extfile "$DOMAIN_EXT"

rm -f "$DOMAIN_CSR"

cat <<EOF
Created:
  $CA_CERT
  $DOMAIN_CERT
  $DOMAIN_KEY

Trust $CA_CERT on the browser host, then map $DOMAIN to 127.0.0.1.
EOF
