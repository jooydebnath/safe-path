"use client";

import { useEffect, useRef } from "react";
import { getToken } from "./api";
import { useAuth } from "./auth";
import { NearbySosAlert } from "./data";

const WS_BASE = process.env.NEXT_PUBLIC_WS_BASE ?? "ws://localhost:8001";

/**
 * Opens (and keeps alive, with reconnect-on-drop) a WebSocket to the
 * per-user emergency channel-layer group, so this device gets pushed a live
 * notification whenever another nearby active user sends an SOS. Token is
 * passed as a query param — browsers can't set custom headers on a
 * WebSocket handshake, and this mirrors how the REST API already
 * authenticates with a bearer token.
 */
export function useEmergencySocket(onAlert: (alert: NearbySosAlert) => void) {
  const { isAuthenticated } = useAuth();
  const onAlertRef = useRef(onAlert);
  onAlertRef.current = onAlert;

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      socket = new WebSocket(`${WS_BASE}/ws/emergency?token=${encodeURIComponent(token)}`);

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as NearbySosAlert;
          onAlertRef.current(data);
        } catch {
          // Ignore malformed frames.
        }
      };

      socket.onclose = () => {
        if (stopped) return;
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, [isAuthenticated]);
}
