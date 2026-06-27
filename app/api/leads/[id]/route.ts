import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";

const updateLeadSchema = z.object({
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "VIBE_CHECK_SENT", "CONFIRMED", "NOT_A_FIT"])
    .optional(),
  owner_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .select(
      "*, trips(id, name, destination, start_date, end_date, price_gst, description), owner:profiles!leads_owner_id_fkey(id, full_name, email)"
    )
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data: currentLead } = await admin
    .from("leads")
    .select("status, trip_id")
    .eq("id", id)
    .single();

  const { data, error } = await admin
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update seat availability when confirmed status changes
  const newStatus = parsed.data.status;
  const oldStatus = (currentLead as any)?.status;
  const tripId = (currentLead as any)?.trip_id;
  if (newStatus && newStatus !== oldStatus && tripId) {
    const wasConfirmed = oldStatus === "CONFIRMED";
    const nowConfirmed = newStatus === "CONFIRMED";
    if (nowConfirmed || wasConfirmed) {
      const delta = nowConfirmed ? -1 : +1;
      
      // Perform atomic seat update in the database to prevent race conditions
      const { data: success, error: rpcError } = await admin.rpc('update_trip_seats', { 
        p_trip_id: tripId, 
        p_delta: delta 
      });

      if (rpcError) {
        console.error("Atomic seat update failed:", rpcError);
      }
    }
  }

  return NextResponse.json(data);
}
