export type BookingStatus = "pending" | "confirmed" | "rejected" | "expired" | "cancelled";

export type BookingSettings = {
  id: "default";
  owner_timezone: string;
  working_days: number[];
  work_start_time: string;
  work_end_time: string;
  default_duration_minutes: number;
  allowed_durations: number[];
  buffer_minutes: number;
  minimum_notice_hours: number;
  pending_expiry_hours: number;
  calendar_ids: string[];
  target_calendar_id: string;
  updated_at?: string;
};

export type BookingRequest = {
  id: string;
  status: BookingStatus;
  visitor_name: string;
  visitor_email: string;
  subject: string;
  description: string;
  visitor_timezone: string;
  owner_timezone: string;
  duration_minutes: number;
  starts_at: string;
  ends_at: string;
  hold_expires_at: string;
  google_event_id?: string | null;
  idempotency_key?: string | null;
  rejection_reason?: string | null;
  last_error?: string | null;
  email_errors?: unknown[];
  created_at: string;
  updated_at: string;
  approved_at?: string | null;
  rejected_at?: string | null;
};

export type Slot = {
  startsAt: string;
  endsAt: string;
  label: string;
  disabled?: boolean;
  reason?: string;
};
