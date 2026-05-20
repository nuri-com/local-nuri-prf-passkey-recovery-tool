import { secp256k1 } from "@noble/curves/secp256k1.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { HDKey } from "@scure/bip32";
import * as btc from "@scure/btc-signer";
import * as musig2 from "@scure/btc-signer/musig2.js";
import { bech32m } from "bech32";

const NURI_RP_ID = "nuri.com";
const NURI_PRF_INPUT = "nuri-prf-salt-v1";
const NURI_KDF_DOMAIN = "app:nuri.com|wallet|v1";
const CREDENTIAL_STORAGE_KEY = "nuri-prf-recovery:credentialId";
const USER_VERIFICATION = "required";
const LEGACY_CSV_CANDIDATES = [
  { id: "legacy-main-external", label: "Legacy Bitcoin CSV external", csvBlocks: 52500 },
  { id: "legacy-main-internal", label: "Legacy Bitcoin CSV internal", csvBlocks: 52501 },
  { id: "legacy-debug-external", label: "Legacy Bitcoin CSV debug external", csvBlocks: 3 },
  { id: "legacy-debug-internal", label: "Legacy Bitcoin CSV debug internal", csvBlocks: 4 }
];

const elements = {
  recoverButton: document.querySelector("#recoverButton"),
  originStatus: document.querySelector("#originStatus"),
  message: document.querySelector("#message"),
  recoveryBundle: document.querySelector("#recoveryBundle"),
  metadataStatus: document.querySelector("#metadataStatus"),
  recoveryOutput: document.querySelector("#recoveryOutput"),
  utxoOutput: document.querySelector("#utxoOutput"),
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

function stripHexPrefix(value) {
  return String(value || "").trim().toLowerCase().replace(/^0x/u, "");
}

function isHex(value, length) {
  const text = stripHexPrefix(value);
  return /^[0-9a-f]+$/u.test(text) && (length == null || text.length === length);
}

function hexToBytes(value) {
  const hex = stripHexPrefix(value);
  if (!/^[0-9a-f]*$/u.test(hex) || hex.length % 2 !== 0) {
    throw new Error("Invalid hex string.");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index += 1) {
    out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

function normalizeCompressedKey(value) {
  const hex = stripHexPrefix(value);
  return /^(02|03)[0-9a-f]{64}$/u.test(hex) ? hex : "";
}

function normalizeXOnly(value) {
  const hex = stripHexPrefix(value);
  if (/^[0-9a-f]{64}$/u.test(hex)) return hex;
  if (/^(02|03)[0-9a-f]{64}$/u.test(hex)) return hex.slice(2);
  return "";
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

function sequenceToTimelock(sequence) {
  const value = Math.trunc(Number(sequence));
  if (!Number.isInteger(value) || value < 0) return null;
  if (value & (1 << 31)) return null;
  const masked = value & 0x0000ffff;
  if (value & (1 << 22)) {
    return { type: "seconds", value: masked << 9, sequence: value };
  }
  return { type: "blocks", value: masked, sequence: value };
}

function csvStatus(utxo, csv, tipHeight) {
  const status = utxo?.status || {};
  if (!status.confirmed) {
    return {
      state: "unconfirmed",
      movableAlone: false,
      detail: "unconfirmed, CSV timer has not started"
    };
  }

  if (!csv || !csv.type || !Number.isFinite(Number(csv.value))) {
    return {
      state: "unknown",
      movableAlone: false,
      detail: "CSV policy unavailable"
    };
  }

  const value = Math.max(0, Math.trunc(Number(csv.value)));
  if (csv.type === "blocks") {
    const blockHeight = Number(status.block_height);
    if (!Number.isFinite(blockHeight) || !Number.isFinite(Number(tipHeight))) {
      return {
        state: "unknown",
        movableAlone: false,
        detail: `confirmed, needs ${value} blocks from confirmation height`
      };
    }
    const unlockHeight = blockHeight + value;
    const remaining = Math.max(0, unlockHeight - Number(tipHeight));
    return {
      state: remaining === 0 ? "ready" : "locked",
      movableAlone: remaining === 0,
      unlockHeight,
      blocksRemaining: remaining,
      approxTime: remaining === 0 ? "now" : formatDurationSeconds(remaining * 600),
      detail:
        remaining === 0
          ? "client-only CSV path is spendable now"
          : `${remaining} blocks remaining, about ${formatDurationSeconds(remaining * 600)}`
    };
  }

  const blockTime = Number(status.block_time);
  if (!Number.isFinite(blockTime)) {
    return {
      state: "unknown",
      movableAlone: false,
      detail: `confirmed, needs about ${formatDurationSeconds(value)} by BIP68 time CSV`
    };
  }
  const unlockTime = blockTime + value;
  const remainingSeconds = Math.max(0, unlockTime - Math.floor(Date.now() / 1000));
  return {
    state: remainingSeconds === 0 ? "ready" : "locked",
    movableAlone: remainingSeconds === 0,
    unlockTime,
    secondsRemaining: remainingSeconds,
    approxBlocksRemaining: Math.ceil(remainingSeconds / 600),
    approxTime: remainingSeconds === 0 ? "now" : formatDurationSeconds(remainingSeconds),
    detail:
      remainingSeconds === 0
        ? "client-only CSV path is spendable now"
        : `${formatDurationSeconds(remainingSeconds)} remaining, about ${Math.ceil(remainingSeconds / 600)} blocks`
  };
}

function formatDurationSeconds(seconds) {
  const total = Math.max(0, Math.ceil(Number(seconds) || 0));
  if (total < 60) return `${total}s`;
  const minutes = Math.ceil(total / 60);
  if (minutes < 120) return `${minutes}m`;
  const hours = Math.ceil(minutes / 60);
  if (hours < 72) return `${hours}h`;
  const days = Math.ceil(hours / 24);
  return `${days}d`;
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

function aggregateMuSig2Keys(clientPk33, serverPk33) {
  const client = hexToBytes(clientPk33);
  const server = hexToBytes(serverPk33);
  const aggregate = musig2.keyAggregate(musig2.sortKeys([client, server]));
  const exported = musig2.keyAggExport(aggregate);
  const compressed =
    exported.length === 33
      ? exported
      : aggregate?.aggPublicKey?.toBytes
        ? aggregate.aggPublicKey.toBytes(true)
        : null;
  if (!(compressed instanceof Uint8Array) || compressed.length !== 33) {
    throw new Error("Failed to aggregate MuSig2 public keys.");
  }
  const xOnly = exported.length === 32 ? exported : compressed.slice(1);
  if (xOnly.length !== 32) {
    throw new Error("Failed to export MuSig2 x-only key.");
  }
  return {
    compressedHex: bytesToHex(compressed),
    xOnlyHex: bytesToHex(xOnly)
  };
}

function buildLegacyCsvLeaf(userXOnly, csvBlocks) {
  return {
    script: btc.Script.encode([
      userXOnly,
      "CHECKSIGVERIFY",
      csvBlocks,
      "CHECKSEQUENCEVERIFY"
    ]),
    leafVersion: 0xc0
  };
}

function buildLegacyCsvCandidate({ id, label, clientPk33, serverPk33, csvBlocks }) {
  const aggregated = aggregateMuSig2Keys(clientPk33, serverPk33);
  const clientXOnly = hexToBytes(clientPk33.slice(2));
  const internalKey = hexToBytes(aggregated.xOnlyHex);
  const leaf = buildLegacyCsvLeaf(clientXOnly, csvBlocks);
  const p2tr = btc.p2tr(internalKey, [leaf], btc.NETWORK, true);
  const tweakedPubkey = p2tr.tweakedPubkey instanceof Uint8Array ? p2tr.tweakedPubkey : null;
  const scriptPubKey = p2tr.script instanceof Uint8Array ? p2tr.script : null;

  return {
    id,
    label,
    type: "legacy-bitcoin-csv",
    network: "bitcoin-mainnet",
    address: p2tr.address || "",
    descriptor: `tr(${aggregated.xOnlyHex},and_v(v:pk(${bytesToHex(clientXOnly)}),older(${csvBlocks})))`,
    scriptPubKeyHex: scriptPubKey ? bytesToHex(scriptPubKey) : "",
    csv: {
      type: "blocks",
      value: csvBlocks,
      sequence: csvBlocks
    },
    clientPk33,
    serverPk33,
    aggregatedPk33: aggregated.compressedHex,
    aggregatedXonly32: aggregated.xOnlyHex,
    clientXonly32: bytesToHex(clientXOnly),
    tapInternalKeyHex: aggregated.xOnlyHex,
    tapMerkleRootHex: p2tr.tapMerkleRoot ? bytesToHex(p2tr.tapMerkleRoot) : "",
    tweakedPubkeyHex: tweakedPubkey ? bytesToHex(tweakedPubkey) : "",
    tapLeafScriptPresent: Array.isArray(p2tr.tapLeafScript) && p2tr.tapLeafScript.length > 0
  };
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
  elements.metadataStatus.textContent = "No server lookup yet.";
  elements.recoveryOutput.value = "";
  elements.utxoOutput.value = "";
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

async function postJson(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `HTTP ${response.status}`);
  }
  return data;
}

function findFirstDeep(value, predicate, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);
  if (predicate(value)) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstDeep(item, predicate, seen);
      if (found) return found;
    }
    return null;
  }
  for (const item of Object.values(value)) {
    const found = findFirstDeep(item, predicate, seen);
    if (found) return found;
  }
  return null;
}

function findStringByKeys(value, keys, seen = new WeakSet()) {
  if (!value || typeof value !== "object") return "";
  if (seen.has(value)) return "";
  seen.add(value);
  if (!Array.isArray(value)) {
    for (const key of keys) {
      if (typeof value[key] === "string" && value[key].trim()) return value[key].trim();
    }
  }
  const children = Array.isArray(value) ? value : Object.values(value);
  for (const child of children) {
    const found = findStringByKeys(child, keys, seen);
    if (found) return found;
  }
  return "";
}

function collectOutpoints(value, path = "$", out = [], seen = new WeakSet()) {
  if (!value || typeof value !== "object" || out.length >= 200) return out;
  if (seen.has(value)) return out;
  seen.add(value);

  if (!Array.isArray(value)) {
    const txid = typeof value.txid === "string" ? value.txid : typeof value.txId === "string" ? value.txId : "";
    const rawVout = value.vout ?? value.outputIndex ?? value.n;
    const valueSats = value.value ?? value.amount ?? value.sats;
    if (/^[0-9a-f]{64}$/iu.test(txid) && Number.isFinite(Number(rawVout))) {
      out.push({
        sourcePath: path,
        txid,
        vout: Math.trunc(Number(rawVout)),
        value: Number.isFinite(Number(valueSats)) ? Math.trunc(Number(valueSats)) : null,
        status: value.status || null,
        csvStatus: value.csvStatus || null,
        csvSequence: Number.isFinite(Number(value.csvSequence)) ? Math.trunc(Number(value.csvSequence)) : null
      });
    }
  }

  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    collectOutpoints(child, `${path}.${String(key)}`, out, seen);
  }
  return out;
}

function parseRecoveryBundle() {
  const text = elements.recoveryBundle.value.trim();
  if (!text) {
    return {
      present: false,
      error: "",
      raw: null,
      serverPk33: "",
      aggregatedXonly32: "",
      nuriServerCsv: null,
      legacyCsvBlocks: [],
      outpoints: []
    };
  }

  try {
    const raw = JSON.parse(text);
    const serverPk33 = normalizeCompressedKey(
      findStringByKeys(raw, [
        "serverPk33",
        "server_pubkey",
        "server_signer_pubkey",
        "serverSignerPubkeyHex",
        "cosignerCompressed"
      ])
    );
    const aggregatedXonly32 = normalizeXOnly(
      findStringByKeys(raw, ["aggregatedXonly32", "aggregatedExternal", "tapInternalKeyHex"])
    );
    const csvObject = findFirstDeep(raw, (entry) => {
      const type = String(entry?.type || "").toLowerCase();
      return (type === "blocks" || type === "seconds") && Number.isFinite(Number(entry?.value));
    });
    const descriptors = raw?.wallet?.descriptors || raw?.descriptors || {};
    const descriptorTexts = [descriptors.external, descriptors.internal, raw?.descriptor]
      .filter((value) => typeof value === "string")
      .join("\n");
    const legacyCsvBlocks = [...descriptorTexts.matchAll(/older\((\d+)\)/gu)]
      .map((match) => Number.parseInt(match[1], 10))
      .filter((value) => Number.isInteger(value) && value > 0);

    return {
      present: true,
      error: "",
      raw,
      serverPk33,
      aggregatedXonly32,
      nuriServerCsv: csvObject
        ? { type: String(csvObject.type).toLowerCase(), value: Math.trunc(Number(csvObject.value)) }
        : null,
      legacyCsvBlocks: [...new Set(legacyCsvBlocks)],
      outpoints: collectOutpoints(raw)
    };
  } catch (error) {
    return {
      present: true,
      error: error.message || String(error),
      raw: null,
      serverPk33: "",
      aggregatedXonly32: "",
      nuriServerCsv: null,
      legacyCsvBlocks: [],
      outpoints: []
    };
  }
}

function collectServerKeys(metadata, manual) {
  const keys = [];
  const add = (source, value, kind = "legacy") => {
    const serverPk33 = normalizeCompressedKey(value);
    if (!serverPk33) return;
    if (keys.some((entry) => entry.serverPk33 === serverPk33 && entry.kind === kind)) return;
    keys.push({ source, kind, serverPk33 });
  };

  if (manual.serverPk33) add("pasted recovery bundle", manual.serverPk33, "manual");

  for (const attempt of metadata?.attempts || []) {
    if (!attempt.ok) continue;
    const data = attempt.data || {};
    if (attempt.source === "arkade-v4-info") {
      add(attempt.source, data.server_pubkey || data.cosigner_derivation?.server_pubkey, "arkade-v4");
      continue;
    }
    add(attempt.source, data.server_pubkey || data.server_signer_pubkey, "legacy");
  }

  return keys;
}

function buildRecoveryCandidates({ clientPk33, serverKeys, manual }) {
  const candidates = [];
  const legacyCsvValues = new Set(LEGACY_CSV_CANDIDATES.map((entry) => entry.csvBlocks));
  for (const csvBlocks of manual.legacyCsvBlocks || []) legacyCsvValues.add(csvBlocks);

  for (const serverKey of serverKeys) {
    if (serverKey.kind === "arkade-v4") continue;
    for (const csvBlocks of legacyCsvValues) {
      const base = LEGACY_CSV_CANDIDATES.find((entry) => entry.csvBlocks === csvBlocks);
      try {
        candidates.push(
          buildLegacyCsvCandidate({
            id: `${serverKey.source}:${csvBlocks}`.replace(/[^a-z0-9:._-]/giu, "_"),
            label: base ? `${base.label} (${serverKey.source})` : `Legacy Bitcoin CSV ${csvBlocks} blocks (${serverKey.source})`,
            clientPk33,
            serverPk33: serverKey.serverPk33,
            csvBlocks
          })
        );
      } catch (error) {
        console.warn("Failed to build legacy CSV candidate", serverKey.source, csvBlocks, error);
      }
    }
  }

  return candidates;
}

async function lookupRecoveryMetadata({ credentialId, clientPk33 }) {
  try {
    return await postJson("/api/recovery-metadata", { credentialId, clientPk33 });
  } catch (error) {
    return {
      ok: false,
      attempts: [],
      error: error.message || String(error)
    };
  }
}

async function lookupUtxos(candidates) {
  const addresses = candidates
    .filter((candidate) => candidate.address)
    .map((candidate) => ({
      id: candidate.id,
      label: candidate.label,
      address: candidate.address,
      csv: candidate.csv
    }));
  if (!addresses.length) return { ok: true, tipHeight: null, results: [] };
  return postJson("/api/utxos", { addresses });
}

function formatMetadataStatus(metadata, serverKeys) {
  if (!metadata.ok) return `Server lookup failed: ${metadata.error || "unknown error"}`;
  const ok = (metadata.attempts || []).filter((attempt) => attempt.ok);
  const failed = (metadata.attempts || []).filter((attempt) => !attempt.ok);
  return [
    `${ok.length} server lookup(s) succeeded, ${failed.length} failed.`,
    `Recovered public server key entries: ${serverKeys.length}.`
  ].join(" ");
}

function formatUtxoReport(utxoLookup, pastedOutpoints) {
  const lines = [];
  if (utxoLookup?.tipHeight != null) lines.push(`Bitcoin tip height: ${utxoLookup.tipHeight}`);

  for (const result of utxoLookup?.results || []) {
    lines.push("");
    lines.push(`${result.label}`);
    lines.push(`  address: ${result.address}`);
    if (!result.ok) {
      lines.push(`  lookup failed: ${result.error}`);
      continue;
    }
    if (!result.utxos.length) {
      lines.push("  no UTXOs found");
      continue;
    }
    for (const utxo of result.utxos) {
      const status = csvStatus(utxo, result.csv, utxoLookup.tipHeight);
      lines.push(
        `  ${utxo.txid}:${utxo.vout} value=${utxo.value} sats confirmed=${utxo.status?.confirmed ? 1 : 0} ` +
          `move_alone=${status.movableAlone ? 1 : 0} ${status.detail}`
      );
    }
  }

  if (pastedOutpoints.length) {
    lines.push("");
    lines.push(`Pasted bundle outpoints: ${pastedOutpoints.length}`);
    for (const outpoint of pastedOutpoints.slice(0, 80)) {
      const csv = outpoint.csvSequence ? sequenceToTimelock(outpoint.csvSequence) : null;
      const status = csv ? csvStatus(outpoint, csv, null) : null;
      lines.push(
        `  ${outpoint.txid}:${outpoint.vout} value=${outpoint.value ?? "n/a"} sats source=${outpoint.sourcePath}` +
          (status ? ` move_alone=${status.movableAlone ? 1 : 0} ${status.detail}` : "")
      );
    }
  }

  if (!lines.length) {
    return "No UTXO scan ran. Live legacy CSV addresses require a server pubkey; Arkade v4 VTXOs require a pasted recovery bundle/storage export.";
  }

  return lines.join("\n");
}

function missingRecoveryMaterial({ metadata, manual, serverKeys, candidates }) {
  const missing = [];
  const hasLegacyKey = serverKeys.some((entry) => entry.kind === "legacy" || entry.kind === "manual");
  const hasArkade = serverKeys.some((entry) => entry.kind === "arkade-v4");
  if (!hasLegacyKey) missing.push("legacy server/cosigner compressed pubkey for old Bitcoin CSV descriptors");
  if (hasArkade && !manual.present) {
    missing.push("Arkade v4 recovery backup/storage paste to enumerate VTXOs and TapTrees");
  }
  if (!hasArkade && !hasLegacyKey && !metadata.ok) {
    missing.push("server lookup response or pasted recovery bundle");
  }
  if (!candidates.length) {
    missing.push("scanable legacy CSV address candidate");
  }
  return missing;
}

async function buildRecoveryContext({ bitcoin, credentialId }) {
  const clientPk33 = stripHexPrefix(bitcoin.publicKeyCompressedHex);
  const manual = parseRecoveryBundle();
  const metadata = await lookupRecoveryMetadata({ credentialId, clientPk33 });
  const serverKeys = collectServerKeys(metadata, manual);
  const candidates = buildRecoveryCandidates({ clientPk33, serverKeys, manual });
  const utxoLookup = await lookupUtxos(candidates).catch((error) => ({
    ok: false,
    error: error.message || String(error),
    tipHeight: null,
    results: []
  }));
  const missing = missingRecoveryMaterial({ metadata, manual, serverKeys, candidates });

  return {
    metadata,
    manual: {
      present: manual.present,
      error: manual.error,
      serverPk33: manual.serverPk33 || "",
      aggregatedXonly32: manual.aggregatedXonly32 || "",
      nuriServerCsv: manual.nuriServerCsv,
      legacyCsvBlocks: manual.legacyCsvBlocks,
      outpointCount: manual.outpoints.length
    },
    serverKeys,
    legacyCsvCandidates: candidates,
    utxoLookup,
    pastedOutpoints: manual.outpoints,
    missing,
    statusText: formatMetadataStatus(metadata, serverKeys),
    utxoText: formatUtxoReport(utxoLookup, manual.outpoints)
  };
}

async function renderOutputs(result) {
  const bitcoin = deriveBitcoinKeypair(result.prf);
  const ethereum = deriveEthereumKeypair(result.prf);
  const credentialId = bytesToBase64url(arrayBufferToBytes(result.credential.rawId));
  const recovery = await buildRecoveryContext({ bitcoin, credentialId });

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
    ethereum,
    recovery
  };

  elements.metadataStatus.textContent = recovery.statusText;
  elements.recoveryOutput.value = JSON.stringify(
    {
      serverKeys: recovery.serverKeys,
      legacyCsvCandidates: recovery.legacyCsvCandidates,
      manual: recovery.manual,
      missing: recovery.missing,
      metadataAttempts: recovery.metadata.attempts || []
    },
    null,
    2
  );
  elements.utxoOutput.value = recovery.utxoText;
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
    setMessage("Recovered keypairs. Looking up server metadata and UTXOs...", "neutral");
    await renderOutputs(result);
    setMessage("Recovered keypairs and checked available recovery metadata.", "success");
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
