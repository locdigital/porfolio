import type { ImageOutputFormat, ImageQuality } from "astro";
import type { Photo } from "./locations";
import { buildR2ResponsiveImage, resolveAssetUrl } from "./assets";

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
  /** Optional AVIF srcset when pre-generated R2 AVIF variants exist */
  avifSrcSet?: string;
  /** WebP srcset for <picture> fallback (only set when withWebpFallback: true) */
  webpSrcSet?: string;
  /** Lightweight base64 blur placeholder when present in the R2 manifest */
  blurDataURL?: string;
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

type ResponsiveImageOptions = {
  width: number;
  height: number;
  widths?: number[];
  sizes?: string;
  quality?: ImageQuality;
};

export interface ResponsiveImageResult {
  src: string;
  srcset?: string;
  avifSrcSet?: string;
  blurDataURL?: string;
  width: number;
  height: number;
  sizes?: string;
}

/**
 * Pure dual-CDN image delivery pipeline (zero duplicate raster assets emitted into `_astro/`):
 * 1. Tier 1 — Cloudflare R2 (`assets.loc.digital`): pre-generated 320w thumbnails + responsive
 *    480w/768w/1200w/1920w WebP/AVIF variants with immutable caching.
 * 2. Tier 2 — UploadThing (`65wv0vnolo.ufs.sh`): served directly from UploadThing CDN without
 *    build-time re-downloading or duplicating onto Vercel.
 * 3. Tier 3 — Local static UI icons/logos (`/assets/logos/*`, `/assets/dock/*`).
 */
export async function responsiveImageAttributes(
  source: string,
  { width, height, widths = [480, 768, 1200, 1920], sizes }: ResponsiveImageOptions,
): Promise<ResponsiveImageResult> {
  // Tier 1: Pre-generated responsive variants verified on Cloudflare R2.
  const r2Responsive = buildR2ResponsiveImage(source, { width, height, widths, sizes });
  if (r2Responsive) {
    const useThumb = Boolean(r2Responsive.thumbnailSrc && width <= 360);
    const thumbSrc = r2Responsive.thumbnailSrc;
    const srcset =
      useThumb && thumbSrc && !r2Responsive.srcset.includes(thumbSrc)
        ? `${thumbSrc} 320w, ${r2Responsive.srcset}`
        : r2Responsive.srcset;
    return {
      src: useThumb && thumbSrc ? thumbSrc : r2Responsive.src,
      srcset,
      avifSrcSet: r2Responsive.avifSrcSet,
      blurDataURL: r2Responsive.blurDataURL,
      width: r2Responsive.width,
      height: r2Responsive.height,
      sizes: r2Responsive.sizes,
    };
  }

  // Tier 2 (UploadThing CDN) & Tier 3 (local static UI assets): pass through cleanly with zero Vercel bloat.
  const resolved = resolveAssetUrl(source, { preferredWidth: width });
  return { src: resolved, width, height, sizes };
}

export async function optimizePhoto(
  photo: Photo,
  options: OptimizePhotoOptions = {},
): Promise<OptimizedPhoto> {
  const originalWidth = photo.w || 1600;
  const originalHeight = photo.h || 1200;
  const width = Math.min(options.previewWidth ?? 960, originalWidth);
  const height = Math.round((width * originalHeight) / originalWidth);
  const src = resolveAssetUrl(photo.src);
  const previewSizes = options.previewSizes ?? PHOTO_GRID_SIZES;
  const preview = await responsiveImageAttributes(photo.src, {
    width,
    height,
    widths: options.previewWidths,
    sizes: previewSizes,
    quality: options.previewQuality,
  });

  return {
    ...photo,
    w: originalWidth,
    h: originalHeight,
    originalSrc: photo.src,
    previewSrc: preview.src,
    previewSrcSet: preview.srcset ?? "",
    avifSrcSet: preview.avifSrcSet,
    webpSrcSet: undefined,
    blurDataURL: preview.blurDataURL,
    previewSizes,
    previewWidth: width,
    previewHeight: height,
    fullSrc: src,
    fullWidth: originalWidth,
    fullHeight: originalHeight,
  };
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
