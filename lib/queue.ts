/**
 * Queue Service Abstraction
 * 
 * In production, if 1 million users submit a lead simultaneously, 
 * writing directly to Postgres will exhaust the connection pool and crash the database.
 * 
 * This service routes high-volume traffic to a Redis Message Queue (Upstash) 
 * so the Next.js API can return a 200 OK instantly. 
 * A background worker then processes the queue at a safe, throttled rate.
 * 
 * If Upstash is not configured (e.g. local dev), it gracefully falls back 
 * to direct database insertion.
 */

import { getSupabaseAdmin } from "./supabase-server";

// We define the shape of the payload
export interface LeadPayload {
  name: string;
  phone: string;
  email: string;
  trip_id: string;
  group_type: string;
  preferred_month: string;
  vibe_text: string;
  status: string;
}

export const QueueService = {
  async enqueueLead(payload: LeadPayload) {
    const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
    const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (upstashUrl && upstashToken) {
      // PROD MODE: Push to Redis Queue
      console.log("[QueueService] Pushing lead to Redis Queue (Decoupled)");
      
      const response = await fetch(`${upstashUrl}/lpush/leads_queue`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error("Failed to enqueue lead in Redis", await response.text());
        throw new Error("Queue Service Unavailable");
      }
      return { status: "queued", provider: "redis" };
    } else {
      // DEV MODE FALLBACK: Write directly to DB so local testing still works
      console.warn("[QueueService] UPSTASH variables missing. Falling back to direct database insertion. (NOT SAFE FOR 1M USERS)");
      
      const admin = getSupabaseAdmin();
      const { data, error } = await admin
        .from("leads")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Database insert failed:", error);
        throw new Error("Database Write Failed");
      }
      return { status: "inserted", provider: "postgres", data };
    }
  }
};
