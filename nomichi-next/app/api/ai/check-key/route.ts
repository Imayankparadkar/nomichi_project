import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireTeamMember } from "@/lib/supabase-server";
import { groqChat } from "@/lib/groq";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const user = await requireTeamMember(authHeader);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ working: false, error: "GROQ_API_KEY is not set." });
  }
  try {
    await groqChat("Hi");
    return NextResponse.json({ working: true });
  } catch (err: any) {
    return NextResponse.json({ working: false, error: err.message ?? "Failed to connect to Groq." });
  }
}
