import type { APIRoute } from "astro";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { isCmsRequestAuthorized } from "../../../../lib/cms-auth";
import { json } from "../../../../lib/http";
import { uploadToUploadThing } from "../../../../lib/uploadthing-server";

export const prerender = false;

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const POST: APIRoute = async ({ request }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return json({ success: false, error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return json(
        { success: false, error: "Invalid file type. Allowed: jpg, png, webp" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return json({ success: false, error: "File too large. Max 5MB" }, { status: 400 });
    }

    const ext = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
    const filename = `writing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "writing");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const buffer = await file.arrayBuffer();
    const remoteUrl = await uploadToUploadThing(buffer, filename);
    if (remoteUrl) {
      return json({ success: true, url: remoteUrl });
    }

    await writeFile(path.join(uploadDir, filename), new Uint8Array(buffer));

    const url = `/uploads/writing/${filename}`;
    return json({ success: true, url });
  } catch (error) {
    return json({ success: false, error: String(error) }, { status: 500 });
  }
};
