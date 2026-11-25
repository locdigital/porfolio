import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const formats = /\.(?:avif|gif|heic|ico|jpe?g|png|svg|tiff?|webp|m4v|mov|mp4|webm|mp3|m4a|wav)$/i;
const byFormat = {};
const hashes = new Map();
let bytes = 0;
let files = 0;
let duplicateBytes = 0;
async function scan(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) await scan(file);
    else if (item.isFile() && formats.test(item.name)) {
      const contents = await readFile(file);
      const digest = createHash("sha256").update(contents).digest("hex");
      const format = path.extname(file).slice(1).toLowerCase();
      const stats = byFormat[format] ??= { files: 0, bytes: 0 };
      stats.files++;
      stats.bytes += contents.length;
      files++;
      bytes += contents.length;
      if (hashes.has(digest)) duplicateBytes += contents.length;
      const paths = hashes.get(digest) ?? [];
      paths.push(file);
      hashes.set(digest, paths);
    }
  }
}

for (const directory of ["public", "src"]) await scan(directory);
console.log(JSON.stringify({ files, bytes, uniqueFiles: hashes.size, duplicateBytes, byFormat,
  duplicates: [...hashes.values()].filter((paths) => paths.length > 1) }, null, 2));
