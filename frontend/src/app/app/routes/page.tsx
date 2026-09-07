"use client";

import { MapPin, ArrowLeft, Search, Star, CheckCircle2, AlertTriangle, Route as RouteIcon } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { getRatingStars, Road } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import ReviewModal from "@/components/ReviewModal";

const STATUS_META: Record<Road["status"], { badge: string; border: string; iconBg: string; iconColor: string }> = {
  safe: { badge: "bg-safe-soft text-safe", border: "border-l-safe", iconBg: "bg-safe-soft", iconColor: "text-safe" },
  caution: { badge: "bg-warning-soft text-warning", border: "border-l-warning", iconBg: "bg-warning-soft", iconColor: "text-warning" },
  unsafe: { badge: "bg-danger-soft text-danger", border: "border-l-danger", iconBg: "bg-danger-soft", iconColor: "text-danger" },
};

export default function RoutesPage() {
  const { roads } = useStore();
  const [filter, setFilter] = useState<"all" | "safe" | "caution" | "unsafe">("all");
  const [search, setSearch] = useState("");
  const [reviewRoad, setReviewRoad] = useState<Road | null>(null);

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
    <div className="mobile-container bg-background">
      <header className="bg-surface/95 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <Link href="/app" className="p-2 hover:bg-surface-hover rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold text-foreground">Safe / Unsafe Routes</h1>
            <p className="text-[11px] text-muted">{roads.length} roads across {grouped.length} areas</p>
          </div>
          <RouteIcon className="w-5 h-5 text-primary" />
        </div>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roads or areas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          {(["all", "safe", "caution", "unsafe"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                filter === f
                  ? f === "safe" ? "bg-safe text-white shadow-md" : f === "caution" ? "bg-warning text-white shadow-md" : f === "unsafe" ? "bg-danger text-white shadow-md" : "bg-primary text-white shadow-md shadow-[var(--primary-glow)]"
                  : "bg-surface-raised text-muted border border-border"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-5 pb-28">
        {grouped.length === 0 && (
          <div className="text-center py-16 text-muted">
            <RouteIcon className="w-10 h-10 mx-auto mb-3 text-border-strong" />
            <p className="text-sm font-medium">No roads found</p>
            <p className="text-xs text-muted mt-1">Try adjusting your filters</p>
          </div>
        )}

        {grouped.map(([area, areaRoads]) => (
          <section key={area}>
            <div className="flex items-center gap-2 mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <h2 className="text-xs font-bold text-muted-strong uppercase tracking-wider">{area}</h2>
              <span className="text-[10px] font-bold text-muted bg-surface-raised px-1.5 py-0.5 rounded-full">{areaRoads.length}</span>
            </div>
            <div className="space-y-2.5">
              {areaRoads.map((road) => {
                const stars = getRatingStars(road.rating);
                const meta = STATUS_META[road.status];
                return (
                  <button key={road.id} onClick={() => setReviewRoad(road)} className="block w-full text-left">
                    <div className={`sp-card border-l-4 ${meta.border} p-4 active:scale-[0.98] transition-transform`}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
                            <MapPin className={`w-5 h-5 ${meta.iconColor}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-semibold text-sm text-foreground">{road.name}</h3>
                              {road.verifiedByAdmin && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-info" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted">{road.area}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${meta.badge}`}>
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
                            <Star key={`e-${i}`} className="w-3.5 h-3.5 text-border-strong" />
                          ))}
                          <span className="text-[11px] text-muted ml-1 font-medium">{road.rating} <span className="text-muted/70">({road.reviews})</span></span>
                        </div>
                        {road.lastIncident && (
                          <span className="text-[10px] text-danger font-medium flex items-center gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> {road.lastIncident}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {reviewRoad && <ReviewModal road={reviewRoad} onClose={() => setReviewRoad(null)} />}

      <BottomNav />
    </div>
  );
}
