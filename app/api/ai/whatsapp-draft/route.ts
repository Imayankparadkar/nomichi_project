import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";
import { groqChat } from "@/lib/groq";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id, message_type = "intro", custom_context = "" } = await req.json();
  const admin = getSupabaseAdmin();
  const { data: lead } = await admin
    .from("leads")
    .select("*, trips(name, destination, start_date, end_date)")
    .eq("id", lead_id)
    .single();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const trip = (lead as any).trips;
  const tripDates = trip
    ? `${formatDate(trip.start_date)} to ${formatDate(trip.end_date)}`
    : "dates TBC";

  let typePrompt = "";
  if (message_type === "ready") {
    typePrompt = `Write a friendly check-in WhatsApp message (2-3 sentences max) asking if they are ready to confirm their slot on the trip. Keep it low-pressure, warm, and clear.`;
  } else if (message_type === "confirmation") {
    typePrompt = `Write a booking confirmation WhatsApp message (3-4 sentences max) confirming their slot is officially booked. Let them know we are excited and will share pre-trip details soon.`;
  } else if (message_type === "followup") {
    typePrompt = `Write a warm follow-up WhatsApp message (2-3 sentences max) to check if they had a chance to look over the details. Ask if they need any help.`;
  } else {
    typePrompt = `Write a warm, short WhatsApp opening message (3-4 sentences max). Reference something specific from what they shared.`;
  }

  try {
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

${custom_context ? `Additional context: "${custom_context}"` : ""}

Sign off from "the Nomichi team". Do not use exclamation marks or em-dashes.`;

    const draft = await groqChat(prompt);
    return NextResponse.json({ draft });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed. Please try again." }, { status: 500 });
  }
}
