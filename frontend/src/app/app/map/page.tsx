"use client";

import { MapPin, Star, ArrowLeft, List, Map as MapIcon, Navigation, Shield, Filter, LocateFixed, Circle, X } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useMemo, useEffect } from "react";
import { getRatingStars, Road } from "@/lib/data";
import { useStore } from "@/lib/store";
import { distanceKm, PlaceResult } from "@/lib/geo";
import { useActiveUsersNearby } from "@/lib/presence";
import BottomNav from "@/components/BottomNav";
import ReviewModal from "@/components/ReviewModal";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

const STATUS_META: Record<Road["status"], { badge: string; border: string; iconBg: string; iconColor: string }> = {
  safe: { badge: "bg-safe-soft text-safe", border: "border-l-safe", iconBg: "bg-safe-soft", iconColor: "text-safe" },
  caution: { badge: "bg-warning-soft text-warning", border: "border-l-warning", iconBg: "bg-warning-soft", iconColor: "text-warning" },
  unsafe: { badge: "bg-danger-soft text-danger", border: "border-l-danger", iconBg: "bg-danger-soft", iconColor: "text-danger" },
};

// Leaflet touches `window` at load time, so this must never render on the server.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[60vh] rounded-2xl border border-border bg-surface animate-pulse" />
  ),
});

// useSearchParams needs a Suspense boundary around it in production builds
// (see next/navigation docs) — this wrapper is the whole reason for the
// split, MapPageInner holds all the actual page logic.
export default function MapPage() {
  return (
    <Suspense fallback={null}>
      <MapPageInner />
    </Suspense>
  );
}

function MapPageInner() {
  const { roads, areas } = useStore();
  const searchParams = useSearchParams();
  const { count: activeNearby, loading: activeNearbyLoading } = useActiveUsersNearby();
  const [filter, setFilter] = useState<"all" | "safe" | "caution" | "unsafe">("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [roadFilter, setRoadFilter] = useState<string>("all");
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [reviewRoad, setReviewRoad] = useState<Road | null>(null);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; label: string } | null>(() => {
    // An incoming SOS alert (see EmergencyListener's "View on Map") hands
    // its coordinates off via ?sosLat/sosLng/sosLabel — seed the pin from
    // those on first render, same shape as a place search result.
    const lat = parseFloat(searchParams.get("sosLat") ?? "");
    const lng = parseFloat(searchParams.get("sosLng") ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng, label: searchParams.get("sosLabel") ?? "SOS alert" };
  });

  const handlePlaceSelected = (place: PlaceResult) => {
    setSearchedLocation({ lat: place.lat, lng: place.lng, label: place.label });
    setSearch("");
    setView("map");
  };

  const requestLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationDenied(false);
      },
      () => setLocationDenied(true),
      // Generous timeout + reuse of a recent fix — mobile GPS can take a
      // while for a fresh lock, and this previously raced (and usually
      // lost against) the fix LocationGate already got to unlock the app,
      // silently falling back to the location-less list every time.
      { timeout: 15000, maximumAge: 120000 }
    );
  };

  // Try once automatically on load; the button lets the user retry/refresh.
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Sort filtered roads by actual distance from the device when we have a
  // location fix; otherwise fall back to filtered order (previous behavior).
  const nearby: { road: Road; km?: number }[] = useMemo(() => {
    if (!myLocation) return filtered.slice(0, 4).map((road) => ({ road }));
    return filtered
      .map((road) => ({ road, km: distanceKm(myLocation, road.coordinates) }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 4);
  }, [filtered, myLocation]);

  return (
    <div className="mobile-container bg-background">
      {/* Leaflet's own panes/controls reach z-index 1000 inside MapView, and
          that div is `relative` without its own z-index so it doesn't
          contain them in a separate stacking context — without an explicit
          z-index here higher than Leaflet's, the map paints over this
          header and hides the search bar/filters underneath it. */}
      <header className="absolute top-0 left-0 right-0 z-[1200] p-4">
        <div className="sp-card p-3 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/app" className="p-1.5 hover:bg-surface-hover rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Link>
            <PlaceAutocomplete
              value={search}
              onChange={setSearch}
              onSelect={handlePlaceSelected}
              placeholder="Search places or roads..."
              className="flex-1"
              inputClassName="w-full pl-9 pr-4 py-2.5 bg-surface-raised border border-border rounded-full text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-surface-hover"
            />
            <div className="flex bg-surface-raised rounded-xl p-0.5 border border-border">
              <button onClick={() => setView("map")} className={`p-2 rounded-lg transition-colors ${view === "map" ? "bg-surface-hover shadow-sm text-primary" : "text-muted"}`}>
                <MapIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-surface-hover shadow-sm text-primary" : "text-muted"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!activeNearbyLoading && (
            <div className="flex items-center gap-1.5 mb-2">
              <Circle className="w-2 h-2 fill-safe text-safe sp-live-dot" />
              <span className="text-[11px] text-muted-strong font-semibold">{activeNearby} Active {activeNearby === 1 ? "User" : "Users"} Nearby</span>
            </div>
          )}

          <div className="flex gap-2 mb-2">
            <div className="flex-1 relative">
              <Filter className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={areaFilter}
                onChange={(e) => onAreaChange(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-surface-raised border border-border rounded-xl text-xs font-semibold text-muted-strong appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              >
                <option value="all">All Areas</option>
                {areas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 relative">
              <MapPin className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={roadFilter}
                onChange={(e) => setRoadFilter(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-surface-raised border border-border rounded-xl text-xs font-semibold text-muted-strong appearance-none focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
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
                    ? f === "safe" ? "bg-safe text-white" : f === "caution" ? "bg-warning text-white" : f === "unsafe" ? "bg-danger text-white" : "bg-primary text-white"
                    : "bg-surface-raised text-muted-strong"
                }`}
              >
                {filterLabels[f]} ({counts[f]})
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className={`${view === "map" ? "pt-0" : "pt-44"} pb-28`}>
        {view === "map" ? (
          <>
            <div className="relative">
              <MapView filter={filter} search={search} areaFilter={areaFilter} searchedLocation={searchedLocation} />
              {searchedLocation && (
                <div className="absolute top-3 left-3 right-3 z-[1000] sp-card px-3 py-2 flex items-center gap-2 shadow-lg">
                  <MapPin className="w-4 h-4 text-danger shrink-0" />
                  <p className="flex-1 text-[11px] font-medium text-muted-strong truncate">{searchedLocation.label}</p>
                  <button onClick={() => setSearchedLocation(null)} className="p-1 hover:bg-surface-hover rounded-full shrink-0 transition-colors">
                    <X className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>
              )}
            </div>
            <div className="px-4 mt-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold text-muted uppercase tracking-wider">
                  {myLocation ? "Nearby Roads" : "Roads"}
                </h2>
                <button
                  onClick={requestLocation}
                  className="flex items-center gap-1 text-[11px] font-bold text-primary"
                >
                  <LocateFixed className="w-3.5 h-3.5" /> {myLocation ? "Refresh" : "Use my location"}
                </button>
              </div>
              {locationDenied && !myLocation && (
                <p className="text-[11px] text-warning mb-2">
                  Couldn’t get your location — showing all roads instead. Enable location access to see the closest ones first.
                </p>
              )}
              <div className="space-y-2">
                {nearby.map(({ road, km }) => {
                  const meta = STATUS_META[road.status];
                  return (
                    <button
                      key={road.id}
                      onClick={() => setReviewRoad(road)}
                      className={`block w-full text-left sp-card border-l-4 ${meta.border} p-3.5 active:scale-[0.98] transition-transform`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.iconBg}`}>
                            <Navigation className={`w-4 h-4 ${meta.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-sm text-foreground">{road.name}</h3>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                                {road.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted">
                              {road.area}
                              {km !== undefined && <span> · {km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-muted-strong">{road.rating}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-center text-xs text-muted py-6">No roads match your filters.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 space-y-4">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted">
                <Shield className="w-10 h-10 mx-auto mb-3 text-border-strong" />
                <p className="text-sm font-medium">No roads found</p>
                <p className="text-xs text-muted mt-1">Try adjusting your filters</p>
              </div>
            )}
            {grouped.map(([area, areaRoads]) => (
              <div key={area}>
                <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background py-1 z-10">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <h2 className="text-xs font-bold text-muted-strong uppercase tracking-wider">{area}</h2>
                  <span className="text-[10px] font-bold text-muted bg-surface-raised px-1.5 py-0.5 rounded-full">{areaRoads.length}</span>
                </div>
                <div className="space-y-2">
                  {areaRoads.map((road) => {
                    const stars = getRatingStars(road.rating);
                    const meta = STATUS_META[road.status];
                    return (
                      <button
                        key={road.id}
                        onClick={() => setReviewRoad(road)}
                        className={`block w-full text-left sp-card border-l-4 ${meta.border} p-4 active:scale-[0.98] transition-transform`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-foreground">{road.name}</h3>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${meta.badge}`}>
                                {road.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted mb-2 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {road.area}
                            </p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: stars.full }).map((_, i) => (
                                <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                              {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                              {Array.from({ length: stars.empty }).map((_, i) => (
                                <Star key={`e-${i}`} className="w-3.5 h-3.5 text-border-strong" />
                              ))}
                              <span className="text-xs text-muted ml-1 font-medium">{road.rating}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-muted font-medium">{road.reviews} reviews</p>
                            {road.lastIncident && (
                              <p className="text-[10px] text-danger mt-1 font-medium">Last: {road.lastIncident}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewRoad && <ReviewModal road={reviewRoad} onClose={() => setReviewRoad(null)} />}

      <BottomNav />
    </div>
  );
}
