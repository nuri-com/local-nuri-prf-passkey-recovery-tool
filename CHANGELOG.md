# Changelog

## 2026-10-14 — [RELEASE] v0.2.0 — hermes-agent for emino

State of `main` at HEAD `cd565c23`. First GitHub release. Version follows the existing `0.2.0` changelog entry, which documents this HEAD.

- Offline recovery of the raw WebAuthn PRF output plus Nuri Bitcoin and Ethereum private keys in the browser, served by a local HTTPS server on `https://nuri.com:8443` (db9045fa, cd565c23).
- Optional public helpers: recovery metadata lookup, UTXO and CSV status lookup, raw transaction broadcast (eb28c6b5, e549b083).
- Recovery dump import and signed CSV sweep transaction builder; broadcast stays blocked until CSV unlock (c2ebea29, 8357f1a0).
- Docs (this release, docs only): README gains Logs, Status, Architecture, User flow, Components, API and Run sections; PROMPTLOG.md added. No code changed.
- Known gap: `package.json` still reports `0.1.0`; not bumped by this pass.

### Commit history

#### 2026-08-21

- cd565c23 Docs: explain provider-independent recovery, PRF vs server co-signing, EIP-4337 comparison; add MIT license and SECURITY.md. No runtime change.

#### 2026-05-22

- c0e7c469 UI shows the prerequisites missing for each recovery action.
- 8357f1a0 Sweep transaction can be built and inspected before CSV unlock; broadcast still gated.
- e9fb6f06 Recovery always uses passkey discovery before the PRF ceremony.
- 8f39d243 Recovery actions are enabled or disabled by workflow state.
- e549b083 Adds CSV sweep transaction builder, signing and broadcast.
- c2ebea29 Adds dump-only CSV import without a passkey.

#### 2026-05-20

- eb28c6b5 Adds CSV recovery metadata lookup against Nuri signer endpoints and UTXO lookup.
- db9045fa Initial local PRF recovery tool: local HTTPS server, cert scripts, WebAuthn PRF recovery page.

## 0.2.0 - 2026-08-20

### Added

- Detailed explanation of infrastructure-free WebAuthn PRF and private-key recovery.
- Mermaid diagrams for the local RP reconstruction, PRF ceremony, server co-signing boundary, wallet derivation, EIP-4337 relationship, and Bitcoin CSV exit.
- Precise comparison with provider-assisted private-key export and ordinary domain-bound passkeys.
- MIT license and private vulnerability-reporting policy.

### Clarified

- The raw PRF and recovered private keys are deliberate offline recovery outputs.
- Recovery does not require Nuri to control, resolve, or serve `nuri.com`; the `nuri.com` RP ID is recreated locally through hosts resolution and locally trusted TLS.
- Nuri signer servers receive WebAuthn assertion proof for co-signing, not the PRF or user private key.
- EIP-4337 provides account-abstraction execution and validation, not provider-independent key derivation or recovery.
- User-key recovery, public wallet-state discovery, and CSV maturity are separate requirements.

### Rationale

A provider-independent recovery claim must be reproducible from public source and understandable before an emergency. This release documents exactly which parts remain local, which values are secret, why domain binding does not create provider dependence, and what additional public data some Bitcoin recovery paths need.

No runtime recovery code changed in this release.
