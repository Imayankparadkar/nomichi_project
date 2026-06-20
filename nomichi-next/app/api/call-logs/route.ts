import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";

const callLogSchema = z.object({
  lead_id: z.string().uuid(),
  note: z.string().min(1),
  next_action: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = callLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("call_logs")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*, created_by_profile:profiles!call_logs_created_by_fkey(id, full_name, email)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
