#!/usr/bin/env node
/**
 * Batch responsive image optimizer for Cloudflare R2 migration.
 *
 * - Converts compatible photographs and raster images (WebP, JPEG, PNG, TIFF) into
 *   content-hashed WebP (and optional AVIF) responsive variants at 480, 768, 1200, and 1920px.
 * - Preserves aspect ratio, auto-orients via EXIF, converts to sRGB, and never upscales.
 * - Preserves Photos application metadata from src/content/photos/*.json in the staging manifest.
 * - Generates a 320px thumbnail and a lightweight 20px WebP base64 LQIP blur placeholder.
 * - Writes all outputs into `_local/r2-staging/` (gitignored) and NEVER modifies or deletes originals.
 * - Idempotent: skips files whose SHA-256 hash already matches existing staged artifacts.
 *
 * Usage:
 *   node scripts/optimize-assets.mjs [--dry-run] [--scope=photos|images|all] [--avif]
 *     [--preserve-exif] [--filter=<substring>] [--limit=<n>] [--out=<dir>]
 */
import { createHash } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: node scripts/optimize-assets.mjs [--dry-run] [--scope=photos|images|all] [--avif] [--preserve-exif] [--filter=<pattern>] [--limit=<n>] [--out=<dir>]",
  );
  process.exit(0);
}

const dryRun = args.includes("--dry-run");
const includeAvif = args.includes("--avif");
const preserveExif = args.includes("--preserve-exif");
const scopeArg = args.find((a) => a.startsWith("--scope="))?.slice("--scope=".length) || "all";
const filterArg = args.find((a) => a.startsWith("--filter="))?.slice("--filter=".length) || "";
const limitArg = Number(args.find((a) => a.startsWith("--limit="))?.slice("--limit=".length) || 0);
const outArg = args.find((a) => a.startsWith("--out="))?.slice("--out=".length) || "_local/r2-staging";

if (!["photos", "images", "all"].includes(scopeArg)) {
  throw new Error(`Invalid --scope value "${scopeArg}". Use photos, images, or all.`);
}

const RESPONSIVE_WIDTHS = [480, 768, 1200, 1920];
const THUMBNAIL_WIDTH = 320;
const PLACEHOLDER_WIDTH = 20;
const COMPATIBLE_EXT = /\.(?:jpe?g|png|webp|tiff?)$/i;
const SKIP_DIRS = new Set(["dock"]); // tiny icons handled separately

const stagingDir = path.resolve(root, outArg);
const stagingFilesDir = path.join(stagingDir, "objects");
const manifestPath = path.join(stagingDir, "optimization-manifest.json");

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function qualityForWidth(width, format) {
  if (format === "avif") {
    if (width <= 480) return 55;
    if (width <= 768) return 60;
    return 65;
  }
  if (width <= 480) return 80;
  if (width <= 768) return 82;
  if (width <= 1200) return 86;
  return 90;
}

/**
 * Loads photography metadata from src/content/photos/*.json keyed by `/assets/photos/...`
 * so EXIF/story/camera metadata required by the Photos application is preserved alongside derivatives.
 */
async function loadPhotoMetadataIndex() {
  const index = new Map();
  const photosContentDir = path.join(root, "src/content/photos");
  let files;
  try {
    files = await readdir(photosContentDir);
  } catch {
    return index;
  }
  for (const filename of files) {
    if (!filename.endsWith(".json")) continue;
    const album = JSON.parse(await readFile(path.join(photosContentDir, filename), "utf8"));
    const slug = album.slug || filename.slice(0, -5);
    for (const img of album.images || []) {
      if (!img?.src) continue;
      index.set(img.src, {
        albumSlug: slug,
        title: img.title,
        alt: img.alt,
        caption: img.caption,
        story: img.story,
        capturedAt: img.capturedAt,
        capturedTimeZone: img.capturedTimeZone,
        location: img.location,
        camera: img.camera,
        lens: img.lens,
        focalLength: img.focalLength,
        aperture: img.aperture,
        shutterSpeed: img.shutterSpeed,
        iso: img.iso,
        latitude: img.latitude,
        longitude: img.longitude,
        copyright: img.copyright,
        creator: img.creator,
      });
    }
  }
  return index;
}

async function collectCandidateFiles() {
  const candidates = [];
  const rootsToScan = [];
  if (scopeArg === "photos" || scopeArg === "all") {
    rootsToScan.push(path.join(root, "public/assets/photos"));
  }
  if (scopeArg === "images" || scopeArg === "all") {
    rootsToScan.push(
      path.join(root, "public/images"),
      path.join(root, "public/uploads"),
      path.join(root, "public/instagram_workflowspace"),
    );
  }

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        await walk(path.join(dir, entry.name));
      } else if (entry.isFile() && COMPATIBLE_EXT.test(entry.name)) {
        const abs = path.join(dir, entry.name);
        const relPublic = "/" + path.relative(path.join(root, "public"), abs).split(path.sep).join("/");
        if (filterArg && !relPublic.toLowerCase().includes(filterArg.toLowerCase())) continue;
        candidates.push({ abs, sourcePath: relPublic });
      }
    }
  }

  for (const scanRoot of rootsToScan) {
    await walk(scanRoot);
  }

  candidates.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
  return limitArg > 0 ? candidates.slice(0, limitArg) : candidates;
}

function buildHashedObjectKey(sourcePath, widthLabel, contentHash, ext) {
  const normalized = sourcePath.replace(/^\/+/, "");
  const dir = path.posix.dirname(normalized);
  const stem = path.posix
    .basename(normalized, path.posix.extname(normalized))
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase();
  const shortHash = contentHash.slice(0, 12);
  const cleanDir = dir === "." ? "misc" : dir;
  return `media/${cleanDir}/${stem}.${widthLabel}.${shortHash}.${ext}`;
}

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readExistingManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return {
      version: 1,
      generatedAt: null,
      responsiveWidths: RESPONSIVE_WIDTHS,
      includeAvif,
      assets: {},
    };
  }
}

const photoMetadataIndex = await loadPhotoMetadataIndex();
const candidates = await collectCandidateFiles();
const existingManifest = await readExistingManifest();

let processed = 0;
let skipped = 0;
let totalInputBytes = 0;
let totalOutputBytes = 0;
let totalVariants = 0;

if (!dryRun) {
  await mkdir(stagingFilesDir, { recursive: true });
}

for (const candidate of candidates) {
  const sourceBuffer = await readFile(candidate.abs);
  const sourceHash = sha256(sourceBuffer);
  totalInputBytes += sourceBuffer.length;

  const existingEntry = existingManifest.assets?.[candidate.sourcePath];
  if (
    existingEntry &&
    existingEntry.hash === sourceHash &&
    (!includeAvif || existingEntry.variants?.some((v) => v.format === "avif"))
  ) {
    let allStagedPresent = true;
    if (!dryRun) {
      for (const variant of existingEntry.variants || []) {
        if (!(await fileExists(path.join(stagingFilesDir, variant.key)))) {
          allStagedPresent = false;
          break;
        }
      }
      if (existingEntry.thumbnail && !(await fileExists(path.join(stagingFilesDir, existingEntry.thumbnail.key)))) {
        allStagedPresent = false;
      }
    }
    if (allStagedPresent) {
      skipped++;
      totalVariants += existingEntry.variants?.length ?? 0;
      totalOutputBytes +=
        (existingEntry.variants?.reduce((sum, v) => sum + (v.bytes ?? 0), 0) ?? 0) +
        (existingEntry.thumbnail?.bytes ?? 0);
      continue;
    }
  }

  const pipeline = sharp(sourceBuffer, { failOn: "error", limitInputPixels: false });
  let meta;
  try {
    meta = await pipeline.metadata();
  } catch {
    console.warn(`[optimize-assets] Skipping unreadable image: ${candidate.sourcePath}`);
    continue;
  }
  const orientedWidth = [5, 6, 7, 8].includes(meta.orientation) ? meta.height : meta.width;
  const orientedHeight = [5, 6, 7, 8].includes(meta.orientation) ? meta.width : meta.height;

  if (!orientedWidth || !orientedHeight) {
    console.warn(`[optimize-assets] Skipping unreadable image: ${candidate.sourcePath}`);
    continue;
  }

  const targetWidths = [
    ...new Set(RESPONSIVE_WIDTHS.map((w) => Math.min(w, orientedWidth))),
  ].sort((a, b) => a - b);

  if (dryRun) {
    processed++;
    totalVariants += targetWidths.length * (includeAvif ? 2 : 1);
    continue;
  }

  const variants = [];

  for (const width of targetWidths) {
    const height = Math.max(1, Math.round((width * orientedHeight) / orientedWidth));
    let resized = pipeline
      .clone()
      .rotate()
      .toColourspace("srgb")
      .resize({ width, withoutEnlargement: true });
    if (preserveExif) {
      resized = resized.withMetadata();
    }

    const webpBuffer = await resized
      .clone()
      .webp({ quality: qualityForWidth(width, "webp"), effort: 5 })
      .toBuffer();
    const webpHash = sha256(webpBuffer);
    const webpKey = buildHashedObjectKey(candidate.sourcePath, `${width}w`, webpHash, "webp");
    const webpDiskPath = path.join(stagingFilesDir, webpKey);
    await mkdir(path.dirname(webpDiskPath), { recursive: true });
    await writeFile(webpDiskPath, webpBuffer);

    variants.push({
      width,
      height,
      format: "webp",
      key: webpKey,
      contentType: "image/webp",
      bytes: webpBuffer.length,
      sha256: webpHash,
    });
    totalOutputBytes += webpBuffer.length;
    totalVariants++;

    if (includeAvif) {
      const avifBuffer = await resized
        .clone()
        .avif({ quality: qualityForWidth(width, "avif"), effort: 4 })
        .toBuffer();
      // Keep AVIF only when it meaningfully beats WebP (>= 15% savings).
      if (avifBuffer.length < webpBuffer.length * 0.85) {
        const avifHash = sha256(avifBuffer);
        const avifKey = buildHashedObjectKey(candidate.sourcePath, `${width}w`, avifHash, "avif");
        const avifDiskPath = path.join(stagingFilesDir, avifKey);
        await mkdir(path.dirname(avifDiskPath), { recursive: true });
        await writeFile(avifDiskPath, avifBuffer);

        variants.push({
          width,
          height,
          format: "avif",
          key: avifKey,
          contentType: "image/avif",
          bytes: avifBuffer.length,
          sha256: avifHash,
        });
        totalOutputBytes += avifBuffer.length;
        totalVariants++;
      }
    }
  }

  // Generate 320px thumbnail
  const thumbWidth = Math.min(THUMBNAIL_WIDTH, orientedWidth);
  const thumbHeight = Math.max(1, Math.round((thumbWidth * orientedHeight) / orientedWidth));
  const thumbBuffer = await pipeline
    .clone()
    .rotate()
    .toColourspace("srgb")
    .resize({ width: thumbWidth, withoutEnlargement: true })
    .webp({ quality: 76, effort: 5 })
    .toBuffer();
  const thumbHash = sha256(thumbBuffer);
  const thumbKey = buildHashedObjectKey(candidate.sourcePath, "thumb", thumbHash, "webp");
  const thumbDiskPath = path.join(stagingFilesDir, thumbKey);
  await mkdir(path.dirname(thumbDiskPath), { recursive: true });
  await writeFile(thumbDiskPath, thumbBuffer);
  totalOutputBytes += thumbBuffer.length;

  // Generate lightweight LQIP blur placeholder (20px WebP base64 data URI)
  const lqipBuffer = await pipeline
    .clone()
    .rotate()
    .toColourspace("srgb")
    .resize({ width: PLACEHOLDER_WIDTH, withoutEnlargement: true })
    .blur(1.2)
    .webp({ quality: 35 })
    .toBuffer();
  const blurDataURL = `data:image/webp;base64,${lqipBuffer.toString("base64")}`;

  const photoMeta = photoMetadataIndex.get(candidate.sourcePath);

  existingManifest.assets[candidate.sourcePath] = {
    sourcePath: candidate.sourcePath,
    hash: sourceHash,
    width: orientedWidth,
    height: orientedHeight,
    aspectRatio: Number((orientedWidth / orientedHeight).toFixed(4)),
    contentType: "image/webp",
    bytes: sourceBuffer.length,
    blurDataURL,
    thumbnail: {
      width: thumbWidth,
      height: thumbHeight,
      format: "webp",
      key: thumbKey,
      contentType: "image/webp",
      bytes: thumbBuffer.length,
      sha256: thumbHash,
    },
    variants,
    ...(photoMeta ? { photoMetadata: photoMeta } : {}),
  };

  processed++;
  if (processed % 25 === 0) {
    console.log(`[optimize-assets] Processed ${processed}/${candidates.length} assets...`);
  }
}

if (!dryRun) {
  existingManifest.generatedAt = new Date().toISOString();
  existingManifest.responsiveWidths = RESPONSIVE_WIDTHS;
  existingManifest.includeAvif = includeAvif;
  existingManifest.totals = {
    assets: Object.keys(existingManifest.assets).length,
    variants: Object.values(existingManifest.assets).reduce(
      (sum, entry) => sum + (entry.variants?.length ?? 0),
      0,
    ),
    bytes: Object.values(existingManifest.assets).reduce(
      (sum, entry) =>
        sum +
        (entry.variants?.reduce((s, v) => s + (v.bytes ?? 0), 0) ?? 0) +
        (entry.thumbnail?.bytes ?? 0),
      0,
    ),
  };
  const tmp = `${manifestPath}.tmp`;
  await writeFile(tmp, JSON.stringify(existingManifest, null, 2) + "\n");
  await rename(tmp, manifestPath);
  await rm(tmp, { force: true }).catch(() => {});
}

console.log(
  JSON.stringify(
    {
      dryRun,
      scope: scopeArg,
      includeAvif,
      candidates: candidates.length,
      processed,
      skipped,
      totalVariants,
      totalInputBytes,
      totalOutputBytes,
      stagingDir: path.relative(root, stagingDir),
    },
    null,
    2,
  ),
);
