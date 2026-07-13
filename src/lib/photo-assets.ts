import type { ImageOutputFormat, ImageQuality } from "astro";
import type { Photo } from "./locations";
import { uploadedAssetUrl } from "./uploadthing-assets";

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

export async function optimizePhoto(
  photo: Photo,
  options: OptimizePhotoOptions = {},
): Promise<OptimizedPhoto> {
  const width = photo.w || options.previewWidth || 1600;
  const height = photo.h || 1200;
  const src = uploadedAssetUrl(photo.src);

  return {
    ...photo,
    w: width,
    h: height,
    originalSrc: photo.src,
    previewSrc: src,
    previewSrcSet: "",
    webpSrcSet: undefined,
    previewSizes: options.previewSizes ?? PHOTO_GRID_SIZES,
    previewWidth: width,
    previewHeight: height,
    fullSrc: src,
    fullWidth: width,
    fullHeight: height,
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
