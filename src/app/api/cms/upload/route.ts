import { NextRequest, NextResponse } from "next/server";
import { readCmsPayload, uploadAssets } from "@/lib/cms-admin";
import { isCmsDisabledInProduction, isCmsRequestAuthorized } from "@/lib/cms-auth";

function isFile(value: FormDataEntryValue): value is File {
  return typeof value === "object" && "arrayBuffer" in value && "name" in value;
}

export async function POST(request: NextRequest) {
  if (isCmsDisabledInProduction()) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!isCmsRequestAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await request.formData();
    const target = String(form.get("target") ?? "");
    const slug = String(form.get("slug") ?? "");
    const files = form.getAll("files").filter(isFile);

    if (target !== "photos" && target !== "gear" && target !== "writing") {
      return NextResponse.json({ success: false, error: "Upload target must be photos, gear, or writing." }, { status: 400 });
    }

    if (target === "photos" && !slug) {
      return NextResponse.json({ success: false, error: "Photo uploads need a location slug." }, { status: 400 });
    }

    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "Choose at least one image to upload." }, { status: 400 });
    }

    const uploaded = await uploadAssets({ target, slug, files });

    return NextResponse.json({
      success: true,
      uploaded,
      data: await readCmsPayload(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to upload files.",
      },
      { status: 400 }
    );
  }
}
