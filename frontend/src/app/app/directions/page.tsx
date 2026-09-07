"use client";

import { ArrowLeft, MapPinned, Navigation, ShieldCheck, ShieldAlert, ShieldQuestion, Loader2, ArrowRight, ListFilter, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { RouteSafetyResult } from "@/lib/data";
import { PlaceResult } from "@/lib/geo";
import BottomNav from "@/components/BottomNav";
import PlaceAutocomplete from "@/components/PlaceAutocomplete";

// Leaflet touches `window` at load time, so this must never render on the server.
const RouteMap = dynamic(() => import("@/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="w-full h-[42vh] rounded-2xl border border-border bg-surface animate-pulse" />,
});

const STATUS_META: Record<
  RouteSafetyResult["status"],
  { label: string; icon: typeof ShieldCheck; badge: string; card: string }
> = {
  safe: { label: "Route Looks Safe", icon: ShieldCheck, badge: "bg-safe text-white", card: "bg-safe-soft border-safe/30" },
  caution: { label: "Route Needs Caution", icon: ShieldQuestion, badge: "bg-warning text-white", card: "bg-warning-soft border-warning/30" },
  unsafe: { label: "Route Is Unsafe", icon: ShieldAlert, badge: "bg-danger text-white", card: "bg-danger-soft border-danger/30" },
};

type LatLng = { lat: number; lng: number };
type Picked = { pos: LatLng; label: string } | null;

/** Average coordinates of all roads tagged with this area — a simple stand-in
 * "area centroid" so an area can be picked as an origin/destination without
 * requiring the user to pick one exact road segment. */
function areaCentroid(area: string, roads: ReturnType<typeof useStore>["roads"]) {
  const inArea = roads.filter((r) => r.area === area);
  if (inArea.length === 0) return null;
  const lat = inArea.reduce((sum, r) => sum + r.coordinates.lat, 0) / inArea.length;
  const lng = inArea.reduce((sum, r) => sum + r.coordinates.lng, 0) / inArea.length;
  return { lat, lng };
}

/** One origin/destination field, togglable between picking a whole tracked
 * area (the app's original "Northern -> Dhanmondi" style flow) and
 * free-text address search with Nominatim autocomplete — an alternative for
 * when the user has a specific point in mind rather than a broad area. */
function EndpointPicker({
  label,
  areas,
  areaValue,
  onAreaChange,
  searchValue,
  onSearchChange,
  picked,
  onPick,
}: {
  label: string;
  areas: string[];
  areaValue: string;
  onAreaChange: (v: string) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  picked: Picked;
  onPick: (place: PlaceResult) => void;
}) {
  const [mode, setMode] = useState<"area" | "search">("area");

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-muted uppercase tracking-wider">{label}</label>
        <div className="flex bg-surface-raised rounded-lg p-0.5 border border-border">
          <button
            type="button"
            onClick={() => setMode("area")}
            className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${mode === "area" ? "bg-surface-hover shadow-sm text-primary" : "text-muted"}`}
          >
            <ListFilter className="w-3 h-3" /> Area
          </button>
          <button
            type="button"
            onClick={() => setMode("search")}
            className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors ${mode === "search" ? "bg-surface-hover shadow-sm text-primary" : "text-muted"}`}
          >
            <SearchIcon className="w-3 h-3" /> Address
          </button>
        </div>
      </div>

      {mode === "area" ? (
        <select
          value={areaValue}
          onChange={(e) => onAreaChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-surface-raised border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Select {label.toLowerCase()} area...</option>
          {areas.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      ) : (
        <PlaceAutocomplete
          value={searchValue}
          onChange={onSearchChange}
          onSelect={onPick}
          placeholder="Search for an address or place..."
          inputClassName="w-full pl-9 pr-8 py-2.5 bg-surface-raised border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}

      {mode === "search" && picked && (
        <p className="text-[11px] text-muted mt-1.5 truncate">Selected: {picked.label}</p>
      )}
    </div>
  );
}

export default function DirectionsPage() {
  const { roads, areas, checkRouteSafety } = useStore();

  const [origin, setOrigin] = useState("");
  const [dest, setDest] = useState("");
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [originPicked, setOriginPicked] = useState<Picked>(null);
  const [destPicked, setDestPicked] = useState<Picked>(null);

  const [result, setResult] = useState<RouteSafetyResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originAreaPos = useMemo(() => (origin ? areaCentroid(origin, roads) : null), [origin, roads]);
  const destAreaPos = useMemo(() => (dest ? areaCentroid(dest, roads) : null), [dest, roads]);

  // Whichever of "area centroid" or "picked search result" is currently set
  // wins as the actual origin/destination coordinate — search selection
  // takes priority since picking one is a more specific, deliberate action.
  const originPos = originPicked?.pos ?? originAreaPos;
  const destPos = destPicked?.pos ?? destAreaPos;
  const originLabel = originPicked?.label ?? origin;
  const destLabel = destPicked?.label ?? dest;

  const samePoint =
    !!originPos && !!destPos && originPos.lat === destPos.lat && originPos.lng === destPos.lng;
  const canCheck = !!originPos && !!destPos && !samePoint;

  const handleShowRoute = async () => {
    if (!originPos || !destPos) return;
    setChecking(true);
    setError(null);
    try {
      const res = await checkRouteSafety(originPos, destPos);
      setResult(res);
    } catch {
      setError("Couldn't check this route right now. Try again.");
      setResult(null);
    } finally {
      setChecking(false);
    }
  };

  const meta = result ? STATUS_META[result.status] : null;
  const flaggedRoads = result ? [...result.unsafeRoads, ...result.cautionRoads] : [];

  return (
    <div className="mobile-container bg-background">
      <header className="bg-surface/95 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-foreground">Direction Safety</h1>
            <p className="text-[11px] text-muted">Pick an area or search an address to check the route</p>
          </div>
          <MapPinned className="w-5 h-5 text-primary" />
        </div>
      </header>

      <div className="p-4 space-y-4 pb-28">
        <section className="sp-card p-4 space-y-3">
          <EndpointPicker
            label="From"
            areas={areas}
            areaValue={origin}
            onAreaChange={(v) => { setOrigin(v); setOriginPicked(null); setResult(null); }}
            searchValue={originSearch}
            onSearchChange={setOriginSearch}
            picked={originPicked}
            onPick={(place) => {
              setOriginPicked({ pos: { lat: place.lat, lng: place.lng }, label: place.label });
              setOriginSearch("");
              setResult(null);
            }}
          />

          <div className="flex items-center justify-center">
            <ArrowRight className="w-4 h-4 text-muted rotate-90" />
          </div>

          <EndpointPicker
            label="To"
            areas={areas}
            areaValue={dest}
            onAreaChange={(v) => { setDest(v); setDestPicked(null); setResult(null); }}
            searchValue={destSearch}
            onSearchChange={setDestSearch}
            picked={destPicked}
            onPick={(place) => {
              setDestPicked({ pos: { lat: place.lat, lng: place.lng }, label: place.label });
              setDestSearch("");
              setResult(null);
            }}
          />

          {samePoint && (
            <p className="text-[11px] text-warning font-medium">Pick two different locations.</p>
          )}

          <button
            onClick={handleShowRoute}
            disabled={!canCheck || checking}
            className="w-full py-3 rounded-2xl font-bold text-sm text-white sp-gradient-primary shadow-lg shadow-[var(--primary-glow)] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            {checking ? "Checking Route..." : "Show Route"}
          </button>

          {error && <p className="text-[11px] text-danger font-medium">{error}</p>}
        </section>

        {originPos && destPos && (
          <RouteMap
            origin={originPos}
            dest={destPos}
            routePolyline={result?.routedPolyline}
            flaggedRoads={flaggedRoads}
            routeStatus={result?.status ?? "safe"}
          />
        )}

        {result?.approximate && (
          <p className="text-[11px] text-warning font-medium px-1">
            Showing approximate route — the routing service didn’t respond in time, so this uses a straight line between {originLabel || "origin"} and {destLabel || "destination"} instead of following actual roads.
          </p>
        )}

        {result && meta && (
          <section className={`rounded-2xl border p-4 ${meta.card} animate-fade-in`}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md ${meta.badge}`}>
                <meta.icon className="w-3.5 h-3.5" /> {meta.label}
              </span>
            </div>
            <p className="text-sm text-muted-strong leading-relaxed">{result.reason}</p>
          </section>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
