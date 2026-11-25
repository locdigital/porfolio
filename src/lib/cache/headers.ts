import { CACHE_CONTROL } from "@/config/site";

export { CACHE_CONTROL };

export function jsonCachedResponse(
  payload: unknown,
  cacheControl: string = CACHE_CONTROL.staticApiSwr,
): Response {
  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl,
    },
  });
}
