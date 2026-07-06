import type { Photo } from "./locations";

type OptimizePhotoOptions = {
  previewWidth?: number;
  previewWidths?: number[];
  previewSizes?: string;
  previewFormat?: string;
  previewQuality?: number;
  fullWidth?: number;
  fullFormat?: string;
  fullQuality?: number;
  withWebpFallback?: boolean;
};

export type OptimizedPhoto = Photo & {
  originalSrc: string;
  previewSrc: string;
  previewSrcSet: string;
  webpSrcSet?: string;
  previewSizes: string;
  previewWidth: number;
  previewHeight: number;
  fullSrc: string;
  fullWidth: number;
  fullHeight: number;
};

export const PHOTO_GRID_SIZES = "(max-width: 600px) 75vw, (max-width: 900px) 50vw, 33vw";
export const MASONRY_GRID_SIZES = "(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 17vw";
export const STRIP_GALLERY_SIZES = "(max-width: 700px) 70vw, 360px";

export function getPhotoAsset(src: string) {
  // Return the public path directly since Next.js serves static assets from /public/
  return {
    src,
    width: 1600,
    height: 1200,
    format: "webp"
  };
}

export async function optimizePhoto(
  photo: Photo,
  options: OptimizePhotoOptions = {},
): Promise<OptimizedPhoto> {
  // Simple mapping that bypasses Astro's getImage and returns direct public paths.
  // Next.js standard components or CSS aspect-ratio will handle scaling.
  const w = photo.w || 1600;
  const h = photo.h || 1200;
  return {
    ...photo,
    w,
    h,
    originalSrc: photo.src,
    previewSrc: photo.src,
    previewSrcSet: "",
    webpSrcSet: undefined,
    previewSizes: options.previewSizes || PHOTO_GRID_SIZES,
    previewWidth: w,
    previewHeight: h,
    fullSrc: photo.src,
    fullWidth: w,
    fullHeight: h,
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
