import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const targetDirs = [
  path.join(process.cwd(), "src", "assets", "photos"),
  path.join(process.cwd(), "public", "uploads"),
  path.join(process.cwd(), "public", "images"),
];

async function getFilesRecursively(dir) {
  let results = [];
  try {
    const list = await fs.readdir(dir, { withFileTypes: true });
    for (const file of list) {
      const res = path.resolve(dir, file.name);
      if (file.isDirectory()) {
        results = results.concat(await getFilesRecursively(res));
      } else {
        results.push(res);
      }
    }
  } catch (error) {
    console.warn(`[Warning] Could not read directory ${dir}:`, error.message);
  }
  return results;
}

async function compressImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
    return null;
  }

  try {
    const originalBuffer = await fs.readFile(filePath);
    const originalSize = originalBuffer.length;

    let image = sharp(originalBuffer, { failOn: "none" });
    const metadata = await image.metadata();

    // Check if we need to resize
    const maxDimension = 1600;
    let needsResize = false;
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      needsResize = true;
    }

    if (needsResize) {
      image = image.resize({
        width: maxDimension,
        height: maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    let processedBuffer;
    if (ext === ".webp") {
      processedBuffer = await image
        .webp({ quality: 75, effort: 6 })
        .toBuffer();
    } else if (ext === ".png") {
      processedBuffer = await image
        .png({ quality: 75, compressionLevel: 9 })
        .toBuffer();
    } else if (ext === ".jpg" || ext === ".jpeg") {
      processedBuffer = await image
        .jpeg({ quality: 75, mozjpeg: true })
        .toBuffer();
    }

    const newSize = processedBuffer.length;
    if (newSize < originalSize) {
      await fs.writeFile(filePath, processedBuffer);
      return {
        success: true,
        originalSize,
        newSize,
        savedBytes: originalSize - newSize,
      };
    } else {
      return {
        success: false,
        reason: "Already optimal",
        originalSize,
        newSize: originalSize,
        savedBytes: 0,
      };
    }
  } catch (error) {
    return {
      success: false,
      reason: error.message,
    };
  }
}

async function main() {
  console.log("=== Scanning project folders for images ===");
  const allFiles = [];
  for (const dir of targetDirs) {
    console.log(`Scanning: ${dir}...`);
    const files = await getFilesRecursively(dir);
    allFiles.push(...files);
  }

  console.log(`Found total ${allFiles.length} files. Starting compression...\n`);

  let totalOriginal = 0;
  let totalNew = 0;
  let optimizedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of allFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const result = await compressImage(file);

    if (!result) continue; // Not an image

    totalOriginal += result.originalSize || 0;
    totalNew += result.newSize || 0;

    if (result.success) {
      optimizedCount++;
      const savedKB = (result.savedBytes / 1024).toFixed(1);
      const ratio = ((result.savedBytes / result.originalSize) * 100).toFixed(1);
      console.log(`[Optimized] ${relativePath}: Saved ${savedKB} KB (${ratio}%)`);
    } else {
      if (result.reason === "Already optimal") {
        skippedCount++;
      } else {
        errorCount++;
        console.error(`[Error] ${relativePath}: ${result.reason}`);
      }
    }
  }

  console.log("\n=== Compression Summary ===");
  console.log(`Total images optimized: ${optimizedCount}`);
  console.log(`Total images already optimal: ${skippedCount}`);
  if (errorCount > 0) {
    console.log(`Total errors encountered: ${errorCount}`);
  }
  console.log(`Original size: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`New size: ${(totalNew / 1024 / 1024).toFixed(2)} MB`);
  const totalSaved = totalOriginal - totalNew;
  console.log(`Total savings: ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${((totalSaved / (totalOriginal || 1)) * 100).toFixed(1)}% reduction)`);
}

main().catch((err) => {
  console.error("Fatal error during execution:", err);
  process.exit(1);
});
