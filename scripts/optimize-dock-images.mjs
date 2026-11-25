import sharp from "sharp";
import { fileURLToPath } from "node:url";

const directory = new URL("../public/assets/dock/", import.meta.url);
for (const name of ["netflix", "spotify"]) {
  const input = fileURLToPath(new URL(name + ".png", directory));
  const output = fileURLToPath(new URL(name + ".webp", directory));
  await sharp(input).rotate().resize({ width: 256, withoutEnlargement: true })
    .toColourspace("srgb").webp({ lossless: true }).toFile(output);
}
