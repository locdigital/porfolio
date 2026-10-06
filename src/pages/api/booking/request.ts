import type { APIRoute } from "astro";
import { json, jsonError, readJsonBody } from "../../../lib/http";
import { getAvailabilityForDate } from "../../../lib/booking/availability";
import { ensureBookingStorage, getBookingSettings } from "../../../lib/booking/data";
import { sendOwnerNotification, sendPendingReceipt } from "../../../lib/booking/email";
import { addMinutes, dateOnlyInTimeZone, isIntervalInWindow } from "../../../lib/booking/time";
import { asString, assertEmail, assertIso, assertMemoryRateLimit, rateLimitKey } from "../../../lib/booking/validation";
import { clientIp } from "../../../lib/booking/security";
import type { BookingRequest } from "../../../lib/booking/types";

export const POST: APIRoute = async ({ request }) => {
  try {
    assertMemoryRateLimit(rateLimitKey("booking-submit", clientIp(request)), 6, 60 * 60 * 1000);
    const body = await readJsonBody<Record<string, unknown>>(request);
    const name = asString(body.name, 80);
    const email = asString(body.email, 120).toLowerCase();
    const subject = asString(body.subject, 120);
    const description = asString(body.description, 1000);
    const visitorTimezone = asString(body.timezone, 80) || "Asia/Ho_Chi_Minh";
    const startsAt = asString(body.startsAt, 40);
    const endsAt = asString(body.endsAt, 40);
    const duration = Number(body.duration || 30);
    const honeypot = asString(body.company, 80);

    if (honeypot) return json({ success: true });
    if (!name || !subject) throw new Error("Vui lòng nhập tên và chủ đề cuộc hẹn.");
    assertEmail(email);
    assertIso(startsAt);
    assertIso(endsAt);

    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const configuredSettings = await getBookingSettings();
    if (!isIntervalInWindow(start, end, configuredSettings.owner_timezone)) {
      throw new Error("Khung giờ nằm ngoài cửa sổ đặt lịch 2 tháng tới.");
    }
    const date = dateOnlyInTimeZone(start, configuredSettings.owner_timezone);
    const { settings, slots } = await getAvailabilityForDate(date, duration);
    const slotStillAvailable = slots.some((slot) => slot.startsAt === start.toISOString() && slot.endsAt === end.toISOString());
    if (!slotStillAvailable) throw new Error("Khung giờ này vừa hết trống. Vui lòng chọn khung giờ khác.");

    const holdExpiryByHours = addMinutes(new Date(), settings.pending_expiry_hours * 60);
    const holdExpiryBeforeStart = addMinutes(start, -1);
    const holdExpiresAt = new Date(Math.min(holdExpiryByHours.getTime(), holdExpiryBeforeStart.getTime()));
    const idempotencyKey = request.headers.get("idempotency-key") || crypto.randomUUID();

    const supabase = ensureBookingStorage();
    const { data, error } = await supabase.rpc("booking_create_request", {
      p_visitor_name: name,
      p_visitor_email: email,
      p_subject: subject,
      p_description: description,
      p_visitor_timezone: visitorTimezone,
      p_owner_timezone: settings.owner_timezone,
      p_duration_minutes: duration,
      p_starts_at: start.toISOString(),
      p_ends_at: end.toISOString(),
      p_hold_expires_at: holdExpiresAt.toISOString(),
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message);

    const booking = data as BookingRequest;
    const emailResults = await Promise.all([sendPendingReceipt(booking), sendOwnerNotification(booking)]);
    const emailErrors = emailResults.filter((result) => !result.sent).map((result) => result.error);
    if (emailErrors.length) {
      await supabase.from("booking_requests").update({ email_errors: emailErrors }).eq("id", booking.id);
    }

    return json({
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        startsAt: booking.starts_at,
        endsAt: booking.ends_at,
        holdExpiresAt: booking.hold_expires_at,
      },
      message: "Yêu cầu đã được gửi. Lịch hẹn chỉ được xác nhận sau khi Lộc duyệt.",
    });
  } catch (error) {
    return jsonError(error, { status: 400, fallbackMessage: "Không thể gửi yêu cầu lịch hẹn." });
  }
};
