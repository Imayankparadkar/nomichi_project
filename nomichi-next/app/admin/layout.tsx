"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import { LayoutDashboard, Users, Globe, LogOut } from "lucide-react";
import type { Profile } from "@/lib/types";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads",     label: "Leads",     icon: Users },
  { href: "/admin/trips",     label: "Trips",     icon: Globe },
];

const VOID = "#0D0C0B";
const SIDEBAR = "#0A0908";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!loading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: VOID }}>
        <span
          className="w-5 h-5 border-2 rounded-full inline-block"
          style={{ borderColor: "rgba(255,251,245,0.2)", borderTopColor: "#D55D27", animation: "spin 0.7s linear infinite" }}
        />
      </div>
    );
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.full_name ?? user?.email ?? "Team";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/admin/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: VOID }}>
      <div className="grain-overlay" aria-hidden="true" />

      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col relative z-10"
        style={{ backgroundColor: SIDEBAR, borderRight: "1px solid rgba(255,251,245,0.06)" }}
      >
        {/* Logo */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,251,245,0.06)" }}>
          <img src="https://www.thenomichi.com/Logo-Rust-cropped.svg" alt="Nomichi" className="h-6 md:h-7 object-contain" />
          <p className="text-[10px] text-cream/25 font-poppins mt-0.5 uppercase tracking-widest">
            Trip Desk
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 text-sm font-poppins font-medium transition-all duration-200 relative",
                  active ? "text-cream" : "text-cream/45 hover:text-cream/80"
                )}
              >
                {active && (
                  <span
                    className="absolute inset-0 animate-fade-in"
                    style={{ background: "rgba(213,93,39,0.85)", zIndex: -1 }}
                  />
                )}
                {!active && (
                  <span
                    className="absolute inset-0 group-hover:opacity-100 opacity-0 transition-opacity duration-200"
                    style={{ background: "rgba(255,251,245,0.05)", zIndex: -1 }}
                  />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-4 py-4" style={{ borderTop: "1px solid rgba(255,251,245,0.06)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(213,93,39,0.75)" }}
            >
              <span className="text-cream text-[10px] font-poppins font-bold">{initials}</span>
            </div>
            <p className="text-xs text-cream/50 font-poppins truncate leading-tight">{displayName}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-cream/25 font-poppins hover:text-cream/60 transition-colors group"
          >
            <LogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto w-full" style={{ backgroundColor: VOID }}>
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
