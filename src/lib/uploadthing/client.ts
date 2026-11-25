import manifestData from "../../../data/uploadthing-images.json";
import { UPLOADTHING_CDN_ORIGIN } from "@/config/site";
import type { UploadThingManifest } from "@/types/media";

const manifest = manifestData as unknown as UploadThingManifest;
const images: Record<string, string> = manifest.images || {};

export function isTrustedMediaUrl(url: string): boolean {
  if (!url) return false;
  try {
    const local = "https://local.invalid";
    if (url.startsWith("/")) return new URL(url, local).origin === local;
    const parsed = new URL(url);
    return parsed.origin === UPLOADTHING_CDN_ORIGIN && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

export function extractFileKeyFromUrl(url: string): string | undefined {
  if (!url.startsWith(`${UPLOADTHING_CDN_ORIGIN}/f/`)) return undefined;
  return url.slice(`${UPLOADTHING_CDN_ORIGIN}/f/`.length).split("?")[0] || undefined;
}

export function uploadedAssetUrl(src: string): string {
  if (!src || !src.startsWith("/")) return src;

  const cleanPath = decodeURIComponent(src.split("?")[0]);
  const publicKey = `public${cleanPath}`;
  const srcKey = `src${cleanPath}`;

  return images[publicKey] ?? images[srcKey] ?? src;
}

export function getUploadThingManifest(): UploadThingManifest {
  return manifest;
}
