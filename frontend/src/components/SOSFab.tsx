"use client";

import { Siren } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAlerts } from "@/lib/alerts";

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

/**
 * App-wide floating SOS button — sits above BottomNav on every screen under
 * /app (except the SOS page itself, which already has its own big button)
 * so emergency help is never more than one tap away, no matter where the
 * user is in the app. Confirms via the pop-up alert system, then sends the
 * same alert the full SOS screen does.
 */
export default function SOSFab() {
  const pathname = usePathname();
  const router = useRouter();
  const { sendSosAlert } = useStore();
  const { showAlert } = useAlerts();
  const [sending, setSending] = useState(false);

  if (pathname === "/app/sos") return null;

  const handlePress = async () => {
    if (sending) return;
    const confirmed = await showAlert({
      kind: "danger",
      title: "Send SOS Alert?",
      message:
        "This immediately notifies SafePath admins with your live location. Only use this in a real emergency.",
      confirmText: "Send SOS",
      cancelText: "Cancel",
    });
    if (!confirmed) return;

    setSending(true);
    try {
      const pos = await getLocation();
      await sendSosAlert(pos?.lat ?? null, pos?.lng ?? null);
      await showAlert({
        kind: "success",
        title: "Alert Sent",
        message: pos
          ? "Your location was shared with SafePath admins and nearby active users."
          : "Sent without a location fix — admins have been notified.",
        confirmText: "OK",
      });
    } catch {
      const openFullScreen = await showAlert({
        kind: "danger",
        title: "Couldn't Send Alert",
        message: "Check your connection and try again, or open the full SOS screen.",
        confirmText: "Open SOS Screen",
        cancelText: "Close",
      });
      if (openFullScreen) router.push("/app/sos");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 flex justify-end pointer-events-none z-40">
      <button
        onClick={handlePress}
        disabled={sending}
        aria-label="Send SOS alert"
        className="pointer-events-auto relative flex items-center justify-center rounded-full sp-gradient-primary shadow-[0_10px_32px_var(--primary-glow)] border-4 border-background active:scale-95 transition-transform disabled:opacity-70"
        style={{ width: "4.5rem", height: "4.5rem" }}
      >
        {!sending && <span className="absolute inset-0 rounded-full sp-gradient-primary sos-pulse" />}
        <Siren className="w-8 h-8 text-white relative z-10" strokeWidth={2.5} />
      </button>
    </div>
  );
}
