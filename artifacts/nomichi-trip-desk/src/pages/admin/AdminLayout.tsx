import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const handler = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span
          className="w-5 h-5 border-2 border-sand border-t-rust rounded-full inline-block"
          style={{ animation: "spin 0.7s linear infinite" }}
        />
      </div>
    );
  }

  if (!user) {
    setLocation("/admin/login");
    return null;
  }

  async function handleSignOut() {
    await signOut();
    setLocation("/admin/login");
  }

  const displayName = profile?.full_name ?? user?.email ?? "Team";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <div className="grain-overlay" aria-hidden="true" />

      <aside className="w-56 flex-shrink-0 bg-ink flex flex-col border-r border-ink relative z-10">
        <div className="px-5 py-6 border-b border-white/8">
          <span className="font-display font-black text-xl text-cream tracking-tight">Nomichi</span>
          <p className="text-[10px] text-cream/25 font-poppins mt-0.5 uppercase tracking-widest">
            Trip Desk
          </p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = currentPath === href || currentPath.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setCurrentPath(href)}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 text-sm font-poppins font-medium transition-all duration-200 relative",
                  active
                    ? "text-cream"
                    : "text-cream/50 hover:text-cream/90"
                )}
              >
                {active && (
                  <span className="absolute inset-0 bg-rust/90 animate-fade-in" style={{ zIndex: -1 }} />
                )}
                {!active && (
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-200" style={{ zIndex: -1 }} />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 rounded-full bg-rust/80 flex items-center justify-center flex-shrink-0">
              <span className="text-cream text-[10px] font-poppins font-bold">{initials}</span>
            </div>
            <p className="text-xs text-cream/55 font-poppins truncate leading-tight">
              {displayName}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-cream/30 font-poppins hover:text-cream/70 transition-colors group"
          >
            <LogOut className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
