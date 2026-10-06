import type { APIRoute } from "astro";
import { json, jsonError } from "../../../../lib/http";
import { expirePendingHolds } from "../../../../lib/booking/data";
import { isBookingAdminRequest } from "../../../../lib/booking/security";

export const POST: APIRoute = async ({ request }) => {
  const cronSecret = process.env.BOOKING_CRON_SECRET;
  const cronOk = cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`;
  if (!cronOk && !isBookingAdminRequest(request)) {
    return json({ success: false, error: "Unauthorized." }, { status: 401 });
  }
  try {
    await expirePendingHolds();
    return json({ success: true });
  } catch (error) {
    return jsonError(error, { status: 500 });
  }
};
