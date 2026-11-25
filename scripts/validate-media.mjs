import { readFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile(new URL("../data/uploadthing-images.json", import.meta.url)));
const origin = "https://" + manifest.appId + ".ufs.sh";
const urls = [...new Set(Object.values(manifest.images))];
const failures = [];
let index = 0;
async function worker() {
  while (index < urls.length) {
    const url = new URL(urls[index++]);
    if (url.origin !== origin || !url.pathname.startsWith("/f/")) {
      failures.push("Unexpected media origin or path");
      continue;
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { method: "HEAD", redirect: "error", signal: AbortSignal.timeout(15000) });
        if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
          throw new Error("HTTP " + response.status + " " + response.headers.get("content-type"));
        }
        break;
      } catch (error) {
        if (attempt === 2) failures.push(url.pathname + " " + error.message);
        else await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
      }
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(JSON.stringify({ uniqueUrls: urls.length, failed: failures.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
