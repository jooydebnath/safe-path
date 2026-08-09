"use client";

import { Search, ChevronLeft, Star, CheckCircle2, Shield, AlertTriangle, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { areas, getStatusColor, getRatingStars } from "@/lib/data";

export default function RoadsPage() {
  const { roads, updateRoadStatus } = useStore();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "safe" | "caution" | "unsafe">("all");

  const filtered = useMemo(() => {
    return roads.filter((r) => {
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.area.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [roads, search, areaFilter, statusFilter]);

  return (
    <DashboardLayout>
      <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Roads</h1>
          </div>
          <span className="text-xs text-gray-400">{filtered.length} of {roads.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search roads or areas..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
            <option value="all">All Areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
            <option value="all">All Status</option>
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="unsafe">Unsafe</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Road</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Area</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Rating</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden md:table-cell">Verified</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No roads found.</td></tr>
                )}
                {filtered.map((road) => {
                  const stars = getRatingStars(road.rating);
                  return (
                    <tr key={road.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${road.status === "safe" ? "bg-green-500" : road.status === "caution" ? "bg-amber-500" : "bg-red-500"}`} />
                          <span className="text-sm font-medium text-gray-900">{road.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{road.area}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: stars.full }).map((_, i) => <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                          {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                          {Array.from({ length: stars.empty }).map((_, i) => <Star key={`e-${i}`} className="w-3.5 h-3.5 text-gray-300" />)}
                          <span className="text-xs text-gray-500 ml-1">{road.rating}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(road.status)}`}>{road.status}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {road.verifiedByAdmin ? <CheckCircle2 className="w-4 h-4 text-blue-500" /> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => updateRoadStatus(road.id, "safe")} title="Mark Safe" className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"><Shield className="w-4 h-4" /></button>
                          <button onClick={() => updateRoadStatus(road.id, "caution")} title="Mark Caution" className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"><AlertTriangle className="w-4 h-4" /></button>
                          <button onClick={() => updateRoadStatus(road.id, "unsafe")} title="Mark Unsafe" className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"><AlertTriangle className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
