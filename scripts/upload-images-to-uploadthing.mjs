import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { UTApi, UTFile } from "uploadthing/server";

const roots = [
  "src/assets/photos",
  "public/uploads",
  "public/images",
  "public/assets/logos",
  "public",
];
const exts = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg", ".ico"]);
const manifestPath = "data/uploadthing-images.json";
const token = process.env.UPLOADTHING_TOKEN;

if (!token) {
  throw new Error("Missing UPLOADTHING_TOKEN");
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(file));
    if (entry.isFile() && exts.has(path.extname(entry.name).toLowerCase())) out.push(file);
  }
  return out;
}

function publicKeys(file) {
  const normalized = file.split(path.sep).join("/");
  if (normalized.startsWith("src/assets/photos/")) {
    return [normalized.replace("src/", "public/"), normalized];
  }
  return [normalized];
}

function customIdFor(file, hash) {
  return `${file.replace(/[^a-zA-Z0-9._-]/g, "_")}__${hash.slice(0, 16)}`;
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.images ||= {};
manifest.unique ||= {};

const files = [...new Set((await Promise.all(roots.map(walk))).flat())]
  .filter((file) => !file.startsWith("public/assets/photos/"))
  .sort();

const byHash = new Map();
const pending = [];
for (const file of files) {
  const buffer = await readFile(file);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const keys = publicKeys(file);
  const existingUrl = keys.map((key) => manifest.images[key]).find(Boolean) ?? byHash.get(hash)?.url;

  if (existingUrl) {
    for (const key of keys) manifest.images[key] = existingUrl;
    continue;
  }

  const dupe = pending.find((item) => item.hash === hash);
  if (dupe) {
    dupe.aliases.push(...keys);
    continue;
  }

  pending.push({ file, buffer, hash, keys, aliases: [] });
}

const utapi = new UTApi({ token });
let uploaded = 0;

for (let i = 0; i < pending.length; i += 10) {
  const batch = pending.slice(i, i + 10);
  const results = await utapi.uploadFiles(
    batch.map(({ file, buffer, hash }) => new UTFile([buffer], path.basename(file), {
      customId: customIdFor(file, hash),
    })),
    { concurrency: 5 },
  );

  for (let j = 0; j < batch.length; j++) {
    const result = results[j];
    if (!result?.data?.ufsUrl) {
      throw new Error(`Upload failed for ${batch[j].file}: ${result?.error?.message ?? "unknown error"}`);
    }

    const url = result.data.ufsUrl;
    for (const key of [...batch[j].keys, ...batch[j].aliases]) {
      manifest.images[key] = url;
    }
    manifest.unique[batch[j].hash] = {
      url,
      paths: [...batch[j].keys, ...batch[j].aliases],
    };
    uploaded++;
  }

  console.log(`uploaded ${Math.min(i + batch.length, pending.length)}/${pending.length}`);
}

manifest.generatedAt = new Date().toISOString();
manifest.appId = "65wv0vnolo";
manifest.totals = {
  files: files.length,
  images: Object.keys(manifest.images).length,
  unique: Object.keys(manifest.unique).length,
  uploaded,
};

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log({ files: files.length, pending: pending.length, uploaded });
