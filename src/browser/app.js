import { secp256k1 } from "@noble/curves/secp256k1.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { HDKey } from "@scure/bip32";
import { bech32m } from "bech32";

const NURI_RP_ID = "nuri.com";
const NURI_PRF_INPUT = "nuri-prf-salt-v1";
const NURI_KDF_DOMAIN = "app:nuri.com|wallet|v1";
const CREDENTIAL_STORAGE_KEY = "nuri-prf-recovery:credentialId";
const USER_VERIFICATION = "required";

const elements = {
  recoverButton: document.querySelector("#recoverButton"),
  originStatus: document.querySelector("#originStatus"),
  message: document.querySelector("#message"),
  bitcoinAddress: document.querySelector("#bitcoinAddress"),
  bitcoinPrivateKey: document.querySelector("#bitcoinPrivateKey"),
  bitcoinPublicKey: document.querySelector("#bitcoinPublicKey"),
  ethereumAddress: document.querySelector("#ethereumAddress"),
  ethereumPrivateKey: document.querySelector("#ethereumPrivateKey"),
  ethereumPublicKey: document.querySelector("#ethereumPublicKey"),
  exportJson: document.querySelector("#exportJson")
};

function utf8(value) {
  return new TextEncoder().encode(value);
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function bytesToBase64url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/u, "");
}

function base64urlToBytes(value) {
  const base64 = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function arrayBufferToBytes(value) {
  return new Uint8Array(value);
}

function concatBytes(...chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

function taggedHash(tag, data) {
  const tagHash = sha256(utf8(tag));
  return sha256(concatBytes(tagHash, tagHash, data));
}

function bytesToNumberBE(bytes) {
  return BigInt(`0x${bytesToHex(bytes)}`);
}

function base58Encode(bytes) {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let value = bytesToNumberBE(bytes);
  let output = "";
  while (value > 0n) {
    const mod = value % 58n;
    output = alphabet[Number(mod)] + output;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    output = `1${output}`;
  }
  return output || "1";
}

function base58CheckEncode(payload) {
  const checksum = sha256(sha256(payload)).slice(0, 4);
  return base58Encode(concatBytes(payload, checksum));
}

function privateKeyToWif(privateKey) {
  return base58CheckEncode(concatBytes(new Uint8Array([0x80]), privateKey, new Uint8Array([0x01])));
}

function toChecksumAddress(addressBytes) {
  const lower = bytesToHex(addressBytes);
  const hash = bytesToHex(keccak_256(utf8(lower)));
  let out = "0x";

  for (let index = 0; index < lower.length; index += 1) {
    const char = lower[index];
    out += /[a-f]/u.test(char) && Number.parseInt(hash[index], 16) >= 8 ? char.toUpperCase() : char;
  }

  return out;
}

function deriveWalletEntropy(prfBytes, chain) {
  const salt = sha256(utf8(NURI_KDF_DOMAIN));
  const info =
    chain === "bitcoin"
      ? "app:nuri.com|wallet|v1|chain=bitcoin|fmt=taproot"
      : "app:nuri.com|wallet|v1|chain=ethereum|fmt=secp256k1";

  return hkdf(sha256, prfBytes, salt, utf8(info), 32);
}

function deriveBitcoinKeypair(prfBytes) {
  const entropy = deriveWalletEntropy(prfBytes, "bitcoin");
  const child = HDKey.fromMasterSeed(entropy).derive("m/86'/0'/0'/0/0");
  if (!child.privateKey || !child.publicKey) {
    throw new Error("Failed to derive Bitcoin keypair.");
  }

  const privateKey = new Uint8Array(child.privateKey);
  const publicKeyCompressed = new Uint8Array(child.publicKey);
  const internalXOnly = publicKeyCompressed.slice(1);
  const tweak = taggedHash("TapTweak", internalXOnly);
  const tweakScalar = bytesToNumberBE(tweak) % secp256k1.Point.Fn.ORDER;
  const internalPoint = secp256k1.Point.fromHex(bytesToHex(publicKeyCompressed));
  const tweakedPoint = internalPoint.add(secp256k1.Point.BASE.multiply(tweakScalar));
  const taprootOutputKey = tweakedPoint.toBytes(true).slice(1);
  const address = bech32m.encode("bc", [1, ...bech32m.toWords(taprootOutputKey)]);

  return {
    network: "bitcoin-mainnet",
    type: "bip86-taproot",
    derivationPath: "m/86'/0'/0'/0/0",
    address,
    privateKeyHex: `0x${bytesToHex(privateKey)}`,
    privateKeyWif: privateKeyToWif(privateKey),
    publicKeyCompressedHex: `0x${bytesToHex(publicKeyCompressed)}`,
    internalXOnlyPublicKeyHex: `0x${bytesToHex(internalXOnly)}`,
    taprootOutputKeyHex: `0x${bytesToHex(taprootOutputKey)}`
  };
}

function deriveEthereumKeypair(prfBytes) {
  const entropy = deriveWalletEntropy(prfBytes, "ethereum");
  const child = HDKey.fromMasterSeed(entropy).derive("m/44'/60'/0'/0/0");
  if (!child.privateKey) {
    throw new Error("Failed to derive Ethereum keypair.");
  }

  const privateKey = new Uint8Array(child.privateKey);
  const point = secp256k1.Point.BASE.multiply(bytesToNumberBE(privateKey));
  const publicKeyUncompressed = point.toBytes(false);
  const addressBytes = keccak_256(publicKeyUncompressed.slice(1)).slice(-20);

  return {
    network: "ethereum",
    type: "secp256k1",
    derivationPath: "m/44'/60'/0'/0/0",
    address: toChecksumAddress(addressBytes),
    privateKeyHex: `0x${bytesToHex(privateKey)}`,
    publicKeyUncompressedHex: `0x${bytesToHex(publicKeyUncompressed)}`,
    publicKeyCompressedHex: `0x${bytesToHex(point.toBytes(true))}`
  };
}

function setMessage(text, kind = "neutral") {
  elements.message.className = `message ${kind}`;
  elements.message.textContent = text;
}

function setOriginStatus(text, kind = "neutral") {
  elements.originStatus.className = `status ${kind}`;
  elements.originStatus.textContent = text;
}

function clearOutputs() {
  elements.bitcoinAddress.value = "";
  elements.bitcoinPrivateKey.value = "";
  elements.bitcoinPublicKey.value = "";
  elements.ethereumAddress.value = "";
  elements.ethereumPrivateKey.value = "";
  elements.ethereumPublicKey.value = "";
  elements.exportJson.value = "";
}

function prfEvalInput() {
  return {
    first: bytesToArrayBuffer(utf8(NURI_PRF_INPUT))
  };
}

function challenge() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToArrayBuffer(bytes);
}

function basePublicKeyOptions() {
  return {
    challenge: challenge(),
    rpId: NURI_RP_ID,
    timeout: 120000,
    userVerification: USER_VERIFICATION
  };
}

function prfByCredentialOptions(credentialBytes) {
  return {
    ...basePublicKeyOptions(),
    allowCredentials: [
      {
        type: "public-key",
        id: bytesToArrayBuffer(credentialBytes)
      }
    ],
    extensions: {
      prf: {
        evalByCredential: {
          [bytesToBase64url(credentialBytes)]: prfEvalInput()
        }
      }
    }
  };
}

function directPrfOptions() {
  return {
    ...basePublicKeyOptions(),
    extensions: {
      prf: {
        eval: prfEvalInput()
      }
    }
  };
}

async function credentialsGet(publicKey) {
  const credential = await navigator.credentials.get({ publicKey });
  if (!credential) {
    throw new Error("No passkey credential was returned.");
  }
  return credential;
}

function extractPrf(credential) {
  const extensions = credential.getClientExtensionResults();
  const result = extensions?.prf?.results?.first;
  return result ? arrayBufferToBytes(result) : null;
}

async function recoverPrf() {
  const cachedCredentialId = localStorage.getItem(CREDENTIAL_STORAGE_KEY);

  if (cachedCredentialId) {
    try {
      setMessage("Waiting for passkey verification...", "neutral");
      const credential = await credentialsGet(prfByCredentialOptions(base64urlToBytes(cachedCredentialId)));
      const prf = extractPrf(credential);
      if (prf) return { credential, prf, mode: "cached-credential" };
    } catch (error) {
      localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
      console.warn("Cached credential PRF failed; falling back to discovery.", error);
    }
  }

  try {
    setMessage("Waiting for passkey verification...", "neutral");
    const credential = await credentialsGet(directPrfOptions());
    const credentialBytes = arrayBufferToBytes(credential.rawId);
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, bytesToBase64url(credentialBytes));
    const prf = extractPrf(credential);
    if (prf) return { credential, prf, mode: "direct-prf" };

    setMessage("Passkey selected. Waiting for PRF verification...", "neutral");
    const secondCredential = await credentialsGet(prfByCredentialOptions(credentialBytes));
    const secondPrf = extractPrf(secondCredential);
    if (secondPrf) return { credential: secondCredential, prf: secondPrf, mode: "discover-then-prf" };
  } catch (error) {
    console.warn("Direct PRF failed; falling back to credential discovery.", error);
  }

  setMessage("Select the Nuri passkey...", "neutral");
  const discoveredCredential = await credentialsGet(basePublicKeyOptions());
  const credentialBytes = arrayBufferToBytes(discoveredCredential.rawId);
  localStorage.setItem(CREDENTIAL_STORAGE_KEY, bytesToBase64url(credentialBytes));

  setMessage("Passkey selected. Waiting for PRF verification...", "neutral");
  const credential = await credentialsGet(prfByCredentialOptions(credentialBytes));
  const prf = extractPrf(credential);
  if (!prf) {
    throw new Error("No PRF result was returned. The selected passkey or browser may not support WebAuthn PRF for this credential.");
  }

  return { credential, prf, mode: "discover-then-prf" };
}

function renderOutputs(result) {
  const bitcoin = deriveBitcoinKeypair(result.prf);
  const ethereum = deriveEthereumKeypair(result.prf);
  const credentialId = bytesToBase64url(arrayBufferToBytes(result.credential.rawId));

  const exportData = {
    createdAt: new Date().toISOString(),
    origin: window.location.origin,
    rpId: NURI_RP_ID,
    prfInput: {
      text: NURI_PRF_INPUT,
      utf8Hex: bytesToHex(utf8(NURI_PRF_INPUT))
    },
    recoveryMode: result.mode,
    credential: {
      id: result.credential.id,
      rawId: credentialId,
      type: result.credential.type,
      authenticatorAttachment: result.credential.authenticatorAttachment || null
    },
    prf: {
      firstHex: bytesToHex(result.prf),
      firstBase64url: bytesToBase64url(result.prf)
    },
    bitcoin,
    ethereum
  };

  elements.bitcoinAddress.value = bitcoin.address;
  elements.bitcoinPrivateKey.value = bitcoin.privateKeyHex;
  elements.bitcoinPublicKey.value = bitcoin.publicKeyCompressedHex;
  elements.ethereumAddress.value = ethereum.address;
  elements.ethereumPrivateKey.value = ethereum.privateKeyHex;
  elements.ethereumPublicKey.value = ethereum.publicKeyUncompressedHex;
  elements.exportJson.value = JSON.stringify(exportData, null, 2);
}

async function recover() {
  elements.recoverButton.disabled = true;
  clearOutputs();

  try {
    if (!window.PublicKeyCredential || !navigator.credentials?.get) {
      throw new Error("This browser does not expose WebAuthn credentials.get().");
    }
    if (!window.isSecureContext) {
      throw new Error("WebAuthn requires the trusted https://nuri.com local origin.");
    }

    const result = await recoverPrf();
    renderOutputs(result);
    setMessage("Recovered Nuri keypairs in this browser.", "success");
  } catch (error) {
    setMessage(error.message || String(error), "error");
  } finally {
    elements.recoverButton.disabled = false;
  }
}

function updateOriginStatus() {
  const hostMatches = window.location.hostname === NURI_RP_ID || window.location.hostname.endsWith(`.${NURI_RP_ID}`);
  const secure = window.isSecureContext && window.location.protocol === "https:";

  if (hostMatches && secure) {
    setOriginStatus(`Ready on ${window.location.origin}`, "success");
    return;
  }

  setOriginStatus(`Open https://${NURI_RP_ID}:8443 to recover`, "error");
}

elements.recoverButton.addEventListener("click", recover);
updateOriginStatus();
