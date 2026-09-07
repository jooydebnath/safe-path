"use client";

import { useRouter } from "next/navigation";
import { useEmergencySocket } from "@/lib/emergencySocket";
import { useAlerts } from "@/lib/alerts";

/**
 * No UI of its own — just wires the live emergency WebSocket (see
 * lib/emergencySocket.ts) into the existing pop-up alert queue, so a nearby
 * user's SOS surfaces as the same kind of pop-up already used for SOS
 * confirmations. Mount once, inside AlertProvider, under /app.
 */
export default function EmergencyListener() {
  const { showAlert } = useAlerts();
  const router = useRouter();

  useEmergencySocket((alert) => {
    showAlert({
      kind: "danger",
      title: "Someone Nearby Needs Help",
      message: `${alert.userName} sent an SOS alert close to your location. If you're nearby and it's safe to do so, consider checking on them or alerting authorities.`,
      confirmText: "View on Map",
      cancelText: "Dismiss",
    }).then((viewOnMap) => {
      if (viewOnMap) {
        // Hand the alert's coordinates off to /app/map via the URL — the
        // page reads these into its `searchedLocation` state so the pin
        // actually lands on the SOS alert instead of just re-centering on
        // the viewer's own location.
        const params = new URLSearchParams();
        if (alert.lat != null) params.set("sosLat", String(alert.lat));
        if (alert.lng != null) params.set("sosLng", String(alert.lng));
        params.set("sosLabel", `${alert.userName}'s SOS`);
        router.push(`/app/map?${params.toString()}`);
      }
    });
  });

  return null;
}
