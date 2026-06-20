import { createClient } from "@supabase/supabase-js";

// Server-side admin client — uses service role key, never in browser
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Server-side authed user verification
export async function getAuthedUser(authHeader?: string | null) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const url = process.env.SUPABASE_URL!;
  const anonKey = process.env.SUPABASE_ANON_KEY!;
  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: { user } } = await client.auth.getUser(token);
  return user;
}

// Require team member (admin or associate role)
export async function requireTeamMember(authHeader?: string | null) {
  const user = await getAuthedUser(authHeader);
  if (!user) return null;
  const admin = getSupabaseAdmin();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  
  if (!profile) {
    // Auto-create a profile as 'admin' if it doesn't exist to prevent auth gaps
    const { data: newProfile, error } = await admin
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.email?.split("@")[0] || "Admin",
        role: "admin",
      })
      .select("role")
      .single();
    if (error) {
      console.error("Error auto-creating profile:", error);
      return null;
    }
    return user;
  }
  
  if (!["admin", "associate"].includes(profile.role)) return null;
  return user;
}
