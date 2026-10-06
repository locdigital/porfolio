# Approval-based booking setup

This project now includes a real server-side appointment request flow:

- Visitor page: `/booking`
- Owner dashboard: `/booking/admin`
- API routes: `/api/booking/*`
- Database migrations: `supabase/migrations/202610060001_booking.sql`, then `supabase/migrations/202610060002_booking_access_controls.sql`

## Required infrastructure

The site already uses Astro server output with the Vercel serverless adapter, so backend endpoints are supported. Persistent storage is Supabase via `SUPABASE_URL` and the server-only `SUPABASE_SECRET_KEY`. Legacy `SUPABASE_SERVICE_ROLE_KEY` remains supported as a fallback.

## 1. Database

Apply the booking migrations to your Supabase project in filename order:

1. `supabase/migrations/202610060001_booking.sql`
2. `supabase/migrations/202610060002_booking_access_controls.sql`

They create and harden:

- `booking_settings`
- `booking_requests`
- `booking_google_tokens`
- `booking_create_request(...)` RPC for atomic pending hold creation
- `booking_expire_holds()` RPC for cleanup
- table/RPC access controls so public visitors use only the server API routes

Timestamps are stored in UTC. Visitor availability is limited to a rolling two-calendar-month window from today in `Asia/Ho_Chi_Minh`; the old 30-day booking horizon is no longer used. Availability ignores expired pending holds even if cleanup runs late.

## 2. Environment variables

Add the booking variables from `.env.example` to local and production environments. Keep these server-side only:

- `BOOKING_ADMIN_TOKEN`
- `BOOKING_TOKEN_ENCRYPTION_KEY`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `SUPABASE_SECRET_KEY` or legacy `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

## 3. Google Cloud Calendar API

1. Create or select a Google Cloud project.
2. Enable **Google Calendar API**.
3. Configure OAuth consent screen for your Google account.
4. Create an OAuth Client ID for a Web application.
5. Add redirect URLs:
   - Local: `http://localhost:4321/api/booking/admin/google/callback`
   - Production: `https://loc.digital/api/booking/admin/google/callback`
6. Set `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, and `GOOGLE_CALENDAR_REDIRECT_URI`.
7. Open `/booking/admin`, enter `BOOKING_ADMIN_TOKEN`, and click reconnect Google.

Scopes requested:

- `https://www.googleapis.com/auth/calendar.freebusy`
- `https://www.googleapis.com/auth/calendar.events`

## 4. Email

The implementation uses Resend via `RESEND_API_KEY` and `BOOKING_EMAIL_FROM`.

Emails sent:

- Pending receipt to visitor
- New request notification to owner
- Confirmation after Google event creation
- Rejection notice

If email is not configured, booking still stores the request and records the email error in `booking_requests.email_errors`.

## 5. Expiry job

Pending holds expire automatically in availability checks and admin list loads. For scheduled cleanup, call:

```bash
curl -X POST https://loc.digital/api/booking/admin/expire \
  -H "Authorization: Bearer $BOOKING_CRON_SECRET"
```

On Vercel, configure a cron job for this endpoint, for example hourly.

## 6. Security model

- Visitors never need Google accounts.
- Public endpoints never expose Google event titles, descriptions, attendees, or tokens.
- Owner endpoints require `BOOKING_ADMIN_TOKEN`.
- Google refresh/access tokens are encrypted before persistence.
- Availability is checked again during approval before event creation.
- Google event IDs are deterministic from booking IDs to avoid duplicate events on retries.
