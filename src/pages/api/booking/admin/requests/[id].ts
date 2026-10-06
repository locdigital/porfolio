import type { APIRoute } from "astro";
import { json, jsonError, readJsonBody } from "../../../../../lib/http";
import { getAvailabilityForDate } from "../../../../../lib/booking/availability";
import { ensureBookingStorage, getBookingRequest, getBookingSettings } from "../../../../../lib/booking/data";
import { sendConfirmation, sendRejection } from "../../../../../lib/booking/email";
import { createGoogleEvent } from "../../../../../lib/booking/google";
import { requireBookingAdmin } from "../../../../../lib/booking/security";
import { dateOnlyInTimeZone, isIntervalInWindow } from "../../../../../lib/booking/time";

export const PATCH: APIRoute = async (context) => {
  const unauthorized = requireBookingAdmin(context);
  if (unauthorized) return unauthorized;

  try {
    const id = context.params.id || "";
    const body = await readJsonBody<{ action?: string; reason?: string }>(context.request);
    const action = body.action;
    const supabase = ensureBookingStorage();
    const booking = await getBookingRequest(id);

    if (action === "reject") {
      if (booking.status !== "pending") throw new Error("Chỉ có thể từ chối yêu cầu đang chờ duyệt.");
      const { data, error } = await supabase
        .from("booking_requests")
        .update({ status: "rejected", rejection_reason: body.reason || null, rejected_at: new Date().toISOString() })
        .eq("id", id)
        .eq("status", "pending")
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      await sendRejection(data as any, body.reason);
      return json({ success: true, booking: data });
    }

    if (action !== "approve") throw new Error("Unsupported action.");
    if (booking.status === "confirmed" && booking.google_event_id) return json({ success: true, booking });
    if (booking.status !== "pending") throw new Error("Chỉ có thể duyệt yêu cầu đang chờ duyệt.");
    if (new Date(booking.hold_expires_at) <= new Date()) {
      await supabase.from("booking_requests").update({ status: "expired", last_error: "Hold expired before approval." }).eq("id", id).eq("status", "pending");
      throw new Error("Yêu cầu này đã hết hạn giữ chỗ.");
    }

    const settings = await getBookingSettings();
    if (!isIntervalInWindow(new Date(booking.starts_at), new Date(booking.ends_at), settings.owner_timezone)) {
      await supabase.from("booking_requests").update({ last_error: "Slot is outside the rolling two-month booking window." }).eq("id", id);
      throw new Error("Yêu cầu này nằm ngoài cửa sổ đặt lịch 2 tháng tới.");
    }
    const date = dateOnlyInTimeZone(new Date(booking.starts_at), settings.owner_timezone);
    const availability = await getAvailabilityForDate(date, booking.duration_minutes, booking.id);
    const stillFree = availability.slots.some((slot) => slot.startsAt === new Date(booking.starts_at).toISOString());
    if (!stillFree) {
      await supabase.from("booking_requests").update({ last_error: "Calendar conflict found during approval." }).eq("id", id);
      return json({ success: false, conflict: true, error: "Khung giờ này không còn trống trên Google Calendar hoặc đã bị request khác giữ." }, { status: 409 });
    }

    const googleEventId = await createGoogleEvent(booking, settings);
    const { data, error } = await supabase
      .from("booking_requests")
      .update({ status: "confirmed", google_event_id: googleEventId, approved_at: new Date().toISOString(), last_error: null })
      .eq("id", id)
      .eq("status", "pending")
      .select("*")
      .single();
    if (error) throw new Error(`Google event created (${googleEventId}) but database confirmation failed: ${error.message}`);

    await sendConfirmation(data as any);
    return json({ success: true, booking: data });
  } catch (error) {
    return jsonError(error, { status: 400 });
  }
};
