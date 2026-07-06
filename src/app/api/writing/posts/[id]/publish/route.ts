import { NextRequest, NextResponse } from "next/server";
import { publishPost, unpublishPost } from "@/lib/writing/posts";
import { isCmsRequestAuthorized } from "@/lib/cms-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string;
    if (action === "unpublish") {
      const post = await unpublishPost(id);
      return NextResponse.json({ success: true, data: post });
    } else {
      const post = await publishPost(id);
      return NextResponse.json({ success: true, data: post });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
