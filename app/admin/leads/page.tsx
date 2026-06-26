"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import type { Lead } from "@/lib/types";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/types";
import { formatDate, getStatusBadgeClass } from "@/lib/utils";
import { Search, X } from "lucide-react";

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const searchVal = searchParams.get("q") ?? "";
  const statusFilterVal = searchParams.get("status") ?? "";
  const tripFilterVal = searchParams.get("trip") ?? "";
  const ownerFilterVal = searchParams.get("owner") ?? "";

  const [search, setSearch] = useState(searchVal);
  const [statusFilter, setStatusFilter] = useState(statusFilterVal);
  const [tripFilter, setTripFilter] = useState(tripFilterVal);
  const [ownerFilter, setOwnerFilter] = useState(ownerFilterVal);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [trips, setTrips] = useState<Array<{ id: string; name: string }>>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("trips").select("id, name").order("name").then(({ data }) => setTrips(data ?? []));
    supabase.from("profiles").select("id, full_name, email").order("full_name").then(({ data }) => setProfiles(data ?? []));
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    setStatusFilter(searchParams.get("status") ?? "");
    setTripFilter(searchParams.get("trip") ?? "");
    setOwnerFilter(searchParams.get("owner") ?? "");
  }, [searchParams]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      let query = supabase
        .from("leads")
        .select("*, trips(id, name, destination), owner:profiles!leads_owner_id_fkey(id, full_name, email)")
        .order("created_at", { ascending: false });

      if (statusFilter) query = query.eq("status", statusFilter);
      if (tripFilter) query = query.eq("trip_id", tripFilter);
      if (ownerFilter) query = query.eq("owner_id", ownerFilter);
      if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);

      const { data } = await query;
      setLeads((data as Lead[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("admin-leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statusFilter, tripFilter, ownerFilter, search]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateFilter("q", search);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setTripFilter("");
    setOwnerFilter("");
    router.push(pathname);
  }

  const hasFilters = statusFilter || tripFilter || ownerFilter || search;

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-cream">Leads</h1>
          <p className="text-cream/40 font-poppins text-sm mt-0.5">
            {leads.length} {leads.length === 1 ? "lead" : "leads"} found
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/35 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 pr-4 w-60"
              placeholder="      Name, email or phone"
            />
          </div>
          <button type="submit" className="btn-primary ml-2 text-sm py-2.5 px-4">
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="select-base w-44"
        >
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={tripFilter}
          onChange={(e) => updateFilter("trip", e.target.value)}
          className="select-base w-48"
        >
          <option value="">All trips</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => updateFilter("owner", e.target.value)}
          className="select-base w-44"
        >
          <option value="">All owners</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-cream/40 font-poppins hover:text-cream transition-colors px-2"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="border animate-pulse" style={{ borderColor: "rgba(255,251,245,0.08)" }}>
          <div className="grid grid-cols-12 px-5 py-2.5" style={{ background: "rgba(255,251,245,0.04)", borderBottom: "1px solid rgba(255,251,245,0.07)" }}>
            <span className="col-span-3 text-xs font-medium text-cream/20 uppercase tracking-wider font-poppins">Name</span>
            <span className="col-span-3 text-xs font-medium text-cream/20 uppercase tracking-wider font-poppins">Trip</span>
            <span className="col-span-2 text-xs font-medium text-cream/20 uppercase tracking-wider font-poppins">Status</span>
            <span className="col-span-2 text-xs font-medium text-cream/20 uppercase tracking-wider font-poppins">Owner</span>
            <span className="col-span-2 text-xs font-medium text-cream/20 uppercase tracking-wider font-poppins">Date</span>
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid grid-cols-12 px-5 py-3.5" style={{ borderTop: i > 1 ? "1px solid rgba(255,251,245,0.05)" : "none" }}>
              <div className="col-span-3">
                <div className="h-4 w-32 bg-cream/10 rounded mb-1.5"></div>
                <div className="h-3 w-24 bg-cream/5 rounded"></div>
              </div>
              <div className="col-span-3">
                <div className="h-4 w-28 bg-cream/10 rounded mb-1.5"></div>
                <div className="h-3 w-36 bg-cream/5 rounded"></div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="h-6 w-20 bg-cream/10 rounded-full"></div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="h-4 w-24 bg-cream/10 rounded"></div>
              </div>
              <div className="col-span-2 flex items-center">
                <div className="h-4 w-20 bg-cream/5 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : leads.length === 0 ? (
        <div
          className="px-8 py-16 text-center border"
          style={{ borderColor: "rgba(255,251,245,0.08)", background: "rgba(255,251,245,0.02)" }}
        >
          <p className="font-display font-bold text-2xl text-cream mb-2">No leads found.</p>
          <p className="text-cream/40 font-poppins text-sm">
            {hasFilters ? "Try adjusting your filters." : "Leads will appear here when travellers enquire."}
          </p>
        </div>
      ) : (
        <div className="border" style={{ borderColor: "rgba(255,251,245,0.08)" }}>
          {/* Table header */}
          <div
            className="grid grid-cols-12 px-5 py-2.5"
            style={{ background: "rgba(255,251,245,0.04)", borderBottom: "1px solid rgba(255,251,245,0.07)" }}
          >
            <span className="col-span-3 text-xs font-medium text-cream/40 uppercase tracking-wider font-poppins">Name</span>
            <span className="col-span-3 text-xs font-medium text-cream/40 uppercase tracking-wider font-poppins">Trip</span>
            <span className="col-span-2 text-xs font-medium text-cream/40 uppercase tracking-wider font-poppins">Status</span>
            <span className="col-span-2 text-xs font-medium text-cream/40 uppercase tracking-wider font-poppins">Owner</span>
            <span className="col-span-2 text-xs font-medium text-cream/40 uppercase tracking-wider font-poppins">Date</span>
          </div>

          {leads.map((lead: any, i) => (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="grid grid-cols-12 px-5 py-3.5 group transition-colors"
              style={{
                borderTop: i > 0 ? "1px solid rgba(255,251,245,0.05)" : "none",
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,251,245,0.03)")
              }
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) =>
                ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")
              }
            >
              <div className="col-span-3">
                <p className="font-medium text-cream text-sm font-poppins group-hover:text-rust transition-colors">
                  {lead.name}
                </p>
                <p className="text-xs text-cream/30 font-poppins mt-0.5">{lead.phone}</p>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-cream/65 font-poppins">{lead.trips?.name ?? "—"}</p>
                <p className="text-xs text-cream/30 font-poppins mt-0.5">{lead.trips?.destination}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={getStatusBadgeClass(lead.status)}>
                  {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-cream/50 font-poppins">
                  {lead.owner?.full_name ?? lead.owner?.email ?? (
                    <span className="text-cream/25 italic">Unassigned</span>
                  )}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-cream/35 font-poppins">{formatDate(lead.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
