import type { APIRoute } from "astro";
import { publishPost, unpublishPost } from "../../../../../lib/writing/posts";
import { isCmsRequestAuthorized } from "../../../../../lib/cms-auth";

export const prerender = false;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export const POST: APIRoute = async ({ request, params }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id as string;
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string;
    if (action === "unpublish") {
      const post = await unpublishPost(id);
      return json({ success: true, data: post });
    } else {
      const post = await publishPost(id);
      return json({ success: true, data: post });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, { status: 400 });
  }
};
