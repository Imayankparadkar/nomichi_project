import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import type { Lead } from "@/lib/types";
import { LEAD_STATUSES, STATUS_LABELS } from "@/lib/types";
import { formatDate, getStatusBadgeClass } from "@/lib/utils";
import { Search, X } from "lucide-react";

export default function LeadsPage() {
  const [location, setLocation] = useLocation();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [trips, setTrips] = useState<Array<{ id: string; name: string }>>([]);
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string | null; email: string }>>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = new URLSearchParams(window.location.search);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "");
  const [tripFilter, setTripFilter] = useState(searchParams.get("trip") ?? "");
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get("owner") ?? "");

  useEffect(() => {
    supabase.from("trips").select("id, name").order("name").then(({ data }) => setTrips(data ?? []));
    supabase.from("profiles").select("id, full_name, email").order("full_name").then(({ data }) => setProfiles(data ?? []));
  }, []);

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
  }, [statusFilter, tripFilter, ownerFilter, search]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set(key, value);
    else params.delete(key);
    window.history.pushState({}, "", `?${params.toString()}`);
    if (key === "status") setStatusFilter(value);
    if (key === "trip") setTripFilter(value);
    if (key === "owner") setOwnerFilter(value);
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
    window.history.pushState({}, "", window.location.pathname);
  }

  const hasFilters = statusFilter || tripFilter || ownerFilter || search;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Leads</h1>
          <p className="text-ink/50 font-poppins text-sm mt-0.5">
            {leads.length} {leads.length === 1 ? "lead" : "leads"} found
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 pr-4 w-60"
              placeholder="Name, email or phone"
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
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <select
          value={tripFilter}
          onChange={(e) => updateFilter("trip", e.target.value)}
          className="select-base w-48"
        >
          <option value="">All trips</option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={ownerFilter}
          onChange={(e) => updateFilter("owner", e.target.value)}
          className="select-base w-44"
        >
          <option value="">All owners</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name ?? p.email}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-sm text-ink/50 font-poppins hover:text-ink transition-colors px-2"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="border border-sand/50 px-8 py-16 text-center">
          <p className="text-ink/40 font-poppins text-sm">Loading…</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="border border-sand/50 px-8 py-16 text-center">
          <p className="font-display font-bold text-2xl text-ink mb-2">No leads found.</p>
          <p className="text-ink/50 font-poppins text-sm">
            {hasFilters ? "Try adjusting your filters." : "Leads will appear here when travellers enquire."}
          </p>
        </div>
      ) : (
        <div className="border border-sand/30 divide-y divide-sand/20">
          <div className="grid grid-cols-12 px-5 py-2 bg-sand/10">
            <span className="col-span-3 text-xs font-medium text-ink/50 uppercase tracking-wider font-poppins">Name</span>
            <span className="col-span-3 text-xs font-medium text-ink/50 uppercase tracking-wider font-poppins">Trip</span>
            <span className="col-span-2 text-xs font-medium text-ink/50 uppercase tracking-wider font-poppins">Status</span>
            <span className="col-span-2 text-xs font-medium text-ink/50 uppercase tracking-wider font-poppins">Owner</span>
            <span className="col-span-2 text-xs font-medium text-ink/50 uppercase tracking-wider font-poppins">Date</span>
          </div>

          {leads.map((lead: any) => (
            <Link
              key={lead.id}
              href={`/admin/leads/${lead.id}`}
              className="grid grid-cols-12 px-5 py-3.5 hover:bg-sand/10 transition-colors group"
            >
              <div className="col-span-3">
                <p className="font-medium text-ink text-sm font-poppins group-hover:text-rust transition-colors">
                  {lead.name}
                </p>
                <p className="text-xs text-ink/40 font-poppins">{lead.phone}</p>
              </div>
              <div className="col-span-3">
                <p className="text-sm text-ink/70 font-poppins">{lead.trips?.name ?? "-"}</p>
                <p className="text-xs text-ink/40 font-poppins">{lead.trips?.destination}</p>
              </div>
              <div className="col-span-2 flex items-center">
                <span className={getStatusBadgeClass(lead.status)}>
                  {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-ink/60 font-poppins">
                  {lead.owner?.full_name ?? lead.owner?.email ?? (
                    <span className="text-ink/30 italic">Unassigned</span>
                  )}
                </p>
              </div>
              <div className="col-span-2 flex items-center">
                <p className="text-sm text-ink/40 font-poppins">{formatDate(lead.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
