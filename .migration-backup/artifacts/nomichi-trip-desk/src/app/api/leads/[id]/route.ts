import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const updateLeadSchema = z.object({
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "VIBE_CHECK_SENT", "CONFIRMED", "NOT_A_FIT"])
    .optional(),
  owner_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = updateLeadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = await createAdminClient();

  // Fetch current lead status so we can adjust seats_available if needed
  const { data: currentLead } = await adminClient
    .from("leads")
    .select("status, trip_id")
    .eq("id", id)
    .single();

  // Update the lead
  const { data, error } = await adminClient
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Adjust seats_available when confirmation status changes
  const newStatus = parsed.data.status;
  const oldStatus = currentLead?.status;
  const tripId = currentLead?.trip_id;

  if (newStatus && newStatus !== oldStatus && tripId) {
    const wasConfirmed = oldStatus === "CONFIRMED";
    const nowConfirmed = newStatus === "CONFIRMED";

    if (nowConfirmed || wasConfirmed) {
      // Fetch current seats
      const { data: trip } = await adminClient
        .from("trips")
        .select("seats_available")
        .eq("id", tripId)
        .single();

      if (trip) {
        const delta = nowConfirmed ? -1 : +1; // confirm → take a seat; unconfirm → release a seat
        const newSeats = Math.max(0, trip.seats_available + delta);
        await adminClient
          .from("trips")
          .update({ seats_available: newSeats })
          .eq("id", tripId);
      }
    }
  }

  return NextResponse.json(data);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from("leads")
    .select(`
      *,
      trips(id, name, destination, start_date, end_date, price_gst, description),
      owner:profiles!leads_owner_id_fkey(id, full_name, email)
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(data);
}
