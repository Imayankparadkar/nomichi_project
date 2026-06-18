import { useState } from "react";
import { Link } from "wouter";
import { formatDate } from "@/lib/utils";

const STATUS_INFO: Record<string, { label: string; message: string; color: string }> = {
  NEW: {
    label: "Under review",
    message: "Your enquiry is with us. The team will be in touch within 24 hours.",
    color: "border-sand text-ink",
  },
  CONTACTED: {
    label: "In conversation",
    message: "The Nomichi team has reached out. Check your WhatsApp and email.",
    color: "border-yellow text-ink",
  },
  QUALIFIED: {
    label: "Looking good",
    message: "Your enquiry looks like a strong fit. We are reviewing the details before we confirm.",
    color: "border-olive text-olive",
  },
  VIBE_CHECK_SENT: {
    label: "Vibe check sent",
    message: "We have shared some information with you. Please review and respond when you can.",
    color: "border-olive text-olive",
  },
  CONFIRMED: {
    label: "You are in",
    message: "Your spot is confirmed. Expect details from the Nomichi team on WhatsApp very soon.",
    color: "border-rust text-rust",
  },
  NOT_A_FIT: {
    label: "Not a match this time",
    message: "We do not think this particular trip is the right fit right now, but that can change. Keep an eye on future trips.",
    color: "border-ink/30 text-ink/60",
  },
};

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

export default function StatusPage() {
  const [phone, setPhone] = useState("");
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
    }
  }

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

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-rust font-poppins font-medium mb-3">
            Enquiry status
          </p>
          <h1 className="font-display font-black text-4xl text-ink leading-tight mb-3">
            Where does your
            <br />
            enquiry stand?
          </h1>
          <p className="text-ink/60 font-poppins text-sm leading-relaxed">
            Enter the mobile number you used when filling the form. We will show you the current
            status of your enquiry.
          </p>
        </div>

        <form onSubmit={checkStatus} className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-medium text-ink/70 uppercase tracking-wider mb-2 font-poppins">
              Your mobile number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
                setEnquiries(null);
                setNotFound(false);
              }}
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
            {loading ? "Checking..." : "Check my enquiry"}
          </button>
        </form>

        {notFound && (
          <div className="border border-sand/50 px-6 py-8 text-center">
            <p className="font-display font-bold text-xl text-ink mb-2">No enquiry found.</p>
            <p className="text-ink/60 font-poppins text-sm leading-relaxed">
              We could not find an enquiry linked to this number. Make sure you are using the same
              number you entered in the form.
            </p>
            <Link href="/" className="inline-block mt-4 text-sm text-rust font-poppins hover:underline">
              Browse open trips →
            </Link>
          </div>
        )}

        {enquiries && enquiries.length > 0 && (
          <div className="space-y-5">
            {enquiries.map((enquiry) => {
              const info = STATUS_INFO[enquiry.status] ?? STATUS_INFO.NEW;
              const isConfirmed = enquiry.status === "CONFIRMED";
              const isNotFit = enquiry.status === "NOT_A_FIT";

              return (
                <div
                  key={enquiry.id}
                  className={`border-l-4 px-6 py-5 bg-cream border border-sand/40 ${info.color.split(" ")[0]}`}
                >
                  {enquiry.trip && (
                    <div className="mb-3">
                      <p className="font-display font-bold text-lg text-ink leading-snug">
                        {enquiry.trip.name}
                      </p>
                      <p className="text-xs text-ink/50 font-poppins mt-0.5">
                        {enquiry.trip.destination} &middot; {formatDate(enquiry.trip.start_date)} to{" "}
                        {formatDate(enquiry.trip.end_date)}
                      </p>
                    </div>
                  )}

                  <div className={`inline-block text-xs font-poppins font-semibold uppercase tracking-wider mb-2 ${info.color.split(" ")[1]}`}>
                    {info.label}
                  </div>

                  <p className="text-sm text-ink/80 font-poppins leading-relaxed">
                    {info.message}
                  </p>

                  {isConfirmed && (
                    <div className="mt-3 bg-rust/5 border border-rust/20 px-4 py-3">
                      <p className="text-sm font-poppins text-rust font-medium">
                        Check your WhatsApp for next steps. If you have not heard from us yet,
                        email us at{" "}
                        <a href="mailto:hello@nomichi.in" className="underline">
                          hello@nomichi.in
                        </a>
                        .
                      </p>
                    </div>
                  )}

                  {isNotFit && (
                    <div className="mt-3">
                      <Link
                        href="/"
                        className="text-sm text-rust font-poppins hover:underline"
                      >
                        See upcoming trips →
                      </Link>
                    </div>
                  )}

                  <p className="text-xs text-ink/30 font-poppins mt-3">
                    Preferred month: {enquiry.preferred_month} &middot; Enquired{" "}
                    {new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-ink/40 font-poppins hover:text-ink transition-colors"
          >
            ← Back to trips
          </Link>
        </div>
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
