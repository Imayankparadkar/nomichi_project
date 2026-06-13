import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { summarizeCallLog } from "@/lib/gemini";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id } = await request.json();

  const [{ data: lead }, { data: callLogs }] = await Promise.all([
    supabase
      .from("leads")
      .select(`*, trips(name)`)
      .eq("id", lead_id)
      .single(),
    supabase
      .from("call_logs")
      .select("note, next_action, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: true }),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!callLogs?.length) {
    return NextResponse.json({ summary: "No call log entries yet." });
  }

  const summary = await summarizeCallLog({
    leadName: lead.name,
    tripName: (lead as any).trips?.name ?? "unknown trip",
    currentStatus: lead.status,
    callLogs: callLogs,
  });

  return NextResponse.json({ summary });
}
