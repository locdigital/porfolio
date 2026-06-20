// src/pages/api/logout.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async () => {
  const isProduction = import.meta.env.PROD || process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  if (isProduction) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  // Clear the session cookie
  headers.append('Set-Cookie', `session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`);
  headers.append('Content-Type', 'application/json');
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};
