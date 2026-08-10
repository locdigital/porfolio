import type { APIRoute } from "astro";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "../../../../lib/cms-auth";
import { readGithubRawFile, shouldUseGithubContent } from "../../../../lib/github-content";

export const prerender = false;

const photoAssetsDir = path.join(process.cwd(), "src", "assets", "photos");

function normalizeAssetPath(filePath: string) {
  if (filePath.includes("\0")) return "";
  return path.posix
    .normalize(filePath.replace(/\\/g, "/"))
    .replace(/^(\.\.\/)+/, "")
    .replace(/^\/+/, "");
}

function localAssetPath(safePath: string) {
  const absolutePath = path.resolve(photoAssetsDir, safePath);
  if (!absolutePath.startsWith(`${photoAssetsDir}${path.sep}`)) return "";
  return absolutePath;
}

export const GET: APIRoute = async ({ params, request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const filePathParam = params.path;
  if (!filePathParam) {
    return new Response("Not found", { status: 404 });
  }

  const safePath = normalizeAssetPath(filePathParam);
  if (!safePath) {
    return new Response("Not found", { status: 404 });
  }

  let fileBuffer: ArrayBuffer;
  const ext = path.extname(safePath).toLowerCase();

  if (shouldUseGithubContent()) {
    try {
      fileBuffer = await readGithubRawFile(`src/assets/photos/${safePath}`);
    } catch (error) {
      const status = error instanceof Error ? error.message.match(/(\d{3})/)?.[1] : undefined;
      return new Response(
        status ? `GitHub Asset not found: ${status}` : "Error fetching asset from GitHub",
        { status: status ? Number(status) : 500 },
      );
    }
  } else {
    const absolutePath = localAssetPath(safePath);

    if (!absolutePath || !existsSync(absolutePath)) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const buffer = await readFile(absolutePath);
      fileBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } catch {
      return new Response("Error reading file", { status: 500 });
    }
  }

  let contentType = "application/octet-stream";
  if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
  else if (ext === ".png") contentType = "image/png";
  else if (ext === ".webp") contentType = "image/webp";
  else if (ext === ".gif") contentType = "image/gif";
  else if (ext === ".svg") contentType = "image/svg+xml";
  else if (ext === ".avif") contentType = "image/avif";

  return new Response(fileBuffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
    },
  });
};
