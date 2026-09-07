"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, ZoomControl, useMap, useMapEvent } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Star, X, Shield, LocateFixed } from "lucide-react";
import { useStore } from "@/lib/store";
import { getStatusColor, getRatingStars, Road } from "@/lib/data";
import { TILE_URL, TILE_ATTRIBUTION } from "@/lib/mapTiles";

interface MapViewProps {
  filter: "all" | "safe" | "caution" | "unsafe";
  search: string;
  areaFilter?: string;
  /** Fixed Tailwind height class for the map box. Defaults to a full-page map. */
  heightClass?: string;
  /** Controlled selection — pass this (with onSelectRoad) to use the map as a picker,
   * e.g. inside a form. Omit both to let the map manage its own "tap to preview" selection. */
  selectedRoadId?: string | null;
  onSelectRoad?: (roadId: string) => void;
  /** Start zoomed out to show all matching roads instead of centering on the
   * device's location. Use this for a "pick a road" embed — centering
   * tightly on the user is useless there since the roads are usually
   * elsewhere on the map. */
  fitAllRoads?: boolean;
  /** An ad-hoc pin for a place the user just searched for (via the
   * autocomplete search bar), distinct from the road-status markers. Passing
   * a new value pans/zooms the map to it, Google-Maps-style. */
  searchedLocation?: { lat: number; lng: number; label: string } | null;
}

const DHAKA_CENTER: [number, number] = [23.8103, 90.4125];

/** Pure geometry — picks a center + a reasonable zoom to show all the given
 * roads, without needing a live Leaflet map instance (so it can be used to
 * choose the map's *initial* view before it's ever created). */
function computeBoundsView(roads: Road[]): { center: [number, number]; zoom: number } {
  if (roads.length === 0) return { center: DHAKA_CENTER, zoom: 12 };
  if (roads.length === 1) return { center: [roads[0].coordinates.lat, roads[0].coordinates.lng], zoom: 15 };

  const bounds = L.latLngBounds(roads.map((r) => [r.coordinates.lat, r.coordinates.lng] as [number, number]));
  const center = bounds.getCenter();
  const span = Math.max(bounds.getNorth() - bounds.getSouth(), bounds.getEast() - bounds.getWest());
  let zoom = 14;
  if (span > 0.5) zoom = 9;
  else if (span > 0.25) zoom = 10;
  else if (span > 0.12) zoom = 11;
  else if (span > 0.06) zoom = 12;
  else if (span > 0.03) zoom = 13;
  return { center: [center.lat, center.lng], zoom };
}

const STATUS_HEX: Record<string, string> = {
  safe: "#22c55e",
  caution: "#f59e0b",
  unsafe: "#ef4444",
};

function roadIcon(status: string) {
  const color = STATUS_HEX[status] ?? "#6b7280";
  // 44px matches the ~44px minimum touch-target size recommended for mobile —
  // the previous 32px pins were too small and too easy to miss/overlap when
  // several roads cluster close together at a zoomed-out view.
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:44px;height:44px;">
        ${status === "unsafe" ? `<span class="sos-pulse" style="position:absolute;inset:-4px;border-radius:9999px;background:${color}55;"></span>` : ""}
        <div style="position:relative;width:44px;height:44px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
}

// Google-Maps-style teardrop pin for an ad-hoc searched location.
const searchedIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:36px;height:48px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));">
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48" fill="none">
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0Z" fill="#ea4335"/>
        <circle cx="18" cy="18" r="7" fill="#fff"/>
      </svg>
    </div>
  `,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
});

const youIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:16px;height:16px;">
      <span class="sos-pulse" style="position:absolute;inset:-6px;border-radius:9999px;background:#3b82f666;"></span>
      <div style="width:16px;height:16px;border-radius:9999px;background:#3b82f6;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);"></div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

/**
 * Pans/zooms to the filtered roads whenever the user actively searches or
 * changes a filter. Compares against the *previous actual values* (not an
 * "is this the first run" flag) so it behaves correctly even under React
 * Strict Mode's dev-only double effect invocation, where a ref-based
 * first-run flag would otherwise survive the simulated remount and treat
 * the second invocation as a real change.
 */
function FollowFilters({
  roads,
  search,
  filter,
  areaFilter,
}: {
  roads: Road[];
  search: string;
  filter: string;
  areaFilter: string;
}) {
  const map = useMap();
  const prev = useRef({ search, filter, areaFilter });

  useEffect(() => {
    const changed =
      prev.current.search !== search || prev.current.filter !== filter || prev.current.areaFilter !== areaFilter;
    prev.current = { search, filter, areaFilter };
    if (!changed) return;

    if (roads.length === 0) return;
    if (roads.length === 1) {
      map.setView([roads[0].coordinates.lat, roads[0].coordinates.lng], 15);
      return;
    }
    const bounds = L.latLngBounds(roads.map((r) => [r.coordinates.lat, r.coordinates.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, areaFilter]);

  return null;
}

/**
 * In picker mode, tapping *anywhere* on the map selects whichever road is
 * geometrically closest to the tap — not just an exact hit on a small pin.
 * This matters because at a zoomed-out view several road pins can sit only
 * a few pixels apart (or overlap outright), making a precise tap on one
 * specific pin unreliable, especially on a touchscreen.
 */
function ClickSelectsNearest({ roads, onSelectRoad }: { roads: Road[]; onSelectRoad: (roadId: string) => void }) {
  const map = useMapEvent("click", (e) => {
    if (roads.length === 0) return;
    let nearest = roads[0];
    let minDist = Infinity;
    for (const r of roads) {
      const d = map.distance(e.latlng, L.latLng(r.coordinates.lat, r.coordinates.lng));
      if (d < minDist) {
        minDist = d;
        nearest = r;
      }
    }
    onSelectRoad(nearest.id);
  });
  return null;
}

/** Recenters on the user's location when tapped; if we don't have a fix yet,
 * it retries getting one instead of just sitting there disabled. Sits inside
 * the map so it can reach the Leaflet instance. Positioned bottom-right,
 * stacked just above Leaflet's zoom control — the familiar Google Maps
 * "current location" crosshair placement — rather than top-left. */
function LocateButton({ userPos, onRetry }: { userPos: [number, number] | null; onRetry: () => void }) {
  const map = useMap();
  return (
    <button
      onClick={() => (userPos ? map.setView(userPos, 17) : onRetry())}
      title={userPos ? "Center on my exact location" : "Retry finding my location"}
      className="absolute right-[10px] bottom-[92px] z-[1000] w-10 h-10 bg-surface-raised border border-border rounded-full shadow-[0_2px_10px_rgba(0,0,0,.5)] flex items-center justify-center text-info hover:bg-surface-hover active:scale-95"
    >
      <LocateFixed className="w-5 h-5" />
    </button>
  );
}

/** Resolves the device's location, then keeps it updated live via watchPosition
 * (like Google Maps' blue dot) instead of a single one-off fix. `retryKey`
 * lets a caller force a fresh permission/fix attempt (e.g. an "Enable
 * Location" button) without remounting the whole map. */
function useLiveLocation(retryKey = 0, timeoutMs = 8000) {
  const [state, setState] = useState<{
    settled: boolean;
    pos: [number, number] | null;
    accuracy: number | null;
    error: "denied" | "unavailable" | null;
  }>({ settled: false, pos: null, accuracy: null, error: null });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState({ settled: true, pos: null, accuracy: null, error: "unavailable" });
      return;
    }

    let firstFixSeen = false;
    // Safety net in case the browser never calls back (some do neither
    // success nor error in odd permission states).
    const safetyNet = setTimeout(() => {
      setState((s) => (s.settled ? s : { settled: true, pos: null, accuracy: null, error: "unavailable" }));
    }, timeoutMs + 500);

    const onPosition = (p: GeolocationPosition) => {
      firstFixSeen = true;
      clearTimeout(safetyNet);
      setState({
        settled: true,
        pos: [p.coords.latitude, p.coords.longitude],
        accuracy: p.coords.accuracy,
        error: null,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      if (firstFixSeen) return; // a later transient error shouldn't wipe out a location we already have
      clearTimeout(safetyNet);
      setState({
        settled: true,
        pos: null,
        accuracy: null,
        error: err.code === err.PERMISSION_DENIED ? "denied" : "unavailable",
      });
    };

    const watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 5000,
    });

    return () => {
      clearTimeout(safetyNet);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [retryKey, timeoutMs]);

  return state;
}

/** Pans/zooms to a freshly-picked search result, Google-Maps-style —
 * fires only when the location actually changes (by identity of lat/lng),
 * not on every render. */
function FlyToSearched({ location }: { location: { lat: number; lng: number } | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!location) return;
    map.setView([location.lat, location.lng], 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.lat, location?.lng]);
  return null;
}

export default function MapView({
  filter,
  search,
  areaFilter = "all",
  heightClass = "h-[60vh]",
  selectedRoadId,
  onSelectRoad,
  fitAllRoads = false,
  searchedLocation = null,
}: MapViewProps) {
  const { roads } = useStore();
  const isControlled = selectedRoadId !== undefined;
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const activeSelectedId = isControlled ? selectedRoadId : internalSelected;
  const [locationRetry, setLocationRetry] = useState(0);
  const { settled, pos: userPos, accuracy: userAccuracy, error: locationError } = useLiveLocation(locationRetry);
  // In "fit all roads" mode we never wait on geolocation to decide the
  // starting view — render immediately and let the "You" marker appear
  // later if/when it resolves.
  const readyToRender = fitAllRoads || settled;

  const filtered = useMemo(
    () =>
      roads.filter((r) => {
        const matchesFilter = filter === "all" || r.status === filter;
        const matchesSearch =
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.area.toLowerCase().includes(search.toLowerCase());
        const matchesArea = areaFilter === "all" || !areaFilter || r.area === areaFilter;
        return matchesFilter && matchesSearch && matchesArea;
      }),
    [roads, filter, search, areaFilter]
  );

  const selected = filtered.find((r) => r.id === activeSelectedId);

  if (!readyToRender) {
    return (
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(0,0,0,0.4)] bg-surface flex items-center justify-center`}>
        <div className="flex items-center gap-2 text-muted">
          <Shield className="w-5 h-5 animate-pulse text-primary" />
          <span className="text-sm font-medium">Finding your location...</span>
        </div>
      </div>
    );
  }

  // Initial view: center on the user if we have them; otherwise fit the
  // known roads (or fall back to a Dhaka-wide view). This is the map's
  // *starting* position only — react-leaflet won't move it again just
  // because these props change on re-render.
  let initialCenter: [number, number] = DHAKA_CENTER;
  let initialZoom = 12;
  if (fitAllRoads) {
    const fit = computeBoundsView(filtered.length > 0 ? filtered : roads);
    initialCenter = fit.center;
    initialZoom = fit.zoom;
  } else if (userPos) {
    initialCenter = userPos;
    initialZoom = 15;
  } else if (filtered.length === 1) {
    initialCenter = [filtered[0].coordinates.lat, filtered[0].coordinates.lng];
    initialZoom = 15;
  }

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-border shadow-[0_4px_20px_rgba(0,0,0,0.4)]`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        zoomControl={false}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        <ZoomControl position="bottomright" />
        <FollowFilters roads={filtered} search={search} filter={filter} areaFilter={areaFilter} />
        <FlyToSearched location={searchedLocation} />
        <LocateButton userPos={userPos} onRetry={() => setLocationRetry((n) => n + 1)} />
        {isControlled && onSelectRoad && <ClickSelectsNearest roads={filtered} onSelectRoad={onSelectRoad} />}

        {filtered.map((road) => (
          <Marker
            key={road.id}
            position={[road.coordinates.lat, road.coordinates.lng]}
            icon={roadIcon(road.status)}
            eventHandlers={{
              click: () => {
                if (isControlled) {
                  onSelectRoad?.(road.id);
                } else {
                  setInternalSelected((cur) => (cur === road.id ? null : road.id));
                }
              },
            }}
          />
        ))}

        {searchedLocation && <Marker position={[searchedLocation.lat, searchedLocation.lng]} icon={searchedIcon} />}

        {userPos && userAccuracy && userAccuracy > 30 && (
          <Circle
            center={userPos}
            radius={userAccuracy}
            pathOptions={{ color: "#3b82f6", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.12 }}
          />
        )}
        {userPos && <Marker position={userPos} icon={youIcon} />}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] bg-surface-raised/95 backdrop-blur-sm rounded-xl shadow-md border border-border p-2.5 pointer-events-none">
        <p className="text-[9px] font-bold text-muted uppercase tracking-wider mb-1.5">Legend</p>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-safe border border-safe" />
            <span className="text-[10px] text-muted-strong font-medium">Safe</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-warning border border-warning" />
            <span className="text-[10px] text-muted-strong font-medium">Caution</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-danger border border-danger" />
            <span className="text-[10px] text-muted-strong font-medium">Unsafe</span>
          </div>
        </div>
      </div>

      {selected && (
        <div className="absolute bottom-24 left-3 right-3 z-[1000] sp-card shadow-xl p-4 animate-slide-up">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-foreground">{selected.name}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${getStatusColor(selected.status)}`}>
                  {selected.status}
                </span>
              </div>
              <p className="text-xs text-muted mb-2">{selected.area}</p>
              <div className="flex items-center gap-1">
                {(() => {
                  const stars = getRatingStars(selected.rating);
                  return (
                    <>
                      {Array.from({ length: stars.full }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                      ))}
                      {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-warning/50 text-warning" />}
                      {Array.from({ length: stars.empty }).map((_, i) => (
                        <Star key={`e${i}`} className="w-3.5 h-3.5 text-border-strong" />
                      ))}
                      <span className="text-xs text-muted ml-1">{selected.rating} ({selected.reviews} reviews)</span>
                    </>
                  );
                })()}
              </div>
              {selected.lastIncident && (
                <p className="text-[11px] text-danger mt-2">⚠️ Last incident: {selected.lastIncident}</p>
              )}
              {isControlled && (
                <p className="text-[11px] text-primary font-semibold mt-2">✓ Selected for this report</p>
              )}
            </div>
            {!isControlled && (
              <button onClick={() => setInternalSelected(null)} className="p-1 hover:bg-surface-hover rounded-full">
                <X className="w-4 h-4 text-muted" />
              </button>
            )}
          </div>
        </div>
      )}

      {!userPos && !fitAllRoads && (
        <div className="absolute top-3 right-3 z-[1000] bg-surface-raised rounded-xl shadow-md border border-warning/40 px-3 py-2 flex items-center gap-2 max-w-[75%]">
          <MapPin className="w-4 h-4 text-warning shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-muted-strong truncate">
              {locationError === "denied" ? "Location permission blocked" : "Can't find your exact location"}
            </p>
            <button onClick={() => setLocationRetry((n) => n + 1)} className="text-[10px] font-bold text-info flex items-center gap-1">
              <LocateFixed className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="absolute top-3 right-3 z-[1000] bg-surface-raised/95 backdrop-blur-sm rounded-lg shadow-md border border-border px-3 py-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-muted" />
          <span className="text-[11px] font-medium text-muted">No roads match your filters</span>
        </div>
      )}
    </div>
  );
}
