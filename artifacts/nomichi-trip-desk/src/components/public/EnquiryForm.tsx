import { useState } from "react";
import type { Trip } from "@/lib/types";
import { GROUP_TYPES, MONTHS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Calendar } from "lucide-react";

interface Props {
  trip: Trip;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  phone: string;
  email: string;
  group_type: string;
  preferred_month: string;
  vibe_text: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  email?: string;
  group_type?: string;
  preferred_month?: string;
  vibe_text?: string;
  general?: string;
}

export default function EnquiryForm({ trip, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<FormData>({
    name: "", phone: "", email: "",
    group_type: "", preferred_month: "", vibe_text: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = "Enter your name";
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, ""))) errs.phone = "Valid 10-digit Indian mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.group_type) errs.group_type = "Select how you are travelling";
    if (!form.preferred_month) errs.preferred_month = "Select a preferred month";
    if (!form.vibe_text.trim() || form.vibe_text.trim().length < 10) errs.vibe_text = "Tell us a little more";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, trip_id: trip.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ general: data.error ?? "Something went wrong. Try again." });
        return;
      }
      onSuccess();
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl animate-fade-up">
      {/* Trip context banner */}
      <div
        className="mb-8 p-5 border-l-4 border-rust flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: "rgba(213,93,39,0.08)" }}
      >
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-rust font-poppins font-medium mb-1">
            Enquiring about
          </p>
          <h2 className="font-display font-bold text-2xl text-cream">{trip.name}</h2>
          <div className="flex flex-wrap gap-4 mt-2 text-xs text-cream/45 font-poppins">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-rust" /> {trip.destination}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-display font-bold text-2xl text-rust">{formatCurrency(trip.price_gst)}</p>
          <p className="text-xs text-cream/30 font-poppins">incl. GST</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
            Your name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="dark-input"
            placeholder="As on your ID"
            autoComplete="name"
          />
          {errors.name && <p className="text-rust text-xs mt-1.5 font-poppins">{errors.name}</p>}
        </div>

        {/* Phone + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="dark-input"
              placeholder="10-digit mobile number"
              autoComplete="tel"
              maxLength={10}
            />
            {errors.phone && <p className="text-rust text-xs mt-1.5 font-poppins">{errors.phone}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="dark-input"
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-rust text-xs mt-1.5 font-poppins">{errors.email}</p>}
          </div>
        </div>

        {/* Group + Month */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
              Travelling as
            </label>
            <div className="relative">
              <select
                value={form.group_type}
                onChange={(e) => set("group_type", e.target.value)}
                className="dark-select w-full"
              >
                <option value="">Select</option>
                {GROUP_TYPES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            {errors.group_type && <p className="text-rust text-xs mt-1.5 font-poppins">{errors.group_type}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
              Preferred month
            </label>
            <div className="relative">
              <select
                value={form.preferred_month}
                onChange={(e) => set("preferred_month", e.target.value)}
                className="dark-select w-full"
              >
                <option value="">Select</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            {errors.preferred_month && <p className="text-rust text-xs mt-1.5 font-poppins">{errors.preferred_month}</p>}
          </div>
        </div>

        {/* Vibe text */}
        <div>
          <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
            What are you hoping this trip feels like?
          </label>
          <textarea
            value={form.vibe_text}
            onChange={(e) => set("vibe_text", e.target.value)}
            className="dark-input min-h-28 resize-none"
            placeholder="Tell us in your own words. There are no wrong answers."
            rows={4}
          />
          {errors.vibe_text && <p className="text-rust text-xs mt-1.5 font-poppins">{errors.vibe_text}</p>}
        </div>

        {errors.general && (
          <div className="border-l-4 border-rust px-4 py-3" style={{ background: "rgba(213,93,39,0.07)" }}>
            <p className="text-rust text-sm font-poppins">{errors.general}</p>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary btn-shimmer flex-1 text-center disabled:opacity-50 disabled:cursor-not-allowed py-3.5"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="inline-block w-3.5 h-3.5 border-2 border-cream/25 border-t-cream rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
                Sending…
              </span>
            ) : "Send my enquiry"}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary px-6">
            Back
          </button>
        </div>

        <p className="text-xs text-cream/25 font-poppins text-center">
          We will be in touch within 24 hours via WhatsApp.
        </p>
      </form>
    </div>
  );
}
