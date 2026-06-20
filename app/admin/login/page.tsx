"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

const VOID = "#0D0C0B";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    router.push("/admin/dashboard");
  }

  return (
    <div
      className="w-full min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: VOID }}
    >
      <div className="grain-overlay" aria-hidden="true" />

      {/* Glow orbs */}
      <div
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          width: "32rem",
          height: "32rem",
          background: "radial-gradient(circle, rgba(213,93,39,0.12) 0%, transparent 70%)",
          transform: "translate(30%, -30%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 pointer-events-none"
        style={{
          width: "24rem",
          height: "24rem",
          background: "radial-gradient(circle, rgba(69,71,29,0.12) 0%, transparent 70%)",
          transform: "translate(-30%, 30%)",
          filter: "blur(40px)",
        }}
      />

      {/* Decorative letter */}
      <div
        className="absolute bottom-6 right-8 pointer-events-none select-none hidden lg:block"
        style={{ opacity: 0.04 }}
        aria-hidden="true"
      >
        <span className="font-display font-black text-[10rem] leading-none text-cream">N</span>
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-up">
        <div className="mb-10 text-center">
          <img src="https://www.thenomichi.com/Logo-Rust-cropped.svg" alt="Nomichi" className="h-8 object-contain" />
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-8" style={{ background: "rgba(255,251,245,0.15)" }} />
            <p className="text-cream/35 font-poppins text-xs tracking-widest uppercase">Team access</p>
            <div className="h-px w-8" style={{ background: "rgba(255,251,245,0.15)" }} />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
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
            <label className="block text-xs font-medium text-cream/45 uppercase tracking-widest mb-2 font-poppins">
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
            <p
              className="text-rust text-sm font-poppins px-3 py-2.5 animate-slide-right border-l-2 border-rust"
              style={{ background: "rgba(213,93,39,0.08)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn-shimmer w-full text-center disabled:opacity-50 disabled:cursor-not-allowed mt-1 py-3.5"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span
                  className="inline-block w-3.5 h-3.5 border-2 rounded-full"
                  style={{ borderColor: "rgba(255,251,245,0.25)", borderTopColor: "#FFFBF5", animation: "spin 0.7s linear infinite" }}
                />
                Signing in…
              </span>
            ) : "Sign in"}
          </button>
        </form>

        <p className="mt-10 text-center text-xs text-cream/20 font-poppins tracking-[0.2em] uppercase">
          Travel that finds you.
        </p>
      </div>
    </div>
  );
}
