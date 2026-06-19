import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { z } from "zod";

const router = Router();

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function getAuthedUser(authHeader?: string) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const url = process.env.SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_ANON_KEY!;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

async function requireTeamMember(
  req: import("express").Request,
  res: import("express").Response,
): Promise<import("@supabase/supabase-js").User | null> {
  const user = await getAuthedUser(req.headers.authorization);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "associate"].includes(profile.role)) {
    res.status(403).json({ error: "Forbidden: team access only" });
    return null;
  }
  return user;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Leads ────────────────────────────────────────────────────────────────────

const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  trip_id: z.string().uuid(),
  group_type: z.enum(["solo", "friends", "couple", "family"]),
  preferred_month: z.string().min(1),
  vibe_text: z.string().min(10),
});

router.post("/leads", async (req, res) => {
  const parsed = createLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .insert({ ...parsed.data, status: "NEW" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: "Failed to save enquiry" });
  res.status(201).json({ success: true, lead: data });
});

router.get("/leads", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const admin = getSupabaseAdmin();
  let query = admin
    .from("leads")
    .select("*, trips(id, name, destination), owner:profiles!leads_owner_id_fkey(id, full_name)")
    .order("created_at", { ascending: false });

  const { status, trip, q } = req.query as Record<string, string>;
  if (status) query = query.eq("status", status);
  if (trip) query = query.eq("trip_id", trip);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

const updateLeadSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "VIBE_CHECK_SENT", "CONFIRMED", "NOT_A_FIT"]).optional(),
  owner_id: z.string().uuid().nullable().optional(),
});

router.patch("/leads/:id", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { id } = req.params;
  const parsed = updateLeadSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed" });

  const admin = getSupabaseAdmin();

  const { data: currentLead } = await admin.from("leads").select("status, trip_id").eq("id", id).single();

  const { data, error } = await admin
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  const newStatus = parsed.data.status;
  const oldStatus = currentLead?.status;
  const tripId = currentLead?.trip_id;

  if (newStatus && newStatus !== oldStatus && tripId) {
    const wasConfirmed = oldStatus === "CONFIRMED";
    const nowConfirmed = newStatus === "CONFIRMED";
    if (nowConfirmed || wasConfirmed) {
      const { data: trip } = await admin.from("trips").select("seats_available").eq("id", tripId).single();
      if (trip) {
        const delta = nowConfirmed ? -1 : +1;
        const newSeats = Math.max(0, (trip as any).seats_available + delta);
        await admin.from("trips").update({ seats_available: newSeats }).eq("id", tripId);
      }
    }
  }

  res.json(data);
});

router.get("/leads/:id", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { id } = req.params;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("*, trips(id, name, destination, start_date, end_date, price_gst, description), owner:profiles!leads_owner_id_fkey(id, full_name, email)")
    .eq("id", id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

// ─── Trips ────────────────────────────────────────────────────────────────────

const updateTripSchema = z.object({
  name: z.string().min(2).optional(),
  destination: z.string().min(2).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  price_gst: z.number().positive().optional(),
  total_seats: z.number().int().positive().optional(),
  seats_available: z.number().int().min(0).optional(),
  status: z.enum(["open", "closed"]).optional(),
  description: z.string().min(10).optional(),
});

router.patch("/trips/:id", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { id } = req.params;
  const parsed = updateTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed" });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.from("trips").update(parsed.data).eq("id", id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete("/trips/:id", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { id } = req.params;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("trips").delete().eq("id", id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ─── Call Logs ────────────────────────────────────────────────────────────────

const callLogSchema = z.object({
  lead_id: z.string().uuid(),
  note: z.string().min(1),
  next_action: z.string().optional().nullable(),
});

router.post("/call-logs", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const parsed = callLogSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Validation failed" });

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("call_logs")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*, created_by_profile:profiles!call_logs_created_by_fkey(id, full_name, email)")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── Messages ─────────────────────────────────────────────────────────────────

router.get("/messages", async (req, res) => {
  const { lead_id, phone } = req.query as Record<string, string>;
  if (!lead_id) return res.status(400).json({ error: "lead_id required" });

  const user = await getAuthedUser(req.headers.authorization);
  const admin = getSupabaseAdmin();

  if (!user) {
    if (!phone) return res.status(401).json({ error: "Phone required" });
    const { data: lead } = await admin.from("leads").select("id").eq("id", lead_id).eq("phone", phone.replace(/\s+/g, "")).single();
    if (!lead) return res.status(403).json({ error: "Could not verify identity" });
  }

  const { data, error } = await admin.from("messages").select("*").eq("lead_id", lead_id).order("created_at", { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.post("/messages", async (req, res) => {
  const { lead_id, content, sender, phone } = req.body;
  if (!lead_id || !content?.trim() || !sender) return res.status(400).json({ error: "Missing required fields" });
  if (!["admin", "lead"].includes(sender)) return res.status(400).json({ error: "Invalid sender" });

  const user = await getAuthedUser(req.headers.authorization);
  const admin = getSupabaseAdmin();

  if (!user) {
    if (sender !== "lead" || !phone) return res.status(401).json({ error: "Unauthorized" });
    const { data: lead } = await admin.from("leads").select("id").eq("id", lead_id).eq("phone", phone.replace(/\s+/g, "")).single();
    if (!lead) return res.status(403).json({ error: "Could not verify identity" });
  } else {
    if (sender !== "admin") return res.status(400).json({ error: "Authenticated users must send as admin" });
  }

  const { data, error } = await admin.from("messages").insert({ lead_id, content: content.trim(), sender }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ─── Status (public) ──────────────────────────────────────────────────────────

router.get("/status", async (req, res) => {
  const phone = (req.query.phone as string)?.replace(/\s+/g, "").trim();
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: "Enter a valid 10-digit Indian mobile number." });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select("id, name, status, preferred_month, created_at, trips(name, destination, start_date, end_date)")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) return res.status(500).json({ error: "Could not look up enquiry." });
  if (!data || data.length === 0) return res.json({ found: false });

  const enquiries = data.map((lead: any) => ({
    id: lead.id,
    name: lead.name,
    status: lead.status,
    preferred_month: lead.preferred_month,
    created_at: lead.created_at,
    trip: lead.trips ? {
      name: lead.trips.name,
      destination: lead.trips.destination,
      start_date: lead.trips.start_date,
      end_date: lead.trips.end_date,
    } : null,
  }));

  res.json({ found: true, enquiries });
});

// ─── AI ───────────────────────────────────────────────────────────────────────

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY?.trim(); // trim strips Windows \r from --env-file
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  return new Groq({ apiKey });
}

async function groqChat(prompt: string): Promise<string> {
  const client = getGroq();
  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 512,
  });
  return completion.choices[0]?.message?.content ?? "";
}

router.get("/ai/check-key", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.json({ working: false, error: "GROQ_API_KEY is not set in the environment (.env file)." });
  }

  try {
    await groqChat("Hi");
    res.json({ working: true });
  } catch (err: any) {
    res.json({ working: false, error: err.message || "Failed to connect to Groq API." });
  }
});

router.post("/ai/whatsapp-draft", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { lead_id, message_type = "intro", custom_context = "" } = req.body;
  const admin = getSupabaseAdmin();
  const { data: lead } = await admin.from("leads").select("*, trips(name, destination, start_date, end_date)").eq("id", lead_id).single();
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const trip = (lead as any).trips;
  const tripDates = trip ? `${formatDate(trip.start_date)} to ${formatDate(trip.end_date)}` : "dates TBC";

  try {
    let typePrompt = "";
    if (message_type === "ready") {
      typePrompt = `Write a friendly check-in WhatsApp message (2-3 sentences max) asking if they are ready to confirm their slot on the trip. Ask if they have any remaining questions about the itinerary, pricing, or details. Keep it low-pressure, warm, and clear.`;
    } else if (message_type === "confirmation") {
      typePrompt = `Write a booking confirmation WhatsApp message (3-4 sentences max) confirming that their slot is officially booked for the trip. Let them know we are excited to travel with them and will share pre-trip details soon.`;
    } else if (message_type === "followup") {
      typePrompt = `Write a warm follow-up WhatsApp message (2-3 sentences max) to check if they had a chance to look over the details we shared. Ask if they need any help or have any questions.`;
    } else {
      typePrompt = `Write a warm, short WhatsApp opening message (3-4 sentences max). Reference something specific from what they shared.`;
    }

    const prompt = `You are writing a WhatsApp message for a Nomichi team member to send to a travel enquiry lead.

Nomichi is a community-led travel brand that designs slow, offbeat, small-group journeys. The voice is warm, honest, specific, and still. Use second person. Write short sentences. No exclamation marks, no em-dashes, no AI-isms like "unlock", "elevate" or "embark on a journey". Prefer concrete detail over abstract feelings. The tagline is "Travel that finds you."

Lead details:
- Name: ${lead.name}
- Trip interested in: ${trip?.name ?? "this trip"} to ${trip?.destination ?? ""}
- Trip dates: ${tripDates}
- Group type: ${lead.group_type}
- What they hope the trip feels like: ${lead.vibe_text}
- Lead current status: ${lead.status}

${typePrompt}

${custom_context ? `Additional specific context or instruction for this message: "${custom_context}"` : ""}

Sign off from "the Nomichi team". Do not use exclamation marks or em-dashes.`;

    const draft = await groqChat(prompt);
    res.json({ draft });
  } catch (err) {
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

router.post("/ai/summarize-log", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { lead_id } = req.body;
  const admin = getSupabaseAdmin();
  const [{ data: lead }, { data: callLogs }] = await Promise.all([
    admin.from("leads").select("*, trips(name)").eq("id", lead_id).single(),
    admin.from("call_logs").select("note, next_action, created_at").eq("lead_id", lead_id).order("created_at", { ascending: true }),
  ]);

  if (!lead) return res.status(404).json({ error: "Lead not found" });
  if (!callLogs?.length) return res.json({ summary: "No call log entries yet." });

  try {
    const logsText = callLogs
      .map((log: any, i: number) => `${i + 1}. [${new Date(log.created_at).toLocaleDateString()}] ${log.note}${log.next_action ? ` | Next: ${log.next_action}` : ""}`)
      .join("\n");

    const prompt = `Summarize the following call log for a Nomichi travel lead in one clear sentence. State where things stand and what the most important next action is. Be specific and practical. Write in the style of a smart colleague handing over a file. No jargon, no em-dashes.

Lead: ${lead.name}
Trip: ${(lead as any).trips?.name ?? "unknown trip"}
Current status: ${lead.status}

Call log:
${logsText}

Write exactly one sentence (max 30 words) covering: where things stand + what to do next.`;

    const summary = await groqChat(prompt);
    res.json({ summary });
  } catch {
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

router.post("/ai/vibe-check", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { lead_id } = req.body;
  const admin = getSupabaseAdmin();
  const { data: lead } = await admin.from("leads").select("*, trips(name, description)").eq("id", lead_id).single();
  if (!lead) return res.status(404).json({ error: "Lead not found" });

  const trip = (lead as any).trips;

  try {
    const prompt = `You are helping a Nomichi travel associate assess whether an enquiry lead is a good fit for slow, small-group travel.

Nomichi runs intimate, offbeat journeys for people who want travel to feel personal and unhurried.

Lead:
- Name: ${lead.name}
- Group type: ${lead.group_type}
- Preferred month: ${lead.preferred_month}
- What they hope the trip feels like: "${lead.vibe_text}"

Trip they enquired about:
- Name: ${trip?.name ?? "this trip"}
- Description: ${trip?.description ?? ""}

Based only on the lead's own words, assess their fit. This is a suggestion to help the associate, never an automatic decision.

Respond with valid JSON only (no markdown, no code fences):
{
  "fit": "strong" | "possible" | "unlikely",
  "reason": "One specific sentence explaining why, referencing something they actually said."
}`;

    const text = (await groqChat(prompt)).trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response");
    res.json(JSON.parse(jsonMatch[0]));
  } catch {
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

router.post("/ai/suggest-reply", async (req, res) => {
  const user = await requireTeamMember(req, res);
  if (!user) return;

  const { lead_id } = req.body;
  if (!lead_id) return res.status(400).json({ error: "lead_id required" });

  const admin = getSupabaseAdmin();
  const [{ data: lead }, { data: messages }] = await Promise.all([
    admin.from("leads").select("*, trips(name, destination, start_date, end_date, description)").eq("id", lead_id).single(),
    admin.from("messages").select("sender, content, created_at").eq("lead_id", lead_id).order("created_at", { ascending: true }),
  ]);

  if (!lead) return res.status(404).json({ error: "Lead not found" });

  try {
    const recentMessagesText = (messages ?? [])
      .slice(-15)
      .map((msg) => `${msg.sender === "admin" ? "Nomichi Team" : lead.name}: ${msg.content}`)
      .join("\n");

    const trip = (lead as any).trips;
    const tripDetails = trip 
      ? `Trip: ${trip.name} to ${trip.destination} (${trip.start_date} to ${trip.end_date}). Description: ${trip.description || "N/A"}`
      : "No trip details chosen yet.";

    const prompt = `You are a helpful co-pilot/assistant for the admin team at Nomichi, a premium travel company that organizes unhurried, small-group journeys.
Your goal is to suggest a response to the latest message from the lead, ${lead.name}.

Context:
Lead Name: ${lead.name}
Preferred Month: ${lead.preferred_month}
Vibe preference: "${lead.vibe_text}"
Current Lead Status: ${lead.status}
${tripDetails}

Recent Chat History:
${recentMessagesText || "No chat history yet."}

Instructions for the suggestion:
- Draft a single, warm, highly helpful, and natural response from the Nomichi team ("we", "us").
- Do NOT use exclamation marks.
- Do NOT use em-dashes or complex punctuation. Keep it clean and elegant.
- Keep the response concise (2-4 sentences max).
- Refer to the context or last message naturally. If the last message was from the admin team, draft a polite follow-up or check-in.
- Return ONLY the suggested response text, with no preamble, no quotes around the response, and no additional commentary. Just the plain message text.`;

    const suggestion = await groqChat(prompt);
    res.json({ suggestion: suggestion.trim() });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate suggested reply." });
  }
});

export default router;
