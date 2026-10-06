-- Approval-based booking system for loc.digital
-- Apply in Supabase SQL editor or via `supabase db push`.

create extension if not exists pgcrypto;

create table if not exists public.booking_settings (
  id text primary key default 'default' check (id = 'default'),
  owner_timezone text not null default 'Asia/Ho_Chi_Minh',
  working_days int[] not null default array[1,2,3,4,5],
  work_start_time time not null default '09:00',
  work_end_time time not null default '17:00',
  default_duration_minutes int not null default 30,
  allowed_durations int[] not null default array[30],
  buffer_minutes int not null default 15,
  minimum_notice_hours int not null default 12,
  booking_horizon_days int not null default 30,
  pending_expiry_hours int not null default 24,
  calendar_ids text[] not null default array['primary'],
  target_calendar_id text not null default 'primary',
  updated_at timestamptz not null default now()
);

insert into public.booking_settings (id)
values ('default')
on conflict (id) do nothing;

create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','expired','cancelled')),
  visitor_name text not null,
  visitor_email text not null,
  subject text not null,
  description text not null default '',
  visitor_timezone text not null default 'Asia/Ho_Chi_Minh',
  owner_timezone text not null default 'Asia/Ho_Chi_Minh',
  duration_minutes int not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  hold_expires_at timestamptz not null,
  google_event_id text unique,
  idempotency_key text unique,
  rejection_reason text,
  last_error text,
  email_errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  constraint booking_time_order check (ends_at > starts_at),
  constraint booking_hold_order check (hold_expires_at > created_at)
);

create index if not exists booking_requests_status_idx on public.booking_requests (status, starts_at);
create index if not exists booking_requests_time_idx on public.booking_requests (starts_at, ends_at);
create index if not exists booking_requests_email_idx on public.booking_requests (visitor_email, created_at desc);

create table if not exists public.booking_google_tokens (
  id text primary key default 'owner' check (id = 'owner'),
  encrypted_refresh_token text,
  encrypted_access_token text,
  access_token_expires_at timestamptz,
  scope text,
  calendar_email text,
  connected_at timestamptz,
  updated_at timestamptz not null default now()
);

create or replace function public.booking_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists booking_requests_touch_updated_at on public.booking_requests;
create trigger booking_requests_touch_updated_at
before update on public.booking_requests
for each row execute function public.booking_touch_updated_at();

drop trigger if exists booking_settings_touch_updated_at on public.booking_settings;
create trigger booking_settings_touch_updated_at
before update on public.booking_settings
for each row execute function public.booking_touch_updated_at();

create or replace function public.booking_expire_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed integer;
begin
  update public.booking_requests
  set status = 'expired', last_error = coalesce(last_error, 'Pending hold expired before owner approval.')
  where status = 'pending'
    and hold_expires_at <= now();

  get diagnostics changed = row_count;
  return changed;
end;
$$;

create or replace function public.booking_create_request(
  p_visitor_name text,
  p_visitor_email text,
  p_subject text,
  p_description text,
  p_visitor_timezone text,
  p_owner_timezone text,
  p_duration_minutes int,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_hold_expires_at timestamptz,
  p_idempotency_key text
)
returns public.booking_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted public.booking_requests;
begin
  perform pg_advisory_xact_lock(hashtext('loc_booking_slot_hold'));
  perform public.booking_expire_holds();

  if exists (
    select 1
    from public.booking_requests b
    where b.starts_at < p_ends_at
      and b.ends_at > p_starts_at
      and (
        b.status = 'confirmed'
        or (b.status = 'pending' and b.hold_expires_at > now())
      )
  ) then
    raise exception 'Slot is no longer available.' using errcode = 'P0001';
  end if;

  insert into public.booking_requests (
    visitor_name,
    visitor_email,
    subject,
    description,
    visitor_timezone,
    owner_timezone,
    duration_minutes,
    starts_at,
    ends_at,
    hold_expires_at,
    idempotency_key
  ) values (
    p_visitor_name,
    lower(p_visitor_email),
    p_subject,
    coalesce(p_description, ''),
    p_visitor_timezone,
    p_owner_timezone,
    p_duration_minutes,
    p_starts_at,
    p_ends_at,
    p_hold_expires_at,
    p_idempotency_key
  )
  on conflict (idempotency_key) do update
    set idempotency_key = excluded.idempotency_key
  returning * into inserted;

  return inserted;
end;
$$;

-- Public clients should not get table access directly. Serverless routes use service role.
revoke all on public.booking_settings from anon, authenticated;
revoke all on public.booking_requests from anon, authenticated;
revoke all on public.booking_google_tokens from anon, authenticated;
