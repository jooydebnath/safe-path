"use client";

import { MapPin, ArrowLeft, Plus, X, MessageSquare, Clock, Shield, AlertTriangle, Siren, Send, LocateFixed } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { typeLabels, typeColors, statusColors, verificationColors } from "@/lib/data";
import BottomNav from "@/components/BottomNav";

// Leaflet touches `window` at load time, so this must never render on the server.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="w-full h-56 rounded-2xl border border-border bg-surface animate-pulse" />,
});

type VerifFilter = "all" | "pending" | "safe" | "unsafe" | "objected";

export default function ReportsPage() {
  const { reports, roads, addReport } = useStore();
  const { user } = useAuth();

  const [filter, setFilter] = useState<VerifFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // form state
  const [fType, setFType] = useState<string>("harassment");
  const [fDescription, setFDescription] = useState("");
  const [fLocation, setFLocation] = useState("");
  const [fRoadId, setFRoadId] = useState("");
  const [fAnonymous, setFAnonymous] = useState(false);
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      alert("Location isn't available on this device/browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        alert("Couldn't get your location — check permissions and try again.");
        setLocating(false);
      },
      { timeout: 6000 }
    );
  };

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
    addReport({
      type: fType as "harassment" | "stalking" | "unsafe_area" | "lighting" | "other",
      description: fDescription.trim(),
      location: fLocation.trim(),
      area: road?.area ?? "Unknown",
      roadId: fRoadId,
      anonymous: fAnonymous,
      userName: user?.name,
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
    <div className="mobile-container bg-background">
      <header className="bg-surface/95 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/app" className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Community Reports</h1>
              <p className="text-[11px] text-muted">{reports.length} reports · labeled by admin</p>
            </div>
          </div>
          <button
            onClick={() => { setModalOpen(true); setSubmitted(false); }}
            className="w-9 h-9 sp-gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-3 pb-28">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                filter === t.key
                  ? "sp-gradient-primary text-white shadow-md shadow-[var(--primary-glow)]"
                  : "bg-surface-raised text-muted border border-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="sp-card p-3 text-center">
            <p className="text-xl font-extrabold text-foreground">{reports.length}</p>
            <p className="text-[10px] text-muted font-medium">Total</p>
          </div>
          <div className="sp-card p-3 text-center">
            <p className="text-xl font-extrabold text-warning">{reports.filter((r) => r.verification === "pending").length}</p>
            <p className="text-[10px] text-muted font-medium">Pending</p>
          </div>
          <div className="sp-card p-3 text-center">
            <p className="text-xl font-extrabold text-safe">{reports.filter((r) => r.verification === "safe").length}</p>
            <p className="text-[10px] text-muted font-medium">Verified Safe</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {filtered.map((report) => (
            <div key={report.id} className="sp-card p-4">
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
              <p className="text-sm text-muted-strong font-medium leading-snug mb-2">{report.description}</p>
              {report.objectionReason && (
                <p className="text-[11px] text-warning mb-2">⚠ Admin objection: {report.objectionReason}</p>
              )}
              <div className="flex items-center gap-3 text-[11px] text-muted">
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
                <div className="mt-2.5 pt-2.5 border-t border-border flex items-center gap-2">
                  <div className="w-5 h-5 bg-primary-soft rounded-full flex items-center justify-center">
                    <span className="text-[9px] font-bold text-primary">{report.userName.charAt(0)}</span>
                  </div>
                  <span className="text-[11px] text-muted font-medium">By {report.userName}</span>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-border-strong" />
              <p className="text-sm font-medium">No reports in this category</p>
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setModalOpen(false); setSubmitted(false); }} />
          <div className="relative sp-card rounded-b-none rounded-t-3xl w-full max-w-[480px] p-5 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
            {!submitted ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-extrabold text-foreground">Submit Report</h2>
                  <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
                    <X className="w-5 h-5 text-muted" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Issue Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFType(key)}
                          className={`p-3 rounded-xl border text-sm font-medium text-left transition-colors ${
                            fType === key ? "border-primary bg-primary-soft text-primary" : "border-border text-muted-strong hover:border-border-strong"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Road</label>
                    <p className="text-[11px] text-muted mb-2">Tap a pin on the map to pick the road — colors show its current safety status.</p>
                    <MapView
                      filter="all"
                      search=""
                      areaFilter="all"
                      heightClass="h-56"
                      fitAllRoads
                      selectedRoadId={fRoadId}
                      onSelectRoad={(id) => setFRoadId(id)}
                    />
                    {!fRoadId && (
                      <p className="mt-2 text-[11px] text-warning font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> No road selected yet — tap a pin above.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Description</label>
                    <textarea
                      value={fDescription}
                      onChange={(e) => setFDescription(e.target.value)}
                      placeholder="Describe what happened..."
                      className="w-full p-3 bg-surface-raised border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none h-24"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Location</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={fLocation}
                        onChange={(e) => setFLocation(e.target.value)}
                        placeholder="Enter specific location..."
                        className="flex-1 p-3 bg-surface-raised border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <button
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={locating}
                        title="Use my current location"
                        className="shrink-0 w-11 h-11 bg-primary-soft text-primary rounded-xl flex items-center justify-center disabled:opacity-50"
                      >
                        <LocateFixed className={`w-5 h-5 ${locating ? "animate-pulse" : ""}`} />
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fAnonymous}
                      onChange={(e) => setFAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded accent-primary"
                    />
                    <span className="text-sm text-muted-strong">Submit anonymously (hide my name)</span>
                  </label>

                  <button
                    onClick={handleSubmit}
                    disabled={!fDescription.trim() || !fLocation.trim() || !fRoadId}
                    className="w-full sp-gradient-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-[var(--primary-glow)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send className="w-4 h-4" />
                    Submit Report
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-safe-soft rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-safe" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground mb-1">Report Submitted!</h3>
                <p className="text-sm text-muted mb-5">Thank you for keeping the community safe. Admin will verify it shortly.</p>
                <button
                  onClick={() => { setModalOpen(false); setSubmitted(false); }}
                  className="bg-surface-hover border border-border text-foreground px-6 py-3 rounded-xl font-bold text-sm"
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
