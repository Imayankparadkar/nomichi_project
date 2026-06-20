# Nomichi Trip Desk

A complete, end-to-end trip management platform built for the Nomichi engineering intern assignment. It moves Nomichi away from messy Google Sheets and into a unified, AI-native workspace.

## What is built

This project solves the core problem: capturing leads cleanly and managing them efficiently.

**1. Public Enquiry Page (Lead Capture)**
A mobile-first page where travellers can view open trips. They can fill out an enquiry form detailing their group type, preferred month, and what they hope the trip feels like. It saves directly to the database with a warm confirmation state.

**2. The Nomichi Team Admin (Mini-CRM)**
An authenticated workspace where the team manages leads.
- **Dashboard Overview**: Quick stats on total leads and pipeline stages.
- **Lead Pipeline**: Move leads through clear stages (New, Contacted, Qualified, Vibe Check Sent, Confirmed, Not a Fit).
- **Lead Detail & Call Logs**: A centralized view of the traveller's details, trip choice, and timestamped touchpoints.
- **Trip Content Management (CMS)**: The team can create, edit, and close trips without touching code. Open trips sync automatically to the public page.

## The Workflow

How data flows through the system on a busy Monday morning:

1. **Lead Capture**: A traveller submits an enquiry on the public site. It appears instantly in the Team Admin.
2. **First Touchpoint (AI Copilot)**: An admin opens the lead, uses the **AI Vibe Check** to assess if they are a fit for slow travel, and clicks **Generate Draft** to get a custom WhatsApp intro message tailored to the traveller's preferences.
3. **Automated Voice Calls (The Surprise Feature)**: If the traveller wants immediate answers, they can click "Start Voice Call" on their status page to talk to an AI Voice Agent. The AI asks for their phone number to confirm identity. When they hang up, the system automatically matches their number and pushes the full call transcript directly into their Call Log in the CRM.
4. **Instant Context**: Before calling a lead back, the admin clicks **Summarise**. The AI reads the entire history of text messages and automated voice transcripts, and outputs exactly one sentence explaining where things stand and what to do next.

## AI Native Features

The heavy lifting is done by AI so the team can focus on connecting with travellers.

- **Voice AI Autopilot (Omni Dimension)**: A fully integrated web widget that talks to leads, extracts their identity, and triggers a webhook to save the call transcript to the CRM.
- **WhatsApp Drafts**: Generates personalized first-contact or follow-up messages based on the lead's specific trip and answers.
- **Vibe Fit Check**: Reads the "what they hope the trip feels like" answer and suggests whether the traveller matches Nomichi's small-group ethos.
- **Smart Log Summarizer**: Distills long call transcripts and chat messages into a single, actionable sentence.
- **Reply Suggestions**: An AI co-pilot inside the chat box that suggests the best reply to a traveller's message.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Models**: Groq / Gemini (for text generation), Omni Dimension (for Voice AI)
- **Deployment**: Vercel

## Running Locally

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

## Design & Voice

Built to feel like Nomichi. It uses the official brand palette (Rust, Olive, Sand, Ink, Cream, Yellow), display fonts for headings, and Poppins for readability. The UI is calm, the language is direct and specific, and the workflow is designed with zero friction for a busy team.
