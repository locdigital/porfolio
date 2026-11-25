import {
  extractFileKeyFromUrl,
  getUploadThingManifest,
  uploadedAssetUrl,
} from "@/lib/uploadthing/client";
import type { MediaAsset, MediaAssetType } from "@/types/media";

const EXTENSION_FORMAT_MAP: Record<string, { type: MediaAssetType; format: string }> = {
  webp: { type: "image", format: "webp" },
  avif: { type: "image", format: "avif" },
  jpg: { type: "image", format: "jpeg" },
  jpeg: { type: "image", format: "jpeg" },
  png: { type: "image", format: "png" },
  svg: { type: "image", format: "svg" },
  gif: { type: "image", format: "gif" },
  mp4: { type: "video", format: "mp4" },
  webm: { type: "video", format: "webm" },
  m4v: { type: "video", format: "m4v" },
  mp3: { type: "audio", format: "mp3" },
  m4a: { type: "audio", format: "m4a" },
};

function inferMediaFormat(pathOrUrl: string): { type: MediaAssetType; format: string } {
  const clean = pathOrUrl.split("?")[0].split("#")[0];
  const ext = clean.slice(clean.lastIndexOf(".") + 1).toLowerCase();
  return EXTENSION_FORMAT_MAP[ext] ?? { type: "image", format: "webp" };
}

function normalizeAssetId(src: string): string {
  const clean = decodeURIComponent(src.split("?")[0]).replace(/^\/+/, "");
  return clean.replace(/^(?:public|src)\//, "");
}

const manifest = getUploadThingManifest();
const urlToUniqueMeta = new Map<
  string,
  {
    fileKey: string;
    width?: number;
    height?: number;
    size?: number;
    format?: string;
    variants?: Record<string, string>;
  }
>();

if (manifest.unique) {
  for (const entry of Object.values(manifest.unique)) {
    if (entry?.url) {
      urlToUniqueMeta.set(entry.url, {
        fileKey: entry.fileKey,
        width: entry.width,
        height: entry.height,
        size: entry.size,
        format: entry.format,
        variants: entry.variants,
      });
    }
  }
}

const assetCache = new Map<string, MediaAsset>();

export function getMediaAsset(
  src: string,
  overrides?: Partial<Omit<MediaAsset, "id" | "url">>,
): MediaAsset {
  const cacheKey = overrides ? "" : src;
  if (cacheKey) {
    const cached = assetCache.get(cacheKey);
    if (cached) return cached;
  }

  const resolvedUrl = uploadedAssetUrl(src);
  const inferred = inferMediaFormat(src);
  const uniqueMeta = urlToUniqueMeta.get(resolvedUrl);

  const asset: MediaAsset = {
    id: normalizeAssetId(src),
    type: overrides?.type ?? inferred.type,
    url: resolvedUrl,
    fileKey: uniqueMeta?.fileKey ?? extractFileKeyFromUrl(resolvedUrl),
    width: overrides?.width ?? uniqueMeta?.width,
    height: overrides?.height ?? uniqueMeta?.height,
    size: overrides?.size ?? uniqueMeta?.size,
    format: overrides?.format ?? uniqueMeta?.format ?? inferred.format,
    alt: overrides?.alt,
    blurDataURL: overrides?.blurDataURL,
    poster: overrides?.poster,
    duration: overrides?.duration,
    variants: overrides?.variants ?? uniqueMeta?.variants,
  };

  if (cacheKey) {
    assetCache.set(cacheKey, asset);
  }

  return asset;
}

export function resolveMediaUrl(src: string): string {
  return uploadedAssetUrl(src);
}

export function listRegisteredMediaAssets(): MediaAsset[] {
  const seen = new Set<string>();
  const assets: MediaAsset[] = [];

  for (const rawKey of Object.keys(manifest.images || {})) {
    const localPath = `/${rawKey.replace(/^(?:public|src)\//, "")}`;
    if (seen.has(localPath)) continue;
    seen.add(localPath);
    assets.push(getMediaAsset(localPath));
  }

  return assets;
}

export function getMediaRegistryStats() {
  return {
    appId: manifest.appId,
    mappedPaths: Object.keys(manifest.images || {}).length,
    uniqueAssets: Object.keys(manifest.unique || {}).length,
  };
}
