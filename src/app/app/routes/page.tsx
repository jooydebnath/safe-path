"use client";

import { MapPin, ArrowLeft, Search, Star, CheckCircle2, AlertTriangle, Route as RouteIcon } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { getStatusColor, getRatingStars, getStatusBorder } from "@/lib/data";
import BottomNav from "@/components/BottomNav";

export default function RoutesPage() {
  const { roads } = useStore();
  const [filter, setFilter] = useState<"all" | "safe" | "caution" | "unsafe">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return roads.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter;
      const matchesSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.area.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [roads, filter, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const r of filtered) {
      const arr = map.get(r.area) ?? [];
      arr.push(r);
      map.set(r.area, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const counts = {
    all: roads.length,
    safe: roads.filter((r) => r.status === "safe").length,
    caution: roads.filter((r) => r.status === "caution").length,
    unsafe: roads.filter((r) => r.status === "unsafe").length,
  };

  return (
    <div className="mobile-container bg-gray-50">
      <header className="bg-white p-4 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/app" className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Safe / Unsafe Routes</h1>
            <p className="text-[11px] text-gray-400">{roads.length} roads across {grouped.length} areas</p>
          </div>
          <RouteIcon className="w-5 h-5 text-rose-500" />
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roads or areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {(["all", "safe", "caution", "unsafe"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? f === "safe" ? "bg-green-500 text-white" : f === "caution" ? "bg-amber-500 text-white" : f === "unsafe" ? "bg-red-500 text-white" : "bg-rose-500 text-white"
                  : "bg-white text-gray-500 border border-gray-100"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-5 pb-24">
        {grouped.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <RouteIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">No roads found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        )}

        {grouped.map(([area, areaRoads]) => (
          <section key={area}>
            <div className="flex items-center gap-2 mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{area}</h2>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{areaRoads.length}</span>
            </div>
            <div className="space-y-2.5">
              {areaRoads.map((road) => {
                const stars = getRatingStars(road.rating);
                return (
                  <Link href="/app/map" key={road.id} className="block">
                    <div className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${getStatusBorder(road.status)} active:scale-[0.98] transition-transform`}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${road.status === "safe" ? "bg-green-50" : road.status === "caution" ? "bg-amber-50" : "bg-red-50"}`}>
                            <MapPin className={`w-5 h-5 ${road.status === "safe" ? "text-green-500" : road.status === "caution" ? "text-amber-500" : "text-red-500"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-sm text-gray-900">{road.name}</h3>
                              {road.verifiedByAdmin && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400">{road.area}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getStatusColor(road.status)}`}>
                          {road.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pl-[50px]">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: stars.full }).map((_, i) => (
                            <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                          {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                          {Array.from({ length: stars.empty }).map((_, i) => (
                            <Star key={`e-${i}`} className="w-3.5 h-3.5 text-gray-200" />
                          ))}
                          <span className="text-[11px] text-gray-400 ml-1 font-medium">{road.rating} <span className="text-gray-300">({road.reviews})</span></span>
                        </div>
                        {road.lastIncident && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> {road.lastIncident}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
