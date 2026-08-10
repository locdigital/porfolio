import type { APIRoute } from "astro";
import {
  deleteEntry,
  collectionNames,
  readCmsPayload,
  saveGear,
  saveCollectionEntry,
  savePhotoLocation,
  saveProject,
  saveWritingPost,
  type CollectionName,
} from "../../lib/cms-admin";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "../../lib/cms-auth";
import { json, jsonError, readJsonBody } from "../../lib/http";

export const prerender = false;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export const GET: APIRoute = async ({ request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await readCmsPayload();
  return json({ success: true, data });
};

export const POST: APIRoute = async ({ request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await readJsonBody<Record<string, unknown>>(request);
    const resource = String(body.resource ?? "");
    const action = String(body.action ?? "save");
    const data = asRecord(body.data);

    if (action === "delete") {
      await deleteEntry(resource, body.slug);
      return json({ success: true, data: await readCmsPayload() });
    }

    if (resource === "writing") {
      await saveWritingPost(data);
    } else if (resource === "gear") {
      await saveGear(data);
    } else if (resource === "projects") {
      await saveProject(data);
    } else if (resource === "photos") {
      await savePhotoLocation(data);
    } else if (collectionNames.includes(resource as CollectionName)) {
      await saveCollectionEntry(resource as CollectionName, data);
    } else {
      return json({ success: false, error: "Unknown CMS resource." }, { status: 400 });
    }

    return json({ success: true, data: await readCmsPayload() });
  } catch (error) {
    return jsonError(error, { status: 400, fallbackMessage: "Unable to save CMS data." });
  }
};
