import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";
import { groqChat } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id } = await req.json();
  if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const admin = getSupabaseAdmin();
  const [{ data: lead }, { data: messages }] = await Promise.all([
    admin
      .from("leads")
      .select("*, trips(name, destination, start_date, end_date, description)")
      .eq("id", lead_id)
      .single(),
    admin
      .from("messages")
      .select("sender, content, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: true }),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  try {
    const recentMessagesText = (messages ?? [])
      .slice(-15)
      .map((msg: any) => `${msg.sender === "admin" ? "Nomichi Team" : lead.name}: ${msg.content}`)
      .join("\n");

    const trip = (lead as any).trips;
    const tripDetails = trip
      ? `Trip: ${trip.name} to ${trip.destination} (${trip.start_date} to ${trip.end_date}). Description: ${trip.description || "N/A"}`
      : "No trip details.";

    const prompt = `You are a helpful co-pilot for the Nomichi admin team. Suggest a response to the latest message from the lead, ${lead.name}.

Context:
Lead Name: ${lead.name}
Preferred Month: ${lead.preferred_month}
Vibe preference: "${lead.vibe_text}"
Current Lead Status: ${lead.status}
${tripDetails}

Recent Chat History:
${recentMessagesText || "No chat history yet."}

Instructions:
- Draft a single, warm, helpful, natural response from the Nomichi team ("we", "us").
- Do NOT use exclamation marks, em-dashes or complex punctuation.
- Keep the response concise (2-4 sentences max).
- Return ONLY the suggested response text, no preamble or quotes.`;

    const suggestion = await groqChat(prompt);
    return NextResponse.json({ suggestion: suggestion.trim() });
  } catch {
    return NextResponse.json({ error: "Failed to generate suggested reply." }, { status: 500 });
  }
}
