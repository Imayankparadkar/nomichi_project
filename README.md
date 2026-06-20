# Nomichi Trip Desk

Internal CRM for the Nomichi travel team. Built as a single **Next.js 14 App Router** application, it manages trip enquiries, lead pipelines, AI-assisted outreach, and real-time chat with leads.

## Project Structure

```
nomichi-next/              ← Next.js unified app
├── app/
│   ├── layout.tsx         # root layout, fonts, globals
│   ├── page.tsx           # public trips page (/)
│   ├── status/
│   │   └── page.tsx       # lead status lookup (/status)
│   ├── admin/
│   │   ├── layout.tsx     # admin layout + auth guard
│   │   ├── login/         # /admin/login
│   │   ├── dashboard/     # /admin/dashboard
│   │   ├── leads/         # /admin/leads and /admin/leads/[id]
│   │   └── trips/         # /admin/trips
│   └── api/               # Next.js Serverless Route Handlers (replacing Express)
├── components/            # Reusable UI components
├── lib/                   # Database clients, auth helpers, Groq SDK integration
└── supabase/              # SQL seed & schema setups
```

---

## Running Locally

### 1. Install dependencies

```bash
git clone <repo-url>
cd nomichi-project/nomichi-next
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file inside the `nomichi-next/` directory:

```bash
cp ../.env.example .env.local
```

Open `.env.local` and populate the keys:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon / public key |
| `SUPABASE_URL` | Same as above |
| `SUPABASE_ANON_KEY` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `GROQ_API_KEY` | https://console.groq.com/keys |

### 3. Database & Seeding Setup

To set up your database schema and seed mock data:
1. Go to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the schema creation query (if setting up database from scratch) or run the SQL in `nomichi-next/supabase/seed.sql` to populate 4 example trips, 6 leads, and chat conversations.

### 4. Start Development Server

```bash
npm run dev
```

The app will run at `http://localhost:3000`.

---

## Pages

| URL | Who sees it | What it does |
|---|---|---|
| `/` | Public | Lists open trips, handles enquiries |
| `/status` | Public | Lets a lead check their enquiry status and live chat with team |
| `/admin/login` | Team only | Sign in with Supabase email/password |
| `/admin/dashboard` | Team only | Pipeline overview, metrics, and PDF exporting |
| `/admin/leads` | Team only | Full lead list with status/trip filters |
| `/admin/leads/:id` | Team only | Lead detail, AI tools, call log, and live chat |
| `/admin/trips` | Team only | Create, edit, and close trips |

---

## AI Reply Co-pilot (Lead Detail & Chat Page)

Powered by **Groq LLaMA-3**:

- **WhatsApp Draft** — generates a warm, personalized initial message matching Nomichi's specific brand voice.
- **AI Suggest Reply** (Inside ChatBox) — suggests a direct context-aware reply to any message sent by the lead.
- **Call Log Handover Summary** — summarizes call notes into a single-sentence handover memo.
- **Vibe Fit Check** — assesses if the lead's travel expectations align with Nomichi's slow, small-group model.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Vanilla CSS (migrated from original design system in `globals.css`)
- **Database/Auth**: Supabase (PostgreSQL, Row-Level Security, Auth)
- **AI Engine**: Groq SDK (LLaMA-3 models)
- **PDF Reports**: jsPDF + jsPDF-AutoTable
