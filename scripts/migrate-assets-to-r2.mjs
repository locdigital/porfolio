#!/usr/bin/env node
/**
 * Idempotent, dry-run-first Cloudflare R2 asset migration script.
 *
 * Reads optimized, content-hashed derivatives produced by `scripts/optimize-assets.mjs`
 * (from `_local/r2-staging/optimization-manifest.json`), uploads missing objects to
 * Cloudflare R2 via its S3-compatible API (native Node AWS SigV4 — zero SDK bloat),
 * verifies each uploaded object via HTTPS HEAD before updating `data/r2-assets.json`,
 * creates a timestamped rollback backup before any manifest write, and preserves all
 * local originals.
 *
 * Required environment variables for live uploads (never required for --dry-run):
 *   R2_ACCOUNT_ID
 *   R2_ACCESS_KEY_ID
 *   R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME           (default: loc-digital-assets)
 *   PUBLIC_ASSET_BASE_URL    (default: https://assets.loc.digital)
 *
 * Usage:
 *   node scripts/migrate-assets-to-r2.mjs --dry-run
 *   node scripts/migrate-assets-to-r2.mjs [--staging=_local/r2-staging] [--concurrency=6]
 *     [--no-verify-public] [--limit=<n>] [--rollback=<backup-file>]
 */
import { createHash, createHmac } from "node:crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: node scripts/migrate-assets-to-r2.mjs [--dry-run] [--staging=_local/r2-staging] [--concurrency=6] [--no-verify-public] [--limit=<n>] [--rollback=<backup-path>]",
  );
  process.exit(0);
}

// Sanitized error handler so signed headers or credentials are never printed to stdout/stderr.
function failSafely(reason) {
  console.error(`[migrate-assets-to-r2] ${reason || "Migration aborted. Completed batches remain saved; rerun to resume."}`);
  process.exit(1);
}
process.on("uncaughtException", (err) => failSafely(err?.message));
process.on("unhandledRejection", (err) => failSafely(err instanceof Error ? err.message : "Unhandled rejection"));

const manifestPath = path.join(root, "data/r2-assets.json");
const rollbackArg = args.find((a) => a.startsWith("--rollback="))?.slice("--rollback=".length);

if (rollbackArg) {
  const backupFile = path.resolve(root, rollbackArg);
  const parsed = JSON.parse(await readFile(backupFile, "utf8"));
  if (!parsed || typeof parsed !== "object" || typeof parsed.assets !== "object") {
    failSafely("Rollback file is not a valid r2-assets manifest.");
  }
  await copyFile(backupFile, `${manifestPath}.tmp`);
  await rename(`${manifestPath}.tmp`, manifestPath);
  console.log(`[migrate-assets-to-r2] Restored data/r2-assets.json from ${path.relative(root, backupFile)}. Rebuild to apply rollback.`);
  process.exit(0);
}

// Load .env.local then .env without overriding already-set environment variables.
for (const envFile of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(root, envFile));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const dryRun = args.includes("--dry-run");
const verifyPublic = !args.includes("--no-verify-public");
const stagingArg = args.find((a) => a.startsWith("--staging="))?.slice("--staging=".length) || "_local/r2-staging";
const concurrency = Math.max(1, Math.min(12, Number(args.find((a) => a.startsWith("--concurrency="))?.slice("--concurrency=".length) || 6)));
const limitArg = Number(args.find((a) => a.startsWith("--limit="))?.slice("--limit=".length) || 0);

const stagingDir = path.resolve(root, stagingArg);
const stagingFilesDir = path.join(stagingDir, "objects");
const stagingManifestPath = path.join(stagingDir, "optimization-manifest.json");

const bucketName = (process.env.R2_BUCKET_NAME || "loc-digital-assets").trim();
const publicBaseUrl = (process.env.PUBLIC_ASSET_BASE_URL || "https://assets.loc.digital").trim().replace(/\/+$/, "");
const R2_FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024;
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

async function readJsonSafe(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

const stagingManifest = await readJsonSafe(stagingManifestPath, null);
const currentR2Manifest = await readJsonSafe(manifestPath, {
  version: 1,
  bucket: bucketName,
  publicBaseUrl,
  generatedAt: null,
  totals: { assets: 0, variants: 0, bytes: 0 },
  assets: {},
});

if (!stagingManifest || !stagingManifest.assets || Object.keys(stagingManifest.assets).length === 0) {
  const report = {
    dryRun,
    bucket: bucketName,
    publicBaseUrl,
    stagingManifestFound: Boolean(stagingManifest),
    stagedAssets: 0,
    pendingAssets: 0,
    pendingObjects: 0,
    pendingBytes: 0,
    nextStep: "Run `pnpm run assets:optimize` first to generate content-hashed responsive variants in _local/r2-staging/.",
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

const stagedEntries = Object.values(stagingManifest.assets);
const selectedEntries = limitArg > 0 ? stagedEntries.slice(0, limitArg) : stagedEntries;

const pendingEntries = [];
let alreadyMigrated = 0;
let pendingObjects = 0;
let pendingBytes = 0;

for (const entry of selectedEntries) {
  const existing = currentR2Manifest.assets?.[entry.sourcePath];
  if (existing && existing.hash === entry.hash && existing.verifiedAt) {
    alreadyMigrated++;
    continue;
  }
  const objectList = [
    ...(entry.variants || []),
    ...(entry.thumbnail ? [entry.thumbnail] : []),
  ];
  pendingObjects += objectList.length;
  pendingBytes += objectList.reduce((sum, obj) => sum + (obj.bytes || 0), 0);
  pendingEntries.push({ entry, objects: objectList });
}

const summary = {
  dryRun,
  bucket: bucketName,
  publicBaseUrl,
  verifyPublic,
  stagedAssets: selectedEntries.length,
  alreadyMigrated,
  pendingAssets: pendingEntries.length,
  pendingObjects,
  pendingBytes,
  pendingMiB: Number((pendingBytes / (1024 * 1024)).toFixed(2)),
  estimatedR2FreeTierPercent: Number(((pendingBytes / R2_FREE_TIER_BYTES) * 100).toFixed(2)),
};

console.log(JSON.stringify(summary, null, 2));

if (dryRun || pendingEntries.length === 0) {
  process.exit(0);
}

// Validate server-side R2 credentials before attempting any network calls.
const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

const missingEnv = [];
if (!accountId) missingEnv.push("R2_ACCOUNT_ID");
if (!accessKeyId) missingEnv.push("R2_ACCESS_KEY_ID");
if (!secretAccessKey) missingEnv.push("R2_SECRET_ACCESS_KEY");
if (missingEnv.length > 0) {
  failSafely(`Missing required R2 environment variables: ${missingEnv.join(", ")}`);
}

const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key, data) {
  return createHmac("sha256", key).update(data).digest();
}

function encodeKeyPath(key) {
  return key
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function publicUrlForKey(key) {
  return `${publicBaseUrl}/${encodeKeyPath(key)}`;
}

function signS3({ method, url, headers = {}, body = new Uint8Array(0) }) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);

  const normalized = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };
  for (const [k, v] of Object.entries(headers)) {
    normalized[k.toLowerCase()] = String(v).trim();
  }

  const keys = Object.keys(normalized).sort();
  const canonicalHeaders = keys.map((k) => `${k}:${normalized[k]}\n`).join("");
  const signedHeaders = keys.join(";");
  const canonicalRequest = [method, url.pathname, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256Hex(canonicalRequest)].join("\n");

  const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, "auto");
  const kService = hmacSha256(kRegion, "s3");
  const kSigning = hmacSha256(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const { host: _host, ...out } = normalized;
  out.authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return out;
}

async function withRetry(fn, _label, maxAttempts = 4) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise((r) => setTimeout(r, 800 * 2 ** (attempt - 1)));
    }
  }
}

async function r2Head(key) {
  return withRetry(async () => {
    const url = new URL(`/${encodeURIComponent(bucketName)}/${encodeKeyPath(key)}`, endpoint);
    const headers = signS3({ method: "HEAD", url });
    const res = await fetch(url, { method: "HEAD", headers, signal: AbortSignal.timeout(20_000) });
    if (res.status === 404) return { exists: false };
    if (!res.ok) throw new Error(`R2 HEAD HTTP ${res.status} for ${key}`);
    return {
      exists: true,
      contentLength: Number(res.headers.get("content-length") || 0),
    };
  }, `HEAD ${key}`);
}

async function r2Put(key, body, contentType) {
  return withRetry(async () => {
    const url = new URL(`/${encodeURIComponent(bucketName)}/${encodeKeyPath(key)}`, endpoint);
    const headers = signS3({
      method: "PUT",
      url,
      body,
      headers: {
        "content-type": contentType,
        "cache-control": IMMUTABLE_CACHE_CONTROL,
        "content-disposition": "inline",
      },
    });
    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: new Uint8Array(body),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) throw new Error(`R2 PUT HTTP ${res.status} for ${key}`);
  }, `PUT ${key}`);
}

async function verifyPublicHead(key, expectedBytes) {
  const url = publicUrlForKey(key);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      const len = Number(res.headers.get("content-length") || 0);
      if (res.ok && (!len || len === expectedBytes)) {
        return true;
      }
      if (attempt === 3) {
        throw new Error(`Public verification failed for ${url} (HTTP ${res.status})`);
      }
    } catch (error) {
      if (attempt === 3) throw error;
    }
    await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
  }
  return false;
}

async function saveManifest() {
  const entries = Object.values(currentR2Manifest.assets);
  currentR2Manifest.bucket = bucketName;
  currentR2Manifest.publicBaseUrl = publicBaseUrl;
  currentR2Manifest.generatedAt = new Date().toISOString();
  currentR2Manifest.totals = {
    assets: entries.length,
    variants: entries.reduce((sum, item) => sum + (item.variants?.length ?? 0), 0),
    bytes: entries.reduce(
      (sum, item) =>
        sum +
        (item.variants?.reduce((s, v) => s + (v.bytes ?? 0), 0) ?? 0) +
        (item.thumbnail?.bytes ?? 0),
      0,
    ),
  };
  const tmp = `${manifestPath}.tmp`;
  await writeFile(tmp, JSON.stringify(currentR2Manifest, null, 2) + "\n");
  await rename(tmp, manifestPath);
}

// Create timestamped rollback backup before any manifest writes.
const backupDir = path.join(root, "_local/r2-migration");
await mkdir(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `r2-assets-${Date.now()}.json`);
await copyFile(manifestPath, backupPath);
console.log(`[migrate-assets-to-r2] Rollback backup saved: ${path.relative(root, backupPath)}`);

let uploadedObjects = 0;
let reusedRemoteObjects = 0;
let completedAssets = 0;

for (let i = 0; i < pendingEntries.length; i += concurrency) {
  const batch = pendingEntries.slice(i, i + concurrency);

  await Promise.all(
    batch.map(async ({ entry, objects }) => {
      for (const obj of objects) {
        const diskPath = path.join(stagingFilesDir, obj.key);
        const body = await readFile(diskPath);

        // Idempotent check: skip PUT if object already exists on R2 with exact byte length.
        const head = await r2Head(obj.key);
        if (head.exists && head.contentLength === body.length) {
          reusedRemoteObjects++;
        } else {
          await r2Put(obj.key, body, obj.contentType || "image/webp");
          uploadedObjects++;
        }

        // Verify uploaded object on public asset domain BEFORE recording in manifest.
        if (verifyPublic) {
          await verifyPublicHead(obj.key, body.length);
        }
      }

      const mappedVariants = (entry.variants || []).map((v) => ({
        width: v.width,
        height: v.height,
        format: v.format,
        key: v.key,
        url: publicUrlForKey(v.key),
        bytes: v.bytes,
      }));

      const mappedThumb = entry.thumbnail
        ? {
            width: entry.thumbnail.width,
            height: entry.thumbnail.height,
            format: entry.thumbnail.format,
            key: entry.thumbnail.key,
            url: publicUrlForKey(entry.thumbnail.key),
            bytes: entry.thumbnail.bytes,
          }
        : undefined;

      const largestVariant = mappedVariants
        .filter((v) => v.format === "webp")
        .sort((a, b) => a.width - b.width)
        .at(-1);

      currentR2Manifest.assets[entry.sourcePath] = {
        sourcePath: entry.sourcePath,
        hash: entry.hash,
        width: entry.width,
        height: entry.height,
        aspectRatio: entry.aspectRatio,
        contentType: entry.contentType,
        bytes: entry.bytes,
        originalKey: largestVariant?.key,
        originalUrl: largestVariant?.url,
        blurDataURL: entry.blurDataURL,
        thumbnail: mappedThumb,
        variants: mappedVariants,
        verifiedAt: new Date().toISOString(),
      };
      completedAssets++;
    }),
  );

  // Persist manifest after every batch so retries never repeat completed work.
  await saveManifest();
  console.log(
    `[migrate-assets-to-r2] Progress: ${completedAssets}/${pendingEntries.length} assets (${uploadedObjects} uploaded, ${reusedRemoteObjects} reused).`,
  );
}

console.log("[migrate-assets-to-r2] Migration complete. Local originals preserved untouched.");
