import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import LeadDetail from "@/components/admin/LeadDetail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: lead }, { data: callLogs }, { data: profiles }] = await Promise.all([
    supabase
      .from("leads")
      .select(`
        *,
        trips(id, name, destination, start_date, end_date, price_gst, description),
        owner:profiles!leads_owner_id_fkey(id, full_name, email)
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("call_logs")
      .select(`
        *,
        created_by_profile:profiles!call_logs_created_by_fkey(id, full_name, email)
      `)
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  if (!lead) notFound();

  return <LeadDetail lead={lead} callLogs={callLogs ?? []} profiles={profiles ?? []} />;
}
