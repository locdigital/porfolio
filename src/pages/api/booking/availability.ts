import type { APIRoute } from "astro";
import { json, jsonError } from "../../../lib/http";
import { getAvailabilityForDate } from "../../../lib/booking/availability";
import { assertDate } from "../../../lib/booking/validation";

export const GET: APIRoute = async ({ url }) => {
  try {
    const date = url.searchParams.get("date") || "";
    const duration = Number(url.searchParams.get("duration") || 30);
    assertDate(date);
    const { settings, slots } = await getAvailabilityForDate(date, duration);
    return json({
      success: true,
      ownerTimezone: settings.owner_timezone,
      duration,
      slots,
    });
  } catch (error) {
    return jsonError(error, { status: 503, fallbackMessage: "Không thể kiểm tra lịch trống." });
  }
};
