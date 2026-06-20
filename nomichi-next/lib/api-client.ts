import { supabase } from "@/lib/supabase-client";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export async function apiGet(path: string): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(path, { headers });
}

export async function apiPost(path: string, body: unknown): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(path, { method: "POST", headers, body: JSON.stringify(body) });
}

export async function apiPatch(path: string, body: unknown): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(path, { method: "PATCH", headers, body: JSON.stringify(body) });
}

export async function apiDelete(path: string): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(path, { method: "DELETE", headers });
}
