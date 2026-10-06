import type { APIRoute } from "astro";
import { json, jsonError } from "../../../lib/http";
import { getBookingSettings } from "../../../lib/booking/data";
import { getGoogleStatus } from "../../../lib/booking/google";
import { getTwoMonthBookingWindow } from "../../../lib/booking/time";

export const GET: APIRoute = async () => {
  try {
    const settings = await getBookingSettings();
    const bookingWindow = getTwoMonthBookingWindow(settings.owner_timezone);
    const google = await getGoogleStatus().catch((error) => ({ configured: false, connected: false, error: error instanceof Error ? error.message : "Google unavailable" }));
    return json({
      success: true,
      settings: {
        ownerTimezone: settings.owner_timezone,
        allowedDurations: settings.allowed_durations,
        defaultDuration: settings.default_duration_minutes,
        minimumNoticeHours: settings.minimum_notice_hours,
        pendingExpiryHours: settings.pending_expiry_hours,
        bookingWindow,
      },
      calendar: google,
    });
  } catch (error) {
    return jsonError(error, { status: 503 });
  }
};
