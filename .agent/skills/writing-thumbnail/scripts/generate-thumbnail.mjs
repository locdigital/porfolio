import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { randomInt } from "node:crypto";

const WIDTH = 1920;
const HEIGHT = 1080;
const PHOTO_DIRS_ROOT = "public/assets/photos";
const PHOTO_CONTENT_DIR = "src/content/photos";
const UPLOAD_MANIFEST_PATH = "data/uploadthing-images.json";
const THUMBNAIL_INDEX_PATH = "data/writing-thumbnails.json";
const LEGACY_SCRIPT_PATH = "scripts/generate-writing-thumbnails.mjs";
const WRITING_DIR = "src/content/writing";

export const PIXEL_ART_PROMPT = `Turn the provided photo into a polished pixel-art illustration in a cute chibi anime style.

Keep the original composition, pose, camera angle, framing, main subject, and background layout from the reference photo. Preserve the important objects and scene structure exactly, only transform everything into pixel art.

Style direction:
- retro pixel-art aesthetic
- visible square pixels
- clean dark outlines
- soft blocky shading
- cute chibi proportions
- expressive anime-style eyes
- soft muted colors
- polished game-sprite look
- detailed but simplified forms
- cozy and aesthetic overall vibe

Character treatment:
- keep the person recognizable
- slightly cute/chibi face styling
- natural skin tone, can be slightly sun-tanned
- keep hairstyle, outfit, accessories, and props accurate
- preserve glasses, watch, backpack, camera, or any key item from the original image

Environment treatment:
- preserve the full scene and composition
- simplify the background into pixel-art forms
- keep plants, flowers, stairs, railing, wall, and foreground elements if they exist
- maintain depth and layering, but in a simplified pixel-art way

Important:
- do not make it photorealistic
- do not redesign the scene
- do not change the pose
- do not add extra characters
- keep the same vibe as a polished pixel-art portrait illustration
- keep everything consistent with the original photo, only convert it into pixel art
- use scenery-only source photos with no people
- do not add any person, face, body part, crowd, or human silhouette`;

const PEOPLE_METADATA_PATTERN = /\b(person|people|man|men|woman|women|boy|boys|girl|girls|child|children|couple|family|crowd|portrait|selfie|tourist|travell?er|hiker|rider|cyclist|driver|passenger|worker|vendor|fisher(?:man|men)?|boatman|pedestrian|human|nguoi|dan ong|phu nu|tre em)\b/i;

/**
 * Parse CLI arguments supporting `--key value` and boolean `--flag` options.
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function normalizeAscii(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d");
}

/**
 * Build reverse map from UploadThing URLs to local photo paths under public/assets/photos.
 */
function loadUploadReverseMap(root) {
  const map = new Map();
  const manifestFile = path.join(root, UPLOAD_MANIFEST_PATH);
  if (!fs.existsSync(manifestFile)) return map;

  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  for (const [relPath, url] of Object.entries(manifest.images || {})) {
    if (!relPath.startsWith(`${PHOTO_DIRS_ROOT}/`)) continue;
    const absPath = path.join(root, relPath);
    if (fs.existsSync(absPath)) {
      map.set(url, relPath);
    }
  }
  return map;
}

/**
 * Collect photo paths and albums already assigned to other writing posts.
 */
function loadUsedSources(root, { excludeSlug } = {}) {
  const usedPhotos = new Set();
  const usedAlbums = new Set();
  let existingRecord = null;

  const legacyPath = path.join(root, LEGACY_SCRIPT_PATH);
  if (fs.existsSync(legacyPath)) {
    const src = fs.readFileSync(legacyPath, "utf8");
    for (const match of src.matchAll(/slug:\s*"([^"]+)"[\s\S]*?source:\s*"([^"]+)"/g)) {
      const [, postSlug, sourcePath] = match;
      if (excludeSlug && postSlug === excludeSlug) continue;
      usedPhotos.add(sourcePath);
      const albumMatch = sourcePath.match(/assets\/photos\/([^/]+)\//);
      if (albumMatch) usedAlbums.add(albumMatch[1]);
    }
  }

  const indexPath = path.join(root, THUMBNAIL_INDEX_PATH);
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    for (const [postSlug, record] of Object.entries(index)) {
      if (excludeSlug && postSlug === excludeSlug) {
        existingRecord = record;
        continue;
      }
      if (record?.source) usedPhotos.add(record.source);
      if (record?.album) usedAlbums.add(record.album);
    }
  }

  const writingDir = path.join(root, WRITING_DIR);
  if (fs.existsSync(writingDir)) {
    for (const file of fs.readdirSync(writingDir)) {
      if (!file.endsWith(".md")) continue;
      const postSlug = file.slice(0, -3);
      if (excludeSlug && postSlug === excludeSlug) continue;
      const content = fs.readFileSync(path.join(writingDir, file), "utf8");
      const altMatch = content.match(/^\s*alt:\s*"([^"]+)"/m);
      if (altMatch) {
        for (const knownAlbum of ["ta chi nhu", "singapore", "ha giang", "sa pa", "bali", "kuala lumpur", "phu quy"]) {
          if (normalizeAscii(altMatch[1]).toLowerCase().includes(knownAlbum)) {
            usedAlbums.add(knownAlbum.replace(/\s+/g, "-"));
          }
        }
      }
    }
  }

  return { usedPhotos, usedAlbums, existingRecord };
}

/**
 * Load all published album photos that resolve cleanly to local files on disk.
 */
function loadLocalAlbumPhotos(root) {
  const urlToLocal = loadUploadReverseMap(root);
  const photosDir = path.join(root, PHOTO_CONTENT_DIR);
  const candidates = [];

  for (const file of fs.readdirSync(photosDir).sort()) {
    if (!file.endsWith(".json")) continue;
    const album = JSON.parse(fs.readFileSync(path.join(photosDir, file), "utf8"));
    if (album.published === false) continue;

    const albumSlug = album.slug || file.slice(0, -5);
    const albumText = [
      albumSlug,
      album.name,
      album.location,
      album.region,
      album.headline,
      album.shortDescription,
      ...(album.tags || []),
    ]
      .filter(Boolean)
      .join(" ");

    for (const img of album.images || []) {
      const localRel = img.src.startsWith("/assets/photos/")
        ? `public${img.src}`
        : urlToLocal.get(img.src);
      if (!localRel) continue;
      const absPath = path.join(root, localRel);
      if (!fs.existsSync(absPath)) continue;

      const width = Number(img.width) || 0;
      const height = Number(img.height) || 0;
      candidates.push({
        albumSlug,
        albumName: album.name || album.location || albumSlug,
        localRel,
        absPath,
        width,
        height,
        isLandscape: width > 0 && height > 0 ? width >= height : true,
        isCover: Boolean(img.isCover),
        order: Number(img.order) || 999,
        title: img.title || "",
        story: img.story || "",
        location: img.location || album.location || albumSlug,
        searchableText: `${albumText} ${img.title || ""} ${img.story || ""} ${img.location || ""} ${img.alt || ""} ${img.caption || ""}`,
      });
    }
  }

  return candidates;
}

/**
 * Resolve explicit `--photo` argument to a verified local path and optional album metadata.
 */
function resolveExplicitPhoto(root, photoArg, candidates) {
  const cleaned = photoArg.startsWith("/assets/") ? `public${photoArg}` : photoArg;
  const matched = candidates.find(
    (c) => c.localRel === cleaned || c.absPath === path.resolve(root, photoArg),
  );
  if (matched) return matched;

  const abs = path.isAbsolute(cleaned) ? cleaned : path.resolve(root, cleaned);
  if (!fs.existsSync(abs)) {
    throw new Error(`Photo file not found: ${photoArg}`);
  }
  const rel = path.relative(root, abs);
  const albumMatch = rel.match(/assets\/photos\/([^/]+)\//);
  return {
    albumSlug: albumMatch?.[1] || "custom",
    albumName: albumMatch?.[1] || "custom",
    localRel: rel,
    absPath: abs,
    width: 0,
    height: 0,
    isLandscape: true,
    isCover: false,
    order: 1,
    title: "",
    story: "",
    location: albumMatch?.[1] || "custom",
    searchableText: rel,
  };
}

/**
 * Pick a random unused landscape photo from the published Photography collection.
 */
function selectRandomAlbumPhoto({ candidates, usedPhotos, usedAlbums, albumSlug, excludedPhotos }) {
  let pool = albumSlug
    ? candidates.filter((c) => c.albumSlug === albumSlug)
    : candidates;

  pool = pool.filter(
    (candidate) =>
      !excludedPhotos.has(candidate.localRel) &&
      !PEOPLE_METADATA_PATTERN.test(normalizeAscii(candidate.searchableText)),
  );

  if (pool.length === 0) {
    throw new Error(albumSlug ? `No local album photos found for album "${albumSlug}".` : "No local album photos found.");
  }

  const landscapePool = pool.filter((c) => c.isLandscape);
  if (landscapePool.length > 0) pool = landscapePool;

  const unusedPool = pool.filter((c) => !usedPhotos.has(c.localRel));
  if (unusedPool.length > 0) pool = unusedPool;

  const unusedAlbumPool = pool.filter((c) => !usedAlbums.has(c.albumSlug));
  if (unusedAlbumPool.length > 0) pool = unusedAlbumPool;

  return pool[randomInt(pool.length)];
}

function escapeYamlDoubleQuoted(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function attachCoverToArticle(root, slug, { coverSrc, suggestedAlt, width, height }) {
  const articlePath = path.join(root, WRITING_DIR, `${slug}.md`);
  if (!fs.existsSync(articlePath)) {
    throw new Error(`Writing article not found: ${path.relative(root, articlePath)}`);
  }
  if (!coverSrc) {
    throw new Error("The generated image must be written inside public/ before it can be attached.");
  }

  const original = fs.readFileSync(articlePath, "utf8");
  if (!original.startsWith("---\n")) {
    throw new Error(`Writing article has no YAML frontmatter: ${path.relative(root, articlePath)}`);
  }
  const frontmatterEnd = original.indexOf("\n---", 4);
  if (frontmatterEnd === -1) {
    throw new Error(`Writing article has invalid YAML frontmatter: ${path.relative(root, articlePath)}`);
  }

  let frontmatter = original.slice(4, frontmatterEnd);
  const coverBlock = [
    "coverImage:",
    `  src: "${escapeYamlDoubleQuoted(coverSrc)}"`,
    `  alt: "${escapeYamlDoubleQuoted(suggestedAlt)}"`,
    `  width: ${width}`,
    `  height: ${height}`,
  ].join("\n");
  const existingCover = /^coverImage:\r?\n(?:[ \t]+.*(?:\r?\n|$))*/m;
  frontmatter = existingCover.test(frontmatter)
    ? frontmatter.replace(existingCover, `${coverBlock}\n`)
    : `${frontmatter.replace(/\s+$/, "")}\n${coverBlock}\n`;

  const updated = `---\n${frontmatter.replace(/^\n+|\n+$/g, "")}\n---${original.slice(frontmatterEnd + 4)}`;
  fs.writeFileSync(articlePath, updated);
  return path.relative(root, articlePath);
}

function recordThumbnailSource(root, slug, payload) {
  const indexPath = path.join(root, THUMBNAIL_INDEX_PATH);
  const current = fs.existsSync(indexPath)
    ? JSON.parse(fs.readFileSync(indexPath, "utf8"))
    : {};
  current[slug] = payload;
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, `${JSON.stringify(current, null, 2)}\n`);
}

function buildSuggestedAlt(titleOrSlug, chosen) {
  const scene = chosen.title ? `${chosen.title} in ${chosen.location}` : chosen.location;
  return `Cute chibi anime pixel-art illustration for ${titleOrSlug} based on ${scene}`;
}

async function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const candidates = loadLocalAlbumPhotos(root);

  if (args.list) {
    const { usedPhotos } = loadUsedSources(root);
    const summary = {};
    for (const c of candidates) {
      summary[c.albumSlug] ??= { totalLocal: 0, unusedLandscape: 0 };
      summary[c.albumSlug].totalLocal++;
      if (c.isLandscape && !usedPhotos.has(c.localRel)) {
        summary[c.albumSlug].unusedLandscape++;
      }
    }
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const slug = args.slug;
  if (!slug) {
    throw new Error("Missing required --slug <article-slug> (or pass --list to inspect albums).");
  }

  const { usedPhotos, usedAlbums, existingRecord } = loadUsedSources(root, {
    excludeSlug: args.fresh ? undefined : slug,
  });

  const excludedPhotos = new Set(
    String(args.exclude || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        if (value.startsWith("/assets/")) return `public${value}`;
        if (path.isAbsolute(value)) return path.relative(root, value);
        return value;
      }),
  );

  const explicitOrRecordedPhoto = args.photo || (!args.fresh && existingRecord?.source);
  const chosen = explicitOrRecordedPhoto
    ? resolveExplicitPhoto(root, explicitOrRecordedPhoto, candidates)
    : selectRandomAlbumPhoto({
        candidates,
        usedPhotos,
        usedAlbums,
        albumSlug: args.album,
        excludedPhotos,
      });

  const defaultOutRel = `public/images/writing/${slug}.webp`;
  const outPath = path.resolve(root, args.out || defaultOutRel);
  const publicSrc = `/${path.relative(path.join(root, "public"), outPath).split(path.sep).join("/")}`;
  const titleOrSlug = args.title || slug;
  const suggestedAlt = buildSuggestedAlt(titleOrSlug, chosen);

  const baseResult = {
    slug,
    style: "pixel-art-chibi",
    album: chosen.albumSlug,
    photoTitle: chosen.title || null,
    source: chosen.localRel,
    sourceAbsPath: chosen.absPath,
    out: path.relative(root, outPath),
    coverSrc: publicSrc.startsWith("/..") ? null : publicSrc,
    width: WIDTH,
    height: HEIGHT,
    suggestedAlt,
  };

  if (args["dry-run"] || args.prepare || !args.finalize) {
    if (!args.finalize && !args.input && !args["dry-run"] && !args.prepare) {
      throw new Error(
        "Specify --prepare to select a photo & emit the pixel-art prompt, or --finalize --input <generated-image> to convert the generated image to 1920x1080 WebP.",
      );
    }
    console.log(
      JSON.stringify(
        {
          mode: args["dry-run"] ? "dry-run" : "prepare",
          ...baseResult,
          peopleCheckRequired: true,
          prompt: PIXEL_ART_PROMPT,
        },
        null,
        2,
      ),
    );
    return;
  }

  const inputArg = args.input;
  if (!inputArg || typeof inputArg !== "string") {
    throw new Error("Missing required --input <generated-image-path> for --finalize.");
  }
  const inputAbs = path.isAbsolute(inputArg) ? inputArg : path.resolve(root, inputArg);
  if (!fs.existsSync(inputAbs)) {
    throw new Error(`Generated image not found: ${inputArg}`);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(inputAbs)
    .resize(WIDTH, HEIGHT, {
      fit: "cover",
      position: args.crop || "center",
      // Nearest-neighbor preserves hard square pixel boundaries when scaling pixel art.
      kernel: sharp.kernel.nearest,
    })
    .webp({ quality: 92, effort: 6 })
    .toFile(outPath);

  if (!args.out) {
    recordThumbnailSource(root, slug, {
      source: chosen.localRel,
      album: chosen.albumSlug,
      photoTitle: chosen.title || undefined,
      style: "pixel-art-chibi",
      generatedAt: new Date().toISOString(),
    });
  }

  const articlePath = path.join(root, WRITING_DIR, `${slug}.md`);
  const shouldAttach = args.attach || (!args["no-attach"] && fs.existsSync(articlePath));
  const attachedArticle = shouldAttach ? attachCoverToArticle(root, slug, baseResult) : null;

  console.log(JSON.stringify({ mode: "finalize", ...baseResult, attachedArticle }, null, 2));
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
