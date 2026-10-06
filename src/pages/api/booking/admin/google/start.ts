import type { APIRoute } from "astro";
import { json, jsonError } from "../../../../../lib/http";
import { getGoogleAuthUrl } from "../../../../../lib/booking/google";
import { requireBookingAdmin } from "../../../../../lib/booking/security";

export const POST: APIRoute = async (context) => {
  const unauthorized = requireBookingAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    return json({ success: true, url: getGoogleAuthUrl() });
  } catch (error) {
    return jsonError(error, { status: 500 });
  }
};
