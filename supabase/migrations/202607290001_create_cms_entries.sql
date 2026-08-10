create extension if not exists pgcrypto;

create table if not exists public.cms_entries (
  uuid uuid primary key default gen_random_uuid(),
  collection text not null,
  id text not null,
  slug text not null,
  order_index integer,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection, id),
  unique (collection, slug)
);

create index if not exists cms_entries_collection_order_idx
  on public.cms_entries (collection, order_index, updated_at desc);

create index if not exists cms_entries_payload_gin_idx
  on public.cms_entries using gin (payload);

create or replace function public.set_cms_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cms_entries_set_updated_at on public.cms_entries;

create trigger cms_entries_set_updated_at
before update on public.cms_entries
for each row
execute function public.set_cms_entries_updated_at();

alter table public.cms_entries enable row level security;

drop policy if exists "Server role manages cms entries" on public.cms_entries;

create policy "Server role manages cms entries"
on public.cms_entries
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
