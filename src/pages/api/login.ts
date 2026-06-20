// src/pages/api/login.ts
import type { APIRoute } from 'astro';

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
  const isProduction = import.meta.env.PROD || process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (isProduction) {
    return new Response("Not found", { status: 404 });
  }

  let credentials: { username?: string; password?: string };

  try {
    credentials = await readCredentials(request);
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { username, password } = credentials;

  // Hard‑coded admin credentials (replace with secure auth later)
  if (username === 'admin' && password === '12051992aA@') {
    const headers = new Headers();
    // Simple cookie, HttpOnly, same‑site strict
    headers.append('Set-Cookie', `session=admin; HttpOnly; Path=/; SameSite=Strict; Max-Age=604800`);
    headers.append('Content-Type', 'application/json');
    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  return new Response(JSON.stringify({ success: false, error: 'Invalid credentials' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
};
