"use client";

import dynamic from "next/dynamic";
import { X, Siren, ExternalLink } from "lucide-react";

// Leaflet touches `window` at load time, so this must never render on the server.
const SosMap = dynamic(() => import("./SosMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-surface animate-pulse" />,
});

/** In-app map view for a single SOS alert's location, opened from the admin
 * SOS list instead of sending admins off to an external OpenStreetMap tab. */
export default function SosLocationModal({
  lat,
  lng,
  userName,
  onClose,
}: {
  lat: number;
  lng: number;
  userName: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative sp-card rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in flex flex-col" style={{ height: "min(80vh, 640px)" }}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-danger-soft rounded-xl flex items-center justify-center shrink-0">
              <Siren className="w-4 h-4 text-danger" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{userName}&apos;s SOS Location</p>
              <p className="text-[11px] text-muted">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-hover rounded-xl transition-colors shrink-0">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <SosMap lat={lat} lng={lng} />
        </div>

        <div className="p-3 border-t border-border shrink-0">
          <a
            href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted hover:text-muted-strong"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open in OpenStreetMap
          </a>
        </div>
      </div>
    </div>
  );
}
