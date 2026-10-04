import manifest from "../../data/uploadthing-images.json";

const images = (manifest.images || {}) as Record<string, string>;

export function uploadedAssetUrl(src: string) {
  if (!src || !src.startsWith("/")) return src;

  const cleanPath = decodeURIComponent(src.split("?")[0]);
  const publicKey = `public${cleanPath}`;
  const srcKey = `src${cleanPath}`;

  return images[publicKey] ?? images[srcKey] ?? src;
}
