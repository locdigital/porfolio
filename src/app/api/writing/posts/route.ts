import { NextRequest, NextResponse } from "next/server";
import { createPost, listPosts } from "@/lib/writing/posts";
import { generateSlug } from "@/lib/writing/slug";
import { isCmsRequestAuthorized } from "@/lib/cms-auth";

export async function GET(request: NextRequest) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const posts = await listPosts();
    return NextResponse.json({ success: true, data: posts });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
