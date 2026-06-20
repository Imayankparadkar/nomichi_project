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
  const { data, error } = await admin
    .from("trips")
    .update(parsed.data)
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
