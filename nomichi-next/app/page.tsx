"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Trip } from "@/lib/types";
import { supabase } from "@/lib/supabase-client";
import TripCard from "@/components/public/TripCard";
import EnquiryForm from "@/components/public/EnquiryForm";
import { MapPin, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const VOID = "#0D0C0B";
const DARK = "#111110";

const FLOAT_CONFIGS = [
  { top: "8%",  right: "140px", zIndex: 10, anim: "card-float-0 6s ease-in-out infinite", delay: "0ms" },
  { top: "32%", right: "20px",  zIndex: 20, anim: "card-float-1 7s ease-in-out infinite", delay: "120ms" },
  { top: "58%", right: "110px", zIndex: 15, anim: "card-float-2 8s ease-in-out infinite", delay: "220ms" },
];

function FloatingCard({ trip, index }: { trip: Trip; index: number }) {
  const cfg = FLOAT_CONFIGS[index] ?? FLOAT_CONFIGS[0];
  return (
    <div className="absolute w-60 animate-fade-up" style={{ top: cfg.top, right: cfg.right, zIndex: cfg.zIndex, animationDelay: cfg.delay }}>
      <div className="glass-card p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]" style={{ animation: cfg.anim, animationDelay: cfg.delay }}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(213,93,39,0.18)" }}>
            <MapPin className="w-4 h-4 text-rust" />
          </div>
          <span className="font-display font-bold text-rust text-lg">{formatCurrency(trip.price_gst)}</span>
        </div>
        <h3 className="font-display font-bold text-cream text-base leading-tight mb-1">{trip.name}</h3>
        <p className="text-cream/40 text-xs font-poppins">{trip.destination}</p>
        <div className="mt-4 pt-4 border-t border-cream/8 flex items-center justify-between">
          <span className="text-xs text-cream/35 font-poppins">{trip.seats_available > 0 ? `${trip.seats_available} spots` : "Full"}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rust pulse-dot" />
            <span className="text-xs text-rust font-poppins">Open</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingPlaceholder({ index }: { index: number }) {
  const cfg = FLOAT_CONFIGS[index] ?? FLOAT_CONFIGS[0];
  const cards = [
    ["Spiti Valley Winter", "Himachal Pradesh", "₹42,000"],
    ["Hampi Slow Weekend", "Karnataka", "₹18,000"],
    ["Dzukou Valley Trek", "Nagaland", "₹28,000"],
  ];
  const [name, dest, price] = cards[index] ?? cards[0];
  return (
    <div className="absolute w-60 animate-fade-up" style={{ top: cfg.top, right: cfg.right, zIndex: cfg.zIndex, animationDelay: cfg.delay }}>
      <div className="glass-card p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]" style={{ animation: cfg.anim, animationDelay: cfg.delay }}>
        <div className="flex justify-between items-start mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(213,93,39,0.18)" }}>
            <MapPin className="w-4 h-4 text-rust" />
          </div>
          <span className="font-display font-bold text-rust text-lg">{price}</span>
        </div>
        <h3 className="font-display font-bold text-cream text-base leading-tight mb-1">{name}</h3>
        <p className="text-cream/40 text-xs font-poppins">{dest}</p>
        <div className="mt-4 pt-4 border-t border-cream/8 flex items-center justify-between">
          <span className="text-xs text-cream/35 font-poppins">Limited spots</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rust pulse-dot" />
            <span className="text-xs text-rust font-poppins">Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchTrips = () => {
      supabase.from("trips").select("*").eq("status", "open").order("start_date", { ascending: true })
        .then(({ data }) => {
          setTrips((data as Trip[]) ?? []);
          setLoading(false);
        });
    };

    fetchTrips();

    const channel = supabase
      .channel("public-trips-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => fetchTrips())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function handleEnquire(trip: Trip) {
    setSelectedTrip(trip);
    setFormOpen(true);
    setSubmitted(false);
    setTimeout(() => document.getElementById("trips-section")?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  function handleSuccess() { setSubmitted(true); setFormOpen(false); setSelectedTrip(null); }
  function scrollToTrips() { document.getElementById("trips-section")?.scrollIntoView({ behavior: "smooth" }); }

  return (
    <div style={{ backgroundColor: VOID, color: "#FFFBF5", width: "100%" }}>
      <div className="grain-overlay" aria-hidden="true" />

      {/* Navigation */}
      <header className="glass-nav sticky top-0 z-50 border-b border-white/5" style={{ width: "100%" }}>
        <div className="page-container py-4 flex items-center justify-between">
          <img src="https://www.thenomichi.com/Logo-Rust-cropped.svg" alt="Nomichi" className="h-6 md:h-7 object-contain" />
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={scrollToTrips} className="text-sm font-poppins underline-anim" style={{ color: "rgba(255,251,245,0.55)" }}>
              Journeys
            </button>
            <Link href="/status" className="text-sm font-poppins underline-anim" style={{ color: "rgba(255,251,245,0.55)" }}>
              Track enquiry
            </Link>
          </nav>
          <button onClick={scrollToTrips} className="btn-primary btn-shimmer text-sm px-5 py-2.5">
            Send Enquiry
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: VOID, minHeight: "calc(100vh - 65px)", display: "flex", alignItems: "center" }}>
        <div className="absolute pointer-events-none" style={{ top: "5%", right: "-5%", width: "700px", height: "600px", background: "radial-gradient(ellipse at center, rgba(213,93,39,0.18) 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: "10%", right: "20%", width: "400px", height: "400px", background: "radial-gradient(ellipse at center, rgba(69,71,29,0.22) 0%, transparent 65%)", filter: "blur(50px)" }} />

        <div className="page-container py-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-rust font-poppins font-medium mb-6 animate-fade-in">
              Open journeys
            </p>
            <h1 className="font-display font-black text-cream leading-none mb-8 animate-fade-up" style={{ fontSize: "clamp(2.8rem, 5.5vw, 5.5rem)", animationDelay: "60ms" }}>
              Where do<br />
              you want<br />
              <em style={{ color: "#D55D27", fontStyle: "italic" }}>to find</em><br />
              <em style={{ color: "#D55D27", fontStyle: "italic" }}>yourself?</em>
            </h1>
            <p className="font-poppins text-lg leading-relaxed max-w-md mb-10 animate-fade-up" style={{ color: "rgba(255,251,245,0.5)", animationDelay: "140ms" }}>
              Small groups. Real places. No template tours.<br />
              Each trip is screened and run end to end by the Nomichi team.
            </p>
            <div className="flex items-center gap-5 flex-wrap mb-14 animate-fade-up" style={{ animationDelay: "200ms" }}>
              <button onClick={scrollToTrips} className="btn-primary btn-shimmer flex items-center gap-2 px-8 py-3.5 text-base">
                Explore trips <ArrowRight className="w-4 h-4" />
              </button>
              <Link href="/status" className="text-sm font-poppins underline-anim" style={{ color: "rgba(255,251,245,0.45)" }}>
                Track my enquiry
              </Link>
            </div>
            <div className="flex items-center gap-10 animate-fade-up" style={{ animationDelay: "260ms" }}>
              <div>
                <p className="font-display font-bold text-3xl text-cream">{trips.length || "—"}</p>
                <p className="text-xs font-poppins uppercase tracking-widest mt-1" style={{ color: "rgba(255,251,245,0.3)" }}>Open trips</p>
              </div>
              <div className="w-px h-10" style={{ background: "rgba(255,251,245,0.1)" }} />
              <div>
                <p className="font-display font-bold text-3xl text-cream">100%</p>
                <p className="text-xs font-poppins uppercase tracking-widest mt-1" style={{ color: "rgba(255,251,245,0.3)" }}>Small groups</p>
              </div>
              <div className="w-px h-10" style={{ background: "rgba(255,251,245,0.1)" }} />
              <div>
                <p className="font-display font-bold text-3xl text-cream">24h</p>
                <p className="text-xs font-poppins uppercase tracking-widest mt-1" style={{ color: "rgba(255,251,245,0.3)" }}>Response</p>
              </div>
            </div>
          </div>

          {/* Floating cards desktop */}
          <div className="relative hidden lg:block" style={{ height: "520px" }}>
            {!loading && trips.length > 0
              ? trips.slice(0, 3).map((trip, i) => <FloatingCard key={trip.id} trip={trip} index={i} />)
              : [0, 1, 2].map((i) => <FloatingPlaceholder key={i} index={i} />)
            }
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float pointer-events-none" style={{ opacity: 0.3 }}>
          <p className="text-xs text-cream font-poppins uppercase tracking-[0.2em]">Scroll</p>
          <ChevronDown className="w-4 h-4 text-cream" />
        </div>
      </section>

      {/* Trips */}
      <section id="trips-section" style={{ backgroundColor: DARK, padding: "7rem 0" }}>
        <div className="page-container">
          <div className="flex items-end justify-between mb-16">
            <div>
              <p className="text-xs text-rust uppercase tracking-[0.22em] font-poppins mb-3">All journeys</p>
              <h2 className="font-display font-bold text-cream" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
                Open trips right now
              </h2>
            </div>
            <p className="font-poppins text-sm hidden md:block" style={{ color: "rgba(255,251,245,0.25)" }}>
              {trips.length} available
            </p>
          </div>

          {submitted && (
            <div className="mb-12 border-l-4 border-rust px-6 py-5 animate-slide-right flex gap-4 items-start" style={{ background: "rgba(213,93,39,0.07)" }}>
              <CheckCircle className="w-5 h-5 text-rust mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-xl text-cream mb-1">We have your enquiry.</p>
                <p className="font-poppins text-sm leading-relaxed mb-3" style={{ color: "rgba(255,251,245,0.55)" }}>
                  The Nomichi team will be in touch on WhatsApp within 24 hours.
                </p>
                <Link href="/status" className="text-rust text-sm font-poppins underline-anim">Check enquiry status →</Link>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-24 border" style={{ background: "rgba(255,251,245,0.02)", borderColor: "rgba(255,251,245,0.07)" }}>
              <div className="flex justify-center mb-4">
                <div className="w-6 h-6 border-2 rounded-full" style={{ borderColor: "rgba(213,93,39,0.3)", borderTopColor: "#D55D27", animation: "spin 0.7s linear infinite" }} />
              </div>
              <p className="font-poppins text-sm" style={{ color: "rgba(255,251,245,0.35)" }}>Loading trips…</p>
            </div>
          ) : formOpen && selectedTrip ? (
            <div className="max-w-2xl mx-auto animate-fade-up">
              <button onClick={() => setFormOpen(false)} className="flex items-center gap-2 text-sm font-poppins mb-8 underline-anim" style={{ color: "rgba(255,251,245,0.45)" }}>
                ← Back to trips
              </button>
              <EnquiryForm trip={selectedTrip} onSuccess={handleSuccess} onCancel={() => setFormOpen(false)} />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-24 border" style={{ background: "rgba(255,251,245,0.02)", borderColor: "rgba(255,251,245,0.07)" }}>
              <p className="font-display font-bold text-2xl text-cream mb-2">Nothing open right now.</p>
              <p className="font-poppins text-sm" style={{ color: "rgba(255,251,245,0.4)" }}>Check back soon. New trips are added every season.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {trips.map((trip, i) => <TripCard key={trip.id} trip={trip} onEnquire={handleEnquire} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,251,245,0.05)", padding: "3rem 0" }}>
        <div className="page-container flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <img src="https://www.thenomichi.com/Logo-Rust-cropped.svg" alt="Nomichi" className="h-6 md:h-7 object-contain" />
            <p className="text-xs font-poppins mt-0.5" style={{ color: "rgba(255,251,245,0.2)" }}>Travel that finds you.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/status" className="text-xs font-poppins underline-anim" style={{ color: "rgba(255,251,245,0.3)" }}>Track enquiry</Link>
            <span style={{ color: "rgba(255,251,245,0.1)" }}>·</span>
            <span className="text-xs font-poppins uppercase tracking-widest" style={{ color: "rgba(255,251,245,0.2)" }}>Wander. Connect. Belong.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
