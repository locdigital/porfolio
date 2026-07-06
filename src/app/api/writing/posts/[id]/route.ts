import { NextRequest, NextResponse } from "next/server";
import { deletePost, getPost, updatePost } from "@/lib/writing/posts";
import { isCmsRequestAuthorized } from "@/lib/cms-auth";
import { countWords, computeReadingTime, extractTextFromHtml } from "@/lib/writing/reading-time";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, data: post });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));

    // Auto-compute word count and reading time from HTML if available
    if (body.contentHtml !== undefined) {
      const text = extractTextFromHtml(body.contentHtml);
      body.wordCount = countWords(text);
      body.readingTime = computeReadingTime(body.wordCount);
    }

    const updated = await updatePost(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await deletePost(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
