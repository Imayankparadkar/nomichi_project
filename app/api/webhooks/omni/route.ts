import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Omni Webhook Payload:", body);

    const { phone_number, to_number, from_number, call_report, user_email, lead_id } = body;
    
    // Omni Dimension sends the transcript and summary inside `call_report`
    let finalNote = "Automated call completed.";
    if (call_report) {
      finalNote = `**Summary:**\n${call_report.summary || 'N/A'}\n\n**Conversation:**\n${call_report.full_conversation || 'N/A'}`;
    }

    const next_action = call_report?.extracted_variables?.suggested_next_actions || "Review AI call transcript";
    
    const admin = getSupabaseAdmin();
    let targetLeadId = lead_id;

    // 1. Try to find by email if it's a Web Call and email is provided
    if (!targetLeadId && user_email) {
      if (user_email.endsWith("@nomichi.local")) {
        // This is a custom string we passed via the Web Widget containing the verified phone number!
        const phoneDigits = user_email.replace("@nomichi.local", "").slice(-10);
        const { data: leads } = await admin
          .from("leads")
          .select("id")
          .ilike("phone", `%${phoneDigits}%`)
          .limit(1);
          
        if (leads && leads.length > 0) {
          targetLeadId = leads[0].id;
        }
      } else {
        // Regular email search
        const { data: leads } = await admin
          .from("leads")
          .select("id")
          .ilike("email", user_email)
          .limit(1);
          
        if (leads && leads.length > 0) {
          targetLeadId = leads[0].id;
        }
      }
    }

    // 2. Try to find by phone number if it's not a "Web Call"
    if (!targetLeadId) {
      const potentialPhones = [phone_number, to_number, from_number].filter(
        p => p && p !== "Web Call" && p !== "Assistant"
      );

      for (const phone of potentialPhones) {
        const phoneDigits = phone.replace(/\D/g, '').slice(-10);
        if (phoneDigits.length >= 10) {
          const { data: leads } = await admin
            .from("leads")
            .select("id")
            .ilike("phone", `%${phoneDigits}%`)
            .limit(1);
            
          if (leads && leads.length > 0) {
            targetLeadId = leads[0].id;
            break;
          }
        }
      }
    }

    if (!targetLeadId) {
       console.error("Lead not found for webhook payload", { user_email, phone_number });
       // We return 200 instead of 404/400 so Omni Dimension stops retrying and closing the circuit!
       return NextResponse.json({ error: "Lead not found in CRM. Ignored." }, { status: 200 });
    }

    // Insert the call log into Supabase
    const { data, error } = await admin
      .from("call_logs")
      .insert({
         lead_id: targetLeadId,
         note: finalNote,
         next_action: next_action
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

