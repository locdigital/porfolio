import type { APIRoute } from "astro";
import { buildPhotosWidgetPayload } from "@/lib/api/photos-feed";
import { jsonCachedResponse } from "@/lib/cache/headers";

export const prerender = true;
export const GET: APIRoute = async () => jsonCachedResponse(await buildPhotosWidgetPayload());
