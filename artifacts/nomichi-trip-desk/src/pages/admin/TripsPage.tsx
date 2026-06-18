import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Trip } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { apiPatch, apiDelete } from "@/lib/api";

const emptyForm = {
  name: "", destination: "", start_date: "", end_date: "",
  price_gst: "", total_seats: "", seats_available: "",
  status: "open" as "open" | "closed", description: "",
};

type TripForm = typeof emptyForm;

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<TripForm>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("trips").select("*").order("created_at", { ascending: false });
    setTrips((data as Trip[]) ?? []);
    setLoading(false);
  }

  function setField(field: keyof TripForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<TripForm> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.destination.trim()) errs.destination = "Required";
    if (!form.start_date) errs.start_date = "Required";
    if (!form.end_date) errs.end_date = "Required";
    if (!form.price_gst || isNaN(Number(form.price_gst))) errs.price_gst = "Enter a number";
    if (!form.total_seats || isNaN(Number(form.total_seats))) errs.total_seats = "Enter a number";
    if (!form.description.trim() || form.description.length < 10) errs.description = "Add a description (10+ chars)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function startEdit(trip: Trip) {
    setForm({
      name: trip.name, destination: trip.destination,
      start_date: trip.start_date, end_date: trip.end_date,
      price_gst: String(trip.price_gst), total_seats: String(trip.total_seats),
      seats_available: String(trip.seats_available), status: trip.status,
      description: trip.description,
    });
    setEditingId(trip.id);
    setShowForm(true);
    setErrors({});
  }

  function startNew() {
    setForm(emptyForm); setEditingId(null); setShowForm(true); setErrors({});
  }

  function cancel() {
    setShowForm(false); setEditingId(null); setForm(emptyForm); setErrors({}); setSaveError("");
  }

  async function save() {
    if (!validate()) return;
    setSaving(true); setSaveError("");
    const body = {
      name: form.name.trim(), destination: form.destination.trim(),
      start_date: form.start_date, end_date: form.end_date,
      price_gst: Number(form.price_gst), total_seats: Number(form.total_seats),
      seats_available: Number(form.seats_available || form.total_seats),
      status: form.status, description: form.description.trim(),
    };
    if (editingId) {
      const res = await apiPatch(`/api/trips/${editingId}`, body);
      if (!res.ok) { setSaveError("Could not save changes. Try again."); setSaving(false); return; }
      const updated = await res.json();
      setTrips(trips.map((t) => (t.id === editingId ? updated : t)));
    } else {
      const { data, error } = await supabase.from("trips").insert(body).select().single();
      if (error) { setSaveError("Could not create trip. Try again."); setSaving(false); return; }
      setTrips([data as Trip, ...trips]);
    }
    cancel(); setSaving(false);
  }

  async function deleteTrip(id: string) {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await apiDelete(`/api/trips/${id}`);
    if (res.ok) setTrips(trips.filter((t) => t.id !== id));
    setDeletingId(null);
  }

  const labelClass = "block text-xs font-medium text-cream/45 uppercase tracking-wider mb-1.5 font-poppins";
  const errClass = "text-rust text-xs mt-1 font-poppins";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-7 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-cream">Trips</h1>
          <p className="text-cream/40 font-poppins text-sm mt-0.5">{trips.length} trips</p>
        </div>
        {!showForm && (
          <button onClick={startNew} className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
            <Plus className="w-4 h-4" /> New trip
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-7 animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-bold text-cream">
              {editingId ? "Edit trip" : "New trip"}
            </h2>
            <button onClick={cancel} className="text-cream/35 hover:text-cream transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Name</label>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} className="input-base" placeholder="Eg. Meghalaya Monsoon" />
              {errors.name && <p className={errClass}>{errors.name}</p>}
            </div>
            <div>
              <label className={labelClass}>Destination</label>
              <input value={form.destination} onChange={(e) => setField("destination", e.target.value)} className="input-base" placeholder="Eg. Shillong, Meghalaya" />
              {errors.destination && <p className={errClass}>{errors.destination}</p>}
            </div>
            <div>
              <label className={labelClass}>Start date</label>
              <input type="date" value={form.start_date} onChange={(e) => setField("start_date", e.target.value)} className="input-base" />
              {errors.start_date && <p className={errClass}>{errors.start_date}</p>}
            </div>
            <div>
              <label className={labelClass}>End date</label>
              <input type="date" value={form.end_date} onChange={(e) => setField("end_date", e.target.value)} className="input-base" />
              {errors.end_date && <p className={errClass}>{errors.end_date}</p>}
            </div>
            <div>
              <label className={labelClass}>Price (incl. GST)</label>
              <input type="number" value={form.price_gst} onChange={(e) => setField("price_gst", e.target.value)} className="input-base" placeholder="25000" />
              {errors.price_gst && <p className={errClass}>{errors.price_gst}</p>}
            </div>
            <div>
              <label className={labelClass}>Total seats</label>
              <input type="number" value={form.total_seats} onChange={(e) => setField("total_seats", e.target.value)} className="input-base" placeholder="12" />
              {errors.total_seats && <p className={errClass}>{errors.total_seats}</p>}
            </div>
            {editingId && (
              <div>
                <label className={labelClass}>Seats available</label>
                <input type="number" value={form.seats_available} onChange={(e) => setField("seats_available", e.target.value)} className="input-base" />
              </div>
            )}
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => setField("status", e.target.value)} className="select-base">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              className="input-base min-h-24 resize-none"
              rows={3}
              placeholder="What makes this trip special? Be specific."
            />
            {errors.description && <p className={errClass}>{errors.description}</p>}
          </div>

          {saveError && <p className="text-rust text-sm font-poppins mt-4">{saveError}</p>}

          <div className="flex gap-3 mt-6">
            <button onClick={save} disabled={saving} className="btn-primary text-sm py-2.5 px-6 disabled:opacity-50">
              {saving ? "Saving…" : editingId ? "Save changes" : "Create trip"}
            </button>
            <button onClick={cancel} className="btn-secondary text-sm py-2.5 px-5">Cancel</button>
          </div>
        </div>
      )}

      {/* Trip list */}
      {loading ? (
        <div className="px-8 py-16 text-center border" style={{ borderColor: "rgba(255,251,245,0.08)", background: "rgba(255,251,245,0.02)" }}>
          <span className="w-5 h-5 border-2 rounded-full inline-block" style={{ borderColor: "rgba(255,251,245,0.15)", borderTopColor: "#D55D27", animation: "spin 0.7s linear infinite" }} />
        </div>
      ) : trips.length === 0 ? (
        <div className="px-8 py-16 text-center border" style={{ borderColor: "rgba(255,251,245,0.08)", background: "rgba(255,251,245,0.02)" }}>
          <p className="font-display font-bold text-2xl text-cream mb-2">No trips yet.</p>
          <p className="text-cream/40 font-poppins text-sm">Create your first trip above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="card flex items-start gap-4 transition-all duration-200"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,251,245,0.13)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,251,245,0.08)"; }}
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <h3 className="font-display font-bold text-lg text-cream">{trip.name}</h3>
                    <p className="text-sm text-cream/50 font-poppins">{trip.destination}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display font-bold text-xl text-rust">{formatCurrency(trip.price_gst)}</p>
                    <span className={`text-xs font-poppins font-medium uppercase tracking-wider ${trip.status === "open" ? "text-olive" : "text-cream/30"}`}>
                      {trip.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-cream/35 font-poppins mb-2">
                  {formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {trip.seats_available}/{trip.total_seats} seats open
                </p>
                <p className="text-sm text-cream/55 font-poppins leading-relaxed">{trip.description}</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => startEdit(trip)} className="btn-ghost p-2 text-cream/40 hover:text-cream">
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteTrip(trip.id)}
                  disabled={deletingId === trip.id}
                  className="btn-ghost p-2 text-rust/40 hover:text-rust disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
