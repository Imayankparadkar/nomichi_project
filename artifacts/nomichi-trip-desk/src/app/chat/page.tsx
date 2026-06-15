"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import ChatBox from "@/components/ChatBox";

interface Enquiry {
  id: string;
  status: string;
  preferred_month: string;
  created_at: string;
  trip: {
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
  } | null;
}

const STATUS_LABEL: Record<string, { text: string; dot: string }> = {
  NEW:              { text: "Under review",        dot: "bg-sand" },
  CONTACTED:        { text: "In conversation",     dot: "bg-yellow" },
  QUALIFIED:        { text: "Looking good",        dot: "bg-olive" },
  VIBE_CHECK_SENT:  { text: "Vibe check sent",     dot: "bg-olive" },
  CONFIRMED:        { text: "Confirmed ✓",         dot: "bg-rust" },
  NOT_A_FIT:        { text: "Not a match",         dot: "bg-ink/20" },
};

export default function ChatPage() {
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = phone.replace(/\s+/g, "").trim();
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    setError("");
    setEnquiries(null);
    setNotFound(false);
    setActiveId(null);

    const res = await fetch(`/api/status?phone=${encodeURIComponent(cleaned)}`);
    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    if (!data.found) { setNotFound(true); return; }

    setVerifiedPhone(cleaned);
    setEnquiries(data.enquiries);
    if (data.enquiries.length === 1) {
      setActiveId(data.enquiries[0].id);
      setActiveName(data.enquiries[0].trip?.name ?? "your trip");
    }
  }

  const activeEnquiry = enquiries?.find((e) => e.id === activeId);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-sand/50 bg-cream sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display font-black text-2xl text-ink tracking-tight">
            Nomichi
          </Link>
          <div className="w-2 h-2 rounded-full bg-rust" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-rust font-poppins font-medium mb-3">
            Message us
          </p>
          <h1 className="font-display font-black text-4xl text-ink leading-tight mb-3">
            Talk to the
            <br />
            Nomichi team
          </h1>
          <p className="text-ink/60 font-poppins text-sm leading-relaxed">
            Enter the mobile number you used in your enquiry. We will pull up your conversation so
            you can message us directly.
          </p>
        </div>

        {/* Phone entry */}
        {!enquiries && (
          <form onSubmit={lookup} className="space-y-4 mb-8">
            <div>
              <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
                Your mobile number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setError(""); }}
                className="input-base"
                placeholder="10-digit number"
                maxLength={10}
                autoComplete="tel"
              />
              {error && <p className="text-rust text-xs mt-1 font-poppins">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-50"
            >
              {loading ? "Looking up…" : "Open my chat"}
            </button>
          </form>
        )}

        {notFound && (
          <div className="border border-sand/50 px-6 py-8 text-center">
            <p className="font-display font-bold text-xl text-ink mb-2">No enquiry found.</p>
            <p className="text-ink/60 font-poppins text-sm leading-relaxed mb-4">
              Check you are using the same number you entered on the form.
            </p>
            <Link href="/" className="text-sm text-rust font-poppins hover:underline">
              Browse trips →
            </Link>
          </div>
        )}

        {/* Enquiry selector (if multiple) */}
        {enquiries && enquiries.length > 1 && !activeId && (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-poppins text-ink/60">You have multiple enquiries. Which one do you want to chat about?</p>
            {enquiries.map((enq) => {
              const statusInfo = STATUS_LABEL[enq.status] ?? STATUS_LABEL.NEW;
              return (
                <button
                  key={enq.id}
                  onClick={() => {
                    setActiveId(enq.id);
                    setActiveName(enq.trip?.name ?? "your trip");
                  }}
                  className="w-full text-left border border-sand/50 px-5 py-4 hover:border-rust transition-colors bg-cream"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${statusInfo.dot} flex-shrink-0`} />
                    <span className="text-xs font-poppins text-ink/50">{statusInfo.text}</span>
                  </div>
                  <p className="font-display font-bold text-lg text-ink leading-snug">
                    {enq.trip?.name ?? "Trip"}
                  </p>
                  {enq.trip && (
                    <p className="text-xs text-ink/50 font-poppins mt-0.5">
                      {enq.trip.destination} · {formatDate(enq.trip.start_date)} to {formatDate(enq.trip.end_date)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Active chat */}
        {activeId && activeEnquiry && (
          <div>
            {enquiries && enquiries.length > 1 && (
              <button
                onClick={() => setActiveId(null)}
                className="text-sm text-ink/50 font-poppins mb-4 hover:text-ink transition-colors flex items-center gap-1"
              >
                ← Other enquiries
              </button>
            )}

            <div className="card mb-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  {activeEnquiry.trip && (
                    <>
                      <p className="font-display font-bold text-xl text-ink leading-snug">
                        {activeEnquiry.trip.name}
                      </p>
                      <p className="text-xs text-ink/50 font-poppins mt-0.5">
                        {activeEnquiry.trip.destination} ·{" "}
                        {formatDate(activeEnquiry.trip.start_date)} to{" "}
                        {formatDate(activeEnquiry.trip.end_date)}
                      </p>
                    </>
                  )}
                </div>
                <div>
                  {(() => {
                    const s = STATUS_LABEL[activeEnquiry.status] ?? STATUS_LABEL.NEW;
                    return (
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0`} />
                        <span className="text-xs font-poppins text-ink/60">{s.text}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="border-t border-sand/30 pt-4">
                <p className="text-xs uppercase tracking-wider font-poppins text-ink/40 font-medium mb-4">
                  Your conversation with Nomichi
                </p>
                <ChatBox
                  leadId={activeId}
                  leadName="You"
                  isAdmin={false}
                  phone={verifiedPhone}
                  height="h-96"
                />
              </div>
            </div>

            <p className="text-xs text-ink/30 font-poppins text-center">
              The team typically replies within a few hours. For urgent matters, call us directly.
            </p>
          </div>
        )}

        {/* Reset */}
        {enquiries && (
          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setEnquiries(null);
                setActiveId(null);
                setPhone("");
                setVerifiedPhone("");
              }}
              className="text-sm text-ink/30 font-poppins hover:text-ink/60 transition-colors mr-6"
            >
              Switch number
            </button>
            <Link href="/" className="text-sm text-ink/40 font-poppins hover:text-ink transition-colors">
              ← Back to trips
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-sand/30 mt-16 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-display font-bold text-ink">Nomichi</span>
          <span className="text-xs text-ink/40 font-poppins">Wander. Connect. Belong.</span>
        </div>
      </footer>
    </div>
  );
}
