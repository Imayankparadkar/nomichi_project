import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftWhatsAppMessage } from "@/lib/gemini";
import { formatDate } from "@/lib/utils";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id } = await request.json();

  const { data: lead } = await supabase
    .from("leads")
    .select(`*, trips(name, destination, start_date, end_date)`)
    .eq("id", lead_id)
    .single();

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const trip = (lead as any).trips;
  const tripDates = trip
    ? `${formatDate(trip.start_date)} to ${formatDate(trip.end_date)}`
    : "dates TBC";

  try {
    const draft = await draftWhatsAppMessage({
      leadName: lead.name,
      tripName: trip?.name ?? "your chosen trip",
      tripDestination: trip?.destination ?? "",
      tripDates,
      groupType: lead.group_type,
      vibeText: lead.vibe_text,
    });
    return NextResponse.json({ draft });
  } catch {
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}
