/**
 * Post-build: drop media masters from the Vercel static output once they are served by R2.
 *
 * `public/` keeps the masters because the optimise/migrate/thumbnail scripts read them,
 * but every page already points at `https://assets.loc.digital/...`, so copying ~140 MB of
 * unreferenced originals into each deployment only slows uploads. For each pruned file a
 * static edge redirect to its R2 original keeps old or externally indexed URLs working.
 *
 * Files are pruned only when (a) data/r2-assets.json has a verified entry for them and
 * (b) no built HTML/CSS/JS/JSON/Markdown file references their local path.
 *
 *   node scripts/prune-deploy-assets.mjs [--dry-run]
 */
import { readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT = path.join(ROOT, ".vercel/output");
const STATIC = path.join(OUTPUT, "static");
const CONFIG = path.join(OUTPUT, "config.json");
const MANIFEST = path.join(ROOT, "data/r2-assets.json");
const DRY_RUN = process.argv.includes("--dry-run");

/** Directories whose contents are media masters mirrored on R2. */
const MEDIA_DIRS = ["assets/photos", "images", "uploads", "instagram_workflowspace"];
/** Source/scrape data that should never be publicly deployed (no redirect needed). */
const PRIVATE_DATA = [/^\/instagram_workflowspace\/.+\.(txt|csv|json)$/, /\/\.gitkeep$/];
const TEXT_EXT = /\.(html|css|js|mjs|json|md|txt|xml|webmanifest)$/;
const REDIRECT_CACHE = "public, max-age=86400, stale-while-revalidate=604800";

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(full) : [full];
    }),
  );
  return nested.flat();
}

const toUrlPath = (file) => `/${path.relative(STATIC, file).split(path.sep).join("/")}`;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  const assets = manifest.assets ?? {};
  const byLowerKey = new Map(Object.entries(assets).map(([key, entry]) => [key.toLowerCase(), entry]));

  const allFiles = await walk(STATIC);
  const mediaPrefixes = MEDIA_DIRS.map((dir) => path.join(STATIC, dir) + path.sep);
  const isMedia = (file) => mediaPrefixes.some((prefix) => file.startsWith(prefix));

  // Everything the built site can reference lives in text files outside the media folders.
  const textFiles = allFiles.filter((file) => TEXT_EXT.test(file) && !isMedia(file));
  const corpus = (await Promise.all(textFiles.map((file) => readFile(file, "utf8")))).join("\n");
  // Strip R2 URLs first so their `/media/assets/...` paths do not count as local references.
  const localCorpus = corpus.replace(/https?:\/\/[^\s"'()<>]+/g, "");
  const isReferenced = (urlPath) =>
    localCorpus.includes(urlPath) || localCorpus.includes(encodeURI(urlPath));

  const redirects = [];
  let removedBytes = 0;
  let removedCount = 0;
  const kept = [];

  for (const file of allFiles.filter(isMedia)) {
    const urlPath = toUrlPath(file);
    const isPrivate = PRIVATE_DATA.some((pattern) => pattern.test(urlPath));
    const entry = assets[urlPath] ?? byLowerKey.get(urlPath.toLowerCase());
    const target = entry?.originalUrl;

    if (isReferenced(urlPath) || (!isPrivate && !target)) {
      kept.push(urlPath);
      continue;
    }
    removedBytes += (await stat(file)).size;
    removedCount += 1;
    if (target && !isPrivate) {
      redirects.push({
        src: `^${escapeRegex(urlPath)}$`,
        status: 302,
        headers: { Location: target, "Cache-Control": REDIRECT_CACHE },
      });
    }
    if (!DRY_RUN) await rm(file);
  }

  // Remove now-empty directories left behind in the media folders.
  if (!DRY_RUN) {
    for (const dir of MEDIA_DIRS) await removeEmptyDirs(path.join(STATIC, dir));
  }

  const config = JSON.parse(await readFile(CONFIG, "utf8"));
  // Drop redirects from a previous run so the script stays idempotent.
  const isOwnRedirect = (route) =>
    route.status === 302 && route.headers?.["Cache-Control"] === REDIRECT_CACHE;
  const routes = (config.routes ?? []).filter((route) => !isOwnRedirect(route));
  const filesystemIndex = routes.findIndex((route) => route.handle === "filesystem");
  if (filesystemIndex === -1) throw new Error("[prune-deploy-assets] config.json has no filesystem handle.");
  // After the filesystem phase: anything still on disk is served directly, the rest redirects.
  routes.splice(filesystemIndex + 1, 0, ...redirects);
  if (routes.length > 2000) {
    throw new Error(`[prune-deploy-assets] ${routes.length} routes exceeds the Vercel limit.`);
  }
  if (!DRY_RUN) await writeFile(CONFIG, `${JSON.stringify({ ...config, routes }, null, 2)}\n`);

  console.log(
    `[prune-deploy-assets] ${DRY_RUN ? "Would remove" : "Removed"} ${removedCount} files ` +
      `(${(removedBytes / 1024 / 1024).toFixed(1)} MB), ${redirects.length} R2 redirects, ` +
      `${kept.length} media files kept.`,
  );
}

async function removeEmptyDirs(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) await removeEmptyDirs(path.join(dir, entry.name));
  }
  if ((await readdir(dir)).length === 0) await rm(dir, { recursive: true });
}

await main();
