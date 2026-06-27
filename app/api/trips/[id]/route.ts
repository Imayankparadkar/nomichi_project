import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";

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
  version_id: z.number().int().positive().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateTripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  
  // Extract version_id and the rest of the data
  const { version_id, ...updateData } = parsed.data;

  // If version_id is provided, perform OCC check
  if (version_id !== undefined) {
    // We increment the version ID on save
    const newVersion = version_id + 1;
    
    const { data, error, count } = await admin
      .from("trips")
      .update({ ...updateData, version_id: newVersion })
      .eq("id", id)
      .eq("version_id", version_id) // ONLY update if the database version matches the frontend's version
      .select()
      .single();

    // If we hit an error but the query didn't fail functionally, it means 0 rows were updated
    // which implies the version_id didn't match.
    if (error && error.code === 'PGRST116') { // PostgREST error for "0 rows returned" on single()
      return NextResponse.json(
        { error: "Conflict: Another admin has updated this trip. Please refresh to see their changes." }, 
        { status: 409 }
      );
    }
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Fallback (for older clients or bulk scripts that don't pass version_id)
  const { data, error } = await admin
    .from("trips")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("trips").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
