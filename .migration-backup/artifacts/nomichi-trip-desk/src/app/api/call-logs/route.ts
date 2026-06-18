import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const callLogSchema = z.object({
  lead_id: z.string().uuid(),
  note: z.string().min(1, "Add a note about the call"),
  next_action: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = callLogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = await createAdminClient();
  const { data, error } = await adminClient
    .from("call_logs")
    .insert({
      ...parsed.data,
      created_by: user.id,
    })
    .select(`
      *,
      created_by_profile:profiles!call_logs_created_by_fkey(id, full_name, email)
    `)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
