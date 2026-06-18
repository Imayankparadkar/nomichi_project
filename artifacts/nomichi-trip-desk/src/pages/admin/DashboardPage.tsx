import { useState, useEffect, useRef } from "react";
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

function useCountUp(target: number, delay = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const timeout = setTimeout(() => {
      const duration = 900;
      const startTime = performance.now();
      function step(now: number) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay);
    return () => clearTimeout(timeout);
  }, [target, delay]);
  return value;
}

function StatCard({
  label,
  value,
  color = "text-ink",
  delay = 0,
}: {
  label: string;
  value: number;
  color?: string;
  delay?: number;
}) {
  const displayed = useCountUp(value, delay);
  return (
    <div
      className="card group hover:border-rust/40 hover:shadow-[0_4px_24px_rgba(213,93,39,0.07)] transition-all duration-300 hover:-translate-y-0.5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs uppercase tracking-widest text-ink/45 font-poppins mb-3">{label}</p>
      <p
        className={`text-5xl font-display font-bold ${color} count-up-num`}
        style={{ animationDelay: `${delay + 80}ms` }}
      >
        {displayed}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [barsVisible, setBarsVisible] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const [{ data: leadsData }, { data: tripsData }] = await Promise.all([
        supabase.from("leads").select("id, status, trip_id, created_at, name, trips(name)"),
        supabase.from("trips").select("id, name, status"),
      ]);
      setLeads(leadsData ?? []);
      setTrips(tripsData ?? []);
      setLoading(false);
      setTimeout(() => setBarsVisible(true), 200);
    }
    load();
  }, []);

  const totalLeads = leads.length;
  const byStatus: Record<string, number> = {};
  leads.forEach((l) => { byStatus[l.status] = (byStatus[l.status] ?? 0) + 1; });

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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning." : hour < 17 ? "Good afternoon." : "Good evening.";

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <span
            className="w-6 h-6 border-2 border-sand border-t-rust rounded-full inline-block"
            style={{ animation: "spin 0.7s linear infinite" }}
          />
          <p className="text-ink/35 font-poppins text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-9 animate-fade-up">
        <h1 className="text-3xl font-display font-bold text-ink">{greeting}</h1>
        <p className="text-ink/50 font-poppins mt-1 text-sm">Here is where things stand.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Leads" value={totalLeads} color="text-ink" delay={60} />
        <StatCard label="Confirmed" value={byStatus["CONFIRMED"] ?? 0} color="text-olive" delay={130} />
        <StatCard label="Open Trips" value={trips.filter((t) => t.status === "open").length} color="text-rust" delay={200} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card animate-fade-up" style={{ animationDelay: "260ms" }}>
          <h2 className="text-lg font-display font-bold text-ink mb-5">Pipeline</h2>
          <div className="space-y-4" ref={barsRef}>
            {statuses.map((status, i) => {
              const count = byStatus[status] ?? 0;
              const pct = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-poppins text-ink/65">{STATUS_LABELS[status]}</span>
                    <span className="text-sm font-medium font-poppins text-ink tabular-nums">{count}</span>
                  </div>
                  <div className="h-1 bg-sand/25 w-full overflow-hidden">
                    <div
                      className={`h-full ${statusColors[status]} transition-all duration-700 ease-out`}
                      style={{
                        width: barsVisible ? `${pct}%` : "0%",
                        transitionDelay: `${i * 80}ms`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card animate-fade-up" style={{ animationDelay: "310ms" }}>
          <h2 className="text-lg font-display font-bold text-ink mb-5">Leads by trip</h2>
          <div className="space-y-3">
            {Object.values(byTrip).length === 0 ? (
              <p className="text-sm text-ink/35 font-poppins">No leads yet.</p>
            ) : (
              Object.values(byTrip)
                .sort((a, b) => b.count - a.count)
                .map((item, i) => (
                  <div
                    key={item.name}
                    className="flex justify-between items-center py-1.5 border-b border-sand/20 last:border-0 animate-fade-up"
                    style={{ animationDelay: `${350 + i * 50}ms` }}
                  >
                    <span className="text-sm font-poppins text-ink/65 truncate">{item.name}</span>
                    <span className="text-sm font-medium font-poppins text-ink ml-4 tabular-nums">{item.count}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <div className="card animate-fade-up" style={{ animationDelay: "370ms" }}>
        <h2 className="text-lg font-display font-bold text-ink mb-5">Recent enquiries</h2>
        {recentLeads.length === 0 ? (
          <p className="text-sm text-ink/35 font-poppins">No leads yet. They will show up here.</p>
        ) : (
          <div className="divide-y divide-sand/25">
            {recentLeads.map((lead: any, i) => (
              <div
                key={lead.id}
                className="py-3.5 flex justify-between items-center hover:bg-sand/8 transition-colors -mx-6 px-6 animate-fade-up"
                style={{ animationDelay: `${400 + i * 55}ms` }}
              >
                <div>
                  <p className="font-medium text-ink font-poppins text-sm">{lead.name}</p>
                  <p className="text-xs text-ink/40 font-poppins mt-0.5">{lead.trips?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`badge-${lead.status.toLowerCase().replace(/_/g, "-")} text-xs`}>
                    {STATUS_LABELS[lead.status as LeadStatus]}
                  </span>
                  <p className="text-xs text-ink/35 font-poppins mt-1">
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
