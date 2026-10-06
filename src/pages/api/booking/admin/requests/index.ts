import type { APIRoute } from "astro";
import { json, jsonError } from "../../../../../lib/http";
import { listBookingRequests } from "../../../../../lib/booking/data";
import { requireBookingAdmin } from "../../../../../lib/booking/security";

export const GET: APIRoute = async (context) => {
  const unauthorized = requireBookingAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    const status = context.url.searchParams.get("status") || "pending";
    const requests = await listBookingRequests(status);
    return json({ success: true, requests });
  } catch (error) {
    return jsonError(error, { status: 500 });
  }
};
