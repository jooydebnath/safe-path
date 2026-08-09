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
  const { user, isAuthenticated } = useAuth();

  const [roadId, setRoadId] = useState("");
  const [vote, setVote] = useState<"safe" | "unsafe">("safe");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadId) return;
    addSurvey({
      roadId,
      userId: user?.id ?? "guest",
      userName: user?.name ?? "Guest",
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
        return { icon: CheckCircle2, color: "bg-green-100 text-green-700", label: "Verified" };
      case "rejected":
        return { icon: XCircle, color: "bg-red-100 text-red-700", label: "Rejected" };
      default:
        return { icon: Clock, color: "bg-yellow-100 text-yellow-700", label: "Pending" };
    }
  };

  return (
    <div className="mobile-container bg-gray-50">
      <header className="bg-white p-4 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Safety Surveys</h1>
            <p className="text-[11px] text-gray-400">Vote routes safe / unsafe for admin verification</p>
          </div>
          <ClipboardList className="w-5 h-5 text-rose-500" />
        </div>
      </header>

      <div className="p-4 space-y-5 pb-24">
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">
              Browsing as Guest. <Link href="/app/login" className="underline">Login</Link> to submit surveys under your name.
            </p>
          </div>
        )}

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700 font-medium">Survey submitted! Admin will review it.</p>
          </div>
        )}

        {/* Submit form */}
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Submit a Safety Survey</h2>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Select Road</label>
            <select
              value={roadId}
              onChange={(e) => setRoadId(e.target.value)}
              required
              className="w-full p-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 border border-gray-100"
            >
              <option value="">Choose a road...</option>
              {roads.map((r) => (
                <option key={r.id} value={r.id}>{r.name} — {r.area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Your Vote</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVote("safe")}
                className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  vote === "safe" ? "bg-green-500 text-white shadow-md" : "bg-gray-50 text-gray-600 border border-gray-200"
                }`}
              >
                <Shield className="w-4 h-4" /> Safe
              </button>
              <button
                type="button"
                onClick={() => setVote("unsafe")}
                className={`p-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  vote === "unsafe" ? "bg-red-500 text-white shadow-md" : "bg-gray-50 text-gray-600 border border-gray-200"
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Unsafe
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why do you consider this route safe or unsafe?"
              className="w-full p-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none h-24 border border-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={!roadId}
            className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit Survey
          </button>
        </form>

        {/* Recent surveys */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Surveys</h2>
          <div className="space-y-2.5">
            {surveys.map((sv) => {
              const badge = statusBadge(sv.status);
              const Icon = badge.icon;
              return (
                <div key={sv.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${sv.safetyVote === "safe" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {sv.safetyVote === "safe" ? "Safe" : "Unsafe"}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${badge.color}`}>
                        <Icon className="w-3 h-3" /> {badge.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">{new Date(sv.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <p className="text-sm font-semibold text-gray-900">{getRoadName(sv.roadId, roads)}</p>
                    <span className="text-[11px] text-gray-400">· {getRoadArea(sv.roadId, roads)}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-snug mb-2">{sv.notes}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-[11px] text-gray-500 font-medium">By {sv.userName}</span>
                    {sv.adminNotes && (
                      <span className="text-[10px] text-gray-400 italic">Admin: {sv.adminNotes}</span>
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
