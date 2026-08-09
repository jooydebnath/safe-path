"use client";

import { MapPin, Star, Search, ArrowLeft, List, Map as MapIcon, Navigation, Shield, Filter } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { areas, getStatusColor, getRatingStars, getStatusBorder, Road } from "@/lib/data";
import { useStore } from "@/lib/store";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";

export default function MapPage() {
  const { roads } = useStore();
  const [filter, setFilter] = useState<"all" | "safe" | "caution" | "unsafe">("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [roadFilter, setRoadFilter] = useState<string>("all");

  const roadOptions = useMemo(() => {
    const inArea = areaFilter === "all" ? roads : roads.filter((r) => r.area === areaFilter);
    return inArea.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [roads, areaFilter]);

  const filtered = roads.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.area.toLowerCase().includes(search.toLowerCase());
    const matchesArea = areaFilter === "all" || r.area === areaFilter;
    const matchesRoad = roadFilter === "all" || r.id === roadFilter;
    return matchesFilter && matchesSearch && matchesArea && matchesRoad;
  });

  const counts = {
    all: roads.length,
    safe: roads.filter((r) => r.status === "safe").length,
    caution: roads.filter((r) => r.status === "caution").length,
    unsafe: roads.filter((r) => r.status === "unsafe").length,
  };

  const filterLabels: Record<string, string> = {
    all: "All",
    safe: "Safe",
    caution: "Caution",
    unsafe: "Unsafe",
  };

  const grouped = useMemo(() => {
    const map = new Map<string, Road[]>();
    for (const r of filtered) {
      const arr = map.get(r.area) ?? [];
      arr.push(r);
      map.set(r.area, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const onAreaChange = (val: string) => {
    setAreaFilter(val);
    setRoadFilter("all");
  };

  return (
    <div className="mobile-container bg-gray-50">
      <header className="absolute top-0 left-0 right-0 z-30 p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/app" className="p-1.5 hover:bg-gray-100 rounded-xl">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roads or areas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => setView("map")} className={`p-2 rounded-lg transition-colors ${view === "map" ? "bg-white shadow-sm text-rose-500" : "text-gray-500"}`}>
                <MapIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-white shadow-sm text-rose-500" : "text-gray-500"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <Filter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={areaFilter}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-300 cursor-pointer"
              >
                <option value="all">All Areas</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={roadFilter}
                onChange={(e) => setRoadFilter(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-300 cursor-pointer"
              >
                <option value="all">All Roads</option>
                {roadOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(["all", "safe", "caution", "unsafe"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${
                  filter === f
                    ? f === "safe" ? "bg-green-500 text-white" : f === "caution" ? "bg-amber-500 text-white" : f === "unsafe" ? "bg-red-500 text-white" : "bg-rose-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {filterLabels[f]} ({counts[f]})
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={`${view === "map" ? "pt-0" : "pt-44"} pb-24`}>
        {view === "map" ? (
          <>
            <MapView filter={filter} search={search} areaFilter={areaFilter} />
            <div className="px-4 mt-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nearby Roads</h2>
              <div className="space-y-2">
                {filtered.slice(0, 4).map((road) => {
                  const stars = getRatingStars(road.rating);
                  return (
                    <div key={road.id} className={`bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${getStatusBorder(road.status)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${road.status === "safe" ? "bg-green-50" : road.status === "caution" ? "bg-amber-50" : "bg-red-50"}`}>
                            <Navigation className={`w-4 h-4 ${road.status === "safe" ? "text-green-500" : road.status === "caution" ? "text-amber-500" : "text-red-500"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-sm text-gray-900">{road.name}</h3>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(road.status)}`}>
                                {road.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400">{road.area}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-gray-700">{road.rating}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-center text-xs text-gray-400 py-6">No roads match your filters.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Shield className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No roads found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            )}
            {grouped.map(([area, areaRoads]) => (
              <div key={area}>
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-gray-50 py-1 z-10">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{area}</h2>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{areaRoads.length}</span>
                </div>
                <div className="space-y-2">
                  {areaRoads.map((road) => {
                    const stars = getRatingStars(road.rating);
                    return (
                      <div key={road.id} className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-l-4 ${getStatusBorder(road.status)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-gray-900">{road.name}</h3>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(road.status)}`}>
                                {road.status}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {road.area}
                            </p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: stars.full }).map((_, i) => (
                                <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                              {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                              {Array.from({ length: stars.empty }).map((_, i) => (
                                <Star key={`e-${i}`} className="w-3.5 h-3.5 text-gray-200" />
                              ))}
                              <span className="text-xs text-gray-400 ml-1 font-medium">{road.rating}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-medium">{road.reviews} reviews</p>
                            {road.lastIncident && (
                              <p className="text-[10px] text-red-500 mt-1 font-medium">Last: {road.lastIncident}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
