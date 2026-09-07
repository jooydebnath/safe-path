"use client";

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from "react";
import AlertPopup, { AlertPopupData } from "@/components/AlertPopup";

interface QueuedAlert extends AlertPopupData {
  id: number;
}

interface AlertContextValue {
  // Resolves true on confirm, false on cancel/dismiss. Alerts queue and
  // show one at a time so an SOS confirmation never gets silently
  // clobbered by, say, a "location unavailable" notice firing at once.
  showAlert: (data: AlertPopupData) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueuedAlert[]>([]);
  const resolvers = useRef(new Map<number, (confirmed: boolean) => void>());
  const nextId = useRef(0);

  const showAlert = useCallback((data: AlertPopupData) => {
    return new Promise<boolean>((resolve) => {
      const id = nextId.current++;
      resolvers.current.set(id, resolve);
      setQueue((q) => [...q, { ...data, id }]);
    });
  }, []);

  const close = (id: number, confirmed: boolean) => {
    resolvers.current.get(id)?.(confirmed);
    resolvers.current.delete(id);
    setQueue((q) => q.filter((a) => a.id !== id));
  };

  const current = queue[0];

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {current && <AlertPopup data={current} onClose={(confirmed) => close(current.id, confirmed)} />}
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
