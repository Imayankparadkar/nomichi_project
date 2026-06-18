import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Those details do not match. Try again.");
      setLoading(false);
      return;
    }
    setLocation("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 relative overflow-hidden">
      <div className="grain-overlay" aria-hidden="true" />

      <div
        className="absolute top-0 right-0 w-[32rem] h-[32rem] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(213,93,39,0.07) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(69,71,29,0.06) 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
        }}
      />

      <div
        className="absolute bottom-6 right-8 pointer-events-none select-none opacity-[0.04] hidden lg:block"
        aria-hidden="true"
      >
        <span className="font-display font-black text-[10rem] leading-none text-ink">N</span>
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        <div className="mb-10 text-center">
          <span className="text-rust font-display font-black text-3xl tracking-tight">
            Nomichi
          </span>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-8 bg-sand/60" />
            <p className="text-ink/45 font-poppins text-xs tracking-widest uppercase">
              Team access
            </p>
            <div className="h-px w-8 bg-sand/60" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-ink/55 uppercase tracking-widest mb-2 font-poppins">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
              placeholder="you@thenomichi.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/55 uppercase tracking-widest mb-2 font-poppins">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-base"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-rust text-sm font-poppins bg-rust/5 border-l-2 border-rust px-3 py-2.5 animate-slide-right">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-shimmer w-full text-center disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span
                  className="inline-block w-3.5 h-3.5 border-2 border-cream/25 border-t-cream rounded-full"
                  style={{ animation: "spin 0.7s linear infinite" }}
                />
                Signing in…
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-xs text-ink/25 font-poppins tracking-[0.2em] uppercase">
          Travel that finds you.
        </p>
      </div>
    </div>
  );
}
