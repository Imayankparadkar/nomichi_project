import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Public endpoint — returns enquiry status by phone number.
// Uses admin client (server-side only) to bypass RLS, but returns only status info — no personal details.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.replace(/\s+/g, "").trim();

  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: "Enter a valid 10-digit Indian mobile number." },
      { status: 400 }
    );
  }

  const adminClient = await createAdminClient();

  const { data, error } = await adminClient
    .from("leads")
    .select("id, status, preferred_month, created_at, trips(name, destination, start_date, end_date)")
    .eq("phone", phone)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: "Could not look up enquiry." }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ found: false });
  }

  // Return only status-safe fields — no name, email, vibe_text
  const enquiries = data.map((lead: any) => ({
    id: lead.id,
    status: lead.status,
    preferred_month: lead.preferred_month,
    created_at: lead.created_at,
    trip: lead.trips
      ? {
          name: lead.trips.name,
          destination: lead.trips.destination,
          start_date: lead.trips.start_date,
          end_date: lead.trips.end_date,
        }
      : null,
  }));

  return NextResponse.json({ found: true, enquiries });
}
