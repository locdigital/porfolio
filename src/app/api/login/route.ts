import { NextRequest, NextResponse } from "next/server";
import {
  createCmsSessionCookie,
  getCmsAuthConfig,
  isCmsDisabledInProduction,
} from "@/lib/cms-auth";

export async function POST(request: NextRequest) {
  if (isCmsDisabledInProduction()) {
    return new NextResponse("Not found", { status: 404 });
  }

  let credentials: { username?: string; password?: string };

  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      credentials = Object.fromEntries(formData) as { username?: string; password?: string };
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await request.text();
      credentials = Object.fromEntries(new URLSearchParams(text)) as { username?: string; password?: string };
    } else {
      credentials = await request.json();
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const { username, password } = credentials;
  const authConfig = getCmsAuthConfig();

  if (!authConfig.configured) {
    return NextResponse.json({ success: false, error: 'CMS auth is not configured.' }, { status: 500 });
  }

  if (username === authConfig.username && password === authConfig.password) {
    const response = NextResponse.json({ success: true }, { status: 200 });
    response.headers.set('Set-Cookie', createCmsSessionCookie());
    return response;
  }

  return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
}
