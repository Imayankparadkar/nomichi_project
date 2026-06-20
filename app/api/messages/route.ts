import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, getAuthedUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lead_id = searchParams.get("lead_id");
  const phone = searchParams.get("phone");

  if (!lead_id) return NextResponse.json({ error: "lead_id required" }, { status: 400 });

  const authHeader = req.headers.get("authorization");
  const user = await getAuthedUser(authHeader);
  const admin = getSupabaseAdmin();

  // Unauthenticated access: verify by phone
  if (!user) {
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 401 });
    const { data: lead } = await admin
      .from("leads")
      .select("id")
      .eq("id", lead_id)
      .eq("phone", phone.replace(/\s+/g, ""))
      .single();
    if (!lead) return NextResponse.json({ error: "Could not verify identity" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("messages")
    .select("*")
    .eq("lead_id", lead_id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { lead_id, content, sender, phone } = body;

  if (!lead_id || !content?.trim() || !sender) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!["admin", "lead"].includes(sender)) {
    return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
  }

  const authHeader = req.headers.get("authorization");
  const user = await getAuthedUser(authHeader);
  const admin = getSupabaseAdmin();

  if (!user) {
    if (sender !== "lead" || !phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: lead } = await admin
      .from("leads")
      .select("id")
      .eq("id", lead_id)
      .eq("phone", phone.replace(/\s+/g, ""))
      .single();
    if (!lead) return NextResponse.json({ error: "Could not verify identity" }, { status: 403 });
  } else {
    if (sender !== "admin") {
      return NextResponse.json({ error: "Authenticated users must send as admin" }, { status: 400 });
    }
  }

  const { data, error } = await admin
    .from("messages")
    .insert({ lead_id, content: content.trim(), sender })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
