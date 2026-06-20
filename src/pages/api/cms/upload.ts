import type { APIRoute } from "astro";
import { readCmsPayload, uploadAssets } from "../../../lib/cms-admin";

export const prerender = false;

function isAuthorized(request: Request) {
  const cookie = request.headers.get("cookie") ?? "";
  return /(?:^|;\s*)session=admin(?:;|$)/.test(cookie);
}

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function isFile(value: FormDataEntryValue): value is File {
  return typeof value === "object" && "arrayBuffer" in value && "name" in value;
}

export const POST: APIRoute = async ({ request }) => {
  const isProduction = import.meta.env.PROD || process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (isProduction) {
    return new Response("Not found", { status: 404 });
  }

  if (!isAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const target = String(form.get("target") ?? "");
    const slug = String(form.get("slug") ?? "");
    const files = form.getAll("files").filter(isFile);

    if (target !== "photos" && target !== "gear") {
      return json({ success: false, error: "Upload target must be photos or gear." }, { status: 400 });
    }

    if (target === "photos" && !slug) {
      return json({ success: false, error: "Photo uploads need a location slug." }, { status: 400 });
    }

    if (files.length === 0) {
      return json({ success: false, error: "Choose at least one image to upload." }, { status: 400 });
    }

    const uploaded = await uploadAssets({ target, slug, files });

    return json({
      success: true,
      uploaded,
      data: await readCmsPayload(),
    });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to upload files.",
      },
      { status: 400 },
    );
  }
};
