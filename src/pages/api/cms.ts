import type { APIRoute } from "astro";
import {
  deleteEntry,
  readCmsPayload,
  saveGear,
  savePhotoLocation,
  saveProject,
  saveWritingPost,
} from "../../lib/cms-admin";

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

async function parseBody(request: Request) {
  try {
    const rawBody = await request.text();
    return JSON.parse(rawBody);
  } catch {
    throw new Error("Invalid JSON payload.");
  }
}

const isProduction = import.meta.env.PROD || process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

export const GET: APIRoute = async ({ request }) => {
  if (isProduction) {
    return new Response("Not found", { status: 404 });
  }

  if (!isAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await readCmsPayload();
  return json({ success: true, data });
};

export const POST: APIRoute = async ({ request }) => {
  if (isProduction) {
    return new Response("Not found", { status: 404 });
  }

  if (!isAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await parseBody(request);
    const resource = String(body.resource ?? "");
    const action = String(body.action ?? "save");

    if (action === "delete") {
      await deleteEntry(resource, body.slug);
      return json({ success: true, data: await readCmsPayload() });
    }

    if (resource === "writing") {
      await saveWritingPost(body.data ?? {});
    } else if (resource === "gear") {
      await saveGear(body.data ?? {});
    } else if (resource === "projects") {
      await saveProject(body.data ?? {});
    } else if (resource === "photos") {
      await savePhotoLocation(body.data ?? {});
    } else {
      return json({ success: false, error: "Unknown CMS resource." }, { status: 400 });
    }

    return json({ success: true, data: await readCmsPayload() });
  } catch (error) {
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to save CMS data.",
      },
      { status: 400 },
    );
  }
};
