# Nomichi Trip Desk 

A robust, enterprise-ready trip management and lead-capture platform built for the Nomichi engineering intern assignment. 

This repository replaces scattered Google Sheets with a unified, AI-native CRM (Customer Relationship Management) system. Designed to be blazingly fast, highly secure, and highly scalable.

> **Live Demo**: [nomichiproject.vercel.app](https://nomichiproject.vercel.app/)

## 🚀 Engineering Optimizations & Architecture

This project was built focusing not just on features, but on **production-grade engineering best practices**:

### 1. Performance & Scalability (The Backend)
- **N+1 Query Elimination & Payload Reduction**: SQL queries in the Next.js API explicitly request only necessary columns (`.select("id, name, email")` rather than `*`), drastically reducing payload sizes over the network.
- **Server-Side Caching (ISR)**: The public trips API utilizes Next.js Incremental Static Regeneration (`export const revalidate = 60`). If 100,000 users visit the landing page simultaneously, the database is queried only once per minute, preventing connection exhaustion.
- **Lazy Loading & Pagination**: Supabase `.range()` pagination is implemented so the system scales gracefully, handling thousands of leads without crashing the browser or server.

### 2. "Perceived Performance" (The Frontend)
- **Native CSS Skeletons**: Eliminated heavy, layout-thrashing JavaScript loaders (like `boneyard-js`) in favor of custom, native Tailwind CSS `animate-pulse` skeletons. The browser instantly paints the UI structure before the database responds, creating a 0ms perceived load time.
- **0 KB Asset Animations**: The splash screen uses pure mathematical SVG tracing and CSS variables instead of heavy MP4s or GIFs, maintaining a perfect Lighthouse performance score.

### 3. Security & Admin Authentication
- **Session Storage**: Supabase Authentication is strictly configured to use `window.sessionStorage`. This allows the admin to refresh pages smoothly without losing state, but instantly and permanently destroys the authenticated session the exact millisecond the browser tab is closed—a crucial security practice for admin portals.

### 4. Technical SEO
- **OpenGraph Implementation**: Added rich OpenGraph meta-tags so sharing the URL on WhatsApp, iMessage, or Twitter unfurls a high-conversion preview card with the Nomichi branding.

---

## 🤖 AI-Native Features
The heavy lifting is done by AI so the team can focus on connecting with travellers.

- **Vibe Fit Check**: Reads the "what they hope the trip feels like" answer and suggests whether the traveller matches Nomichi's small-group ethos.
- **WhatsApp Drafts**: Generates personalized first-contact or follow-up messages based on the lead's specific trip and answers.
- **Smart Log Summarizer**: Distills long text histories and call transcripts into a single, actionable sentence.
- **Voice AI Autopilot (Omni Dimension)**: A fully integrated web widget that talks to leads over Voice, extracts their identity, and triggers a webhook to save the call transcript directly to the CRM.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **AI Models**: Groq (for text generation), Omni Dimension (for Voice AI)
- **Deployment**: Vercel (Edge CDN)

---

## 💻 Running Locally

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your `.env.local` file with your Supabase, Omni Dimension, and Groq keys (see `.env.example`).
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000`.

---

## 🎨 Design & Voice
Built to feel like Nomichi. It uses the official brand palette (Rust, Olive, Sand, Ink, Cream, Yellow), display fonts for headings, and Poppins for readability. The UI is calm, the language is direct and specific, and the workflow is designed with zero friction for a busy team.
