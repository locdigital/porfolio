-- Harden booking database access for server-routed booking flow.
-- Public visitors use /api/booking/*; they should not access tables or RPCs directly.

alter table public.booking_settings enable row level security;
alter table public.booking_requests enable row level security;
alter table public.booking_google_tokens enable row level security;

revoke all on public.booking_settings from anon, authenticated;
revoke all on public.booking_requests from anon, authenticated;
revoke all on public.booking_google_tokens from anon, authenticated;

revoke execute on function public.booking_touch_updated_at() from public, anon, authenticated;
revoke execute on function public.booking_expire_holds() from public, anon, authenticated;
revoke execute on function public.booking_create_request(
  text,
  text,
  text,
  text,
  text,
  text,
  int,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) from public, anon, authenticated;

grant execute on function public.booking_expire_holds() to service_role;
grant execute on function public.booking_create_request(
  text,
  text,
  text,
  text,
  text,
  text,
  int,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) to service_role;
