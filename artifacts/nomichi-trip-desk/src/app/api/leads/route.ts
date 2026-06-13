import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const createLeadSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Enter a valid email address"),
  trip_id: z.string().uuid("Select a trip"),
  group_type: z.enum(["solo", "friends", "couple", "family"]),
  preferred_month: z.string().min(1, "Select a preferred month"),
  vibe_text: z.string().min(10, "Tell us a little more — at least 10 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Use admin client so public (unauthenticated) enquiries bypass RLS
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from("leads")
      .insert({
        ...parsed.data,
        status: "NEW",
      })
      .select()
      .single();

    if (error) {
      console.error("Lead creation error:", error);
      return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
    }

    return NextResponse.json({ success: true, lead: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = supabase
    .from("leads")
    .select(`*, trips(id, name, destination), owner:profiles!leads_owner_id_fkey(id, full_name)`)
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  const trip = searchParams.get("trip");
  const q = searchParams.get("q");

  if (status) query = query.eq("status", status);
  if (trip) query = query.eq("trip_id", trip);
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
