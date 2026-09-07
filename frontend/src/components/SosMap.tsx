"use client";

import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapTiles";

// Pulsing red teardrop — reads as "emergency" at a glance, distinct from
// MapView's plain blue/status pins.
const alertIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:48px;">
      <span class="sos-pulse" style="position:absolute;left:0;top:12px;width:36px;height:36px;border-radius:9999px;background:#ef444455;"></span>
      <div style="position:relative;width:36px;height:48px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));">
        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none">
          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0Z" fill="#ef4444"/>
          <circle cx="18" cy="18" r="7" fill="#fff"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
});

/**
 * Minimal single-pin Leaflet map for showing one SOS alert's location
 * in-app (inside SosLocationModal). Deliberately doesn't depend on the
 * roads store the way MapView does — an admin looking at one alert doesn't
 * need the whole road-status layer, just "where is this person".
 *
 * Must only ever be loaded via `next/dynamic` with `ssr: false` — Leaflet
 * touches `window` at import time.
 */
export default function SosMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      className="w-full h-full"
      zoomControl={false}
      scrollWheelZoom
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ZoomControl position="bottomright" />
      <Marker position={[lat, lng]} icon={alertIcon} />
    </MapContainer>
  );
}
