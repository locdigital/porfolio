export const SITE_URL = "https://loc.digital";
export const SITE_NAME = "Phuc Loc Nguyen — Workspace";
export const CONTACT_EMAIL = "hi@loc.digital";

// Cloudflare R2 public asset storage configuration
export const R2_BUCKET_NAME = "loc-digital-assets";
export const R2_PUBLIC_HOST = "assets.loc.digital";
export const R2_PUBLIC_ORIGIN = `https://${R2_PUBLIC_HOST}`;

// Legacy UploadThing CDN (preserved as fallback during staged R2 migration)
export const UPLOADTHING_APP_ID = "65wv0vnolo";
export const UPLOADTHING_CDN_HOST = `${UPLOADTHING_APP_ID}.ufs.sh`;
export const UPLOADTHING_CDN_ORIGIN = `https://${UPLOADTHING_CDN_HOST}`;

/**
 * Standard responsive derivative widths generated for Cloudflare R2 asset delivery.
 */
export const R2_RESPONSIVE_WIDTHS = [480, 768, 1200, 1920] as const;

/**
 * Responsive display breakpoints matching actual layout containers:
 * 320px (thumbnails), 480px (mobile), 640px/768px (tablet & 2-col masonry),
 * 960px/1200px/1280px (desktop content), 1920px (large desktop & photography preview),
 * 2560px (high-resolution photography viewer).
 */
export const RESPONSIVE_IMAGE_WIDTHS = {
  thumbnail: [320, 480],
  card: [480, 768, 1200],
  gallery: [480, 768, 1200],
  hero: [480, 768, 1200, 1920],
  viewer: [480, 768, 1200, 1920, 2560],
} as const;

export const IMAGE_QUALITY_PRESETS = {
  thumbnail: 76,
  standard: 82,
  photographyPreview: 86,
  photographyHighRes: 90,
} as const;

export const CACHE_CONTROL = {
  /** Content-hashed static assets and versioned R2 objects */
  immutableAsset: "public, max-age=31536000, immutable",
  /** Mutable non-hashed static files (favicons, manifests, unversioned files) */
  mutableAsset: "public, max-age=3600, stale-while-revalidate=86400",
  /** Build-time public JSON feeds (/api/photos.json, /api/photos-widget.json, /api/search-index.json) */
  staticApiSwr: "public, max-age=3600, stale-while-revalidate=86400",
  /** HTML documents served from Vercel CDN */
  htmlDocument: "public, max-age=0, must-revalidate",
  /** Private, authenticated, or personalized API responses — never cache at CDN or browser */
  privateNoStore: "private, no-store, max-age=0",
} as const;

export const ALLOWED_ASSET_CORS_ORIGINS = [
  "https://loc.digital",
  "https://www.loc.digital",
] as const;
