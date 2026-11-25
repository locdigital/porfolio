import type { APIRoute } from "astro";
import { buildPhotosApiPayload } from "../../lib/api/photos-feed";
import { jsonCachedResponse } from "../../lib/cache/headers";

export type { PhotosApiDestination, PhotosApiPhoto } from "../../lib/api/photos-feed";

export const prerender = true;

export const GET: APIRoute = async () => jsonCachedResponse(await buildPhotosApiPayload());
