"use client";

import { ArrowLeft, ClipboardList, Send, CheckCircle2, XCircle, Clock, MapPin, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getRoadName, getRoadArea } from "@/lib/data";
import BottomNav from "@/components/BottomNav";

export default function SurveysPage() {
  const { surveys, roads, addSurvey } = useStore();
  const { user } = useAuth();

  const [roadId, setRoadId] = useState("");
  const [vote, setVote] = useState<"safe" | "unsafe">("safe");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadId || !user) return;
    addSurvey({
      roadId,
      userId: user.id,
      userName: user.name,
      safetyVote: vote,
      notes,
    });
    setSubmitted(true);
    setRoadId("");
    setNotes("");
    setVote("safe");
    setTimeout(() => setSubmitted(false), 2500);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return { icon: CheckCircle2, color: "bg-safe-soft text-safe", label: "Verified" };
      case "rejected":
        return { icon: XCircle, color: "bg-danger-soft text-danger", label: "Rejected" };
      default:
        return { icon: Clock, color: "bg-warning-soft text-warning", label: "Pending" };
    }
  };

  return (
    <div className="mobile-container bg-background">
      <header className="bg-surface/95 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-foreground">Safety Surveys</h1>
            <p className="text-[11px] text-muted">Vote routes safe / unsafe for admin verification</p>
          </div>
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
      </header>

      <div className="p-4 space-y-5 pb-28">
        {submitted && (
          <div className="bg-safe-soft border border-safe/30 rounded-2xl p-3 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
            <p className="text-xs text-safe font-medium">Survey submitted! Admin will review it.</p>
          </div>
        )}

        {/* Submit form */}
        <form onSubmit={handleSubmit} className="sp-card p-4 space-y-4">
          <h2 className="text-sm font-bold text-foreground">Submit a Safety Survey</h2>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Select Road</label>
            <select
              value={roadId}
              onChange={(e) => setRoadId(e.target.value)}
              required
              className="w-full p-3 bg-surface-raised border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Choose a road...</option>
              {roads.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Your Vote</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVote("safe")}
                className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  vote === "safe" ? "bg-safe text-white shadow-md" : "bg-surface-raised text-muted-strong border border-border"
                }`}
              >
                <Shield className="w-4 h-4" /> Safe
              </button>
              <button
                type="button"
                onClick={() => setVote("unsafe")}
                className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  vote === "unsafe" ? "bg-danger text-white shadow-md" : "bg-surface-raised text-muted-strong border border-border"
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Unsafe
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why do you consider this route safe or unsafe?"
              className="w-full p-3 bg-surface-raised border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none h-24"
            />
          </div>

          <button
            type="submit"
            disabled={!roadId}
            className="w-full sp-gradient-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-[var(--primary-glow)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
          >
            <Send className="w-4 h-4" /> Submit Survey
          </button>
        </form>

        {/* Recent surveys */}
        <section>
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Recent Surveys</h2>
          <div className="space-y-2.5">
            {surveys.map((sv) => {
              const badge = statusBadge(sv.status);
              const Icon = badge.icon;
              return (
                <div key={sv.id} className="sp-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.safetyVote === "safe" ? "bg-safe-soft text-safe" : "bg-danger-soft text-danger"}`}>
                        {sv.safetyVote === "safe" ? "Safe" : "Unsafe"}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${badge.color}`}>
                        <Icon className="w-3 h-3" /> {badge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted">{new Date(sv.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <p className="text-sm font-semibold text-foreground">{getRoadName(sv.roadId, roads)}</p>
                    <span className="text-[11px] text-muted">· {getRoadArea(sv.roadId, roads)}</span>
                  </div>
                  <p className="text-xs text-muted-strong leading-snug mb-2">{sv.notes}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[11px] text-muted font-medium">By {sv.userName}</span>
                    {sv.adminNotes && (
                      <span className="text-[10px] text-muted italic">Admin: {sv.adminNotes}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
