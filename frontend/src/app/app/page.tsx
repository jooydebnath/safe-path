"use client";

import { useEffect, useState } from "react";
import { MapPin, Siren, Shield, Navigation, Star, ChevronRight, AlertTriangle, Clock, LogIn, Route, CheckCircle2, Circle, MapPinned, User } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getRatingStars, typeColors, typeLabels, statusColors, verificationColors } from "@/lib/data";
import { reverseGeocode, distanceKm } from "@/lib/geo";
import { useActiveUsersNearby } from "@/lib/presence";
import BottomNav from "@/components/BottomNav";

export default function AppHome() {
  const { roads, reports } = useStore();
  const { user, isAuthenticated } = useAuth();
  const { count: activeNearby, loading: activeNearbyLoading } = useActiveUsersNearby();
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // Ask for a fix once on load: reverse-geocode it to an actual place name
  // for the header, and keep the raw coords to sort "nearby" roads by real
  // distance below (rather than guessing from the small fixed set of seeded
  // roads, or — worse — not looking at location at all).
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationDenied(true);
      return;
    }
    const controller = new AbortController();
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMyLocation(coords);
        reverseGeocode(coords.lat, coords.lng, controller.signal)
          .then((name) => (name ? setPlaceName(name) : setLocationDenied(true)))
          .catch(() => setLocationDenied(true));
      },
      () => setLocationDenied(true),
      // A generous timeout (mobile GPS can take a while for a fresh fix,
      // especially indoors/cold-start) and a maximumAge that's happy to
      // reuse the fix LocationGate just obtained to unlock the app at all —
      // without this the page raced its own fresh, tight-timeout request
      // and usually lost, silently falling back to the location-less list.
      { timeout: 15000, maximumAge: 120000 }
    );
    return () => controller.abort();
  }, []);

  const locationLabel = placeName
    ? `${placeName}, Dhaka`
    : locationDenied
    ? "Location unavailable"
    : "Locating...";

  // Closest safe roads to the device's actual position — falls back to the
  // backend's own order when we don't have a location fix yet.
  const safeRoads = myLocation
    ? roads
        .filter((r) => r.status === "safe")
        .map((r) => ({ road: r, km: distanceKm(myLocation, r.coordinates) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3)
        .map(({ road }) => road)
    : roads.filter((r) => r.status === "safe").slice(0, 3);
  const recentReports = reports.slice(0, 3);
  const unsafeCount = roads.filter((r) => r.status === "unsafe").length;
  const safeCount = roads.filter((r) => r.status === "safe").length;
  const safetyScore = roads.length ? Math.round((safeCount / roads.length) * 100) : 0;

  return (
    <div className="mobile-container bg-background">
      <header className="sp-glow relative sp-gradient-primary text-white p-5 pb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">SafePath</h1>
            <p className="text-white/80 text-sm">
              {isAuthenticated ? `Hi, ${user?.name}` : "Your safety companion"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/app/profile"
                aria-label="Profile"
                className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
              >
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/app/login"
                className="bg-white text-primary-strong px-3 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-lg active:scale-95 transition-transform"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs text-white/80 font-medium">Current Location</span>
            </div>
            <p className="font-semibold text-sm">{locationLabel}</p>
            {!activeNearbyLoading && (
              <div className="flex items-center gap-1.5 mt-2">
                <Circle className="w-2 h-2 fill-safe text-safe sp-live-dot" />
                <span className="text-[11px] text-white/90 font-semibold">{activeNearby} Active {activeNearby === 1 ? "User" : "Users"} Nearby</span>
              </div>
            )}
          </div>
          <div className="bg-surface/90 backdrop-blur-md rounded-2xl p-3.5 flex flex-col items-center justify-center min-w-[72px] border border-white/15 shadow-lg">
            <span className={`text-xl font-extrabold ${safetyScore >= 70 ? "text-safe" : safetyScore >= 40 ? "text-warning" : "text-danger"}`}>
              {safetyScore}
            </span>
            <span className="text-[9px] text-white/70 font-semibold uppercase">Score</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-28">
        <section>
          <h2 className="text-xs font-bold text-muted uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            <Link
              href="/app/sos"
              className="flex-shrink-0 sp-gradient-primary text-white px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg shadow-[var(--primary-glow)] active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">SOS Alert</span>
                <span className="text-[10px] text-white/80">Emergency help</span>
              </div>
            </Link>
            <Link
              href="/app/map"
              className="flex-shrink-0 sp-card px-5 py-3.5 flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-primary-soft rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">Safety Map</span>
                <span className="text-[10px] text-muted">Find safe routes</span>
              </div>
            </Link>
            <Link
              href="/app/routes"
              className="flex-shrink-0 sp-card px-5 py-3.5 flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-info-soft rounded-xl flex items-center justify-center">
                <Route className="w-5 h-5 text-info" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">Routes</span>
                <span className="text-[10px] text-muted">Safe/Unsafe list</span>
              </div>
            </Link>
            <Link
              href="/app/directions"
              className="flex-shrink-0 sp-card px-5 py-3.5 flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-surface-hover rounded-xl flex items-center justify-center">
                <MapPinned className="w-5 h-5 text-muted-strong" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">Directions</span>
                <span className="text-[10px] text-muted">Check a route</span>
              </div>
            </Link>
            <Link
              href="/app/reports"
              className="flex-shrink-0 sp-card px-5 py-3.5 flex items-center gap-3 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-warning-soft rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div>
                <span className="font-bold text-sm text-foreground block">Report Issue</span>
                <span className="text-[10px] text-muted">Alert community</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="sp-card p-3 text-center">
            <p className="text-lg font-extrabold text-safe">{safeCount}</p>
            <p className="text-[10px] text-muted font-medium">Safe Roads</p>
          </div>
          <div className="sp-card p-3 text-center">
            <p className="text-lg font-extrabold text-warning">{roads.filter(r => r.status === "caution").length}</p>
            <p className="text-[10px] text-muted font-medium">Caution</p>
          </div>
          <div className="sp-card p-3 text-center">
            <p className="text-lg font-extrabold text-danger">{unsafeCount}</p>
            <p className="text-[10px] text-muted font-medium">Unsafe</p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Safe Roads Nearby</h2>
            <Link href="/app/routes" className="text-primary text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {safeRoads.map((road) => {
              const stars = getRatingStars(road.rating);
              return (
                <Link href="/app/map" key={road.id} className="block">
                  <div className="sp-card p-4 active:scale-[0.98] transition-transform">
                    <div className="flex items-start justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${road.status === "safe" ? "bg-safe-soft" : road.status === "caution" ? "bg-warning-soft" : "bg-danger-soft"}`}>
                          <MapPin className={`w-5 h-5 ${road.status === "safe" ? "text-safe" : road.status === "caution" ? "text-warning" : "text-danger"}`} />
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
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${road.status === "safe" ? "bg-safe-soft text-safe" : road.status === "caution" ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger"}`}>
                        {road.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 pl-[50px]">
                      {Array.from({ length: stars.full }).map((_, i) => (
                        <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                      {Array.from({ length: stars.empty }).map((_, i) => (
                        <Star key={`e-${i}`} className="w-3.5 h-3.5 text-border-strong" />
                      ))}
                      <span className="text-[11px] text-muted ml-1 font-medium">{road.rating} <span className="text-muted/70">({road.reviews})</span></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-muted uppercase tracking-wider">Recent Reports</h2>
            <Link href="/app/reports" className="text-primary text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentReports.map((report) => (
              <Link href="/app/reports" key={report.id} className="block">
                <div className="sp-card p-4 active:scale-[0.98] transition-transform">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${typeColors[report.type]}`}>
                      {typeLabels[report.type]}
                    </span>
                    <div className="flex gap-1">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${verificationColors[report.verification]}`}>
                        {report.verification}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors[report.status]}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-strong font-medium leading-snug mb-2">{report.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
