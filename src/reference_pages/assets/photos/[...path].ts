import type { APIRoute } from "astro";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { uploadedAssetUrl } from "../../../lib/uploadthing-assets";

export const prerender = false;

const photosRoot = path.resolve(process.cwd(), "src", "assets", "photos");

const contentTypes: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function resolvePhoto(params: Record<string, string | undefined>) {
  const rawPath = params.path ?? "";
  const normalizedPath = decodeURIComponent(rawPath).replace(/^\/+/, "");
  const filePath = path.resolve(photosRoot, normalizedPath);

  if (!filePath.startsWith(`${photosRoot}${path.sep}`)) {
    return null;
  }

  const contentType = contentTypes[path.extname(filePath).toLowerCase()];
  if (!contentType) {
    return null;
  }

  return { filePath, contentType };
}

export const GET: APIRoute = async ({ params }) => {
  const photo = resolvePhoto(params);
  if (!photo) return new Response("Not found", { status: 404 });
  const remoteUrl = uploadedAssetUrl(`/assets/photos/${params.path ?? ""}`);
  if (remoteUrl.startsWith("https://")) return Response.redirect(remoteUrl, 302);

  try {
    const file = await readFile(photo.filePath);
    return new Response(file, {
      headers: {
        "Content-Type": photo.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
};

export const HEAD: APIRoute = async ({ params }) => {
  const photo = resolvePhoto(params);
  if (!photo) return new Response(null, { status: 404 });
  const remoteUrl = uploadedAssetUrl(`/assets/photos/${params.path ?? ""}`);
  if (remoteUrl.startsWith("https://")) return Response.redirect(remoteUrl, 302);

  try {
    const file = await stat(photo.filePath);
    return new Response(null, {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Length": String(file.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
};
