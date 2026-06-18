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
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/trips", label: "Trips", icon: Globe },
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
        <p className="text-ink/40 font-poppins text-sm">Loading…</p>
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

  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-ink flex flex-col border-r border-ink">
        <div className="px-5 py-6 border-b border-white/10">
          <span className="font-display font-black text-xl text-cream tracking-tight">
            Nomichi
          </span>
          <p className="text-xs text-cream/30 font-poppins mt-0.5">Trip Desk</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = currentPath === href || currentPath.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setCurrentPath(href)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-poppins font-medium transition-colors rounded-none",
                  active
                    ? "bg-rust text-cream"
                    : "text-cream/60 hover:text-cream hover:bg-white/5"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-cream/60 font-poppins truncate mb-1">{displayName}</p>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-cream/40 font-poppins hover:text-cream transition-colors"
          >
            <LogOut className="w-3 h-3" />
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
