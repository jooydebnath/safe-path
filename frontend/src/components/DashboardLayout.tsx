"use client";

import { Shield, MapPin, FileText, Users, Menu, X, LogOut, ClipboardCheck, Siren, Star, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Shield },
  { name: "SOS Alerts", href: "/dashboard/sos", icon: Siren },
  { name: "Roads", href: "/dashboard/roads", icon: MapPin },
  { name: "Reports", href: "/dashboard/reports", icon: FileText },
  { name: "Surveys", href: "/dashboard/surveys", icon: ClipboardCheck },
  { name: "Reviews", href: "/dashboard/reviews", icon: Star },
  { name: "Users", href: "/dashboard/users", icon: Users },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAdmin, adminVerified, user, logout } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated || !isAdmin || !adminVerified) {
      router.replace("/dashboard/login");
    }
  }, [mounted, isAuthenticated, isAdmin, adminVerified, router]);

  if (!mounted || !isAuthenticated || !isAdmin || !adminVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <Shield className="w-6 h-6 animate-pulse text-primary" />
          <span className="text-sm">Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-surface border-r border-border z-50 transition-transform lg:translate-x-0 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sp-gradient-primary rounded-xl flex items-center justify-center shadow-[0_4px_16px_var(--primary-glow)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-foreground tracking-tight">SafePath</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-3 py-2 space-y-1 flex-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-border space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 sp-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">
              {user?.name?.split(" ").map((n) => n[0]).join("") ?? "A"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted truncate">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              router.replace("/dashboard/login");
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Exit to Landing
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="lg:hidden bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 sticky top-0 z-30 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-surface-hover rounded-lg text-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-foreground">SafePath Admin</span>
        </div>

        {children}
      </main>
    </div>
  );
}
