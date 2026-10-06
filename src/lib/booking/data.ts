import { getSupabaseServerClient, isSupabaseServerConfigured } from "../supabase-server";
import type { BookingRequest, BookingSettings } from "./types";

export const defaultSettings: BookingSettings = {
  id: "default",
  owner_timezone: "Asia/Ho_Chi_Minh",
  working_days: [1, 2, 3, 4, 5],
  work_start_time: "09:00",
  work_end_time: "17:00",
  default_duration_minutes: 30,
  allowed_durations: [30],
  buffer_minutes: 15,
  minimum_notice_hours: 12,
  pending_expiry_hours: 24,
  calendar_ids: ["primary"],
  target_calendar_id: "primary",
};

export function ensureBookingStorage() {
  if (!isSupabaseServerConfigured()) {
    throw new Error("Booking database is not configured. Add Supabase env vars and apply the booking migration.");
  }
  return getSupabaseServerClient();
}

export async function getBookingSettings(): Promise<BookingSettings> {
  const supabase = ensureBookingStorage();
  const { data, error } = await supabase.from("booking_settings").select("*").eq("id", "default").single();
  if (error) throw new Error(`Cannot load booking settings: ${error.message}`);
  return { ...defaultSettings, ...(data as BookingSettings) };
}

export async function updateBookingSettings(input: Partial<BookingSettings>) {
  const supabase = ensureBookingStorage();
  const allowed: Partial<BookingSettings> = {
    owner_timezone: input.owner_timezone,
    working_days: input.working_days,
    work_start_time: input.work_start_time,
    work_end_time: input.work_end_time,
    default_duration_minutes: input.default_duration_minutes,
    allowed_durations: input.allowed_durations,
    buffer_minutes: input.buffer_minutes,
    minimum_notice_hours: input.minimum_notice_hours,
    pending_expiry_hours: input.pending_expiry_hours,
    calendar_ids: input.calendar_ids,
    target_calendar_id: input.target_calendar_id,
  };
  Object.keys(allowed).forEach((key) => allowed[key as keyof BookingSettings] === undefined && delete allowed[key as keyof BookingSettings]);
  const { data, error } = await supabase.from("booking_settings").update(allowed).eq("id", "default").select("*").single();
  if (error) throw new Error(`Cannot update booking settings: ${error.message}`);
  return data as BookingSettings;
}

export async function expirePendingHolds() {
  const supabase = ensureBookingStorage();
  await supabase.rpc("booking_expire_holds");
}

export async function getActiveBusyHolds(rangeStart: string, rangeEnd: string, excludeId?: string) {
  const supabase = ensureBookingStorage();
  await expirePendingHolds();
  let query = supabase
    .from("booking_requests")
    .select("id, starts_at, ends_at, status, hold_expires_at")
    .lt("starts_at", rangeEnd)
    .gt("ends_at", rangeStart)
    .in("status", ["pending", "confirmed"]);

  if (excludeId) query = query.neq("id", excludeId);

  const { data, error } = await query;
  if (error) throw new Error(`Cannot load booking holds: ${error.message}`);
  const now = new Date();
  return (data ?? [])
    .filter((item) => item.status === "confirmed" || new Date(item.hold_expires_at) > now)
    .map((item) => ({ start: item.starts_at, end: item.ends_at }));
}

export async function listBookingRequests(status?: string) {
  const supabase = ensureBookingStorage();
  await expirePendingHolds();
  let query = supabase.from("booking_requests").select("*").order("created_at", { ascending: false }).limit(200);
  if (status && status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error(`Cannot load booking requests: ${error.message}`);
  return data as BookingRequest[];
}

export async function getBookingRequest(id: string) {
  const supabase = ensureBookingStorage();
  await expirePendingHolds();
  const { data, error } = await supabase.from("booking_requests").select("*").eq("id", id).single();
  if (error) throw new Error(`Cannot load booking request: ${error.message}`);
  return data as BookingRequest;
}
