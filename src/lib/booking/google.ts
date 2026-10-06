import { ensureBookingStorage } from "./data";
import { decryptSecret, encryptSecret, signState } from "./security";
import type { BookingRequest, BookingSettings } from "./types";

const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy";

type TokenRow = {
  encrypted_refresh_token?: string | null;
  encrypted_access_token?: string | null;
  access_token_expires_at?: string | null;
  scope?: string | null;
  calendar_email?: string | null;
  connected_at?: string | null;
};

function googleConfig() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || "";
  return { clientId, clientSecret, redirectUri, configured: Boolean(clientId && clientSecret && redirectUri) };
}

export function getGoogleAuthUrl() {
  const config = googleConfig();
  if (!config.configured) throw new Error("Google Calendar OAuth is not configured.");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", signState({ source: "booking-google" }));
  return url.toString();
}

async function tokenRequest(body: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google token request failed.");
  return data as { access_token: string; refresh_token?: string; expires_in: number; scope?: string };
}

export async function exchangeGoogleCode(code: string) {
  const config = googleConfig();
  if (!config.configured) throw new Error("Google Calendar OAuth is not configured.");
  const token = await tokenRequest(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    code,
  }));

  if (!token.refresh_token) {
    throw new Error("Google did not return a refresh token. Revoke access in Google Account permissions, then reconnect.");
  }

  const supabase = ensureBookingStorage();
  const expiresAt = new Date(Date.now() + token.expires_in * 1000 - 60_000).toISOString();
  const { error } = await supabase.from("booking_google_tokens").upsert({
    id: "owner",
    encrypted_refresh_token: encryptSecret(token.refresh_token),
    encrypted_access_token: encryptSecret(token.access_token),
    access_token_expires_at: expiresAt,
    scope: token.scope || GOOGLE_SCOPE,
    connected_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Cannot save Google token: ${error.message}`);
}

export async function getGoogleStatus() {
  const configured = googleConfig().configured;
  if (!configured) return { configured, connected: false };
  const supabase = ensureBookingStorage();
  const { data } = await supabase.from("booking_google_tokens").select("connected_at, scope, calendar_email").eq("id", "owner").maybeSingle();
  return { configured, connected: Boolean(data?.connected_at), connectedAt: data?.connected_at, scope: data?.scope, calendarEmail: data?.calendar_email };
}

async function getTokenRow(): Promise<TokenRow | null> {
  const supabase = ensureBookingStorage();
  const { data, error } = await supabase.from("booking_google_tokens").select("*").eq("id", "owner").maybeSingle();
  if (error) throw new Error(`Cannot load Google token: ${error.message}`);
  return data as TokenRow | null;
}

export async function getGoogleAccessToken() {
  const config = googleConfig();
  if (!config.configured) throw new Error("Google Calendar is not configured.");
  const row = await getTokenRow();
  if (!row?.encrypted_refresh_token) throw new Error("Google Calendar is not connected.");

  const existing = row.encrypted_access_token ? decryptSecret(row.encrypted_access_token) : "";
  if (existing && row.access_token_expires_at && new Date(row.access_token_expires_at) > new Date()) {
    return existing;
  }

  const refreshToken = decryptSecret(row.encrypted_refresh_token);
  const token = await tokenRequest(new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }));

  const supabase = ensureBookingStorage();
  await supabase.from("booking_google_tokens").update({
    encrypted_access_token: encryptSecret(token.access_token),
    access_token_expires_at: new Date(Date.now() + token.expires_in * 1000 - 60_000).toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", "owner");

  return token.access_token;
}

export async function getGoogleBusy(settings: BookingSettings, timeMin: string, timeMax: string) {
  const token = await getGoogleAccessToken();
  const calendars = settings.calendar_ids.length ? settings.calendar_ids : [settings.target_calendar_id || "primary"];
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: settings.owner_timezone,
      items: calendars.map((id) => ({ id })),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Cannot check Google Calendar availability.");
  return Object.values(data.calendars ?? {}).flatMap((calendar: any) => calendar.busy ?? []) as { start: string; end: string }[];
}

export async function createGoogleEvent(booking: BookingRequest, settings: BookingSettings) {
  const token = await getGoogleAccessToken();
  const calendarId = encodeURIComponent(settings.target_calendar_id || "primary");
  const eventId = `locbooking${booking.id.replace(/-/g, "")}`.slice(0, 100);
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?sendUpdates=all`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: eventId,
      summary: booking.subject,
      description: `${booking.description || "Không có mô tả."}\n\nBooking ID: ${booking.id}`,
      start: { dateTime: booking.starts_at, timeZone: booking.owner_timezone },
      end: { dateTime: booking.ends_at, timeZone: booking.owner_timezone },
      attendees: [{ email: booking.visitor_email, displayName: booking.visitor_name }],
      extendedProperties: { private: { bookingId: booking.id } },
    }),
  });
  const data = await response.json();
  if (response.status === 409) return eventId;
  if (!response.ok) throw new Error(data.error?.message || "Cannot create Google Calendar event.");
  return data.id || eventId;
}
