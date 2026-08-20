# Changelog

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
