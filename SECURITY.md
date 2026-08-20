# Security Policy

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/nuri-com/local-nuri-prf-passkey-recovery-tool/security/advisories/new).

Do not include real PRF outputs, private keys, WIFs, recovery dumps, credentials, or unpublished signed transactions.

Include the affected commit, file and line, impact, a reproduction using synthetic keys only, and the smallest known fix.

## Supported version

Only the latest commit on `main` and the latest tagged release receive security fixes.

## Emergency recovery safety

The raw PRF and private keys are deliberate outputs. Their appearance in the local page or export JSON is not a vulnerability.

The security boundary is the recovery machine:

1. Run reviewed local source.
2. Disconnect the machine before recovery.
3. Never use a hosted recovery page or certificate files supplied by another person.
4. Remove the temporary local CA trust, `127.0.0.1 nuri.com` hosts entry, and generated `certs/` after recovery.

## Known dependency audit note

The locked `esbuild@0.27.7` reports low-severity advisory [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr). The affected optional esbuild development-server path is not used. The offline runtime executes the committed browser bundle and the Node.js standard-library HTTPS server; it does not execute esbuild.
