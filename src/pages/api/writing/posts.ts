import type { APIRoute } from "astro";
import { createPost, listPosts } from "../../../lib/writing/posts";
import { generateSlug } from "../../../lib/writing/slug";
import { isCmsRequestAuthorized } from "../../../lib/cms-auth";

export const prerender = false;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export const GET: APIRoute = async ({ request }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await listPosts();
    return json({ success: true, data: posts });
  } catch (error) {
    return json({ success: false, error: String(error) }, { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? "Untitled");
    const slug = body.slug
      ? String(body.slug)
      : generateSlug(title) || `post-${Date.now()}`;

    const post = await createPost({
      title,
      slug,
      status: "draft",
      ...body,
    });
    return json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return json({ success: false, error: String(error) }, { status: 500 });
  }
};
