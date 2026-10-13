create extension if not exists pgcrypto;

create table if not exists public.telemetry_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  params jsonb not null default '{}'::jsonb,
  page_path text not null,
  environment text not null,
  user_agent text not null,
  source_ip text not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists telemetry_events_event_name_idx
  on public.telemetry_events (event_name);

create index if not exists telemetry_events_occurred_at_idx
  on public.telemetry_events (occurred_at desc);

alter table public.telemetry_events enable row level security;

drop policy if exists "Only service role can write telemetry events" on public.telemetry_events;
create policy "Only service role can write telemetry events"
  on public.telemetry_events
  for insert
  to service_role
  with check (true);

drop policy if exists "Admins can read telemetry events" on public.telemetry_events;
create policy "Admins can read telemetry events"
  on public.telemetry_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.users u
      where u.id = auth.uid()
        and u.user_role = 'admin'
    )
  );
