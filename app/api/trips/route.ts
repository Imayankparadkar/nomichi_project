import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";

const tripSchema = z.object({
  name: z.string().min(2),
  destination: z.string().min(2),
  start_date: z.string(),
  end_date: z.string(),
  price_gst: z.number().positive(),
  total_seats: z.number().int().positive(),
  seats_available: z.number().int().min(0).optional(),
  status: z.enum(["open", "closed"]).default("open"),
  description: z.string().min(10),
});

export const revalidate = 60; // Cache the trips API for 60 seconds

export async function GET() {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("trips")
    .select("id, name, destination, start_date, end_date, price_gst, total_seats, seats_available, status")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = tripSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const insertData = {
    ...parsed.data,
    seats_available: parsed.data.seats_available ?? parsed.data.total_seats,
  };
  const { data, error } = await admin.from("trips").insert(insertData).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
