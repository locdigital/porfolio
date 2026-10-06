import type { APIRoute } from "astro";
import { json, jsonError } from "../../../../../lib/http";
import { getGoogleStatus } from "../../../../../lib/booking/google";
import { requireBookingAdmin } from "../../../../../lib/booking/security";

export const GET: APIRoute = async (context) => {
  const unauthorized = requireBookingAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    return json({ success: true, google: await getGoogleStatus() });
  } catch (error) {
    return jsonError(error, { status: 500 });
  }
};
