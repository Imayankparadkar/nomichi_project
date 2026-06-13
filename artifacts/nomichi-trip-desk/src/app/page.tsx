import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";
import PublicPage from "@/components/public/PublicPage";

export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();
  const { data: trips } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "open")
    .order("start_date", { ascending: true });

  return <PublicPage trips={(trips as Trip[]) ?? []} />;
}
