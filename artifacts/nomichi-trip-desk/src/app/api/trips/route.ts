import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const tripSchema = z.object({
  name: z.string().min(2),
  destination: z.string().min(2),
  start_date: z.string(),
  end_date: z.string(),
  price_gst: z.number().positive(),
  total_seats: z.number().int().positive(),
  seats_available: z.number().int().min(0),
  status: z.enum(["open", "closed"]),
  description: z.string().min(10),
});

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = tripSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("trips")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
