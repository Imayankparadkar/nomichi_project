---
name: Nomichi Trip Desk migration
description: Key decisions and lessons from migrating this app from Next.js/Vercel to React+Vite+Express on Replit.
---

# Nomichi Trip Desk — migration notes

## Stack
- Frontend: React + Vite (artifacts/nomichi-trip-desk), wouter for routing
- Backend: Express + TypeScript (artifacts/api-server)
- DB/Auth: Supabase (browser client for public reads, service-role admin for server writes)
- AI: Gemini 2.0 Flash via @google/generative-ai

## Env var naming
Vite only exposes `VITE_` prefixed env vars to the browser. Supabase secrets were originally `NEXT_PUBLIC_*` — had to add parallel `VITE_*` copies.

Required secrets:
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — frontend (public-safe, set as env vars not secrets)
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` — api-server
- `SUPABASE_SERVICE_ROLE_KEY` — api-server admin operations
- `GEMINI_API_KEY` — ai routes in api-server

**Why:** Vite's security model requires VITE_ prefix; anon key is public by design (Supabase RLS handles security).

## API routes (artifacts/api-server/src/routes/nomichi.ts)
All nomichi routes live here: leads CRUD, trips CRUD, call-logs, messages, status (public), AI (whatsapp-draft, summarize-log, vibe-check).

Auth check: reads Bearer token from Authorization header, verifies with supabase.auth.getUser(). Public endpoints (POST /leads, GET /status, GET/POST /messages for leads) skip auth.
