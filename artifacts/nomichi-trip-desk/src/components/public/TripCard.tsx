import { useState, useRef } from "react";
import type { Trip } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Calendar, Users } from "lucide-react";

interface Props {
  trip: Trip;
  onEnquire: (trip: Trip) => void;
  index?: number;
}

export default function TripCard({ trip, onEnquire, index = 0 }: Props) {
  const spotsLeft = trip.seats_available;
  const almostFull = spotsLeft > 0 && spotsLeft <= 3;
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
      className="spotlight-card border border-sand/50 bg-cream flex flex-col hover:border-rust/50 transition-all duration-350 group hover:shadow-[0_12px_40px_rgba(213,93,39,0.10)] hover:-translate-y-1.5 animate-fade-up"
      style={{
        animationDelay: `${index * 90}ms`,
        "--spot-x": `${spot.x}px`,
        "--spot-y": `${spot.y}px`,
      } as React.CSSProperties}
    >
      <div
        className="px-6 py-5 border-b border-sand/30 relative z-10"
        style={{
          background:
            "linear-gradient(135deg, rgba(69,71,29,0.055) 0%, rgba(213,93,39,0.035) 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-ink leading-tight group-hover:text-rust transition-colors duration-300">
              {trip.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3 h-3 text-rust" />
              <span className="text-sm text-ink/60 font-poppins">{trip.destination}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-display font-bold text-2xl text-rust">
              {formatCurrency(trip.price_gst)}
            </p>
            <p className="text-xs text-ink/40 font-poppins">incl. GST</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 flex-1 flex flex-col relative z-10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-4 text-xs text-ink/60 font-poppins">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3" />
            <span>
              {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            <span>{trip.total_seats} people max</span>
          </div>
        </div>

        <p className="text-sm text-ink/70 font-poppins leading-relaxed flex-1">
          {trip.description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          {almostFull ? (
            <span className="flex items-center gap-1.5 text-xs text-rust font-semibold font-poppins uppercase tracking-wider">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-rust animate-pulse" />
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
            </span>
          ) : spotsLeft === 0 ? (
            <span className="text-xs text-ink/40 font-poppins uppercase tracking-wider">Full</span>
          ) : (
            <span className="text-xs text-ink/40 font-poppins">{spotsLeft} spots open</span>
          )}

          <button
            onClick={() => onEnquire(trip)}
            className="btn-primary btn-shimmer text-sm py-2.5"
          >
            Send enquiry
          </button>
        </div>
      </div>
    </div>
  );
}
