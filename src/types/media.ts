export type MediaAssetType = "image" | "video" | "audio";

export interface MediaAsset {
  id: string;
  type: MediaAssetType;
  url: string;
  fileKey?: string;
  width?: number;
  height?: number;
  size?: number;
  format: string;
  alt?: string;
  blurDataURL?: string;
  poster?: string;
  duration?: number;
  variants?: Record<string, string>;
}

export interface UploadThingUniqueEntry {
  url: string;
  fileKey: string;
  fileHash: string;
  paths: string[];
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  variants?: Record<string, string>;
}

export interface UploadThingManifest {
  appId: string;
  generatedAt?: string;
  totals?: {
    images: number;
    unique: number;
  };
  images: Record<string, string>;
  unique?: Record<string, UploadThingUniqueEntry>;
  videos?: Record<string, MediaAsset>;
}
