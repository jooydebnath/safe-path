"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Road } from "@/lib/data";
import { TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapTiles";

const STATUS_HEX: Record<string, string> = { safe: "#22c55e", caution: "#f59e0b", unsafe: "#ef4444" };

function endpointIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const originIcon = endpointIcon("#3b82f6");
const destIcon = endpointIcon("#e11d48");

/** Fits the map to the drawn line whenever the route (or its endpoints)
 * change. */
function FitToRoute({ line }: { line: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (line.length === 0) return;
    const bounds = L.latLngBounds(line);
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.length, line[0]?.[0], line[0]?.[1], line[line.length - 1]?.[0], line[line.length - 1]?.[1]]);
  return null;
}

/**
 * Draws the route between two picked points, plus any roads flagged as
 * caution/unsafe along it — used by the Directions page as the visual
 * companion to the server's route-safety verdict. Deliberately separate
 * from MapView (which is a full "browse all roads" map) since this only
 * ever needs two endpoints and an overlay line.
 *
 * `routePolyline`, when given, is the actual road-following path (from
 * OSRM, via the backend's route-safety response) and is drawn instead of
 * the plain 2-point straight line between origin and dest.
 */
export default function RouteMap({
  origin,
  dest,
  routePolyline,
  flaggedRoads = [],
  routeStatus = "safe",
}: {
  origin: { lat: number; lng: number };
  dest: { lat: number; lng: number };
  routePolyline?: { lat: number; lng: number }[] | null;
  flaggedRoads?: Road[];
  routeStatus?: "safe" | "caution" | "unsafe";
}) {
  const originPos: [number, number] = [origin.lat, origin.lng];
  const destPos: [number, number] = [dest.lat, dest.lng];
  const lineColor = STATUS_HEX[routeStatus] ?? "#6b7280";
  const line: [number, number][] =
    routePolyline && routePolyline.length > 1
      ? routePolyline.map((p) => [p.lat, p.lng])
      : [originPos, destPos];

  return (
    <div className="relative w-full h-[42vh] rounded-2xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <MapContainer center={originPos} zoom={13} zoomControl={false} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ZoomControl position="bottomright" />
        <FitToRoute line={line} />
        <Polyline
          positions={line}
          pathOptions={{ color: lineColor, weight: 5, opacity: 0.85, dashArray: routeStatus === "safe" ? undefined : "2 10" }}
        />
        <Marker position={originPos} icon={originIcon} />
        <Marker position={destPos} icon={destIcon} />
        {flaggedRoads.map((road) => (
          <Marker key={road.id} position={[road.coordinates.lat, road.coordinates.lng]} icon={endpointIcon(STATUS_HEX[road.status] ?? "#6b7280")} />
        ))}
      </MapContainer>
    </div>
  );
}
