export const SITE_URL = "https://loc.digital";
export const SITE_NAME = "Phuc Loc Nguyen — Workspace";
export const CONTACT_EMAIL = "hi@loc.digital";

export const UPLOADTHING_APP_ID = "65wv0vnolo";
export const UPLOADTHING_CDN_HOST = `${UPLOADTHING_APP_ID}.ufs.sh`;
export const UPLOADTHING_CDN_ORIGIN = `https://${UPLOADTHING_CDN_HOST}`;

/**
 * Responsive display breakpoints matching actual layout containers:
 * 320px (thumbnails), 640px (mobile cards), 960px (tablet / 2-col masonry),
 * 1280px (desktop content), 1920px (large desktop & photography preview),
 * 2560px (high-resolution photography viewer).
 */
export const RESPONSIVE_IMAGE_WIDTHS = {
  thumbnail: [320, 640],
  card: [320, 640, 960],
  gallery: [320, 640, 960, 1280],
  hero: [640, 960, 1280, 1920],
  viewer: [640, 960, 1280, 1920, 2560],
} as const;

export const IMAGE_QUALITY_PRESETS = {
  thumbnail: 76,
  standard: 82,
  photographyPreview: 86,
  photographyHighRes: 90,
} as const;

export const CACHE_CONTROL = {
  immutableAsset: "public, max-age=31536000, immutable",
  staticApiSwr: "public, max-age=3600, stale-while-revalidate=86400",
  htmlDocument: "public, max-age=0, must-revalidate",
} as const;
