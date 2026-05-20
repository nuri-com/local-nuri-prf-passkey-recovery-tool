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
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host || `${domain}:${port}`}`);

  if (url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      requestId: randomUUID(),
      rpId: domain
    });
    return;
  }

  if (url.pathname === "/api/config") {
    try {
      sendJson(res, 200, await loadConfig());
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: "Invalid recovery config" });
    }
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
