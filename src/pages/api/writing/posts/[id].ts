import type { APIRoute } from "astro";
import { deletePost, getPost, updatePost } from "../../../../lib/writing/posts";
import { isCmsRequestAuthorized } from "../../../../lib/cms-auth";
import { json } from "../../../../lib/http";
import { countWords, computeReadingTime, extractTextFromHtml } from "../../../../lib/writing/reading-time";

export const prerender = false;

export const GET: APIRoute = async ({ request, params }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id as string;
  const post = await getPost(id);
  if (!post) return json({ success: false, error: "Not found" }, { status: 404 });
  return json({ success: true, data: post });
};

export const PATCH: APIRoute = async ({ request, params }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id as string;
  try {
    const body = await request.json().catch(() => ({}));

    // Auto-compute word count and reading time from HTML if available
    if (body.contentHtml !== undefined) {
      const text = extractTextFromHtml(body.contentHtml);
      body.wordCount = countWords(text);
      body.readingTime = computeReadingTime(body.wordCount);
    }

    const updated = await updatePost(id, body);
    return json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ success: false, error: message }, { status: 400 });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (!isCmsRequestAuthorized(request)) {
    return json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id as string;
  try {
    await deletePost(id);
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: String(error) }, { status: 500 });
  }
};
