"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";

const HEARTBEAT_INTERVAL_MS = 60_000;
const NEARBY_POLL_INTERVAL_MS = 25_000;

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    );
  });
}

/**
 * Powers the "🟢 N Active Users" badge. While logged in, pings the presence
 * heartbeat on an interval so this device counts toward the nearby total for
 * other users (and so it's reachable for SOS proximity broadcast); anyone
 * (logged in or not) polls the nearby-count endpoint using the device's last
 * known location, falling back to the app-wide count if location isn't
 * available.
 */
export function useActiveUsersNearby() {
  const { isAuthenticated } = useAuth();
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);

  // Heartbeat — logged-in users only, matching how SOS already requires auth.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const beat = async () => {
      const pos = await getPosition();
      if (cancelled || !pos) return;
      lastPos.current = pos;
      api.post("/presence/heartbeat", pos).catch(() => {});
    };

    beat();
    const id = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isAuthenticated]);

  // Nearby count poll — works whether or not we're logged in.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      const pos = lastPos.current ?? (await getPosition());
      lastPos.current = pos;
      try {
        const path = pos ? `/presence/nearby?lat=${pos.lat}&lng=${pos.lng}` : "/presence/nearby";
        const res = await api.get<{ count: number }>(path);
        if (!cancelled) setCount(res.count);
      } catch {
        // Leave the previous count showing rather than flashing to empty.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    poll();
    const id = setInterval(poll, NEARBY_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { count: count ?? 0, loading };
}
