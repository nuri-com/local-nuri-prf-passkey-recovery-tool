import { createServer } from "node:https";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";

const rootDir = resolve(new URL("..", import.meta.url).pathname);
const publicDir = join(rootDir, "public");

const host = process.env.HOST || "127.0.0.1";
const port = Number.parseInt(process.env.PORT || "8443", 10);
const domain = process.env.DOMAIN || "nuri.com";
const certPath = resolve(rootDir, process.env.CERT || `certs/${domain}.crt`);
const keyPath = resolve(rootDir, process.env.KEY || `certs/${domain}.key`);
const configPath = resolve(rootDir, process.env.CONFIG || "config/recovery.json");
const maxBodyBytes = 256 * 1024;
const remoteTimeoutMs = Number.parseInt(process.env.REMOTE_TIMEOUT_MS || "8000", 10);
const arkadeV4BaseUrl = process.env.ARKADE_V4_URL || "https://arkade.nuri.com/v4";
const legacySignBaseUrls = (process.env.LEGACY_SIGN_URLS || "https://sign.nuri.com/v1,https://sign.nuri.com/v2")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const mempoolApiBaseUrl = process.env.MEMPOOL_API_URL || "https://mempool.space/api";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"]
]);

const securityHeaders = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self'"
  ].join("; "),
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff"
};

function defaultConfig() {
  return {
    appName: "Nuri Passkey PRF Recovery",
    rpId: domain,
    expectedOrigin: `https://${domain}:${port}`,
    defaultUserVerification: "required",
    salt: {
      label: "PRF salt",
      encoding: "hex",
      value: ""
    },
    secondSalt: {
      label: "Second PRF salt",
      encoding: "hex",
      value: ""
    },
    credentialId: {
      encoding: "base64url",
      value: ""
    },
    derivations: [
      {
        id: "raw-prf",
        label: "Raw PRF output",
        type: "raw"
      }
    ]
  };
}

async function loadConfig() {
  const base = defaultConfig();
  if (!existsSync(configPath)) {
    return base;
  }

  const parsed = JSON.parse(await readFile(configPath, "utf8"));
  return {
    ...base,
    ...parsed,
    salt: { ...base.salt, ...(parsed.salt || {}) },
    secondSalt: { ...base.secondSalt, ...(parsed.secondSalt || {}) },
    credentialId: { ...base.credentialId, ...(parsed.credentialId || {}) },
    derivations: Array.isArray(parsed.derivations) ? parsed.derivations : base.derivations
  };
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    ...securityHeaders,
    "Content-Type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(body, null, 2));
}

async function parseJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        rejectBody(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf8");
        resolveBody(text.trim() ? JSON.parse(text) : {});
      } catch (error) {
        rejectBody(error);
      }
    });

    req.on("error", rejectBody);
  });
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/u, "");
}

function publicError(error) {
  return error?.message || String(error);
}

function validateCredentialId(value) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{8,512}$/u.test(text)) {
    throw new Error("credentialId must be base64url");
  }
  return text;
}

function validateCompressedKey(value, name) {
  const text = String(value || "").trim().toLowerCase().replace(/^0x/u, "");
  if (!/^(02|03)[0-9a-f]{64}$/u.test(text)) {
    throw new Error(`${name} must be compressed secp256k1 hex`);
  }
  return text;
}

function validateAddress(value) {
  const text = String(value || "").trim();
  if (!/^[A-Za-z0-9:._-]{8,140}$/u.test(text)) {
    throw new Error("invalid address");
  }
  return text;
}

function validateRawTx(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!/^[0-9a-f]{20,400000}$/u.test(text) || text.length % 2 !== 0) {
    throw new Error("rawTx must be raw transaction hex");
  }
  return text;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), remoteTimeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {})
      }
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text.slice(0, 2000) };
    }
    if (!response.ok) {
      const message = data?.error || data?.details || `HTTP ${response.status}`;
      throw new Error(message);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function stripAuthFields(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const clone = { ...data };
  delete clone.token;
  delete clone.challenge;
  return clone;
}

async function tryMetadataAttempt(attempt) {
  const startedAt = Date.now();
  try {
    const data = await attempt.run();
    return {
      ok: true,
      source: attempt.source,
      url: attempt.publicUrl,
      durationMs: Date.now() - startedAt,
      data: stripAuthFields(data)
    };
  } catch (error) {
    return {
      ok: false,
      source: attempt.source,
      url: attempt.publicUrl,
      durationMs: Date.now() - startedAt,
      error: publicError(error)
    };
  }
}

async function lookupRecoveryMetadata(body) {
  const credentialId = validateCredentialId(body.credentialId || body.credential_id || body.cred_id_b64u);
  const clientPk33 = validateCompressedKey(body.clientPk33 || body.client_signer_pubkey, "clientPk33");
  const credPubkey = String(body.credPubkey || body.cred_pubkey_b64u || "").trim();
  const attempts = [];

  const arkadeBase = normalizeBaseUrl(arkadeV4BaseUrl);
  const arkadeInfoUrl = `${arkadeBase}/arkade/info?client_signer_pubkey=${encodeURIComponent(clientPk33)}&cred_id_b64u=${encodeURIComponent(credentialId)}`;
  attempts.push({
    source: "arkade-v4-info",
    publicUrl: arkadeInfoUrl,
    run: () => fetchJson(arkadeInfoUrl)
  });

  for (const rawBase of legacySignBaseUrls) {
    const base = normalizeBaseUrl(rawBase);
    const label = base.endsWith("/v2") ? "legacy-sign-v2-auth" : base.endsWith("/v1") ? "legacy-sign-v1-info" : "legacy-sign-info";
    if (base.endsWith("/v2")) {
      attempts.push({
        source: label,
        publicUrl: `${base}/auth`,
        run: () =>
          fetchJson(`${base}/auth`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cred_id_b64u: credentialId,
              cred_pubkey_b64u: credPubkey || undefined,
              client_signer_pubkey: clientPk33
            })
          })
      });
      continue;
    }

    const infoUrl = `${base}/info?cred_id_b64u=${encodeURIComponent(credentialId)}${credPubkey ? `&cred_pubkey_b64u=${encodeURIComponent(credPubkey)}` : ""}`;
    attempts.push({
      source: label,
      publicUrl: infoUrl,
      run: () => fetchJson(infoUrl)
    });
  }

  return {
    ok: true,
    lookedUpAt: new Date().toISOString(),
    clientPk33,
    credentialId,
    attempts: await Promise.all(attempts.map(tryMetadataAttempt))
  };
}

async function lookupUtxos(body) {
  const addresses = Array.isArray(body.addresses) ? body.addresses.slice(0, 32) : [];
  const normalized = addresses.map((entry) => ({
    id: String(entry?.id || "").slice(0, 80),
    label: String(entry?.label || "").slice(0, 120),
    address: validateAddress(entry?.address),
    csv: entry?.csv && typeof entry.csv === "object" ? entry.csv : null
  }));

  const tipUrl = `${normalizeBaseUrl(mempoolApiBaseUrl)}/blocks/tip/height`;
  let tipHeight = null;
  try {
    const tipText = await fetchJson(tipUrl, {
      headers: { Accept: "text/plain, application/json" }
    });
    tipHeight = Number.isFinite(Number(tipText)) ? Number(tipText) : Number(tipText?.raw);
  } catch {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remoteTimeoutMs);
    try {
      const response = await fetch(tipUrl, { signal: controller.signal });
      if (response.ok) tipHeight = Number(await response.text());
    } finally {
      clearTimeout(timer);
    }
  }

  const results = await Promise.all(
    normalized.map(async (entry) => {
      const url = `${normalizeBaseUrl(mempoolApiBaseUrl)}/address/${encodeURIComponent(entry.address)}/utxo`;
      try {
        const utxos = await fetchJson(url);
        return {
          ...entry,
          ok: true,
          utxos: Array.isArray(utxos) ? utxos : []
        };
      } catch (error) {
        return {
          ...entry,
          ok: false,
          error: publicError(error),
          utxos: []
        };
      }
    })
  );

  return {
    ok: true,
    lookedUpAt: new Date().toISOString(),
    tipHeight: Number.isFinite(tipHeight) ? tipHeight : null,
    results
  };
}

async function broadcastTransaction(body) {
  const rawTx = validateRawTx(body.rawTx || body.tx || body.hex);
  const url = `${normalizeBaseUrl(mempoolApiBaseUrl)}/tx`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), remoteTimeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "text/plain"
      },
      body: rawTx
    });
    const text = (await response.text()).trim();
    if (!response.ok) {
      throw new Error(text || `HTTP ${response.status}`);
    }
    return {
      ok: true,
      broadcastAt: new Date().toISOString(),
      txid: text,
      mempoolUrl: `https://mempool.space/tx/${text}`
    };
  } finally {
    clearTimeout(timer);
  }
}

function safePublicPath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const normalized = decoded === "/" ? "/index.html" : decoded;
  const candidate = resolve(join(publicDir, `.${normalized}`));
  const publicPrefix = publicDir.endsWith(sep) ? publicDir : `${publicDir}${sep}`;

  if (candidate !== publicDir && !candidate.startsWith(publicPrefix)) {
    return null;
  }

  return candidate;
}

async function serveStatic(res, pathname) {
  const filePath = safePublicPath(pathname);
  if (!filePath) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    const data = await readFile(filePath);
    res.writeHead(200, {
      ...securityHeaders,
      "Content-Type": contentTypes.get(extname(filePath)) || "application/octet-stream"
    });
    res.end(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(res, 404, { error: "Not found" });
      return;
    }

    console.error(error);
    sendJson(res, 500, { error: "Internal server error" });
  }
}

async function requestHandler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || `${domain}:${port}`}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      requestId: randomUUID(),
      rpId: domain
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/config") {
    try {
      sendJson(res, 200, await loadConfig());
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: "Invalid recovery config" });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/recovery-metadata") {
    try {
      sendJson(res, 200, await lookupRecoveryMetadata(await parseJsonBody(req)));
    } catch (error) {
      sendJson(res, 400, { error: publicError(error) });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/utxos") {
    try {
      sendJson(res, 200, await lookupUtxos(await parseJsonBody(req)));
    } catch (error) {
      sendJson(res, 400, { error: publicError(error) });
    }
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/broadcast") {
    try {
      sendJson(res, 200, await broadcastTransaction(await parseJsonBody(req)));
    } catch (error) {
      sendJson(res, 400, { error: publicError(error) });
    }
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  await serveStatic(res, url.pathname);
}

async function main() {
  if (!existsSync(certPath) || !existsSync(keyPath)) {
    console.error(`Missing TLS certificate files:
  ${certPath}
  ${keyPath}

Run ./scripts/gen-certs.sh first, then trust certs/local-ca.crt on the machine that runs the browser.`);
    process.exit(1);
  }

  const [cert, key] = await Promise.all([readFile(certPath), readFile(keyPath)]);
  const server = createServer({ cert, key }, requestHandler);

  server.listen(port, host, () => {
    const reachableHost = host === "0.0.0.0" ? domain : `${domain}`;
    console.log(`Nuri PRF recovery server listening on https://${reachableHost}:${port}`);
    console.log(`Expected WebAuthn RP ID: ${domain}`);
    console.log("The recovered PRF output is handled only in the browser.");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
