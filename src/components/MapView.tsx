"use client";

import { useState } from "react";
import { MapPin, Star, X, Navigation, Plus, Minus, RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { getStatusColor, getRatingStars } from "@/lib/data";

interface MapViewProps {
  filter: "all" | "safe" | "caution" | "unsafe";
  search: string;
  areaFilter?: string;
}

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.2;

export default function MapView({ filter, search, areaFilter = "all" }: MapViewProps) {
  const { roads } = useStore();
  const [selectedRoad, setSelectedRoad] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const filtered = roads.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.area.toLowerCase().includes(search.toLowerCase());
    const matchesArea = areaFilter === "all" || !areaFilter || r.area === areaFilter;
    return matchesFilter && matchesSearch && matchesArea;
  });

  const lats = roads.map((r) => r.coordinates.lat);
  const lngs = roads.map((r) => r.coordinates.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const toScreen = (lat: number, lng: number) => {
    const padding = 40;
    const x = padding + ((lng - minLng) / lngRange) * (100 - 2 * padding);
    const y = 100 - padding - ((lat - minLat) / latRange) * (100 - 2 * padding);
    return { x, y };
  };

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "safe": return "bg-green-500 border-green-600";
      case "caution": return "bg-amber-500 border-amber-600";
      case "unsafe": return "bg-red-500 border-red-600";
      default: return "bg-gray-500 border-gray-600";
    }
  };

  const selected = filtered.find((r) => r.id === selectedRoad);

  const zoomIn = () => setZoom((z) => Math.min(+(z + ZOOM_STEP).toFixed(2), MAX_ZOOM));
  const zoomOut = () => setZoom((z) => Math.max(+(z - ZOOM_STEP).toFixed(2), MIN_ZOOM));
  const resetZoom = () => setZoom(1);

  const areaCentroids = (() => {
    const map = new Map<string, { lat: number; lng: number; count: number }>();
    for (const r of roads) {
      const e = map.get(r.area) ?? { lat: 0, lng: 0, count: 0 };
      e.lat += r.coordinates.lat;
      e.lng += r.coordinates.lng;
      e.count += 1;
      map.set(r.area, e);
    }
    const out: { area: string; x: number; y: number }[] = [];
    for (const [area, e] of map) {
      const pos = toScreen(e.lat / e.count, e.lng / e.count);
      out.push({ area, x: pos.x, y: pos.y });
    }
    return out;
  })();

  return (
    <div className="relative w-full h-[60vh] bg-[#e8e8e8] rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <div
        className="absolute inset-0"
        style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `20px 20px`,
          }}
        >
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }}>
            <line x1="10%" y1="30%" x2="85%" y2="35%" stroke="#ccc" strokeWidth="3" />
            <line x1="25%" y1="15%" x2="30%" y2="85%" stroke="#ccc" strokeWidth="2" />
            <line x1="50%" y1="10%" x2="55%" y2="90%" stroke="#ccc" strokeWidth="2" />
            <line x1="10%" y1="60%" x2="90%" y2="65%" stroke="#ccc" strokeWidth="2" />
            <line x1="70%" y1="20%" x2="75%" y2="80%" stroke="#ccc" strokeWidth="2" />
            <ellipse cx="70%" cy="50%" rx="12%" ry="8%" fill="#b8d4e3" opacity="0.5" />
            <rect x="15%" y="50%" width="15%" height="12%" fill="#a8d5a2" opacity="0.4" rx="4" />
          </svg>
        </div>

        {areaCentroids.map((a) => (
          <div
            key={a.area}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-semibold bg-white/70 px-1.5 py-0.5 rounded pointer-events-none"
            style={{ left: `${a.x}%`, top: `${a.y - 6}%` }}
          >
            {a.area}
          </div>
        ))}

        {filtered.map((road) => {
          const pos = toScreen(road.coordinates.lat, road.coordinates.lng);
          return (
            <button
              key={road.id}
              onClick={() => setSelectedRoad(road.id === selectedRoad ? null : road.id)}
              className="absolute transform -translate-x-1/2 -translate-y-full group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {road.status === "unsafe" && (
                <span className="absolute inset-0 -m-1 rounded-full bg-red-400/30 sos-pulse" />
              )}
              <div className={`relative w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg ${getMarkerColor(road.status)}`}>
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  {road.name}
                </div>
              </div>
            </button>
          );
        })}

        <div className="absolute top-[48%] left-[38%] transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg relative">
            <span className="absolute inset-0 rounded-full bg-blue-400/40 sos-pulse" />
          </div>
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] text-blue-600 font-medium whitespace-nowrap bg-white/80 px-1 rounded">You</span>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-gray-100 p-2.5 z-10">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-600" />
            <span className="text-[10px] text-gray-600 font-medium">Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600" />
            <span className="text-[10px] text-gray-600 font-medium">Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-600" />
            <span className="text-[10px] text-gray-600 font-medium">Unsafe</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
        >
          <Minus className="w-5 h-5" />
        </button>
        <button
          onClick={resetZoom}
          className="w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95"
          title="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 px-2.5 py-1 z-10">
        <span className="text-[11px] font-bold text-gray-700">Zoom: {zoom.toFixed(1)}x</span>
      </div>

      <button className="absolute top-3 left-3 w-9 h-9 bg-white rounded-lg shadow-md flex items-center justify-center text-blue-600 hover:bg-gray-50 active:scale-95 z-10">
        <Navigation className="w-5 h-5" />
      </button>

      {selected && (
        <div className="absolute bottom-14 left-3 right-3 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">{selected.name}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-2">{selected.area}</p>
              <div className="flex items-center gap-1">
                {(() => {
                  const stars = getRatingStars(selected.rating);
                  return (
                    <>
                      {Array.from({ length: stars.full }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                      {Array.from({ length: stars.empty }).map((_, i) => (
                        <Star key={`e${i}`} className="w-3.5 h-3.5 text-gray-300" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{selected.rating} ({selected.reviews} reviews)</span>
                    </>
                  );
                })()}
              </div>
              {selected.lastIncident && (
                <p className="text-[11px] text-red-500 mt-2">⚠️ Last incident: {selected.lastIncident}</p>
              )}
            </div>
            <button onClick={() => setSelectedRoad(null)} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
