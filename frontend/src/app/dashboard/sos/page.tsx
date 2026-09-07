"use client";

import { ChevronLeft, Siren, MapPin, Phone, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import SosLocationModal from "@/components/SosLocationModal";
import { useStore } from "@/lib/store";
import { SosAlert } from "@/lib/data";

export default function DashboardSosPage() {
  const { sosAlerts, refreshSosAlerts, resolveSosAlert } = useStore();
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [resolving, setResolving] = useState<string | null>(null);
  const [mapAlert, setMapAlert] = useState<SosAlert | null>(null);

  useEffect(() => {
    refreshSosAlerts();
    // Poll for new emergency alerts while the page is open.
    const timer = setInterval(refreshSosAlerts, 15000);
    return () => clearInterval(timer);
  }, [refreshSosAlerts]);

  const filtered = useMemo(
    () => sosAlerts.filter((a) => statusFilter === "all" || a.status === statusFilter),
    [sosAlerts, statusFilter]
  );

  const activeCount = sosAlerts.filter((a) => a.status === "active").length;

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await resolveSosAlert(id);
    } finally {
      setResolving(null);
    }
  };

  return (
    <DashboardLayout>
      <header className="bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-muted hover:text-muted-strong text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">SOS Alerts</h1>
          </div>
          <span className="text-xs text-muted">{filtered.length} of {sosAlerts.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="sp-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-danger-soft rounded-xl flex items-center justify-center">
              <Siren className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{activeCount}</p>
              <p className="text-sm text-muted">Active Alerts</p>
            </div>
          </div>
          <div className="sp-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-safe-soft rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-safe" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{sosAlerts.length - activeCount}</p>
              <p className="text-sm text-muted">Resolved</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {(["all", "active", "resolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === f ? "sp-gradient-primary text-white shadow-[0_6px_18px_var(--primary-glow)]" : "bg-surface text-muted border border-border"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted">
            <Siren className="w-10 h-10 mx-auto mb-3 text-border-strong" />
            <p className="text-sm font-medium">No SOS alerts</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              className={`bg-surface rounded-2xl border p-4 ${alert.status === "active" ? "border-danger/40" : "border-border"}`}
            >
              <div className="flex items-start justify-between mb-2 flex-wrap gap-1">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${alert.status === "active" ? "bg-danger-soft" : "bg-surface-raised"}`}>
                    <Siren className={`w-4 h-4 ${alert.status === "active" ? "text-danger" : "text-muted"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{alert.userName}</p>
                    {alert.userPhone && (
                      <p className="text-xs text-muted flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {alert.userPhone}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    alert.status === "active" ? "bg-danger-soft text-danger" : "bg-safe-soft text-safe"
                  }`}
                >
                  {alert.status === "active" ? "Active" : "Resolved"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {new Date(alert.timestamp).toLocaleString()}
                </span>
                {alert.lat != null && alert.lng != null ? (
                  <button
                    onClick={() => setMapAlert(alert)}
                    className="flex items-center gap-1 text-info hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" /> View location
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-muted">
                    <MapPin className="w-3.5 h-3.5" /> Location unavailable
                  </span>
                )}
              </div>

              {alert.status === "active" && (
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolving === alert.id}
                  className="w-full text-xs font-bold py-2 rounded-lg bg-safe-soft text-safe hover:brightness-110 flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> {resolving === alert.id ? "Marking Resolved..." : "Mark Resolved"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {mapAlert && mapAlert.lat != null && mapAlert.lng != null && (
        <SosLocationModal
          lat={mapAlert.lat}
          lng={mapAlert.lng}
          userName={mapAlert.userName}
          onClose={() => setMapAlert(null)}
        />
      )}
    </DashboardLayout>
  );
}
