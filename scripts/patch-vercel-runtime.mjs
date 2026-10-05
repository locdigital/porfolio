/**
 * Post-build patch: replaces nodejs18.x / nodejs20.x -> nodejs22.x in Vercel output configs.
 * Vercel has discontinued nodejs18.x and nodejs20.x for serverless function runtimes.
 */
import { readdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

async function patchDir(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await patchDir(fullPath);
    } else if (entry.name === ".vc-config.json") {
      const content = await readFile(fullPath, "utf-8");
      if (content.includes("nodejs18.x") || content.includes("nodejs20.x")) {
        const patched = content.replace(/nodejs(18|20)\.x/g, "nodejs22.x");
        await writeFile(fullPath, patched);
        console.log(`[patch-vercel-runtime] Patched runtime: ${fullPath}`);
      }
    }
  }
}

console.log("[patch-vercel-runtime] Patching Vercel output nodejs18.x/20.x -> nodejs22.x...");
await patchDir(".vercel/output");
console.log("[patch-vercel-runtime] Done.");
