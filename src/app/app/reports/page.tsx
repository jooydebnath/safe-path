"use client";

import { MapPin, ArrowLeft, Plus, X, MessageSquare, Clock, Shield, AlertTriangle, Siren, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { typeLabels, typeColors, statusColors, verificationColors } from "@/lib/data";
import BottomNav from "@/components/BottomNav";

type VerifFilter = "all" | "pending" | "safe" | "unsafe" | "objected";

export default function ReportsPage() {
  const { reports, roads, addReport } = useStore();
  const { user, isAuthenticated } = useAuth();

  const [filter, setFilter] = useState<VerifFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // form state
  const [fType, setFType] = useState<string>("harassment");
  const [fDescription, setFDescription] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fRoadId, setFRoadId] = useState("");
  const [fAnonymous, setFAnonymous] = useState(false);

  const filtered = filter === "all" ? reports : reports.filter((r) => r.verification === filter);

  const typeIcon = (type: string) => {
    switch (type) {
      case "harassment": return <AlertTriangle className="w-4 h-4" />;
      case "stalking": return <Shield className="w-4 h-4" />;
      case "unsafe_area": return <MapPin className="w-4 h-4" />;
      case "lighting": return <Clock className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const resetForm = () => {
    setFType("harassment"); setFDescription(""); setFLocation(""); setFRoadId(""); setFAnonymous(false);
  };

  const handleSubmit = () => {
    if (!fDescription.trim() || !fLocation.trim() || !fRoadId) return;
    const road = roads.find((r) => r.id === fRoadId);
    const guest = !isAuthenticated;
    addReport({
      type: fType as "harassment" | "stalking" | "unsafe_area" | "lighting" | "other",
      description: fDescription.trim(),
      location: fLocation.trim(),
      area: road?.area ?? "Unknown",
      roadId: fRoadId,
      anonymous: guest ? true : fAnonymous,
      userName: guest ? undefined : user?.name,
    });
    resetForm();
    setSubmitted(true);
  };

  const filterTabs: { key: VerifFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "safe", label: "Verified Safe" },
    { key: "unsafe", label: "Verified Unsafe" },
    { key: "objected", label: "Objected" },
  ];

  return (
    <div className="mobile-container bg-gray-50">
      <header className="bg-white p-4 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-gray-100 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Community Reports</h1>
              <p className="text-[11px] text-gray-400">{reports.length} reports · labeled by admin</p>
            </div>
          </div>
          <button
            onClick={() => { setModalOpen(true); setSubmitted(false); }}
            className="w-9 h-9 bg-rose-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-200 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3 pb-24">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                filter === t.key
                  ? "bg-rose-500 text-white shadow-md shadow-rose-200"
                  : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-extrabold text-gray-900">{reports.length}</p>
            <p className="text-[10px] text-gray-400 font-medium">Total</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-extrabold text-amber-500">{reports.filter((r) => r.verification === "pending").length}</p>
            <p className="text-[10px] text-gray-400 font-medium">Pending</p>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xl font-extrabold text-green-500">{reports.filter((r) => r.verification === "safe").length}</p>
            <p className="text-[10px] text-gray-400 font-medium">Verified Safe</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((report) => (
            <div key={report.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${typeColors[report.type].split(" ")[0]}`}>
                    {typeIcon(report.type)}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${typeColors[report.type]}`}>
                    {typeLabels[report.type]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${verificationColors[report.verification]}`}>
                    {report.verification}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[report.status]}`}>
                    {report.status}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 font-medium leading-snug mb-2">{report.description}</p>
              {report.objectionReason && (
                <p className="text-[11px] text-orange-600 mb-2">⚠ Admin objection: {report.objectionReason}</p>
              )}
              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {report.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(report.timestamp).toLocaleDateString()}
                </span>
              </div>
              {!report.anonymous && report.userName && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-50 flex items-center gap-2">
                  <div className="w-5 h-5 bg-rose-100 rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-rose-600">{report.userName.charAt(0)}</span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">By {report.userName}</span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No reports in this category</p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setModalOpen(false); setSubmitted(false); }} />
          <div className="relative bg-white rounded-t-3xl w-full max-w-[480px] p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Submit Report</h2>
                  <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Issue Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFType(key)}
                          className={`p-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                            fType === key ? "border-rose-300 bg-rose-50 text-rose-700" : "border-gray-200 text-gray-600 hover:border-rose-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Road</label>
                    <select
                      value={fRoadId}
                      onChange={(e) => setFRoadId(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 border border-gray-100"
                    >
                      <option value="">Select a road...</option>
                      {roads.map((r) => (
                        <option key={r.id} value={r.id}>{r.name} — {r.area}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
                    <textarea
                      value={fDescription}
                      onChange={(e) => setFDescription(e.target.value)}
                      placeholder="Describe what happened..."
                      className="w-full p-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none h-24 border border-gray-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Location</label>
                    <input
                      type="text"
                      value={fLocation}
                      onChange={(e) => setFLocation(e.target.value)}
                      placeholder="Enter specific location..."
                      className="w-full p-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 border border-gray-100"
                    />
                  </div>

                  {isAuthenticated ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fAnonymous}
                        onChange={(e) => setFAnonymous(e.target.checked)}
                        className="w-4 h-4 rounded accent-rose-500"
                      />
                      <span className="text-sm text-gray-600">Submit anonymously (hide my name)</span>
                    </label>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-700">
                      Browsing as guest — report will be submitted anonymously. <Link href="/app/login" className="underline font-semibold">Login</Link> to attach your name.
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={!fDescription.trim() || !fLocation.trim() || !fRoadId}
                    className="w-full bg-rose-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    Submit Report
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Report Submitted!</h3>
                <p className="text-sm text-gray-500 mb-5">Thank you for keeping the community safe. Admin will verify it shortly.</p>
                <button
                  onClick={() => { setModalOpen(false); setSubmitted(false); }}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
