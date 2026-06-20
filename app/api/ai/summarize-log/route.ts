import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";
import { groqChat } from "@/lib/groq";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead_id } = await req.json();
  const admin = getSupabaseAdmin();
  const [{ data: lead }, { data: callLogs }] = await Promise.all([
    admin.from("leads").select("*, trips(name)").eq("id", lead_id).single(),
    admin
      .from("call_logs")
      .select("note, next_action, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: true }),
  ]);

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!callLogs?.length) return NextResponse.json({ summary: "No call log entries yet." });

  try {
    const logsText = callLogs
      .map(
        (log: any, i: number) =>
          `${i + 1}. [${new Date(log.created_at).toLocaleDateString()}] ${log.note}${log.next_action ? ` | Next: ${log.next_action}` : ""}`
      )
      .join("\n");

    const prompt = `Summarize the following call log for a Nomichi travel lead in one clear sentence. State where things stand and what the most important next action is. Be specific and practical. No jargon, no em-dashes.

Lead: ${lead.name}
Trip: ${(lead as any).trips?.name ?? "unknown trip"}
Current status: ${lead.status}

Call log:
${logsText}

Write exactly one sentence (max 30 words) covering: where things stand + what to do next.`;

    const summary = await groqChat(prompt);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "AI generation failed. Please try again." }, { status: 500 });
  }
}
