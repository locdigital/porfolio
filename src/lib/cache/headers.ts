import { ALLOWED_ASSET_CORS_ORIGINS, CACHE_CONTROL } from "@/config/site";

export { CACHE_CONTROL };

export function jsonCachedResponse(
  payload: unknown,
  cacheControl: string = CACHE_CONTROL.staticApiSwr,
): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Private, authenticated, or personalized JSON responses.
 * Explicitly prevents CDN and browser caching.
 */
export function privateJsonResponse(
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": CACHE_CONTROL.privateNoStore,
      Pragma: "no-cache",
      Vary: "Origin, Cookie, Authorization",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

/**
 * Emits strict CORS headers only for explicitly allowed first-party origins.
 */
export function corsHeadersForOrigin(
  origin: string | null | undefined,
  allowedMethods: readonly string[] = ["GET", "HEAD"],
): Record<string, string> {
  if (!origin) return {};
  const isAllowed = (ALLOWED_ASSET_CORS_ORIGINS as readonly string[]).includes(origin);
  if (!isAllowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": allowedMethods.join(", "),
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
