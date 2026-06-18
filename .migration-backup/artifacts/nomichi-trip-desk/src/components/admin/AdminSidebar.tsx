"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LayoutDashboard, Users, Globe, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  user: User;
  profile: { full_name: string | null; email: string } | null;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/trips", label: "Trips", icon: Globe },
];

export default function AdminSidebar({ user, profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const displayName = profile?.full_name ?? user.email ?? "Team";

  return (
    <aside className="w-56 flex-shrink-0 bg-ink flex flex-col border-r border-ink">
      <div className="px-5 py-6 border-b border-white/10">
        <span className="font-display font-black text-xl text-cream tracking-tight">
          Nomichi
        </span>
        <p className="text-xs text-cream/30 font-poppins mt-0.5">Trip Desk</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
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
  );
}
