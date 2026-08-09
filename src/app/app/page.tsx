"use client";

import { MapPin, Siren, Shield, Navigation, Star, ChevronRight, AlertTriangle, Clock, LogIn, Route, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getStatusColor, getRatingStars, typeColors, typeLabels, statusColors, verificationColors } from "@/lib/data";
import BottomNav from "@/components/BottomNav";

export default function AppHome() {
  const { roads, reports } = useStore();
  const { user, isAuthenticated } = useAuth();

  const safeRoads = roads.filter((r) => r.status === "safe").slice(0, 3);
  const recentReports = reports.slice(0, 3);
  const unsafeCount = roads.filter((r) => r.status === "unsafe").length;
  const safeCount = roads.filter((r) => r.status === "safe").length;
  const safetyScore = Math.round((safeCount / roads.length) * 100);

  return (
    <div className="mobile-container bg-gray-50">
      <header className="relative bg-gradient-to-br from-rose-500 to-rose-600 text-white p-5 pb-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">SafePath</h1>
            <p className="text-rose-100 text-sm">
              {isAuthenticated ? `Hi, ${user?.name}` : "Your safety companion"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                <MapPin className="w-5 h-5" />
              </div>
            ) : (
              <Link
                href="/app/login"
                className="bg-white text-rose-600 px-3 py-2 rounded-2xl flex items-center gap-1.5 text-xs font-bold shadow-md active:scale-95 transition-transform"
              >
                <LogIn className="w-4 h-4" /> Login
              </Link>
            )}
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Navigation className="w-3.5 h-3.5 text-rose-200" />
              <span className="text-xs text-rose-100 font-medium">Current Location</span>
            </div>
            <p className="font-semibold text-sm">Dhanmondi, Dhaka</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 flex flex-col items-center justify-center min-w-[72px]">
            <span className={`text-xl font-extrabold ${safetyScore >= 70 ? "text-green-500" : safetyScore >= 40 ? "text-amber-500" : "text-red-500"}`}>
              {safetyScore}
            </span>
            <span className="text-[9px] text-gray-400 font-semibold uppercase">Score</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-5 pb-24">
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            <Link
              href="/app/sos"
              className="flex-shrink-0 bg-gradient-to-br from-red-500 to-red-600 text-white px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-lg shadow-red-200 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Siren className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block">SOS Alert</span>
                <span className="text-[10px] text-red-100">Emergency help</span>
              </div>
            </Link>
            <Link
              href="/app/map"
              className="flex-shrink-0 bg-white px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-800 block">Safety Map</span>
                <span className="text-[10px] text-gray-400">Find safe routes</span>
              </div>
            </Link>
            <Link
              href="/app/routes"
              className="flex-shrink-0 bg-white px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Route className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-800 block">Routes</span>
                <span className="text-[10px] text-gray-400">Safe/Unsafe list</span>
              </div>
            </Link>
            <Link
              href="/app/reports"
              className="flex-shrink-0 bg-white px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-sm border border-gray-100 active:scale-95 transition-transform"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <span className="font-bold text-sm text-gray-800 block">Report Issue</span>
                <span className="text-[10px] text-gray-400">Alert community</span>
              </div>
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-extrabold text-green-500">{safeCount}</p>
            <p className="text-[10px] text-gray-400 font-medium">Safe Roads</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-extrabold text-amber-500">{roads.filter(r => r.status === "caution").length}</p>
            <p className="text-[10px] text-gray-400 font-medium">Caution</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 text-center">
            <p className="text-lg font-extrabold text-red-500">{unsafeCount}</p>
            <p className="text-[10px] text-gray-400 font-medium">Unsafe</p>
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Safe Roads Nearby</h2>
            <Link href="/app/routes" className="text-rose-500 text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {safeRoads.map((road) => {
              const stars = getRatingStars(road.rating);
              return (
                <Link href="/app/map" key={road.id} className="block">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
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
                    <div className="flex items-center gap-1 pl-[50px]">
                      {Array.from({ length: stars.full }).map((_, i) => (
                        <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                      {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                      {Array.from({ length: stars.empty }).map((_, i) => (
                        <Star key={`e-${i}`} className="w-3.5 h-3.5 text-gray-200" />
                      ))}
                      <span className="text-[11px] text-gray-400 ml-1 font-medium">{road.rating} <span className="text-gray-300">({road.reviews})</span></span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recent Reports</h2>
            <Link href="/app/reports" className="text-rose-500 text-xs font-bold flex items-center gap-0.5">
              See All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentReports.map((report) => (
              <Link href="/app/reports" key={report.id} className="block">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform">
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
                  <p className="text-sm text-gray-700 font-medium leading-snug mb-2">{report.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
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
