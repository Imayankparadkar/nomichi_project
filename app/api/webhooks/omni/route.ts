import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone_number, lead_id, note, transcript, next_action } = body;
    
    // The AI agent might send 'transcript' instead of 'note' depending on how it's configured.
    const finalNote = note || transcript || "Automated call completed. No transcript provided.";
    
    const admin = getSupabaseAdmin();
    let targetLeadId = lead_id;

    // If the webhook only provides a phone number, look up the lead in Supabase
    if (!targetLeadId && phone_number) {
      // Extract the last 10 digits to avoid country code mismatch issues
      const phoneDigits = phone_number.replace(/\D/g, '').slice(-10);
      
      const { data: leads, error: leadError } = await admin
        .from("leads")
        .select("id")
        .ilike("phone", `%${phoneDigits}%`)
        .limit(1);
        
      if (!leadError && leads && leads.length > 0) {
        targetLeadId = leads[0].id;
      } else {
        return NextResponse.json({ error: "Lead not found for this phone number." }, { status: 404 });
      }
    }

    if (!targetLeadId) {
       return NextResponse.json({ error: "lead_id or phone_number is required in the payload." }, { status: 400 });
    }

    // Insert the call log into Supabase
    const { data, error } = await admin
      .from("call_logs")
      .insert({
         lead_id: targetLeadId,
         note: finalNote,
         next_action: next_action || "Review AI call transcript",
         // We do not pass created_by, so it will be null (indicating a system/AI action)
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, call_log: data }, { status: 201 });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
