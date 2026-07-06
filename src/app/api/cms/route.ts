import { NextRequest, NextResponse } from "next/server";
import {
  deleteEntry,
  readCmsPayload,
  saveGear,
  savePhotoLocation,
  saveProject,
  saveWritingPost,
} from "@/lib/cms-admin";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "@/lib/cms-auth";

export async function GET(request: NextRequest) {
  if (isCmsDisabledInProduction()) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Convert NextRequest to standard Request for isCmsRequestAuthorized check
  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await readCmsPayload();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  if (isCmsDisabledInProduction()) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const resource = String(body.resource ?? "");
    const action = String(body.action ?? "save");

    if (action === "delete") {
      await deleteEntry(resource, body.slug);
      return NextResponse.json({ success: true, data: await readCmsPayload() });
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
      return NextResponse.json({ success: false, error: "Unknown CMS resource." }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: await readCmsPayload() });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to save CMS data.",
      },
      { status: 400 }
    );
  }
}
