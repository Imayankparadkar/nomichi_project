"use client";

import { useState } from "react";
import type { Trip } from "@/lib/types";
import { GROUP_TYPES, MONTHS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

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
    name: "",
    phone: "",
    email: "",
    group_type: "",
    preferred_month: "",
    vibe_text: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.name.trim() || form.name.trim().length < 2)
      errs.name = "Enter your name";
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s+/g, "")))
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Enter a valid email address";
    if (!form.group_type) errs.group_type = "Select how you are travelling";
    if (!form.preferred_month) errs.preferred_month = "Select a preferred month";
    if (!form.vibe_text.trim() || form.vibe_text.trim().length < 10)
      errs.vibe_text = "Tell us a little more";
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
    <div className="max-w-xl">
      <div className="mb-8 border-l-4 border-rust pl-5">
        <p className="text-xs uppercase tracking-wider text-rust font-poppins font-medium mb-1">
          Enquiring about
        </p>
        <h2 className="font-display font-bold text-2xl text-ink">{trip.name}</h2>
        <p className="text-sm text-ink/60 font-poppins mt-1">
          {trip.destination} &middot; {formatDate(trip.start_date)} to {formatDate(trip.end_date)} &middot;{" "}
          {formatCurrency(trip.price_gst)} incl. GST
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
            Your name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="input-base"
            placeholder="As on your ID"
            autoComplete="name"
          />
          {errors.name && <p className="text-rust text-xs mt-1 font-poppins">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
              Phone
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="input-base"
              placeholder="10-digit mobile number"
              autoComplete="tel"
              maxLength={10}
            />
            {errors.phone && (
              <p className="text-rust text-xs mt-1 font-poppins">{errors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="input-base"
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="text-rust text-xs mt-1 font-poppins">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
              Travelling as
            </label>
            <select
              value={form.group_type}
              onChange={(e) => set("group_type", e.target.value)}
              className="select-base"
            >
              <option value="">Select</option>
              {GROUP_TYPES.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {errors.group_type && (
              <p className="text-rust text-xs mt-1 font-poppins">{errors.group_type}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
              Preferred month
            </label>
            <select
              value={form.preferred_month}
              onChange={(e) => set("preferred_month", e.target.value)}
              className="select-base"
            >
              <option value="">Select</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {errors.preferred_month && (
              <p className="text-rust text-xs mt-1 font-poppins">{errors.preferred_month}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
            What are you hoping this trip feels like?
          </label>
          <textarea
            value={form.vibe_text}
            onChange={(e) => set("vibe_text", e.target.value)}
            className="input-base min-h-28 resize-none"
            placeholder="Tell us in your own words. There are no wrong answers here."
            rows={4}
          />
          {errors.vibe_text && (
            <p className="text-rust text-xs mt-1 font-poppins">{errors.vibe_text}</p>
          )}
        </div>

        {errors.general && (
          <div className="border-l-4 border-rust bg-rust/5 px-4 py-3">
            <p className="text-rust text-sm font-poppins">{errors.general}</p>
          </div>
        )}

        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending..." : "Send my enquiry"}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Back
          </button>
        </div>

        <p className="text-xs text-ink/40 font-poppins text-center pt-1">
          We will be in touch within 24 hours.
        </p>
      </form>
    </div>
  );
}
