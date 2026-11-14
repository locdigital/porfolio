import { createHash } from "node:crypto";
import { readFile, readdir, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { UTApi, UTFile } from "uploadthing/server";

// SDK exceptions can contain request headers and credentials. Never dump them.
function failSafely() {
  console.error("Photo synchronization failed. Completed batches are saved; rerun to resume.");
  process.exit(1);
}
process.on("uncaughtException", failSafely);
process.on("unhandledRejection", failSafely);

const root = fileURLToPath(new URL("../", import.meta.url));
if (process.argv.includes("--help")) {
  console.log("Usage: node scripts/upload-photo-assets.mjs [--dry-run]");
  process.exit(0);
}
if (process.argv.slice(2).some((arg) => arg !== "--dry-run")) throw new Error("Unknown argument. Use --help.");
const manifestPath = path.join(root, "data/uploadthing-images.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const dryRun = process.argv.includes("--dry-run");

// Existing environment values take precedence; never print credentials.
for (const filename of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(path.join(root, filename));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const sources = new Set();
for (const filename of await readdir(path.join(root, "src/content/photos"))) {
  if (!filename.endsWith(".json")) continue;
  const album = JSON.parse(await readFile(path.join(root, "src/content/photos", filename), "utf8"));
  for (const src of [album.heroImage?.src, album.seoImage, ...album.images.map((image) => image.src)]) {
    if (src?.startsWith("/assets/photos/")) sources.add(src);
  }
}

const pending = new Map();
let mapped = 0;
let reused = 0;
let uploaded = 0;

function record(asset, url, fileKey, fileHash) {
  const entry = manifest.unique[asset.hash] ?? { url, fileKey, fileHash, paths: [] };
  for (const src of asset.sources) {
    for (const prefix of ["public", "src"]) {
      const key = `${prefix}${src}`;
      manifest.images[key] = url;
      if (!entry.paths.includes(key)) entry.paths.push(key);
    }
  }
  manifest.unique[asset.hash] = entry;
}

for (const src of sources) {
  if (manifest.images[`public${src}`] || manifest.images[`src${src}`]) {
    mapped++;
    continue;
  }
  const filePath = path.resolve(root, "public", `.${src}`);
  const photoRoot = path.join(root, "public/assets/photos") + path.sep;
  if (!filePath.startsWith(photoRoot)) throw new Error("Photo path escapes the photo directory.");
  const buffer = await readFile(filePath);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const asset = { hash, sources: [src], buffer };
  const existing = manifest.unique[hash];
  if (existing) {
    record(asset, existing.url, existing.fileKey, existing.fileHash);
    reused++;
  } else if (pending.has(hash)) {
    pending.get(hash).sources.push(src);
  } else {
    pending.set(hash, asset);
  }
}

console.log(JSON.stringify({ sources: sources.size, mapped, reused, pending: pending.size, dryRun }));
if (dryRun) process.exit(0);
if (!process.env.UPLOADTHING_TOKEN) throw new Error("UPLOADTHING_TOKEN is required.");
const tokenAppId = JSON.parse(Buffer.from(process.env.UPLOADTHING_TOKEN, "base64").toString()).appId;
if (tokenAppId !== manifest.appId) throw new Error("UploadThing app does not match the image manifest.");
// SDK error logs include signed upload URLs; report only sanitized result codes below.
const api = new UTApi({ logLevel: "None" });

async function save() {
  manifest.generatedAt = new Date().toISOString();
  manifest.totals.images = Object.keys(manifest.images).length;
  manifest.totals.unique = Object.keys(manifest.unique).length;
  manifest.photoSync = { sources: sources.size, mapped, reused, uploaded, remaining: pending.size };
  await writeFile(`${manifestPath}.tmp`, JSON.stringify(manifest, null, 2) + "\n");
  await rename(`${manifestPath}.tmp`, manifestPath);
}

// Recover uploads from an interrupted run before creating any new files.
if (pending.size) {
  let offset = 0;
  let hasMore = true;
  while (hasMore) {
    let listing;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        listing = await api.listFiles({ limit: 500, offset });
        break;
      } catch {
        if (attempt === 3) throw new Error("Could not list UploadThing files after three attempts.");
        console.log("Retrying UploadThing connection...");
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
    for (const file of listing.files) {
      if (file.status !== "Uploaded" || !file.customId?.startsWith("portfolio-photo-")) continue;
      const hash = file.customId.slice("portfolio-photo-".length);
      const asset = pending.get(hash);
      if (!asset) continue;
      record(asset, `https://${manifest.appId}.ufs.sh/f/${file.key}`, file.key, createHash("md5").update(asset.buffer).digest("hex"));
      pending.delete(hash);
      reused++;
    }
    hasMore = listing.hasMore;
    offset += listing.files.length;
    if (hasMore && !listing.files.length) throw new Error("UploadThing returned an empty page with hasMore=true.");
  }
}
await save();

const queue = [...pending.values()];
for (let start = 0; start < queue.length; start += 12) {
  const batch = queue.slice(start, start + 12);
  const files = batch.map((asset) => new UTFile(
    [asset.buffer],
    asset.sources[0].slice("/assets/photos/".length).replaceAll("/", "-"),
    { type: "image/webp", customId: `portfolio-photo-${asset.hash}` },
  ));
  const results = await api.uploadFiles(files, { concurrency: 6, contentDisposition: "inline" });
  const failures = [];
  for (const [index, result] of results.entries()) {
    const asset = batch[index];
    if (!result.data) {
      failures.push({ source: asset.sources[0], code: result.error?.code });
      continue;
    }
    const url = result.data.ufsUrl;
    if (!url?.startsWith(`https://${manifest.appId}.ufs.sh/f/`)) throw new Error("Unexpected CDN URL.");
    record(asset, url, result.data.key, createHash("md5").update(asset.buffer).digest("hex"));
    pending.delete(asset.hash);
    uploaded++;
  }
  // Persist every batch so retries never re-upload completed images.
  await save();
  console.log(`Uploaded ${uploaded}/${queue.length}; ${pending.size} remaining.`);
  if (failures.length) throw new Error(JSON.stringify(failures));
}
console.log("Photo assets synchronized to UploadThing.");
