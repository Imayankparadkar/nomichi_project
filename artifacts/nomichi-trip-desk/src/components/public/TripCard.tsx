import { useState, useRef } from "react";
import type { Trip } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Calendar, Users, ArrowUpRight } from "lucide-react";

interface Props {
  trip: Trip;
  onEnquire: (trip: Trip) => void;
  index?: number;
}

export default function TripCard({ trip, onEnquire, index = 0 }: Props) {
  const spotsLeft = trip.seats_available;
  const almostFull = spotsLeft > 0 && spotsLeft <= 3;
  const isFull = spotsLeft === 0;
  const cardRef = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState({ x: -999, y: -999 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setSpot({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleMouseLeave() {
    setSpot({ x: -999, y: -999 });
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="spotlight-card group relative flex flex-col cursor-default transition-all duration-350 animate-fade-up hover:-translate-y-1"
      style={{
        animationDelay: `${index * 80}ms`,
        background: "rgba(255,251,245,0.04)",
        border: "1px solid rgba(255,251,245,0.08)",
        "--spot-x": `${spot.x}px`,
        "--spot-y": `${spot.y}px`,
        boxShadow: spot.x > 0 ? "0 0 0 1px rgba(213,93,39,0.18), 0 16px 48px rgba(0,0,0,0.35)" : "0 8px 32px rgba(0,0,0,0.3)",
        transition: "box-shadow 0.3s, transform 0.3s",
      } as React.CSSProperties}
    >
      {/* Header band */}
      <div
        className="px-6 py-5 border-b relative z-10"
        style={{
          borderColor: "rgba(255,251,245,0.07)",
          background: "linear-gradient(135deg, rgba(69,71,29,0.18) 0%, rgba(213,93,39,0.08) 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-cream leading-tight group-hover:text-rust transition-colors duration-300">
              {trip.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-rust" />
              <span className="text-sm text-cream/50 font-poppins">{trip.destination}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-bold text-2xl text-rust">{formatCurrency(trip.price_gst)}</p>
            <p className="text-xs text-cream/25 font-poppins">incl. GST</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex-1 flex flex-col relative z-10">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 text-xs text-cream/40 font-poppins">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            <span>{trip.total_seats} people max</span>
          </div>
        </div>

        <p className="text-sm text-cream/55 font-poppins leading-relaxed flex-1">
          {trip.description}
        </p>

        {/* Footer row */}
        <div className="mt-6 flex items-center justify-between">
          {almostFull ? (
            <span className="flex items-center gap-1.5 text-xs text-rust font-semibold font-poppins uppercase tracking-wider">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rust animate-pulse" />
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
            </span>
          ) : isFull ? (
            <span className="text-xs text-cream/25 font-poppins uppercase tracking-wider">Full</span>
          ) : (
            <span className="text-xs text-cream/30 font-poppins">{spotsLeft} spots open</span>
          )}

          <button
            onClick={() => onEnquire(trip)}
            disabled={isFull}
            className="btn-primary btn-shimmer flex items-center gap-2 text-sm py-2.5 px-5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send enquiry
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
