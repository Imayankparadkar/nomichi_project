import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email(),
  trip_id: z.string().uuid(),
  group_type: z.enum(["solo", "friends", "couple", "family"]),
  preferred_month: z.string().min(1),
  vibe_text: z.string().min(10),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("leads")
    .insert({ ...parsed.data, status: "NEW" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to save enquiry" }, { status: 500 });
  }
  return NextResponse.json({ success: true, lead: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { requireTeamMember } = await import("@/lib/supabase-server");
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const trip = searchParams.get("trip");
  const q = searchParams.get("q");
  const owner = searchParams.get("owner");
  
  // Pagination / Lazy loading
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = admin
    .from("leads")
    .select("id, name, email, phone, status, created_at, group_type, vibe_text, trips(id, name, destination), owner:profiles!leads_owner_id_fkey(id, full_name, email)")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status) as typeof query;
  if (trip) query = query.eq("trip_id", trip) as typeof query;
  if (owner) query = query.eq("owner_id", owner) as typeof query;
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`) as typeof query;

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
