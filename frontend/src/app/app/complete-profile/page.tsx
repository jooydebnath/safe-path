"use client";

import { Shield, IdCard, AtSign, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

// Mandatory backfill screen for accounts created before NID + username were
// required. AppSectionLayout redirects any authenticated user with
// profileComplete=false here and won't let them past it — see the redirect
// logic in app/app/layout.tsx.
export default function CompleteProfilePage() {
  const router = useRouter();
  const { completeProfile, logout } = useAuth();
  const [nid, setNid] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nidDigitsOk = /^\d{10}$|^\d{13}$|^\d{17}$/.test(nid.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nidDigitsOk) {
      setError("NID must be a valid 10, 13, or 17 digit number");
      return;
    }
    setLoading(true);
    const res = await completeProfile(nid, username);
    setLoading(false);
    if (res.ok) {
      router.replace("/app");
    } else {
      setError(res.error ?? "Could not complete profile");
    }
  };

  return (
    <div className="mobile-container bg-background sp-glow flex flex-col">
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 sp-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_10px_30px_var(--primary-glow)]">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted mt-1 px-4">
            SafePath now requires NID verification for every account. Please confirm your details to keep using the app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">National ID (NID) Number</label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={nid}
                onChange={(e) => setNid(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="10, 13, or 17 digit NID number"
                maxLength={17}
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5 ml-1">Stored encrypted — never shown to other users. Reviewed by an admin before your account shows as verified.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Username <span className="normal-case text-muted font-medium">(optional)</span></label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="Leave blank to auto-generate"
                maxLength={30}
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5 ml-1">Your unique @handle. You can change it later from your profile.</p>
          </div>

          {error && (
            <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              <p className="text-xs text-danger font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sp-gradient-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_10px_30px_var(--primary-glow)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={logout} className="text-sm text-muted hover:text-foreground inline-flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Not you? Log out
          </button>
        </div>
      </div>
    </div>
  );
}
