/**
 * Post-build patch: replaces nodejs18.x → nodejs20.x in Vercel output configs.
 * Needed because @astrojs/vercel@7.x hardcodes nodejs18.x but Vercel has
 * deprecated Node 18 serverless runtime support.
 */
import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

async function patchDir(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // Directory doesn't exist (e.g. not a serverless build), skip silently
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await patchDir(fullPath);
    } else if (entry.name === '.vc-config.json') {
      const content = await readFile(fullPath, 'utf-8');
      if (content.includes('nodejs18.x')) {
        const patched = content.replace(/nodejs18\.x/g, 'nodejs20.x');
        await writeFile(fullPath, patched);
        console.log(`[patch-vercel-runtime] ✓ Patched runtime: ${fullPath}`);
      }
    }
  }
}

console.log('[patch-vercel-runtime] Patching Vercel output nodejs18.x → nodejs20.x...');
await patchDir('.vercel/output');
console.log('[patch-vercel-runtime] Done.');
