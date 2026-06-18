import { useState } from "react";
import { Link } from "wouter";
import type { Trip } from "@/lib/types";
import TripCard from "./TripCard";
import EnquiryForm from "./EnquiryForm";
import { MapPin, ArrowRight, CheckCircle, ChevronDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  trips: Trip[];
}

const FLOAT_CONFIGS = [
  { top: "4%",  right: "30%", zIndex: 10, anim: "card-float-0 6s ease-in-out infinite", delay: "0ms" },
  { top: "28%", right: "4%",  zIndex: 20, anim: "card-float-1 7s ease-in-out infinite", delay: "120ms" },
  { top: "55%", right: "24%", zIndex: 15, anim: "card-float-2 8s ease-in-out infinite", delay: "220ms" },
];

function FloatingCard({ trip, index }: { trip: Trip; index: number }) {
  const cfg = FLOAT_CONFIGS[index] ?? FLOAT_CONFIGS[0];
  return (
    <div
      className="absolute w-60 animate-fade-up"
      style={{
        top: cfg.top,
        right: cfg.right,
        zIndex: cfg.zIndex,
        animationDelay: cfg.delay,
      }}
    >
      <div
        className="glass-card p-5 shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
        style={{ animation: cfg.anim, animationDelay: cfg.delay }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(213,93,39,0.18)" }}>
            <MapPin className="w-4 h-4 text-rust" />
          </div>
          <span className="font-display font-bold text-rust text-lg">{formatCurrency(trip.price_gst)}</span>
        </div>
        <h3 className="font-display font-bold text-cream text-base leading-tight mb-1">{trip.name}</h3>
        <p className="text-cream/40 text-xs font-poppins">{trip.destination}</p>
        <div className="mt-4 pt-4 border-t border-cream/8 flex items-center justify-between">
          <span className="text-xs text-cream/35 font-poppins">
            {trip.seats_available > 0 ? `${trip.seats_available} spots` : "Full"}
          </span>
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
  const labels = [["Spiti Valley", "Himachal Pradesh", "₹42,000"], ["Hampi Weekend", "Karnataka", "₹18,000"], ["Dzukou Trek", "Nagaland", "₹28,000"]];
  const [name, dest, price] = labels[index] ?? labels[0];
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

export default function PublicPage({ trips }: Props) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleEnquire(trip: Trip) {
    setSelectedTrip(trip);
    setFormOpen(true);
    setSubmitted(false);
    document.getElementById("trips-section")?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSuccess() {
    setSubmitted(true);
    setFormOpen(false);
    setSelectedTrip(null);
  }

  function scrollToTrips() {
    document.getElementById("trips-section")?.scrollIntoView({ behavior: "smooth" });
  }

  const openTrips = trips.filter((t) => t.status === "open");

  return (
    <div className="bg-void min-h-screen">
      <div className="grain-overlay" aria-hidden="true" />

      {/* ── Navigation ──────────────────────────────────────── */}
      <header className="glass-nav sticky top-0 z-50 border-b border-cream/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-display font-black text-xl text-cream tracking-tight">Nomichi</span>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={scrollToTrips} className="text-sm text-cream/45 hover:text-cream transition-colors font-poppins underline-anim">
              Journeys
            </button>
            <Link href="/status" className="text-sm text-cream/45 hover:text-cream transition-colors font-poppins underline-anim">
              Track enquiry
            </Link>
          </nav>
          <button
            onClick={scrollToTrips}
            className="btn-primary btn-shimmer text-sm px-5 py-2.5"
          >
            Send Enquiry
          </button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="min-h-[calc(100vh-65px)] flex flex-col justify-center relative overflow-hidden">
        {/* Glow orbs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "5%", right: "-5%",
            width: "700px", height: "600px",
            background: "radial-gradient(ellipse at center, rgba(213,93,39,0.18) 0%, transparent 65%)",
            filter: "blur(60px)",
            animation: "glow-breathe 5s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "10%", right: "20%",
            width: "400px", height: "400px",
            background: "radial-gradient(ellipse at center, rgba(69,71,29,0.25) 0%, transparent 65%)",
            filter: "blur(50px)",
            animation: "glow-breathe 7s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%", left: "-10%",
            width: "500px", height: "400px",
            background: "radial-gradient(ellipse at center, rgba(213,93,39,0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left: copy */}
          <div>
            <p
              className="text-xs uppercase tracking-[0.28em] text-rust font-poppins font-medium mb-6 animate-fade-in"
              style={{ animationDelay: "0ms" }}
            >
              Open journeys
            </p>

            <h1
              className="font-display font-black text-cream leading-none mb-7 animate-fade-up"
              style={{ fontSize: "clamp(2.8rem, 6vw, 5.5rem)", animationDelay: "60ms" }}
            >
              Where do
              <br />
              you want
              <br />
              <em className="text-rust not-italic italic">to find</em>
              <br />
              <em className="text-rust not-italic italic">yourself?</em>
            </h1>

            <p
              className="text-cream/50 font-poppins text-lg leading-relaxed max-w-md mb-10 animate-fade-up"
              style={{ animationDelay: "140ms" }}
            >
              Small groups. Real places. No template tours.
              Each trip is screened and run end to end by the Nomichi team.
            </p>

            <div
              className="flex items-center gap-5 flex-wrap mb-14 animate-fade-up"
              style={{ animationDelay: "200ms" }}
            >
              <button
                onClick={scrollToTrips}
                className="btn-primary btn-shimmer flex items-center gap-2 px-8 py-3.5 text-base"
              >
                Explore trips
                <ArrowRight className="w-4 h-4" />
              </button>
              <Link
                href="/status"
                className="text-cream/45 text-sm font-poppins hover:text-cream transition-colors underline-anim"
              >
                Track my enquiry
              </Link>
            </div>

            {/* Stats */}
            <div
              className="flex items-center gap-8 animate-fade-up"
              style={{ animationDelay: "260ms" }}
            >
              <div>
                <p className="font-display font-bold text-3xl text-cream">{openTrips.length}</p>
                <p className="text-xs text-cream/30 font-poppins uppercase tracking-widest mt-1">Open trips</p>
              </div>
              <div className="w-px h-10 bg-cream/10" />
              <div>
                <p className="font-display font-bold text-3xl text-cream">100%</p>
                <p className="text-xs text-cream/30 font-poppins uppercase tracking-widest mt-1">Small groups</p>
              </div>
              <div className="w-px h-10 bg-cream/10" />
              <div>
                <p className="font-display font-bold text-3xl text-cream">24h</p>
                <p className="text-xs text-cream/30 font-poppins uppercase tracking-widest mt-1">Response</p>
              </div>
            </div>
          </div>

          {/* Right: floating cards */}
          <div className="relative h-[520px] hidden lg:block">
            {trips.length > 0
              ? trips.slice(0, 3).map((trip, i) => <FloatingCard key={trip.id} trip={trip} index={i} />)
              : [0, 1, 2].map((i) => <FloatingPlaceholder key={i} index={i} />)
            }
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-float pointer-events-none">
          <p className="text-xs text-cream font-poppins uppercase tracking-[0.2em]">Scroll</p>
          <ChevronDown className="w-4 h-4 text-cream" />
        </div>
      </section>

      {/* ── Trips section ───────────────────────────────────── */}
      <section id="trips-section" className="py-24" style={{ backgroundColor: "#111110" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-xs text-rust uppercase tracking-[0.22em] font-poppins mb-3">
                All journeys
              </p>
              <h2 className="font-display font-bold text-4xl md:text-5xl text-cream">
                Open trips right now
              </h2>
            </div>
            <p className="text-cream/25 font-poppins text-sm hidden md:block">
              {openTrips.length} available
            </p>
          </div>

          {/* Success banner */}
          {submitted && (
            <div className="mb-12 border-l-4 border-rust px-6 py-5 animate-slide-right flex gap-4 items-start" style={{ background: "rgba(213,93,39,0.07)" }}>
              <CheckCircle className="w-5 h-5 text-rust mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-display font-bold text-xl text-cream mb-1">We have your enquiry.</p>
                <p className="text-cream/55 font-poppins text-sm leading-relaxed mb-3">
                  The Nomichi team will be in touch on WhatsApp within 24 hours.
                </p>
                <Link href="/status" className="text-rust text-sm font-poppins underline-anim hover:text-cream transition-colors">
                  Check enquiry status →
                </Link>
              </div>
            </div>
          )}

          {formOpen && selectedTrip ? (
            <div className="animate-fade-up">
              <button
                onClick={() => setFormOpen(false)}
                className="flex items-center gap-2 text-sm text-cream/45 font-poppins mb-8 hover:text-rust transition-colors underline-anim"
              >
                ← Back to trips
              </button>
              <EnquiryForm trip={selectedTrip} onSuccess={handleSuccess} onCancel={() => setFormOpen(false)} />
            </div>
          ) : trips.length === 0 ? (
            <div
              className="text-center py-24 border border-cream/8"
              style={{ background: "rgba(255,251,245,0.02)" }}
            >
              <p className="font-display font-bold text-2xl text-cream mb-2">Nothing open right now.</p>
              <p className="text-cream/40 font-poppins text-sm">
                Check back soon. New trips are added every season.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} onEnquire={handleEnquire} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-cream/5 py-10 bg-void">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="font-display font-black text-xl text-cream">Nomichi</span>
            <p className="text-xs text-cream/20 font-poppins mt-0.5">Travel that finds you.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/status" className="text-xs text-cream/30 font-poppins hover:text-cream/60 transition-colors">
              Track enquiry
            </Link>
            <span className="text-cream/10">·</span>
            <span className="text-xs text-cream/20 font-poppins tracking-widest uppercase">
              Wander. Connect. Belong.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
