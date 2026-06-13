import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestVibeFit } from "@/lib/gemini";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id } = await request.json();

  const { data: lead } = await supabase
    .from("leads")
    .select(`*, trips(name, description)`)
    .eq("id", lead_id)
    .single();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const trip = (lead as any).trips;

  try {
    const result = await suggestVibeFit({
      leadName: lead.name,
      groupType: lead.group_type,
      preferredMonth: lead.preferred_month,
      vibeText: lead.vibe_text,
      tripName: trip?.name ?? "this trip",
      tripDescription: trip?.description ?? "",
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}
