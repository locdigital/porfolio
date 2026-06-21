// src/pages/api/logout.ts
import type { APIRoute } from 'astro';
import { clearCmsSessionCookies, isCmsDisabledInProduction } from '../../lib/cms-auth';

export const prerender = false;

export const POST: APIRoute = async () => {
  if (isCmsDisabledInProduction()) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  clearCmsSessionCookies().forEach((cookie) => headers.append('Set-Cookie', cookie));
  headers.append('Content-Type', 'application/json');
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};
