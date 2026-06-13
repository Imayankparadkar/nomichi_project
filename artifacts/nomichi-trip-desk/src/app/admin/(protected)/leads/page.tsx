import { createClient } from "@/lib/supabase/server";
import LeadList from "@/components/admin/LeadList";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; trip?: string; owner?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select(`
      *,
      trips(id, name, destination),
      owner:profiles!leads_owner_id_fkey(id, full_name, email)
    `)
    .order("created_at", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.trip) query = query.eq("trip_id", params.trip);
  if (params.owner) query = query.eq("owner_id", params.owner);
  if (params.q) {
    query = query.or(
      `name.ilike.%${params.q}%,email.ilike.%${params.q}%,phone.ilike.%${params.q}%`
    );
  }

  const [{ data: leads }, { data: trips }, { data: profiles }] = await Promise.all([
    query,
    supabase.from("trips").select("id, name").order("name"),
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
  ]);

  return (
    <LeadList
      leads={leads ?? []}
      trips={trips ?? []}
      profiles={profiles ?? []}
      filters={params}
    />
  );
}
