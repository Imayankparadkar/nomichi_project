# Nomichi Trip Desk

A working web app that lets a traveller send a trip enquiry, and lets the Nomichi team manage that enquiry from first contact to a confirmed seat, all in one place.

## What was built

Three connected parts:

1. **Public enquiry page** — travellers browse open trips and send an enquiry. The form validates phone, email and all required fields. Submission saves to Supabase and shows a warm confirmation state.

2. **Team admin (mini-CRM)** — authenticated area for the Nomichi team with:
   - Lead list with search and filters by status, trip and owner
   - Lead detail with full pipeline (NEW → CONTACTED → QUALIFIED → VIBE CHECK SENT → CONFIRMED → NOT A FIT)
   - Call log — timestamped notes with next action per lead
   - Owner assignment per lead
   - Trip management — create, edit and close trips from the admin with no code changes

3. **AI features (Gemini)** — all run server-side, no keys exposed to the browser:
   - Draft the first WhatsApp message from the lead's own words and trip details
   - Summarise the call log into one line covering where things stand and what to do next
   - Suggest vibe fit — strong, possible or unlikely — with a specific reason from what the traveller wrote. Always marked as a suggestion, never an automatic decision.

4. **Dashboard** — total leads, pipeline counts and leads per trip. Numbers a team lead would check each morning.

## Stack

- Next.js 15 (App Router), TypeScript
- Supabase (PostgreSQL + Auth + Row Level Security)
- Google Gemini 1.5 Flash
- Tailwind CSS with Nomichi brand colours

## Setup

1. Create a Supabase project at supabase.com
2. Run `supabase-schema.sql` in the Supabase SQL editor — this sets up all tables, RLS policies, and seed data
3. Copy `.env.example` to `.env.local` and fill in your values
4. Create your first admin user in Supabase Auth (Authentication > Users > Add user)
5. Run `pnpm install && pnpm dev`

## Key decisions

- **Supabase RLS everywhere.** The enquiry form inserts leads without auth (public form), but all reads and updates require a signed-in user. The service role key is never exposed to the browser.
- **All AI calls are server-side API routes.** Gemini keys are environment variables only. The browser calls `/api/ai/*` routes, which call Gemini, and returns the result.
- **Trips as content.** Open trips appear on the public page automatically. Closing a trip removes it from the public view with no code change. This connects the admin and public surfaces meaningfully.
- **Vibe fit is always a suggestion.** The AI result is clearly labelled and includes the reasoning. The associate makes the call.

## What I would do with another week

- Row-level security so associates see only their assigned leads
- CSV export of the lead list
- Activity timeline per lead (status changes with timestamps)
- Email notification to team when a new lead comes in
- Mobile-optimised admin for on-the-go updates
