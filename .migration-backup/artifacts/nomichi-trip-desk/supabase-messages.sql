-- ============================================================
-- Nomichi Trip Desk — Messages (in-site chat)
-- Run this in your Supabase SQL Editor if you already ran
-- the main supabase-schema.sql. Otherwise the main schema
-- already includes these tables.
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  sender text not null check (sender in ('admin', 'lead')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Anyone with the lead_id (UUID — hard to guess) can read/write.
-- All real validation is handled server-side via the API routes.
create policy "messages_select" on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (true);
create policy "messages_update_auth" on public.messages for update using (auth.uid() is not null);

grant select, insert on public.messages to anon;
grant select, insert, update on public.messages to authenticated;
