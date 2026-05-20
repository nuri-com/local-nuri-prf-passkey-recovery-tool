# Nuri Passkey PRF Recovery

Offline helper for recovering the Nuri Bitcoin and Ethereum keypairs from a passkey scoped to `nuri.com`.

This does not bypass WebAuthn. The browser still enforces the RP ID/origin rules, and the user still has to approve the passkey operation. The local app works by serving a tiny HTTPS page as `https://nuri.com:8443` with a locally trusted certificate.

## One-Line Start

macOS or Linux:

```sh
./scripts/setup-local.sh && ./run.sh
```

Windows PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -Scope Process Bypass; .\scripts\setup-windows.ps1; .\run.ps1
```

Then open:

```text
https://nuri.com:8443
```

## What You Need

- The original passkey available to the browser/OS on this machine.
- No manual salt. The Nuri app's internal PRF input is built in: `nuri-prf-salt-v1`.
- A browser/passkey provider that supports the WebAuthn `prf` extension.

If the passkey scope, PRF support, or derivation differs from the original app, the recovered keys will not match.

## What This Tool Does

1. Creates a local certificate authority and a TLS certificate for `nuri.com`.
2. Adds `127.0.0.1 nuri.com` so the browser reaches this local recovery page.
3. Serves a small offline HTTPS app at `https://nuri.com:8443`.
4. Uses the browser's normal WebAuthn passkey flow with Nuri's internal PRF input.
5. Derives the same Bitcoin and Ethereum keypairs as the app in the browser.
6. Shows the recovered keypairs only in the browser. The local server never receives them.

## Recovery Steps

Start the tool:

```sh
./scripts/setup-local.sh && ./run.sh
```

Open:

```text
https://nuri.com:8443
```

Then:

1. Click `Recover Keypairs`.
2. Approve the passkey prompt.
3. Copy the Bitcoin and Ethereum keypairs from the output.

## Manual Setup

Generate a local CA and a `nuri.com` leaf certificate:

```sh
./scripts/gen-certs.sh
```

Trust `certs/local-ca.crt` on the machine running the browser.

Map `nuri.com` to the local machine:

```text
127.0.0.1 nuri.com
```

Start the server:

```sh
./run.sh
```

Open `https://nuri.com:8443`.

## OS Notes

`scripts/setup-local.sh` supports macOS and common Linux distributions. On Linux it uses either `update-ca-certificates` or `trust` if available.

On Windows, run PowerShell as Administrator:

```powershell
Set-ExecutionPolicy -Scope Process Bypass; .\scripts\setup-windows.ps1; .\run.ps1
```

Firefox may use its own certificate store depending on local settings. Safari and Chrome on macOS use the system trust store.

## Docker

Docker can run the server, but it cannot make the host browser trust a certificate or resolve `nuri.com`. Do the certificate and hosts setup on the host first.

```sh
./scripts/gen-certs.sh
docker build -t nuri-passkey-prf-recovery .
docker run --rm -it \
  -p 8443:8443 \
  -v "$PWD/certs:/app/certs:ro" \
  -v "$PWD/config:/app/config:ro" \
  nuri-passkey-prf-recovery
```

Open `https://nuri.com:8443`.

## Derivation

The built-in derivation matches `bitcoinlightning` and `nuri-expo`:

- PRF input: UTF-8 `nuri-prf-salt-v1`
- KDF salt: `SHA256("app:nuri.com|wallet|v1")`
- Bitcoin entropy: `HKDF-SHA256(PRF, salt, "app:nuri.com|wallet|v1|chain=bitcoin|fmt=taproot", 32)`
- Bitcoin path: `m/86'/0'/0'/0/0`
- Ethereum entropy: `HKDF-SHA256(PRF, salt, "app:nuri.com|wallet|v1|chain=ethereum|fmt=secp256k1", 32)`
- Ethereum path: `m/44'/60'/0'/0/0`

## Security Notes

Run this from audited local files, ideally offline. Any trusted page served as `https://nuri.com` can ask the browser to evaluate PRF after user verification if it knows the salt. This tool uses a strict Content Security Policy and does not load remote assets.

Remove the hosts entry and local CA trust after recovery if you do not need them anymore.
