import { getImage } from "astro:assets";
import type { ImageMetadata, ImageOutputFormat, ImageQuality } from "astro";
import type { Photo } from "./locations";

type ImageModule = {
  default: ImageMetadata;
};

type OptimizePhotoOptions = {
  previewWidth?: number;
  previewWidths?: number[];
  previewSizes?: string;
  previewFormat?: ImageOutputFormat;
  previewQuality?: ImageQuality;
  fullWidth?: number;
  fullFormat?: ImageOutputFormat;
  fullQuality?: ImageQuality;
  /** Generate a WebP srcset as fallback (for browsers not supporting AVIF) */
  withWebpFallback?: boolean;
};

export type OptimizedPhoto = Photo & {
  originalSrc: string;
  previewSrc: string;
  previewSrcSet: string;
  /** WebP srcset for <picture> fallback (only set when withWebpFallback: true) */
  webpSrcSet?: string;
  previewSizes: string;
  previewWidth: number;
  previewHeight: number;
  fullSrc: string;
  fullWidth: number;
  fullHeight: number;
};

export const PHOTO_GRID_SIZES =
  "(max-width: 600px) 75vw, (max-width: 900px) 50vw, 33vw";
export const MASONRY_GRID_SIZES =
  "(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 17vw";
export const STRIP_GALLERY_SIZES =
  "(max-width: 700px) 70vw, 360px";

// Removed 1280 — grid thumbnails never render that wide; saves bandwidth
const DEFAULT_PREVIEW_WIDTHS = [240, 400, 640, 960];
const photoModules = import.meta.glob<ImageModule>("../assets/photos/**/*.{jpg,jpeg,png,webp}", {
  eager: true,
});

function publicPhotoPathToAssetKey(src: string) {
  const pathname = decodeURIComponent(src.split("?")[0]);

  if (!pathname.startsWith("/assets/photos/")) {
    throw new Error(`Expected a public photo path, received: ${src}`);
  }

  return pathname.replace("/assets/photos/", "../assets/photos/");
}

export function getPhotoAsset(src: string) {
  const key = publicPhotoPathToAssetKey(src);
  const match = photoModules[key];

  if (!match) {
    throw new Error(`Missing source image for ${src}. Looked up ${key}.`);
  }

  return match.default;
}

function clampWidths(widths: number[], maxWidth: number) {
  const usableWidths = widths
    .map((width) => Math.min(width, maxWidth))
    .filter((width) => width > 0);

  return [...new Set(usableWidths)].sort((a, b) => a - b);
}

function dimensionsAtWidth(asset: ImageMetadata, width: number) {
  const safeWidth = Math.min(width, asset.width);

  return {
    width: safeWidth,
    height: Math.round((safeWidth / asset.width) * asset.height),
  };
}

function defaultFullWidth(asset: ImageMetadata) {
  const targetWidth = asset.width >= asset.height ? 1920 : 1280;
  return Math.min(asset.width, targetWidth);
}

async function buildImage(
  asset: ImageMetadata,
  width: number,
  widths: number[],
  format: ImageOutputFormat,
  quality: ImageQuality,
) {
  return getImage({
    src: asset,
    width: Math.min(width, asset.width),
    widths: clampWidths(widths, asset.width),
    format,
    quality,
  });
}

export async function optimizePhoto(
  photo: Photo,
  options: OptimizePhotoOptions = {},
): Promise<OptimizedPhoto> {
  try {
    const asset = getPhotoAsset(photo.src);
    const previewWidth = Math.min(options.previewWidth ?? 640, asset.width);

    // Optimize Sharp workload in development mode
    const isDev = import.meta.env.DEV;
    const targetWidths = isDev ? [previewWidth] : (options.previewWidths ?? DEFAULT_PREVIEW_WIDTHS);
    const shouldFallback = isDev ? false : (options.withWebpFallback ?? true);

    // Primary: AVIF (≈30% smaller than WebP, supported by 93%+ browsers as of 2025)
    const preview = await buildImage(
      asset,
      previewWidth,
      targetWidths,
      options.previewFormat ?? "avif",
      options.previewQuality ?? 65,
    );

    // Optional WebP fallback srcset for <picture> tag (Safari < 16, old Edge)
    let webpSrcSet: string | undefined;
    if (shouldFallback) {
      const webpPreview = await buildImage(
        asset,
        previewWidth,
        targetWidths,
        "webp",
        (options.previewQuality ?? 65) + 5, // WebP needs slightly higher quality for same visual
      );
      webpSrcSet = webpPreview.srcSet.attribute;
    }

    const fullWidth = Math.min(options.fullWidth ?? defaultFullWidth(asset), asset.width);
    const targetFullWidth = isDev ? Math.min(fullWidth, 1024) : fullWidth;
    const full = await getImage({
      src: asset,
      width: targetFullWidth,
      format: options.fullFormat ?? "webp",
      quality: options.fullQuality ?? 75,
    });
    const previewDimensions = dimensionsAtWidth(asset, previewWidth);
    const fullDimensions = dimensionsAtWidth(asset, fullWidth);

    return {
      ...photo,
      w: asset.width,
      h: asset.height,
      originalSrc: photo.src,
      previewSrc: preview.src,
      previewSrcSet: preview.srcSet.attribute,
      webpSrcSet,
      previewSizes: options.previewSizes ?? PHOTO_GRID_SIZES,
      previewWidth: Number(preview.attributes.width ?? previewDimensions.width),
      previewHeight: Number(preview.attributes.height ?? previewDimensions.height),
      fullSrc: full.src,
      fullWidth: Number(full.attributes.width ?? fullDimensions.width),
      fullHeight: Number(full.attributes.height ?? fullDimensions.height),
    };
  } catch (error) {
    console.warn(`[photo-assets] Failed to optimize photo ${photo.src}:`, error instanceof Error ? error.message : error);
    return {
      ...photo,
      w: photo.w ?? 1600,
      h: photo.h ?? 1200,
      originalSrc: photo.src,
      previewSrc: photo.src,
      previewSrcSet: "",
      webpSrcSet: undefined,
      previewSizes: options.previewSizes ?? PHOTO_GRID_SIZES,
      previewWidth: photo.w ?? 1600,
      previewHeight: photo.h ?? 1200,
      fullSrc: photo.src,
      fullWidth: photo.w ?? 1600,
      fullHeight: photo.h ?? 1200,
    };
  }
}

export async function optimizePhotos(
  photos: Photo[],
  options: OptimizePhotoOptions = {},
) {
  return Promise.all(photos.map((photo) => optimizePhoto(photo, options)));
}

export function toImgAttributes(photo: OptimizedPhoto) {
  return {
    src: photo.previewSrc,
    srcset: photo.previewSrcSet,
    sizes: photo.previewSizes,
    width: photo.previewWidth,
    height: photo.previewHeight,
  };
}
