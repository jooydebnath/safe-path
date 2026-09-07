"use client";

import { Siren, Phone, MapPin, ArrowLeft, AlertTriangle, Shield, ShieldAlert, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { useStore } from "@/lib/store";

const emergencyContacts = [
  { name: "Police", number: "999", desc: "National Emergency", color: "bg-info-soft text-info" },
  { name: "Women Support", number: "109", desc: "Violence Helpline", color: "bg-primary-soft text-primary" },
  { name: "Fire Service", number: "9555555", desc: "Fire Emergency", color: "bg-warning-soft text-warning" },
  { name: "Ambulance", number: "199", desc: "Medical Emergency", color: "bg-safe-soft text-safe" },
];

type Phase = "idle" | "sending" | "sent" | "failed";

function getLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      // Same fix as app/page.tsx and app/map/page.tsx: a tight timeout with
      // no maximumAge races its own fresh GPS lock against the one
      // LocationGate just obtained to unlock the app, usually loses, and
      // silently sends the SOS alert with no location. Generous timeout +
      // willingness to reuse a recent fix avoids that.
      { timeout: 15000, maximumAge: 120000 }
    );
  });
}

export default function SOSPage() {
  const { sendSosAlert } = useStore();
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(5);
  const [pulses, setPulses] = useState<number[]>([]);
  const [locationShared, setLocationShared] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (phase !== "sending") return;
    let count = 5;
    setCountdown(5);
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(Math.max(count, 0));
      if (count <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const triggerSOS = async () => {
    if (phase === "sending") return;
    setPhase("sending");
    setPulses([1, 2, 3]);
    setError("");

    // Keep a ~5s "sending" beat (matches the countdown UI) while we get a
    // location fix in parallel, then actually record the alert.
    const [pos] = await Promise.all([getLocation(), new Promise((r) => setTimeout(r, 5000))]);

    try {
      await sendSosAlert(pos?.lat ?? null, pos?.lng ?? null);
      setLocationShared(!!pos);
      setPhase("sent");
    } catch {
      setError("Couldn't send the alert — check your connection and try again.");
      setPhase("failed");
    }
  };

  const reset = () => {
    setPhase("idle");
    setPulses([]);
    setError("");
  };

  return (
    <div className="mobile-container bg-background">
      {/* Header */}
      <header className="sp-gradient-primary text-white p-4 sticky top-0 z-10 shadow-[0_4px_20px_var(--primary-glow)]">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-white/20 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-extrabold tracking-tight">Emergency SOS</h1>
        </div>
      </header>

      <div className="p-4 space-y-5 pb-28">
        {/* Warning Banner */}
        <div className="bg-warning-soft border border-warning/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-warning">Emergency Only</p>
            <p className="text-xs text-muted-strong mt-1 leading-relaxed">
              Use this feature only in real emergencies. This records an alert with your location that
              SafePath admins can see — it does not call the police for you. For immediate danger, use the
              Police number below.
            </p>
          </div>
        </div>

        {/* SOS Button */}
        <div className="flex flex-col items-center py-4">
          {phase === "idle" ? (
            <div className="relative">
              {pulses.map((p) => (
                <div key={p} className="absolute inset-0 rounded-full sp-gradient-primary sos-pulse" style={{ animationDelay: `${p * 0.3}s` }} />
              ))}
              <button
                onClick={triggerSOS}
                className="relative w-52 h-52 rounded-full sp-gradient-primary shadow-[0_20px_60px_var(--primary-glow)] flex flex-col items-center justify-center active:scale-95 transition-transform border-4 border-background"
              >
                <span className="absolute inset-3 rounded-full border-2 border-white/25" />
                <Siren className="w-14 h-14 text-white mb-2" strokeWidth={2.25} />
                <span className="text-white font-extrabold text-2xl tracking-wide">SOS</span>
                <span className="text-white/85 text-xs font-semibold mt-1">Tap to Alert</span>
              </button>
            </div>
          ) : phase === "sending" ? (
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-warning to-amber-600 shadow-[0_20px_60px_rgba(251,191,36,0.35)] flex flex-col items-center justify-center border-4 border-background">
              <span className="text-white font-extrabold text-6xl">{countdown}</span>
              <span className="text-white/85 text-sm font-semibold mt-2">Sending alert...</span>
            </div>
          ) : phase === "sent" ? (
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-safe to-emerald-600 shadow-[0_20px_60px_rgba(52,211,153,0.35)] flex flex-col items-center justify-center border-4 border-background">
              <Shield className="w-14 h-14 text-white mb-2" />
              <span className="text-white font-extrabold text-xl">Alert Sent!</span>
              <span className="text-white/85 text-xs font-semibold mt-1 text-center px-4">Admins + nearby users notified</span>
            </div>
          ) : (
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-muted-strong to-muted shadow-2xl flex flex-col items-center justify-center border-4 border-background">
              <ShieldAlert className="w-14 h-14 text-white mb-2" />
              <span className="text-white font-extrabold text-lg">Failed to Send</span>
            </div>
          )}
        </div>

        {phase === "failed" && (
          <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3 flex items-center gap-3">
            <p className="text-xs text-danger font-medium flex-1">{error}</p>
            <button
              onClick={triggerSOS}
              className="flex items-center gap-1.5 sp-gradient-primary text-white text-xs font-bold px-3 py-2 rounded-lg shrink-0 shadow-[0_6px_18px_var(--primary-glow)]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Status Cards */}
        {phase === "sent" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="sp-card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${locationShared ? "bg-safe-soft" : "bg-surface-raised"}`}>
                <MapPin className={`w-5 h-5 ${locationShared ? "text-safe" : "text-muted"}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Location</p>
                <p className="text-[10px] text-muted">{locationShared ? "Shared" : "Unavailable"}</p>
              </div>
            </div>
            <div className="sp-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-soft rounded-xl flex items-center justify-center">
                <Siren className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Admin Panel</p>
                <p className="text-[10px] text-muted">Alert recorded</p>
              </div>
            </div>
          </div>
        )}

        {phase === "sent" && (
          <button
            onClick={reset}
            className="w-full text-center text-xs font-bold text-muted hover:text-muted-strong py-1"
          >
            Send another alert
          </button>
        )}

        {/* Emergency Contacts */}
        <section>
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">
            Emergency Contacts
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="sp-card p-3.5 flex flex-col items-center text-center gap-2 active:bg-surface-hover transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${contact.color}`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{contact.name}</p>
                  <p className="text-[10px] text-muted font-medium">{contact.desc}</p>
                </div>
                <span className="text-xs font-extrabold text-primary bg-primary-soft px-3 py-1 rounded-lg">{contact.number}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
