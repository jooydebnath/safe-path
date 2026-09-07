"use client";

import { ArrowLeft, LogOut, Mail, AtSign, MapPin, IdCard, ShieldCheck, Clock, ShieldAlert, ShieldX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useAlerts } from "@/lib/alerts";
import BottomNav from "@/components/BottomNav";

const NID_META: Record<
  string,
  { label: string; className: string; icon: typeof ShieldCheck }
> = {
  verified: { label: "Verified", className: "bg-safe-soft text-safe", icon: ShieldCheck },
  pending: { label: "Pending Review", className: "bg-warning-soft text-warning", icon: Clock },
  rejected: { label: "Rejected", className: "bg-danger-soft text-danger", icon: ShieldX },
  not_submitted: { label: "Not Submitted", className: "bg-surface-raised text-muted", icon: ShieldAlert },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showAlert } = useAlerts();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase())
      .join("") || "U";

  const nidMeta = NID_META[user?.nidStatus ?? "not_submitted"];
  const NidIcon = nidMeta.icon;

  const handleLogout = async () => {
    const confirmed = await showAlert({
      kind: "danger",
      title: "Log Out?",
      message: "You'll need to log back in to send SOS alerts or view the map.",
      confirmText: "Log Out",
      cancelText: "Cancel",
    });
    if (!confirmed) return;
    setLoggingOut(true);
    logout();
    router.replace("/app/login");
  };

  return (
    <div className="mobile-container bg-background">
      <header className="sp-gradient-primary text-white p-4 sticky top-0 z-10 shadow-[0_4px_20px_var(--primary-glow)]">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight">Profile</h1>
        </div>
      </header>

      <div className="p-4 space-y-5 pb-28">
        <div className="sp-card p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl sp-gradient-primary flex items-center justify-center text-white font-extrabold text-xl shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
            <span className={`inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-1 rounded-full ${nidMeta.className}`}>
              <NidIcon className="w-3 h-3" /> {nidMeta.label}
            </span>
          </div>
        </div>

        <div className="sp-card divide-y divide-border overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 bg-primary-soft rounded-xl flex items-center justify-center shrink-0">
              <AtSign className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted font-medium">Username</p>
              <p className="text-sm font-semibold text-foreground truncate">{user?.username ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 bg-primary-soft rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted font-medium">Email</p>
              <p className="text-sm font-semibold text-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 bg-primary-soft rounded-xl flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted font-medium">Area</p>
              <p className="text-sm font-semibold text-foreground truncate">{user?.area || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4">
            <div className="w-9 h-9 bg-primary-soft rounded-xl flex items-center justify-center shrink-0">
              <IdCard className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted font-medium">NID Verification</p>
              <p className="text-sm font-semibold text-foreground truncate">{nidMeta.label}</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-danger bg-danger-soft py-3.5 rounded-2xl active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          <LogOut className="w-4 h-4" /> {loggingOut ? "Logging Out..." : "Log Out"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
