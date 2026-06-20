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
  const { data: lead } = await admin
    .from("leads")
    .select("*, trips(name, description)")
    .eq("id", lead_id)
    .single();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

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
    
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed. Please try again." }, { status: 500 });
  }
}
