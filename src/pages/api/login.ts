// src/pages/api/login.ts
import type { APIRoute } from 'astro';
import {
  createCmsSessionCookie,
  getCmsAuthConfig,
  isCmsDisabledInProduction,
} from '../../lib/cms-auth';
import { json } from '../../lib/http';

export const prerender = false;

async function readCredentials(request: Request) {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    return Object.fromEntries(await request.formData()) as { username?: string; password?: string };
  }

  const rawBody = await request.text();

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody)) as { username?: string; password?: string };
  }

  return JSON.parse(rawBody) as { username?: string; password?: string };
}

export const POST: APIRoute = async ({ request }) => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  let credentials: { username?: string; password?: string };

  try {
    credentials = await readCredentials(request);
  } catch {
    return json({ success: false, error: 'Invalid request' }, { status: 400 });
  }

  const { username, password } = credentials;
  const authConfig = getCmsAuthConfig();

  if (!authConfig.configured) {
    return json({ success: false, error: 'CMS auth is not configured.' }, { status: 500 });
  }

  if (username === authConfig.username && password === authConfig.password) {
    const headers = new Headers();
    headers.append('Set-Cookie', createCmsSessionCookie());
    return json({ success: true }, { status: 200, headers });
  }

  return json({ success: false, error: 'Invalid credentials' }, { status: 401 });
};
