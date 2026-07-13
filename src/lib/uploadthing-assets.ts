import manifest from "../../data/uploadthing-images.json";

const images = manifest.images as Record<string, string>;

export function uploadedAssetUrl(src: string) {
  if (!src.startsWith("/")) return src;

  const cleanPath = decodeURIComponent(src.split("?")[0]);
  const key = `public${cleanPath}`;

  return images[key] ?? src;
}
