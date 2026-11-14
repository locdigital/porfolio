import type { ImageMetadata, ImageOutputFormat, ImageQuality } from "astro";
import { getImage } from "astro:assets";
import type { Photo } from "./locations";
import { uploadedAssetUrl } from "./uploadthing-assets";
import uploadManifest from "../../data/uploadthing-images.json";

// Imported metadata lets Astro emit hashed, immutable WebP files during prerendering.
// Reuse local originals when available; UploadThing remains the source for other images.
const localImages = import.meta.glob<{ default: ImageMetadata }>(
  [
    "/public/**/*.webp",
    "/public/uploads/**/*.{avif,jpeg,jpg,png}",
    "/public/instagram_workflowspace/**/*.{avif,jpeg,jpg,png}",
  ],
);
const localUploads = new Map<string, string>();
for (const [source, url] of Object.entries(uploadManifest.images)) {
  const key = `/${source}`;
  if (localImages[key]) localUploads.set(url, key);
}
const imageSources = new Map<string, Promise<ImageMetadata | string>>();

function resolveImageSource(src: string): Promise<ImageMetadata | string> {
  let image = imageSources.get(src);
  if (!image) {
    const key = src.startsWith("/")
      ? `/public${decodeURIComponent(src.split("?")[0])}`
      : localUploads.get(src);
    const load = key && localImages[key];
    image = load ? load().then((module) => module.default) : Promise.resolve(src);
    imageSources.set(src, image);
  }
  return image;
}

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

type ResponsiveImageOptions = {
  width: number;
  height: number;
  widths?: number[];
  sizes?: string;
  quality?: ImageQuality;
};

/** Keep originals for downloads/lightboxes; send a display-sized image to the page. */
export async function responsiveImageAttributes(
  source: string,
  { width, height, widths = [320, 480, 720, 960, 1280], sizes, quality = 75 }: ResponsiveImageOptions,
) {
  const src = uploadedAssetUrl(source);
  const canOptimize = src.startsWith("/") || src.startsWith("https://65wv0vnolo.ufs.sh/");
  if (!canOptimize) return { src, width, height, sizes };

  const sourceImage = await resolveImageSource(src);
  const outputWidths = typeof sourceImage === "string"
    ? widths
    : [...new Set(widths.map((candidate) => Math.min(candidate, sourceImage.width)))];
  const image = await getImage({
    src: sourceImage,
    width: typeof sourceImage === "string" ? width : Math.min(width, sourceImage.width),
    ...(typeof sourceImage === "string" ? { height } : {}),
    widths: outputWidths,
    quality,
    format: "webp",
  });
  return { src: image.src, srcset: image.srcSet.attribute, width, height, sizes };
}

export async function optimizePhoto(
  photo: Photo,
  options: OptimizePhotoOptions = {},
): Promise<OptimizedPhoto> {
  const originalWidth = photo.w || 1600;
  const originalHeight = photo.h || 1200;
  const width = Math.min(options.previewWidth ?? 960, originalWidth);
  const height = Math.round(width * originalHeight / originalWidth);
  const src = uploadedAssetUrl(photo.src);
  const previewSizes = options.previewSizes ?? PHOTO_GRID_SIZES;
  const preview = await responsiveImageAttributes(src, {
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
    webpSrcSet: undefined,
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
