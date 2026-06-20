"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { CheckCircle, Clock, MessageCircle, Compass, XCircle, ArrowRight } from "lucide-react";
import ChatBox from "@/components/ChatBox";
import Script from "next/script";

const STATUS_INFO: Record<string, {
  label: string;
  message: string;
  borderColor: string;
  icon: React.ReactNode;
}> = {
  NEW: {
    label: "Under review",
    message: "Your enquiry is with us. The team will be in touch within 24 hours.",
    borderColor: "rgba(209,183,136,0.5)",
    icon: <Clock className="w-5 h-5 text-sand" />,
  },
  CONTACTED: {
    label: "In conversation",
    message: "The Nomichi team has reached out. Check your WhatsApp and email.",
    borderColor: "rgba(255,254,0,0.4)",
    icon: <MessageCircle className="w-5 h-5 text-yellow" />,
  },
  QUALIFIED: {
    label: "Looking good",
    message: "Your enquiry looks like a strong fit. We are reviewing the details before we confirm.",
    borderColor: "rgba(69,71,29,0.6)",
    icon: <Compass className="w-5 h-5 text-olive" />,
  },
  VIBE_CHECK_SENT: {
    label: "Vibe check sent",
    message: "We have shared some information with you. Please review and respond when you can.",
    borderColor: "rgba(213,93,39,0.5)",
    icon: <ArrowRight className="w-5 h-5 text-rust" />,
  },
  CONFIRMED: {
    label: "You are in",
    message: "Your spot is confirmed. Expect details from the Nomichi team on WhatsApp very soon.",
    borderColor: "rgba(213,93,39,0.9)",
    icon: <CheckCircle className="w-5 h-5 text-rust" />,
  },
  NOT_A_FIT: {
    label: "Not a match this time",
    message: "We do not think this particular trip is the right fit right now — but that can change. Keep an eye on future trips.",
    borderColor: "rgba(255,251,245,0.12)",
    icon: <XCircle className="w-5 h-5 text-cream/40" />,
  },
};

interface Enquiry {
  id: string;
  name: string;
  status: string;
  preferred_month: string;
  created_at: string;
  trip: { name: string; destination: string; start_date: string; end_date: string } | null;
}

export default function StatusPage() {
  const [phone, setPhone] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function checkStatus(e: React.FormEvent) {
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

    try {
      const res = await fetch(`/api/status?phone=${encodeURIComponent(cleaned)}`);
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      if (!data.found) {
        setNotFound(true);
      } else {
        setEnquiries(data.enquiries);
        setVerifiedPhone(cleaned);
      }
    } catch {
      setLoading(false);
      setError("Failed to fetch enquiry status.");
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col" style={{ background: "#0D0C0B", color: "#FFFBF5" }}>
      <div className="grain-overlay" aria-hidden="true" />

      {/* Ambient glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "-10%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(ellipse, rgba(213,93,39,0.1) 0%, transparent 65%)",
          filter: "blur(70px)",
        }}
      />

      {/* Nav */}
      <header className="glass-nav sticky top-0 z-50 border-b border-cream/5 w-full">
        <div className="page-container py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <img src="https://www.thenomichi.com/Logo-Rust-cropped.svg" alt="Nomichi" className="h-6 md:h-7 object-contain" />
          </Link>
          <div className="w-2 h-2 rounded-full bg-rust pulse-dot" />
        </div>
      </header>

      <main style={{ maxWidth: "36rem", margin: "0 auto", padding: "6rem 2rem", position: "relative", zIndex: 10, flex: 1 }}>
        {/* Heading */}
        <div className="mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-rust font-poppins font-medium mb-5 animate-fade-in">
            Enquiry status
          </p>
          <h1 className="font-display font-black text-cream leading-none mb-5 animate-fade-up" style={{ fontSize: "clamp(2.4rem, 5vw, 4rem)" }}>
            Where does your
            <br />
            <em className="text-rust italic">enquiry stand?</em>
          </h1>
          <p className="text-cream/45 font-poppins text-sm leading-relaxed animate-fade-up" style={{ animationDelay: "80ms" }}>
            Enter the mobile number you used in the form. We will show you the current status of your enquiry.
          </p>
        </div>

        {/* Hidden Trigger & Widget Script for Omni Dimension */}
        <button id="omni-open-widget-btn" className="hidden" aria-hidden="true">Hidden Trigger</button>
        {process.env.NEXT_PUBLIC_OMNIDIMENSION_SECRET_KEY && (
          <Script
            id="omnidimension-web-widget"
            src={`https://omnidim.io/web_widget.js?secret_key=${process.env.NEXT_PUBLIC_OMNIDIMENSION_SECRET_KEY}`}
            strategy="afterInteractive"
          />
        )}

        {/* Form */}
        <form onSubmit={checkStatus} className="space-y-4 mb-10 animate-fade-up" style={{ animationDelay: "140ms" }}>
          <div>
            <label className="block text-xs font-medium text-cream/40 uppercase tracking-widest mb-2 font-poppins">
              Your mobile number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setError(""); setEnquiries(null); setNotFound(false); }}
              className="dark-input text-lg"
              placeholder="10-digit number"
              maxLength={10}
              autoComplete="tel"
            />
            {error && (
              <p className="text-rust text-xs mt-1.5 font-poppins animate-slide-right">{error}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-shimmer w-full py-3.5 text-center disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="inline-block w-3.5 h-3.5 border-2 border-cream/25 border-t-cream rounded-full" style={{ animation: "spin 0.7s linear infinite" }} />
                Checking…
              </span>
            ) : "Check my enquiry"}
          </button>
        </form>

        {/* Not found */}
        {notFound && (
          <div
            className="text-center py-10 px-6 border border-cream/8 animate-fade-up"
            style={{ background: "rgba(255,251,245,0.02)" }}
          >
            <p className="font-display font-bold text-xl text-cream mb-2">No enquiry found.</p>
            <p className="text-cream/40 font-poppins text-sm leading-relaxed mb-5">
              We could not find an enquiry linked to this number. Make sure you are using the same number you entered in the form.
            </p>
            <Link href="/" className="text-sm text-rust font-poppins underline-anim hover:text-cream transition-colors">
              Browse open trips →
            </Link>
          </div>
        )}

        {/* Results */}
        {enquiries && enquiries.length > 0 && (
          <div className="space-y-4">
            {enquiries.map((enquiry, i) => {
              const info = STATUS_INFO[enquiry.status] ?? STATUS_INFO.NEW;
              const isConfirmed = enquiry.status === "CONFIRMED";
              const isNotFit = enquiry.status === "NOT_A_FIT";

              return (
                <div
                  key={enquiry.id}
                  className="p-6 border-l-4 animate-fade-up animate-none"
                  style={{
                    animationDelay: `${i * 80}ms`,
                    borderLeftColor: info.borderColor,
                    background: "rgba(255,251,245,0.03)",
                    border: `1px solid rgba(255,251,245,0.07)`,
                    borderLeft: `4px solid ${info.borderColor}`,
                  }}
                >
                  {enquiry.trip && (
                    <div className="mb-4">
                      <p className="font-display font-bold text-lg text-cream leading-snug">
                        {enquiry.trip.name}
                      </p>
                      <p className="text-xs text-cream/40 font-poppins mt-0.5">
                        {enquiry.trip.destination} · {formatDate(enquiry.trip.start_date)} to {formatDate(enquiry.trip.end_date)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5 mb-3">
                    {info.icon}
                    <span className="text-xs font-poppins font-semibold uppercase tracking-widest text-cream/70">
                      {info.label}
                    </span>
                  </div>

                  <p className="text-sm text-cream/60 font-poppins leading-relaxed">{info.message}</p>

                  {isConfirmed && (
                    <div
                      className="mt-4 px-4 py-3 border-l-2 border-rust"
                      style={{ background: "rgba(213,93,39,0.08)" }}
                    >
                      <p className="text-sm font-poppins text-rust">
                        Check your WhatsApp for next steps. If you have not heard from us,{" "}
                        <a href="mailto:hello@nomichi.in" className="underline underline-offset-2">
                          email hello@nomichi.in
                        </a>.
                      </p>
                    </div>
                  )}

                  {isNotFit && (
                    <div className="mt-4">
                      <Link href="/" className="text-sm text-rust font-poppins underline-anim hover:text-cream transition-colors">
                        See upcoming trips →
                      </Link>
                    </div>
                  )}

                  <p className="text-xs text-cream/20 font-poppins mt-4 mb-6">
                    Preferred: {enquiry.preferred_month} · Enquired{" "}
                    {new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {/* Chat with Nomichi team */}
                  <div className="mt-6 pt-6 border-t border-cream/10">
                    <p className="text-xs uppercase tracking-[0.15em] font-poppins text-cream/40 font-semibold mb-3">
                      Chat with the Nomichi team
                    </p>
                    <div className="p-4 bg-black/30 border border-cream/5 rounded-lg">
                      <ChatBox
                        leadId={enquiry.id}
                        leadName={enquiry.name}
                        isAdmin={false}
                        phone={verifiedPhone}
                        height="h-72"
                      />
                    </div>
                  </div>

                  {/* Speak with Call Agent */}
                  <div className="mt-6 pt-6 border-t border-cream/10">
                    <p className="text-xs uppercase tracking-[0.15em] font-poppins text-cream/40 font-semibold mb-3">
                      Speak with our Voice Call Agent
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const hiddenBtn = document.getElementById("omni-open-widget-btn");
                        if (hiddenBtn) hiddenBtn.click();
                      }}
                      className="btn-primary btn-shimmer w-full py-3.5 text-center flex items-center justify-center gap-2 font-poppins text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Start Voice Call
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link href="/" className="text-sm text-cream/25 font-poppins hover:text-cream/60 transition-colors underline-anim">
            ← Back to trips
          </Link>
        </div>
      </main>

      <footer className="w-full border-t border-cream/5 py-10" style={{ background: "#0D0C0B" }}>
        <div className="page-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <img src="https://www.thenomichi.com/Logo-Rust-cropped.svg" alt="Nomichi" className="h-6 md:h-7 object-contain" />
          <span className="text-xs text-cream/20 font-poppins tracking-widest uppercase">
            Wander. Connect. Belong.
          </span>
        </div>
      </footer>
    </div>
  );
}
