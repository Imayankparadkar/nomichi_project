import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET /api/messages?lead_id=xxx&phone=yyy
// Admin: no phone needed (uses session auth)
// Lead: phone required to validate ownership
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id");
  const phone = searchParams.get("phone");

  if (!leadId) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminClient = await createAdminClient();

  if (!user) {
    // Unauthenticated (lead) — validate by phone
    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 401 });
    }
    const { data: lead } = await adminClient
      .from("leads")
      .select("id")
      .eq("id", leadId)
      .eq("phone", phone.replace(/\s+/g, ""))
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Could not verify identity" }, { status: 403 });
    }
  }

  const { data, error } = await adminClient
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/messages
// Body: { lead_id, content, sender: 'admin' | 'lead', phone? }
export async function POST(request: Request) {
  const body = await request.json();
  const { lead_id, content, sender, phone } = body;

  if (!lead_id || !content?.trim() || !sender) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!["admin", "lead"].includes(sender)) {
    return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminClient = await createAdminClient();

  if (!user) {
    // Lead sending — must validate phone
    if (sender !== "lead" || !phone) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { data: lead } = await adminClient
      .from("leads")
      .select("id")
      .eq("id", lead_id)
      .eq("phone", phone.replace(/\s+/g, ""))
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Could not verify identity" }, { status: 403 });
    }
  } else {
    // Authenticated admin
    if (sender !== "admin") {
      return NextResponse.json({ error: "Authenticated users must send as admin" }, { status: 400 });
    }
  }

  const { data, error } = await adminClient
    .from("messages")
    .insert({ lead_id, content: content.trim(), sender })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
