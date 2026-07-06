import { NextRequest, NextResponse } from "next/server";
import { clearCmsSessionCookies, isCmsDisabledInProduction } from "@/lib/cms-auth";

export async function POST(request: NextRequest) {
  if (isCmsDisabledInProduction()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  clearCmsSessionCookies().forEach((cookie) => {
    response.headers.append('Set-Cookie', cookie);
  });
  return response;
}
