import sharp from "sharp";
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import path from "node:path";

// Process one photographic master into a new directory. Existing releases stay usable.
const [source, destination, ...options] = process.argv.slice(2);
if (!source || !destination || options.some((value) => value !== "--avif")) {
  throw new Error("Usage: node scripts/optimize-image.mjs original.jpg new-directory [--avif]");
}
const input = sharp(source, { failOn: "error" });
const metadata = await input.metadata();
if (!["jpeg", "png", "tiff"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
  throw new Error("Choose a single-frame JPEG, PNG or TIFF master.");
}
const width = [5, 6, 7, 8].includes(metadata.orientation) ? metadata.height : metadata.width;
const finalDir = path.resolve(destination);
await mkdir(path.dirname(finalDir), { recursive: true });
const stage = await mkdtemp(finalDir + ".tmp-");
try {
  const widths = [...new Set([320, 640, 960, 1280, 1920, 2560].map((size) => Math.min(size, width)))];
  for (const size of widths) {
    const resized = input.clone().rotate().toColourspace("srgb").resize({ width: size, withoutEnlargement: true });
    const webp = await resized.clone().webp({ quality: size <= 320 ? 78 : size <= 960 ? 84 : 90 })
      .toFile(path.join(stage, size + ".webp"));
    if (options.includes("--avif")) {
      const file = path.join(stage, size + ".avif");
      const avif = await resized.clone().avif({ quality: size <= 960 ? 62 : 72 }).toFile(file);
      if (avif.size >= webp.size * 0.85) await rm(file);
    }
  }
  await rename(stage, finalDir);
} finally {
  await rm(stage, { recursive: true, force: true });
}
