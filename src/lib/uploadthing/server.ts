/**
 * Server-only UploadThing utilities & strict upload validation.
 * Never import this module into client-side React or browser scripts.
 */
import { UTApi } from "uploadthing/server";
import { UPLOADTHING_APP_ID, UPLOADTHING_CDN_HOST } from "@/config/site";

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/webp",
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/svg+xml",
]);

export const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

export const MAX_IMAGE_UPLOAD_BYTES = 16 * 1024 * 1024; // 16 MB
export const MAX_VIDEO_UPLOAD_BYTES = 64 * 1024 * 1024; // 64 MB

export interface UploadValidationResult {
  valid: boolean;
  reason?: string;
}

export function validateMediaUploadCandidate(input: {
  mimeType: string;
  sizeBytes: number;
}): UploadValidationResult {
  const { mimeType, sizeBytes } = input;
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { valid: false, reason: "Invalid or empty file size." };
  }

  if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    if (sizeBytes > MAX_IMAGE_UPLOAD_BYTES) {
      return {
        valid: false,
        reason: `Image exceeds max size of ${MAX_IMAGE_UPLOAD_BYTES} bytes.`,
      };
    }
    return { valid: true };
  }

  if (ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
    if (sizeBytes > MAX_VIDEO_UPLOAD_BYTES) {
      return {
        valid: false,
        reason: `Video exceeds max size of ${MAX_VIDEO_UPLOAD_BYTES} bytes.`,
      };
    }
    return { valid: true };
  }

  return { valid: false, reason: `Unsupported MIME type: ${mimeType}` };
}

export function parseUploadThingTokenAppId(rawToken: string | undefined): string | null {
  if (!rawToken) return null;
  try {
    const decoded = JSON.parse(Buffer.from(rawToken, "base64").toString("utf8"));
    return typeof decoded?.appId === "string" ? decoded.appId : null;
  } catch {
    return null;
  }
}

export function verifyUploadThingCredentials(expectedAppId = UPLOADTHING_APP_ID): {
  configured: boolean;
  appId?: string;
  cdnHost: string;
  error?: string;
} {
  const token = process.env.UPLOADTHING_TOKEN;
  if (!token) {
    return {
      configured: false,
      cdnHost: UPLOADTHING_CDN_HOST,
      error: "UPLOADTHING_TOKEN is not configured.",
    };
  }

  const appId = parseUploadThingTokenAppId(token);
  if (!appId) {
    return {
      configured: false,
      cdnHost: UPLOADTHING_CDN_HOST,
      error: "UPLOADTHING_TOKEN is malformed.",
    };
  }

  if (appId !== expectedAppId) {
    return {
      configured: false,
      appId,
      cdnHost: UPLOADTHING_CDN_HOST,
      error: `Token appId (${appId}) does not match expected manifest appId (${expectedAppId}).`,
    };
  }

  return { configured: true, appId, cdnHost: UPLOADTHING_CDN_HOST };
}

export function createServerUTApi(): UTApi {
  const status = verifyUploadThingCredentials();
  if (!status.configured) {
    throw new Error(status.error || "UploadThing credentials unavailable.");
  }
  // Never log signed upload URLs or authorization headers.
  return new UTApi({ logLevel: "None" });
}
