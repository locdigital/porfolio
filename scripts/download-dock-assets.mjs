#!/usr/bin/env node
/**
 * Downloads authentic official application icons for the macOS Dock
 * into public/assets/dock/ and writes a manifest with source URLs.
 */
import fs from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("public/assets/dock");

/**
 * Official / verified sources:
 * - Official Apple App Store / Mac App Store artwork (published by the app owners)
 * - Official product repositories & Wikimedia Commons official brand marks
 */
const APPS = [
  {
    id: "spotify",
    name: "Spotify",
    sourceType: "itunes",
    lookupId: "324684580", // Spotify AB official App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
    licenseNote: "Spotify AB official app icon via Apple App Store CDN (brand asset, all rights reserved by Spotify AB).",
  },
  {
    id: "netflix",
    name: "Netflix",
    sourceType: "itunes",
    lookupId: "363590051", // Netflix, Inc. official App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Netflix_2015_N_logo.svg",
    licenseNote: "Netflix, Inc. official app icon via Apple App Store CDN (brand asset, all rights reserved by Netflix, Inc.).",
  },
  {
    id: "lightroom",
    name: "Adobe Lightroom",
    sourceType: "itunes",
    lookupId: "878783582", // Adobe Inc. official Lightroom App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Adobe_Photoshop_Lightroom_CC_logo.svg",
    licenseNote: "Adobe Inc. official Adobe Lightroom app icon via Apple App Store CDN (brand asset, all rights reserved by Adobe Inc.).",
  },
  {
    id: "photoshop",
    name: "Adobe Photoshop",
    sourceType: "itunes",
    lookupId: "1457771281", // Adobe Inc. official Photoshop App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/a/af/Adobe_Photoshop_CC_icon.svg",
    licenseNote: "Adobe Inc. official Adobe Photoshop app icon via Apple App Store CDN (brand asset, all rights reserved by Adobe Inc.).",
  },
  {
    id: "figma",
    name: "Figma",
    sourceType: "itunes",
    lookupId: "1152747299", // Figma, Inc. official App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
    licenseNote: "Figma, Inc. official app icon via Apple App Store CDN (brand asset, all rights reserved by Figma, Inc.).",
  },
  {
    id: "notion",
    name: "Notion",
    sourceType: "itunes",
    lookupId: "1232780281", // Notion Labs, Inc. official App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    licenseNote: "Notion Labs, Inc. official app icon via Apple App Store CDN (brand asset, all rights reserved by Notion Labs, Inc.).",
  },
  {
    id: "chrome",
    name: "Google Chrome",
    sourceType: "itunes",
    lookupId: "535886823", // Google LLC official Chrome App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg",
    licenseNote: "Google LLC official Google Chrome app icon via Apple App Store CDN (brand asset, all rights reserved by Google LLC).",
  },
  {
    id: "github",
    name: "GitHub",
    sourceType: "itunes",
    lookupId: "1477376905", // GitHub, Inc. official App Store listing
    fallbackUrl: "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
    licenseNote: "GitHub, Inc. official app icon via Apple App Store CDN (brand asset, all rights reserved by GitHub, Inc.).",
  },
  {
    id: "vscode",
    name: "Visual Studio Code",
    sourceType: "direct",
    pngFallback: "https://raw.githubusercontent.com/microsoft/vscode/main/resources/linux/code.png",
    licenseNote: "Microsoft Corporation official Visual Studio Code stable app icon from microsoft/vscode repository (brand asset, all rights reserved by Microsoft).",
  },
];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
  return buf.length;
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const results = [];

  for (const app of APPS) {
    let resolvedUrl = "";
    let filename = `${app.id}.png`;

    try {
      if (app.sourceType === "itunes") {
        const data = await fetchJson(`https://itunes.apple.com/lookup?id=${app.lookupId}`);
        const item = data?.results?.[0];
        if (!item?.artworkUrl512) {
          throw new Error(`No artworkUrl512 found for iTunes ID ${app.lookupId}`);
        }
        resolvedUrl = item.artworkUrl512;
        const size = await downloadFile(resolvedUrl, path.join(OUT_DIR, filename));
        results.push({
          id: app.id,
          name: app.name,
          file: `/assets/dock/${filename}`,
          sourceUrl: resolvedUrl,
          publisher: item.artistName || item.sellerName || app.name,
          bytes: size,
          licenseNote: app.licenseNote,
          status: "ok",
        });
        console.log(`✓ ${app.name} (${Math.round(size / 1024)} KB) <- ${resolvedUrl}`);
      } else {
        resolvedUrl = app.pngFallback;
        const size = await downloadFile(resolvedUrl, path.join(OUT_DIR, filename));
        results.push({
          id: app.id,
          name: app.name,
          file: `/assets/dock/${filename}`,
          sourceUrl: resolvedUrl,
          publisher: "Microsoft Corporation",
          bytes: size,
          licenseNote: app.licenseNote,
          status: "ok",
        });
        console.log(`✓ ${app.name} (${Math.round(size / 1024)} KB) <- ${resolvedUrl}`);
      }
    } catch (err) {
      console.error(`✗ ${app.name}: ${err.message}`);
      results.push({
        id: app.id,
        name: app.name,
        file: null,
        sourceUrl: resolvedUrl || app.fallbackUrl || "",
        status: "failed",
        error: err.message,
      });
    }
  }

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(results, null, 2) + "\n");
  console.log(`\nSaved manifest to ${manifestPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
