-- ============================================================
-- Nomichi Trip Desk — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- Profiles (mirrors auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'associate' check (role in ('admin', 'associate')),
  created_at timestamptz not null default now()
);

-- Trips
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  price_gst numeric(10,2) not null,
  total_seats integer not null check (total_seats > 0),
  seats_available integer not null check (seats_available >= 0),
  status text not null default 'open' check (status in ('open', 'closed')),
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Leads
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text not null,
  trip_id uuid references public.trips(id) on delete set null,
  group_type text not null check (group_type in ('solo', 'friends', 'couple', 'family')),
  preferred_month text not null,
  vibe_text text not null default '',
  status text not null default 'NEW'
    check (status in ('NEW','CONTACTED','QUALIFIED','VIBE_CHECK_SENT','CONFIRMED','NOT_A_FIT')),
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Call logs
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note text not null,
  next_action text,
  created_by uuid not null references public.profiles(id) on delete set default,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Table-level grants (required in addition to RLS policies)
-- ============================================================

-- anon role: public reads + lead inserts only
grant usage on schema public to anon;
grant select on public.trips to anon;
grant select on public.profiles to anon;
grant insert on public.leads to anon;

-- authenticated role: full access to all tables
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.call_logs to authenticated;
grant select, update on public.profiles to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.leads enable row level security;
alter table public.call_logs enable row level security;

-- Profiles: users can read all, update their own
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Trips: public read for open trips, authenticated write
create policy "trips_public_read" on public.trips for select using (true);
create policy "trips_auth_insert" on public.trips for insert with check (auth.uid() is not null);
create policy "trips_auth_update" on public.trips for update using (auth.uid() is not null);
create policy "trips_auth_delete" on public.trips for delete using (auth.uid() is not null);

-- Leads: public insert (enquiry form), authenticated read/update
create policy "leads_public_insert" on public.leads for insert with check (true);
create policy "leads_auth_read" on public.leads for select using (auth.uid() is not null);
create policy "leads_auth_update" on public.leads for update using (auth.uid() is not null);

-- Call logs: authenticated only
create policy "call_logs_auth_all" on public.call_logs for all using (auth.uid() is not null);

-- ============================================================
-- Auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Seed data — 4 example trips
-- ============================================================

insert into public.trips (name, destination, start_date, end_date, price_gst, total_seats, seats_available, status, description)
values
  (
    'Spiti Valley Winter',
    'Spiti Valley, Himachal Pradesh',
    '2025-01-10',
    '2025-01-18',
    42000,
    10,
    6,
    'open',
    'Eight days in one of India''s highest inhabited valleys. Snow-covered monasteries, frozen rivers, and a slowness that is hard to find anywhere else.'
  ),
  (
    'Dzukou Valley Trek',
    'Nagaland',
    '2025-02-14',
    '2025-02-20',
    28000,
    12,
    8,
    'open',
    'A six-day walk through Nagaland''s hidden valley. Seasonal wildflowers, bamboo forests, and nights in the hills with a small group.'
  ),
  (
    'Hampi Slow Weekend',
    'Hampi, Karnataka',
    '2025-03-07',
    '2025-03-10',
    18000,
    8,
    3,
    'open',
    'Three days among boulders and ruins. Bicycle rides at dawn, meals by the river, and no schedule beyond what the light suggests.'
  ),
  (
    'Rann of Kutch Salt Season',
    'Kutch, Gujarat',
    '2024-11-20',
    '2024-11-25',
    32000,
    10,
    0,
    'closed',
    'Five nights on the white salt desert under a full moon. Craft villages, migratory birds, and a landscape that feels like another planet.'
  )
on conflict do nothing;
