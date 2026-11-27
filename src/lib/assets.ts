/**
 * Unified public asset resolution and responsive image delivery helper.
 *
 * Resolution precedence:
 * 1. Verified Cloudflare R2 manifest entry (`data/r2-assets.json`) served via `PUBLIC_ASSET_BASE_URL`
 * 2. Legacy UploadThing manifest entry (`data/uploadthing-images.json`)
 * 3. Local static asset path (`/assets/...`, `/images/...`)
 *
 * This guarantees zero broken images before migration, atomic rollback via manifest
 * revert, and responsive srcset/AVIF/blur placeholder delivery once assets are in R2.
 */
import r2ManifestData from "../../data/r2-assets.json";
import uploadManifestData from "../../data/uploadthing-images.json";
import {
  R2_PUBLIC_ORIGIN,
  R2_RESPONSIVE_WIDTHS,
  UPLOADTHING_CDN_ORIGIN,
} from "@/config/site";
import { uploadedAssetUrl } from "@/lib/uploadthing/client";

export interface R2AssetVariant {
  width: number;
  height?: number;
  format: "webp" | "avif" | "jpeg" | "png" | "svg";
  key: string;
  url: string;
  bytes: number;
}

export interface R2AssetEntry {
  sourcePath: string;
  hash: string;
  width: number;
  height: number;
  aspectRatio?: number;
  contentType: string;
  bytes: number;
  originalKey?: string;
  originalUrl?: string;
  blurDataURL?: string;
  thumbnail?: R2AssetVariant;
  variants: R2AssetVariant[];
  verifiedAt?: string;
}

export interface R2AssetManifest {
  version: number;
  bucket: string;
  publicBaseUrl: string;
  generatedAt: string | null;
  totals: {
    assets: number;
    variants: number;
    bytes: number;
  };
  assets: Record<string, R2AssetEntry>;
}

const manifest = r2ManifestData as unknown as R2AssetManifest;
const uploadThingUrlToLocalPath = new Map<string, string>();
for (const [sourceKey, url] of Object.entries(
  (uploadManifestData as { images?: Record<string, string> }).images || {},
)) {
  if (url && !uploadThingUrlToLocalPath.has(url)) {
    const localPath = `/${sourceKey.replace(/^(?:public|src)\//, "")}`;
    uploadThingUrlToLocalPath.set(url, localPath);
  }
}
const r2UrlToLocalPath = new Map<string, string>();
for (const [sourcePath, entry] of Object.entries(manifest.assets || {})) {
  if (entry?.originalUrl) r2UrlToLocalPath.set(entry.originalUrl, sourcePath);
  if (entry?.thumbnail?.url) r2UrlToLocalPath.set(entry.thumbnail.url, sourcePath);
  for (const variant of entry?.variants || []) {
    if (variant?.url) r2UrlToLocalPath.set(variant.url, sourcePath);
  }
}

export function getPublicAssetBaseUrl(): string {
  const configured =
    (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_ASSET_BASE_URL) ||
    (typeof process !== "undefined" && process.env?.PUBLIC_ASSET_BASE_URL) ||
    manifest.publicBaseUrl ||
    R2_PUBLIC_ORIGIN;
  return configured.trim().replace(/\/+$/, "");
}

export function getPublicAssetOrigin(): string {
  try {
    return new URL(getPublicAssetBaseUrl()).origin;
  } catch {
    return R2_PUBLIC_ORIGIN;
  }
}

export function normalizeLocalAssetPath(src: string): string {
  if (!src) return "";
  const clean = decodeURIComponent(src.split("?")[0].split("#")[0]);
  if (/^https?:\/\//i.test(clean)) return clean;
  const withoutPrefix = clean.replace(/^\/?(?:public|src)\//, "/");
  return withoutPrefix.startsWith("/") ? withoutPrefix : `/${withoutPrefix}`;
}

export type ImageStorageProvider = "cloudflare-r2" | "uploadthing" | "local" | "external";

export function isR2AssetUrl(url: string): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return (
      (parsed.origin === getPublicAssetOrigin() || parsed.origin === R2_PUBLIC_ORIGIN) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

export function isUploadThingAssetUrl(url: string): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  try {
    const parsed = new URL(url);
    return parsed.origin === UPLOADTHING_CDN_ORIGIN && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function getImageStorageProvider(url: string): ImageStorageProvider {
  if (!url) return "local";
  if (url.startsWith("/")) return "local";
  if (isR2AssetUrl(url)) return "cloudflare-r2";
  if (isUploadThingAssetUrl(url)) return "uploadthing";
  return "external";
}

export function isTrustedAssetUrl(url: string): boolean {
  if (!url) return false;
  try {
    if (url.startsWith("/")) {
      const local = "https://local.invalid";
      return new URL(url, local).origin === local;
    }
    const parsed = new URL(url);
    if (parsed.username || parsed.password) return false;
    return (
      parsed.origin === getPublicAssetOrigin() ||
      parsed.origin === R2_PUBLIC_ORIGIN ||
      parsed.origin === UPLOADTHING_CDN_ORIGIN
    );
  } catch {
    return false;
  }
}

export function getR2AssetManifest(): R2AssetManifest {
  return manifest;
}

export function getR2AssetEntry(
  src: string,
  customManifest: R2AssetManifest = manifest,
): R2AssetEntry | undefined {
  if (!src) return undefined;
  const resolvedInput = /^https?:\/\//i.test(src)
    ? (r2UrlToLocalPath.get(src) ?? uploadThingUrlToLocalPath.get(src))
    : src;
  if (!resolvedInput) return undefined;
  const normalized = normalizeLocalAssetPath(resolvedInput);
  const assets = customManifest.assets || {};
  return (
    assets[normalized] ??
    assets[`public${normalized}`] ??
    assets[normalized.replace(/^\/+/, "")]
  );
}

/**
 * Resolves a variant URL relative to the active `PUBLIC_ASSET_BASE_URL` when a key is present,
 * allowing environment overrides (e.g., staging vs production custom domains) without rebuilding manifests.
 */
export function resolveR2VariantUrl(variant: Pick<R2AssetVariant, "key" | "url">): string {
  if (variant.key) {
    const base = getPublicAssetBaseUrl();
    const encodedKey = variant.key
      .replace(/^\/+/, "")
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return `${base}/${encodedKey}`;
  }
  return variant.url;
}

/**
 * Resolves a local asset path or legacy UploadThing URL to its active CDN URL:
 * Tier 1: Cloudflare R2 (`assets.loc.digital`, pre-generated responsive variants & 320w thumbnails)
 * Tier 2: UploadThing (`65wv0vnolo.ufs.sh`, secondary/fallback CDN)
 * Tier 3: Local static path (icons/logos/favicons)
 */
export function resolveAssetUrl(
  src: string,
  options: {
    preferredWidth?: number;
    format?: "webp" | "avif";
    manifest?: R2AssetManifest;
  } = {},
): string {
  if (!src || src.startsWith("data:")) return src;

  // External non-managed URLs pass through untouched; managed UploadThing/R2/local paths resolve via Tier 1 -> Tier 2.
  const isHttp = /^https?:\/\//i.test(src);
  if (isHttp && !isUploadThingAssetUrl(src) && !isR2AssetUrl(src)) {
    return src;
  }

  const entry = getR2AssetEntry(src, options.manifest);
  if (entry) {
    if (options.preferredWidth && options.preferredWidth <= 360 && entry.thumbnail) {
      return resolveR2VariantUrl(entry.thumbnail);
    }

    const targetFormat = options.format ?? "webp";
    const matchingVariants = entry.variants
      .filter((v) => v.format === targetFormat)
      .sort((a, b) => a.width - b.width);

    if (matchingVariants.length > 0) {
      if (options.preferredWidth) {
        const bestFit =
          matchingVariants.find((v) => v.width >= options.preferredWidth!) ??
          matchingVariants[matchingVariants.length - 1];
        return resolveR2VariantUrl(bestFit);
      }
      return resolveR2VariantUrl(matchingVariants[matchingVariants.length - 1]);
    }

    if (entry.originalUrl || entry.originalKey) {
      return entry.originalKey
        ? resolveR2VariantUrl({ key: entry.originalKey, url: entry.originalUrl ?? "" })
        : entry.originalUrl!;
    }
  }

  return isHttp ? src : uploadedAssetUrl(src);
}

export interface ResponsiveR2ImageSet {
  src: string;
  srcset: string;
  avifSrcSet?: string;
  sizes?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  thumbnailSrc?: string;
  fullSrc: string;
  source: "r2";
}

/**
 * Builds responsive `src`, `srcset` (480w/768w/1200w/1920w), optional AVIF `srcset`,
 * and lightweight blur placeholder attributes from a verified R2 manifest entry.
 * Returns `null` when the asset has not been migrated to R2 yet so callers can fall back cleanly.
 */
export function buildR2ResponsiveImage(
  src: string,
  options: {
    width?: number;
    height?: number;
    widths?: readonly number[];
    sizes?: string;
    manifest?: R2AssetManifest;
  } = {},
): ResponsiveR2ImageSet | null {
  const entry = getR2AssetEntry(src, options.manifest);
  if (!entry || !entry.variants || entry.variants.length === 0) {
    return null;
  }

  const allowedWidths = options.widths?.length ? options.widths : R2_RESPONSIVE_WIDTHS;
  const maxAllowedWidth = Math.max(...allowedWidths);

  const pickVariants = (format: "webp" | "avif") => {
    const all = entry.variants
      .filter((v) => v.format === format)
      .sort((a, b) => a.width - b.width);
    if (all.length === 0) return [];
    const filtered = all.filter((v) => v.width <= maxAllowedWidth);
    return filtered.length > 0 ? filtered : [all[0]];
  };

  const webpVariants = pickVariants("webp");
  const avifVariants = pickVariants("avif");
  const primaryVariants = webpVariants.length > 0 ? webpVariants : entry.variants;

  const targetWidth = options.width ?? Math.min(1200, entry.width);
  const chosen =
    primaryVariants.find((v) => v.width >= targetWidth) ??
    primaryVariants[primaryVariants.length - 1];

  const fullVariant = primaryVariants[primaryVariants.length - 1];
  const fullSrc = entry.originalKey
    ? resolveR2VariantUrl({ key: entry.originalKey, url: entry.originalUrl ?? "" })
    : entry.originalUrl || resolveR2VariantUrl(fullVariant);

  const computedWidth = options.width ?? entry.width;
  const computedHeight =
    options.height ??
    (entry.width > 0 ? Math.round((computedWidth * entry.height) / entry.width) : entry.height);

  return {
    src: resolveR2VariantUrl(chosen),
    srcset: primaryVariants.map((v) => `${resolveR2VariantUrl(v)} ${v.width}w`).join(", "),
    avifSrcSet:
      avifVariants.length > 0
        ? avifVariants.map((v) => `${resolveR2VariantUrl(v)} ${v.width}w`).join(", ")
        : undefined,
    sizes: options.sizes,
    width: computedWidth,
    height: computedHeight,
    blurDataURL: entry.blurDataURL,
    thumbnailSrc: entry.thumbnail ? resolveR2VariantUrl(entry.thumbnail) : undefined,
    fullSrc,
    source: "r2",
  };
}

export function getAssetPlaceholder(
  src: string,
  customManifest: R2AssetManifest = manifest,
): string | undefined {
  return getR2AssetEntry(src, customManifest)?.blurDataURL;
}

export function getAssetCatalogStats(customManifest: R2AssetManifest = manifest) {
  const entries = Object.values(customManifest.assets || {});
  const totalVariants = entries.reduce((sum, item) => sum + (item.variants?.length ?? 0), 0);
  const totalBytes = entries.reduce(
    (sum, item) =>
      sum +
      (item.variants?.reduce((vSum, v) => vSum + (v.bytes ?? 0), 0) ?? 0) +
      (item.thumbnail?.bytes ?? 0),
    0,
  );

  return {
    bucket: customManifest.bucket,
    publicBaseUrl: getPublicAssetBaseUrl(),
    generatedAt: customManifest.generatedAt,
    migratedAssets: entries.length,
    totalVariants,
    totalBytes,
  };
}
