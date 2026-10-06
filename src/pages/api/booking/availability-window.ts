import type { APIRoute } from "astro";
import { json, jsonError } from "../../../lib/http";
import { getAvailabilityWindow } from "../../../lib/booking/availability";

export const GET: APIRoute = async ({ url }) => {
  try {
    const duration = Number(url.searchParams.get("duration") || 30);
    const { settings, window, dates } = await getAvailabilityWindow(duration);
    return json({
      success: true,
      ownerTimezone: settings.owner_timezone,
      bookingWindow: window,
      dates,
    });
  } catch (error) {
    return jsonError(error, {
      status: 503,
      fallbackMessage: "Không thể lấy dữ liệu lịch Google. Tạm thời chưa thể đặt lịch.",
    });
  }
};
