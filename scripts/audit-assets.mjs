#!/usr/bin/env node
/**
 * Comprehensive asset & infrastructure media auditor for loc.digital.
 *
 * Scans public/, src/assets/, and root wallpaper assets, reports format & directory
 * breakdowns, SHA-256 duplicates, unoptimized raster candidates, large files,
 * UploadThing vs Cloudflare R2 manifest coverage, and R2 free-tier headroom.
 *
 * Usage:
 *   node scripts/audit-assets.mjs [--json] [--write=<output-path>]
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log("Usage: node scripts/audit-assets.mjs [--json] [--write=<path>]");
  process.exit(0);
}

const jsonOnly = args.includes("--json");
const writeArg = args.find((a) => a.startsWith("--write="));
const writePath = writeArg ? path.resolve(root, writeArg.slice("--write=".length)) : null;

const ASSET_EXTENSIONS = /\.(?:avif|gif|heic|ico|jpe?g|png|svg|tiff?|webp|m4v|mov|mp4|webm|mp3|m4a|wav|woff2?|ttf|otf|pdf)$/i;
const RASTER_CANDIDATES = /\.(?:jpe?g|png|tiff?)$/i;
const R2_FREE_TIER_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

const byFormat = {};
const byCategory = {};
const hashes = new Map();
const largeFiles = [];
const rasterOptimizationCandidates = [];
let totalFiles = 0;
let totalBytes = 0;
let duplicateBytes = 0;

function categorize(relPath) {
  if (relPath.startsWith("public/assets/photos/")) return "photos";
  if (relPath.startsWith("public/images/netflix/")) return "netflix";
  if (relPath.startsWith("public/images/writing/")) return "writing";
  if (relPath.startsWith("public/images/")) return "images";
  if (relPath.startsWith("public/assets/logos/")) return "logos";
  if (relPath.startsWith("public/assets/dock/")) return "dock";
  if (relPath.startsWith("public/uploads/")) return "uploads";
  if (relPath.startsWith("public/instagram_workflowspace/")) return "instagram";
  if (relPath.startsWith("src/assets/fonts/")) return "fonts";
  if (relPath.startsWith("src/")) return "src-assets";
  return "root-and-other";
}

async function inspectFile(absPath) {
  const relPath = path.relative(root, absPath).split(path.sep).join("/");
  const contents = await readFile(absPath);
  const size = contents.length;
  const digest = createHash("sha256").update(contents).digest("hex");
  const ext = path.extname(absPath).slice(1).toLowerCase() || "unknown";
  const category = categorize(relPath);

  totalFiles++;
  totalBytes += size;

  byFormat[ext] ??= { files: 0, bytes: 0 };
  byFormat[ext].files++;
  byFormat[ext].bytes += size;

  byCategory[category] ??= { files: 0, bytes: 0 };
  byCategory[category].files++;
  byCategory[category].bytes += size;

  if (hashes.has(digest)) {
    duplicateBytes += size;
  }
  const existing = hashes.get(digest) ?? [];
  existing.push(relPath);
  hashes.set(digest, existing);

  if (size >= 500 * 1024) {
    largeFiles.push({ path: relPath, bytes: size, ext });
  }

  if (RASTER_CANDIDATES.test(absPath) && size >= 50 * 1024) {
    rasterOptimizationCandidates.push({ path: relPath, bytes: size, ext });
  }
}

async function scanDirectory(dirPath) {
  let entries;
  try {
    entries = await readdir(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await scanDirectory(full);
    } else if (entry.isFile() && ASSET_EXTENSIONS.test(entry.name)) {
      await inspectFile(full);
    }
  }
}

await scanDirectory(path.join(root, "public"));
await scanDirectory(path.join(root, "src"));

// Inspect manifests
async function readJsonSafe(relPath, fallback) {
  try {
    return JSON.parse(await readFile(path.join(root, relPath), "utf8"));
  } catch {
    return fallback;
  }
}

const uploadThingManifest = await readJsonSafe("data/uploadthing-images.json", { images: {}, unique: {} });
const r2Manifest = await readJsonSafe("data/r2-assets.json", { assets: {}, totals: { assets: 0, variants: 0, bytes: 0 } });

// Count published photo references from src/content/photos
let publishedAlbums = 0;
let publishedPhotoRefs = 0;
try {
  for (const filename of await readdir(path.join(root, "src/content/photos"))) {
    if (!filename.endsWith(".json")) continue;
    const album = JSON.parse(await readFile(path.join(root, "src/content/photos", filename), "utf8"));
    if (album.published === false) continue;
    publishedAlbums++;
    publishedPhotoRefs += Array.isArray(album.images) ? album.images.length : 0;
  }
} catch {
  // Ignore if absent
}

largeFiles.sort((a, b) => b.bytes - a.bytes);
rasterOptimizationCandidates.sort((a, b) => b.bytes - a.bytes);

const duplicates = [...hashes.values()].filter((paths) => paths.length > 1);

const report = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalFiles,
    totalBytes,
    totalMiB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    uniqueFiles: hashes.size,
    duplicateGroups: duplicates.length,
    duplicateBytes,
    r2FreeTierPercent: Number(((totalBytes / R2_FREE_TIER_BYTES) * 100).toFixed(2)),
  },
  byFormat,
  byCategory,
  manifests: {
    uploadThing: {
      mappedPaths: Object.keys(uploadThingManifest.images || {}).length,
      uniqueObjects: Object.keys(uploadThingManifest.unique || {}).length,
    },
    cloudflareR2: {
      bucket: r2Manifest.bucket || "loc-digital-assets",
      publicBaseUrl: r2Manifest.publicBaseUrl || "https://assets.loc.digital",
      migratedAssets: Object.keys(r2Manifest.assets || {}).length,
      totalVariants: r2Manifest.totals?.variants ?? 0,
      totalBytes: r2Manifest.totals?.bytes ?? 0,
    },
  },
  contentPhotos: {
    publishedAlbums,
    publishedPhotoRefs,
  },
  rasterOptimizationCandidates: {
    count: rasterOptimizationCandidates.length,
    totalBytes: rasterOptimizationCandidates.reduce((sum, item) => sum + item.bytes, 0),
    top: rasterOptimizationCandidates.slice(0, 20),
  },
  largeFiles: {
    thresholdBytes: 500 * 1024,
    count: largeFiles.length,
    top: largeFiles.slice(0, 20),
  },
  duplicates,
};

if (writePath) {
  await mkdir(path.dirname(writePath), { recursive: true });
  await writeFile(writePath, JSON.stringify(report, null, 2) + "\n");
}

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const formatMiB = (b) => `${(b / (1024 * 1024)).toFixed(2)} MiB`;
  console.log("=== loc.digital Asset Audit ===");
  console.log(`Files: ${report.summary.totalFiles} (${report.summary.uniqueFiles} unique, ${report.summary.duplicateGroups} duplicate groups)`);
  console.log(`Total size: ${formatMiB(report.summary.totalBytes)} (${report.summary.r2FreeTierPercent}% of R2 10 GB free tier)`);
  console.log(`Published photo albums: ${publishedAlbums} (${publishedPhotoRefs} image references)`);
  console.log(`UploadThing manifest: ${report.manifests.uploadThing.uniqueObjects} unique objects (${report.manifests.uploadThing.mappedPaths} path mappings)`);
  console.log(`Cloudflare R2 manifest: ${report.manifests.cloudflareR2.migratedAssets} migrated assets (${report.manifests.cloudflareR2.totalVariants} variants)`);
  console.log(`Unoptimized JPEG/PNG >=50 KiB: ${report.rasterOptimizationCandidates.count} files (${formatMiB(report.rasterOptimizationCandidates.totalBytes)})`);
  console.log("\nBy category:");
  for (const [cat, stats] of Object.entries(byCategory).sort((a, b) => b[1].bytes - a[1].bytes)) {
    console.log(`  - ${cat.padEnd(16)} ${String(stats.files).padStart(4)} files  ${formatMiB(stats.bytes)}`);
  }
  console.log("\nBy format:");
  for (const [fmt, stats] of Object.entries(byFormat).sort((a, b) => b[1].bytes - a[1].bytes)) {
    console.log(`  - ${fmt.padEnd(8)} ${String(stats.files).padStart(4)} files  ${formatMiB(stats.bytes)}`);
  }
  if (writePath) {
    console.log(`\nWrote JSON audit report to ${path.relative(root, writePath)}`);
  }
}
