import type { APIRoute } from "astro";
import { readCmsPayload, uploadAssets } from "../../../lib/cms-admin";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "../../../lib/cms-auth";
import { isFormFile, json, jsonError } from "../../../lib/http";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const target = String(form.get("target") ?? "");
    const slug = String(form.get("slug") ?? "");
    const files = form.getAll("files").filter(isFormFile);

    if (target !== "photos" && target !== "gear" && target !== "writing") {
      return json({ success: false, error: "Upload target must be photos, gear, or writing." }, { status: 400 });
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
    return jsonError(error, { status: 400, fallbackMessage: "Unable to upload files." });
  }
};
