"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Trip } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";

interface Props {
  trips: Trip[];
}

const emptyForm = {
  name: "",
  destination: "",
  start_date: "",
  end_date: "",
  price_gst: "",
  total_seats: "",
  seats_available: "",
  status: "open" as "open" | "closed",
  description: "",
};

type TripForm = typeof emptyForm;

export default function TripsAdmin({ trips }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TripForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<TripForm>>({});
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

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
      name: trip.name,
      destination: trip.destination,
      start_date: trip.start_date,
      end_date: trip.end_date,
      price_gst: String(trip.price_gst),
      total_seats: String(trip.total_seats),
      seats_available: String(trip.seats_available),
      status: trip.status,
      description: trip.description,
    });
    setEditingId(trip.id);
    setShowForm(true);
    setErrors({});
  }

  function startNew() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setErrors({});
  }

  function cancel() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setSaveError("");
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    setSaveError("");

    const body = {
      name: form.name.trim(),
      destination: form.destination.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      price_gst: Number(form.price_gst),
      total_seats: Number(form.total_seats),
      seats_available: Number(form.seats_available || form.total_seats),
      status: form.status,
      description: form.description.trim(),
    };

    const url = editingId ? `/api/trips/${editingId}` : "/api/trips";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      cancel();
      router.refresh();
    } else {
      const errData = await res.json().catch(() => ({}));
      setSaveError(errData.error ?? "Something went wrong. Please try again.");
    }
    setSaving(false);
  }

  async function deleteTrip(id: string) {
    if (!confirm("Remove this trip? Existing leads will not be deleted.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setDeletingId(null);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-ink">Trips</h1>
          <p className="text-ink/50 font-poppins text-sm mt-0.5">
            Manage what travellers can enquire about.
          </p>
        </div>
        {!showForm && (
          <button onClick={startNew} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            New trip
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-ink">
              {editingId ? "Edit trip" : "New trip"}
            </h2>
            <button onClick={cancel} className="text-ink/40 hover:text-ink transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                Trip name
              </label>
              <input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className="input-base text-sm"
                placeholder="e.g. Spiti Valley Winter"
              />
              {errors.name && <p className="text-rust text-xs mt-1 font-poppins">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                Destination
              </label>
              <input
                value={form.destination}
                onChange={(e) => setField("destination", e.target.value)}
                className="input-base text-sm"
                placeholder="e.g. Spiti Valley, Himachal Pradesh"
              />
              {errors.destination && (
                <p className="text-rust text-xs mt-1 font-poppins">{errors.destination}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                Start date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setField("start_date", e.target.value)}
                className="input-base text-sm"
              />
              {errors.start_date && (
                <p className="text-rust text-xs mt-1 font-poppins">{errors.start_date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                End date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setField("end_date", e.target.value)}
                className="input-base text-sm"
              />
              {errors.end_date && (
                <p className="text-rust text-xs mt-1 font-poppins">{errors.end_date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                Price incl. GST (INR)
              </label>
              <input
                type="number"
                value={form.price_gst}
                onChange={(e) => setField("price_gst", e.target.value)}
                className="input-base text-sm"
                placeholder="e.g. 35000"
              />
              {errors.price_gst && (
                <p className="text-rust text-xs mt-1 font-poppins">{errors.price_gst}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                  Total seats
                </label>
                <input
                  type="number"
                  value={form.total_seats}
                  onChange={(e) => setField("total_seats", e.target.value)}
                  className="input-base text-sm"
                  placeholder="12"
                />
                {errors.total_seats && (
                  <p className="text-rust text-xs mt-1 font-poppins">{errors.total_seats}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                  Available
                </label>
                <input
                  type="number"
                  value={form.seats_available}
                  onChange={(e) => setField("seats_available", e.target.value)}
                  className="input-base text-sm"
                  placeholder="Same as total"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
                className="select-base text-sm"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-ink/60 uppercase tracking-wider mb-1.5 font-poppins">
                Short description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="input-base text-sm resize-none"
                rows={3}
                placeholder="One or two lines travellers will read on the enquiry page."
              />
              {errors.description && (
                <p className="text-rust text-xs mt-1 font-poppins">{errors.description}</p>
              )}
            </div>
          </div>

          {saveError && (
            <p className="text-rust text-sm font-poppins mt-4 bg-rust/5 border border-rust/20 px-4 py-2">
              {saveError}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {saving ? "Saving..." : editingId ? "Save changes" : "Create trip"}
            </button>
            <button onClick={cancel} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="border border-sand/50 px-8 py-16 text-center">
          <p className="font-display font-bold text-2xl text-ink mb-2">No trips yet.</p>
          <p className="text-ink/50 font-poppins text-sm">
            Create your first trip and it will appear on the public enquiry page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="border border-sand/40 px-5 py-4 flex items-center gap-4 bg-cream hover:border-sand transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-0.5">
                  <p className="font-medium text-ink font-poppins">{trip.name}</p>
                  <span
                    className={`text-xs font-poppins px-2 py-0.5 uppercase tracking-wide ${
                      trip.status === "open"
                        ? "bg-yellow text-ink"
                        : "bg-sand/40 text-ink/50"
                    }`}
                  >
                    {trip.status}
                  </span>
                </div>
                <p className="text-sm text-ink/50 font-poppins truncate">
                  {trip.destination} &middot; {formatDate(trip.start_date)} to{" "}
                  {formatDate(trip.end_date)} &middot; {formatCurrency(trip.price_gst)} &middot;{" "}
                  {trip.seats_available}/{trip.total_seats} seats open
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(trip)}
                  className="btn-ghost text-sm flex items-center gap-1.5 py-2"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => deleteTrip(trip.id)}
                  disabled={deletingId === trip.id}
                  className="text-sm text-ink/30 hover:text-rust transition-colors flex items-center gap-1.5 px-3 py-2 disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
