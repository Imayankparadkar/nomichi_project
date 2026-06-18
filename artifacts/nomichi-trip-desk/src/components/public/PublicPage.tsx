import { useState } from "react";
import type { Trip } from "@/lib/types";
import TripCard from "./TripCard";
import EnquiryForm from "./EnquiryForm";

interface Props {
  trips: Trip[];
}

export default function PublicPage({ trips }: Props) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleEnquire(trip: Trip) {
    setSelectedTrip(trip);
    setFormOpen(true);
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSuccess() {
    setSubmitted(true);
    setFormOpen(false);
    setSelectedTrip(null);
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-sand/50 bg-cream sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <span className="font-display font-black text-2xl text-ink tracking-tight">Nomichi</span>
            <span className="ml-3 text-xs text-ink/40 font-poppins hidden sm:inline">
              Travel that finds you.
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-rust" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {submitted && (
          <div className="mb-10 border-l-4 border-rust bg-rust/5 px-6 py-5">
            <p className="font-display font-bold text-xl text-ink mb-1">We have got your enquiry.</p>
            <p className="text-ink/70 font-poppins text-sm leading-relaxed mb-3">
              Someone from the Nomichi team will be in touch on WhatsApp within 24 hours.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-poppins text-ink/60">
              <a href="/status" className="text-rust underline underline-offset-2 hover:text-ink transition-colors">
                Check enquiry status →
              </a>
              <span className="text-ink/20">·</span>
              <a href="/chat" className="text-rust underline underline-offset-2 hover:text-ink transition-colors">
                Message us directly →
              </a>
            </div>
          </div>
        )}

        {formOpen && selectedTrip ? (
          <div>
            <button
              onClick={() => setFormOpen(false)}
              className="flex items-center gap-2 text-sm text-ink/60 font-poppins mb-6 hover:text-ink transition-colors"
            >
              <span>&#8592;</span> Back to trips
            </button>
            <EnquiryForm
              trip={selectedTrip}
              onSuccess={handleSuccess}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        ) : (
          <div>
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-rust font-poppins font-medium mb-3">
                Open journeys
              </p>
              <h1 className="font-display font-black text-4xl md:text-5xl text-ink leading-tight">
                Where do you want
                <br />
                to find yourself?
              </h1>
              <p className="mt-4 text-ink/60 font-poppins text-base leading-relaxed max-w-xl">
                Small groups. Real places. No template tours. Each trip is screened, curated and
                run end to end by the Nomichi team.
              </p>
            </div>

            {trips.length === 0 ? (
              <div className="border border-sand/50 px-8 py-16 text-center">
                <p className="font-display font-bold text-2xl text-ink mb-2">
                  Nothing open right now.
                </p>
                <p className="text-ink/60 font-poppins text-sm">
                  Check back soon. New trips are added every season.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trips.map((trip) => (
                  <TripCard key={trip.id} trip={trip} onEnquire={handleEnquire} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-sand/30 mt-24 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="font-display font-bold text-ink">Nomichi</span>
          <span className="text-xs text-ink/40 font-poppins">
            Wander. Connect. Belong.
          </span>
        </div>
      </footer>
    </div>
  );
}
