import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { LeadStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statusColors: Record<LeadStatus, string> = {
  NEW: "bg-yellow",
  CONTACTED: "bg-sand",
  QUALIFIED: "bg-olive",
  VIBE_CHECK_SENT: "bg-rust",
  CONFIRMED: "bg-ink",
  NOT_A_FIT: "bg-sand/40",
};

const statuses: LeadStatus[] = [
  "NEW", "CONTACTED", "QUALIFIED", "VIBE_CHECK_SENT", "CONFIRMED", "NOT_A_FIT",
];

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: leadsData }, { data: tripsData }] = await Promise.all([
        supabase.from("leads").select("id, status, trip_id, created_at, name, trips(name)"),
        supabase.from("trips").select("id, name, status"),
      ]);
      setLeads(leadsData ?? []);
      setTrips(tripsData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const totalLeads = leads.length;

  const byStatus: Record<string, number> = {};
  leads.forEach((l) => {
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
  });

  const byTrip: Record<string, { name: string; count: number }> = {};
  leads.forEach((l: any) => {
    if (!l.trip_id) return;
    const tripName = l.trips?.name ?? "Unknown";
    if (!byTrip[l.trip_id]) byTrip[l.trip_id] = { name: tripName, count: 0 };
    byTrip[l.trip_id].count += 1;
  });

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-ink/40 font-poppins text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-ink">Good morning.</h1>
        <p className="text-ink/60 font-poppins mt-1 text-sm">Here is where things stand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-poppins mb-2">Total Leads</p>
          <p className="text-5xl font-display font-bold text-ink">{totalLeads}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-poppins mb-2">Confirmed</p>
          <p className="text-5xl font-display font-bold text-olive">{byStatus["CONFIRMED"] ?? 0}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-poppins mb-2">Open Trips</p>
          <p className="text-5xl font-display font-bold text-rust">
            {trips.filter((t) => t.status === "open").length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-display font-bold text-ink mb-4">Pipeline</h2>
          <div className="space-y-3">
            {statuses.map((status) => {
              const count = byStatus[status] ?? 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-poppins text-ink/70">{STATUS_LABELS[status]}</span>
                    <span className="text-sm font-medium font-poppins text-ink">{count}</span>
                  </div>
                  <div className="h-1.5 bg-sand/30 w-full">
                    <div
                      className={`h-full ${statusColors[status]} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-display font-bold text-ink mb-4">Leads by trip</h2>
          <div className="space-y-3">
            {Object.values(byTrip).length === 0 ? (
              <p className="text-sm text-ink/40 font-poppins">No leads yet.</p>
            ) : (
              Object.values(byTrip)
                .sort((a, b) => b.count - a.count)
                .map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="text-sm font-poppins text-ink/70 truncate">{item.name}</span>
                    <span className="text-sm font-medium font-poppins text-ink ml-4">{item.count}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-display font-bold text-ink mb-4">Recent enquiries</h2>
        {recentLeads.length === 0 ? (
          <p className="text-sm text-ink/40 font-poppins">No leads yet. They will show up here.</p>
        ) : (
          <div className="divide-y divide-sand/30">
            {recentLeads.map((lead: any) => (
              <div key={lead.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-ink font-poppins text-sm">{lead.name}</p>
                  <p className="text-xs text-ink/50 font-poppins">{lead.trips?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`badge-${lead.status.toLowerCase().replace(/_/g, "-")} text-xs`}>
                    {STATUS_LABELS[lead.status as LeadStatus]}
                  </span>
                  <p className="text-xs text-ink/40 font-poppins mt-1">
                    {formatDate(lead.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
