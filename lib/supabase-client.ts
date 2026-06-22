import { createClient } from "@supabase/supabase-js";

// Browser client — uses public anon key only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Stores the session only for the life of the browser tab.
    // When the admin closes the tab, they are automatically logged out.
    storage: typeof window !== "undefined" ? window.sessionStorage : undefined,
  },
});
