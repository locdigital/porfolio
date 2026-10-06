import type { APIRoute } from "astro";
import { json, jsonError, readJsonBody } from "../../../../lib/http";
import { getBookingSettings, updateBookingSettings } from "../../../../lib/booking/data";
import { requireBookingAdmin } from "../../../../lib/booking/security";

export const GET: APIRoute = async (context) => {
  const unauthorized = requireBookingAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    return json({ success: true, settings: await getBookingSettings() });
  } catch (error) {
    return jsonError(error, { status: 500 });
  }
};

export const PATCH: APIRoute = async (context) => {
  const unauthorized = requireBookingAdmin(context);
  if (unauthorized) return unauthorized;
  try {
    const body = await readJsonBody<Record<string, unknown>>(context.request);
    const settings = await updateBookingSettings({
      owner_timezone: String(body.owner_timezone || "Asia/Ho_Chi_Minh"),
      working_days: Array.isArray(body.working_days) ? body.working_days.map(Number) : undefined,
      work_start_time: String(body.work_start_time || "09:00"),
      work_end_time: String(body.work_end_time || "17:00"),
      default_duration_minutes: Number(body.default_duration_minutes || 30),
      allowed_durations: Array.isArray(body.allowed_durations) ? body.allowed_durations.map(Number) : undefined,
      buffer_minutes: Number(body.buffer_minutes ?? 15),
      minimum_notice_hours: Number(body.minimum_notice_hours ?? 12),
      pending_expiry_hours: Number(body.pending_expiry_hours ?? 24),
      calendar_ids: Array.isArray(body.calendar_ids) ? body.calendar_ids.map(String) : undefined,
      target_calendar_id: String(body.target_calendar_id || "primary"),
    } as any);
    return json({ success: true, settings });
  } catch (error) {
    return jsonError(error, { status: 400 });
  }
};
