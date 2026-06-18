# Nomichi Trip Desk

Internal CRM for the Nomichi travel team. Manages trip enquiries, lead pipeline, AI-assisted outreach, and real-time chat with leads.

## What's in here

```
artifacts/
  nomichi-trip-desk/   ← the web app (React + Vite)
  api-server/          ← the backend API (Express + TypeScript)
```

The web app talks to the API server for protected operations (lead updates, AI tools), and directly to Supabase for public reads (trips, enquiry status).

---

## Running locally

### 1. Clone and install

```bash
git clone <repo-url>
cd <repo>
pnpm install
```

### 2. Add your secrets

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to find it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon / public key |
| `SUPABASE_URL` | Same as above |
| `SUPABASE_ANON_KEY` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `GEMINI_API_KEY` | https://aistudio.google.com/app/apikey |

### 3. Start

Open two terminals:

```bash
# Terminal 1 — backend API
cd artifacts/api-server
pnpm dev
```

```bash
# Terminal 2 — frontend
cd artifacts/nomichi-trip-desk
pnpm dev
```

The app runs at `http://localhost:5173` by default.

---

## Pages

| URL | Who sees it | What it does |
|---|---|---|
| `/` | Public | Lists open trips, handles enquiries |
| `/status` | Public | Lets a lead check their enquiry status by phone number |
| `/admin/login` | Team only | Sign in with Supabase email/password |
| `/admin/dashboard` | Team only | Pipeline overview, stats |
| `/admin/leads` | Team only | Full lead list with filters |
| `/admin/leads/:id` | Team only | Lead detail, AI tools, call log, chat |
| `/admin/trips` | Team only | Create and manage trips |

---

## AI tools (on lead detail page)

All powered by Gemini 2.0 Flash:

- **WhatsApp draft** — generates a personalised opening message based on what the lead wrote
- **Call log summary** — one-sentence handover note from the full call history
- **Vibe fit** — suggests how well the lead's vibe matches the trip (strong / possible / unlikely)

---

## Tech

- **Frontend**: React, Vite, Tailwind CSS v4, Wouter (routing), Supabase client
- **Backend**: Node.js, Express, TypeScript, Supabase admin client, Gemini AI
- **Database/Auth**: Supabase (PostgreSQL + auth)
- **Package manager**: pnpm (workspaces)

---

## Team notes

- Secrets on Replit live in the **Secrets** tab (not `.env`). On Replit you never need `.env` — just add secrets there.
- The `.env.example` file is for running a local copy on your own machine.
- Don't commit `.env` to git — it's in `.gitignore`.
