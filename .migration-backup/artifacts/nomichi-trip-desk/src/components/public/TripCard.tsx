import type { Trip } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { MapPin, Calendar, Users } from "lucide-react";

interface Props {
  trip: Trip;
  onEnquire: (trip: Trip) => void;
}

export default function TripCard({ trip, onEnquire }: Props) {
  const spotsLeft = trip.seats_available;
  const almostFull = spotsLeft > 0 && spotsLeft <= 3;

  return (
    <div className="border border-sand/50 bg-cream flex flex-col hover:border-rust transition-colors duration-200 group">
      <div className="bg-olive/10 px-6 py-5 border-b border-sand/30">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-ink leading-tight group-hover:text-rust transition-colors">
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

      <div className="px-6 py-4 flex-1 flex flex-col">
        <div className="flex items-center gap-4 mb-4 text-xs text-ink/60 font-poppins">
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
            <span className="text-xs text-rust font-medium font-poppins uppercase tracking-wider">
              {spotsLeft} {spotsLeft === 1 ? "spot" : "spots"} left
            </span>
          ) : spotsLeft === 0 ? (
            <span className="text-xs text-ink/40 font-poppins uppercase tracking-wider">Full</span>
          ) : (
            <span className="text-xs text-ink/40 font-poppins">{spotsLeft} spots open</span>
          )}

          <button onClick={() => onEnquire(trip)} className="btn-primary text-sm py-2.5">
            Send enquiry
          </button>
        </div>
      </div>
    </div>
  );
}
