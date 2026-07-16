import { UTApi, UTFile } from "uploadthing/server";

const token = process.env.UPLOADTHING_TOKEN;
const utapi = token ? new UTApi({ token }) : null;

export function canUploadToUploadThing() {
  return Boolean(utapi);
}

export async function uploadToUploadThing(buffer: Buffer | Uint8Array | ArrayBuffer, name: string) {
  if (!utapi) return null;

  const bytes = buffer instanceof ArrayBuffer
    ? buffer
    : buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const result = await utapi.uploadFiles(new UTFile([bytes], name));
  if (!result.data?.ufsUrl) {
    throw new Error(result.error?.message ?? "UploadThing upload failed");
  }

  return result.data.ufsUrl;
}
