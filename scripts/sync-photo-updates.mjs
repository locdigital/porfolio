import { createHash } from "node:crypto";
import { readFile, readdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRoot = fileURLToPath(new URL("../", import.meta.url));

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

async function readJson(filename, fallback) {
  try {
    return JSON.parse(await readFile(filename, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

export async function syncPhotoUpdates({ root = defaultRoot, now = new Date() } = {}) {
  const sourceDir = path.join(root, "src/content/photos");
  const publicDir = path.join(root, "public");
  const output = path.join(root, "data/photo-updates.json");
  const previous = await readJson(output, {});
  const uploads = (await readJson(path.join(root, "data/uploadthing-images.json"), {})).images ?? {};
  const files = new Map();

  async function localFile(src) {
    if (!src.startsWith("/")) return undefined;
    const filename = path.resolve(publicDir, `.${decodeURIComponent(src.split("?")[0])}`);
    if (!filename.startsWith(publicDir + path.sep)) throw new Error("Photo path escapes public directory.");
    if (!files.has(filename)) {
      files.set(filename, (async () => {
        try {
          const [bytes, metadata] = await Promise.all([readFile(filename), stat(filename)]);
          return { hash: createHash("sha256").update(bytes).digest("hex"), modified: metadata.mtimeMs };
        } catch (error) {
          if (error.code === "ENOENT") return undefined;
          throw error;
        }
      })());
    }
    return files.get(filename);
  }

  const next = {};
  let changed = 0;
  for (const name of (await readdir(sourceDir)).filter((name) => name.endsWith(".json")).sort()) {
    const filename = path.join(sourceDir, name);
    const [album, metadata] = await Promise.all([readJson(filename), stat(filename)]);
    const slug = album.slug ?? name.slice(0, -5);
    const hash = createHash("sha256").update(JSON.stringify(canonical(album)));
    let modified = metadata.mtimeMs;
    const sources = new Set([album.heroImage?.src, album.seoImage, ...(album.images ?? []).map((image) => image.src)]);
    for (const src of [...sources].filter(Boolean).sort()) {
      const uploaded = uploads[`public${src}`] ?? uploads[`src${src}`] ?? src;
      const local = await localFile(src);
      hash.update(JSON.stringify([src, uploaded, local?.hash ?? null]));
      if (local) modified = Math.max(modified, local.modified);
    }
    const contentHash = hash.digest("hex");
    const old = previous[slug];
    if (old?.contentHash === contentHash) {
      next[slug] = old;
    } else {
      next[slug] = {
        // Seed existing albums from their sources; only real subsequent edits get a new timestamp.
        updatedAt: (old ? now : new Date(modified)).toISOString(),
        contentHash,
      };
      changed++;
    }
  }
  if (JSON.stringify(next) !== JSON.stringify(previous)) {
    await writeFile(`${output}.tmp`, JSON.stringify(next, null, 2) + "\n");
    await rename(`${output}.tmp`, output);
  }
  return { albums: Object.keys(next).length, changed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await syncPhotoUpdates();
  console.log(`[photo-updates] ${result.albums} albums, ${result.changed} updated.`);
}
