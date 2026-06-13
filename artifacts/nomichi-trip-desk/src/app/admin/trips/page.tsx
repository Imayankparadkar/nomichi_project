import { createClient } from "@/lib/supabase/server";
import TripsAdmin from "@/components/admin/TripsAdmin";

export default async function TripsPage() {
  const supabase = await createClient();

  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  return <TripsAdmin trips={trips ?? []} />;
}
