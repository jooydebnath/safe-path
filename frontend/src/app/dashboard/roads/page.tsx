"use client";

import { Search, ChevronLeft, Star, CheckCircle2, Shield, AlertTriangle, MapPin, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { getStatusColor, getRatingStars } from "@/lib/data";

export default function RoadsPage() {
  const { roads, areas, updateRoadStatus, addRoad } = useStore();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "safe" | "caution" | "unsafe">("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fName, setFName] = useState("");
  const [fArea, setFArea] = useState("");
  const [fLat, setFLat] = useState("");
  const [fLng, setFLng] = useState("");
  const [fStatus, setFStatus] = useState<"safe" | "caution" | "unsafe">("safe");

  const filtered = useMemo(() => {
    return roads.filter((r) => {
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.area.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [roads, search, areaFilter, statusFilter]);

  const resetForm = () => {
    setFName(""); setFArea(""); setFLat(""); setFLng(""); setFStatus("safe");
  };

  const handleAddRoad = async () => {
    const lat = parseFloat(fLat);
    const lng = parseFloat(fLng);
    if (!fName.trim() || !fArea.trim() || Number.isNaN(lat) || Number.isNaN(lng)) return;
    setSaving(true);
    try {
      await addRoad({ name: fName.trim(), area: fArea.trim(), lat, lng, status: fStatus });
      resetForm();
      setAddModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <header className="bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-muted hover:text-muted-strong text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">Roads</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted">{filtered.length} of {roads.length}</span>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-1.5 sp-gradient-primary text-white text-xs font-bold px-3 py-2 rounded-lg shadow-[0_6px_18px_var(--primary-glow)]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Road
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-4">
        <div className="sp-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search roads or areas..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="all">All Areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="all">All Status</option>
            <option value="safe">Safe</option>
            <option value="caution">Caution</option>
            <option value="unsafe">Unsafe</option>
          </select>
        </div>

        <div className="sp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Road</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Area</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Rating</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3 hidden md:table-cell">Verified</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-muted text-sm">No roads found. Click &quot;Add Road&quot; to create the first one.</td></tr>
                )}
                {filtered.map((road) => {
                  const stars = getRatingStars(road.rating);
                  return (
                    <tr key={road.id} className="hover:bg-surface-hover">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${road.status === "safe" ? "bg-safe" : road.status === "caution" ? "bg-warning" : "bg-danger"}`} />
                          <span className="text-sm font-medium text-foreground">{road.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-strong flex items-center gap-1"><MapPin className="w-3 h-3 text-muted" />{road.area}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: stars.full }).map((_, i) => <Star key={`f-${i}`} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                          {stars.half > 0 && <Star className="w-3.5 h-3.5 fill-amber-400/50 text-amber-400" />}
                          {Array.from({ length: stars.empty }).map((_, i) => <Star key={`e-${i}`} className="w-3.5 h-3.5 text-border-strong" />)}
                          <span className="text-xs text-muted ml-1">{road.rating}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(road.status)}`}>{road.status}</span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {road.verifiedByAdmin ? <CheckCircle2 className="w-4 h-4 text-info" /> : <span className="text-xs text-muted">—</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => updateRoadStatus(road.id, "safe")} title="Mark Safe" className="p-1.5 rounded-lg bg-safe-soft text-safe hover:brightness-110"><Shield className="w-4 h-4" /></button>
                          <button onClick={() => updateRoadStatus(road.id, "caution")} title="Mark Caution" className="p-1.5 rounded-lg bg-warning-soft text-warning hover:brightness-110"><AlertTriangle className="w-4 h-4" /></button>
                          <button onClick={() => updateRoadStatus(road.id, "unsafe")} title="Mark Unsafe" className="p-1.5 rounded-lg bg-danger-soft text-danger hover:brightness-110"><AlertTriangle className="w-4 h-4" /></button>
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

      {addModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddModalOpen(false)} />
          <div className="relative sp-card shadow-xl max-w-md w-full p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Add Road</h2>
              <button onClick={() => setAddModalOpen(false)} className="p-1 hover:bg-surface-hover rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Road name</label>
                <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Mirpur Road"
                  className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Area</label>
                <input type="text" value={fArea} onChange={(e) => setFArea(e.target.value)} placeholder="e.g. Mirpur"
                  className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Latitude</label>
                  <input type="number" step="any" value={fLat} onChange={(e) => setFLat(e.target.value)} placeholder="23.8103"
                    className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">Longitude</label>
                  <input type="number" step="any" value={fLng} onChange={(e) => setFLng(e.target.value)} placeholder="90.4125"
                    className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Initial status</label>
                <select value={fStatus} onChange={(e) => setFStatus(e.target.value as typeof fStatus)}
                  className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
                  <option value="safe">Safe</option>
                  <option value="caution">Caution</option>
                  <option value="unsafe">Unsafe</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAddModalOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-hover text-muted-strong hover:brightness-110">Cancel</button>
              <button
                onClick={handleAddRoad}
                disabled={saving || !fName.trim() || !fArea.trim() || !fLat || !fLng}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold sp-gradient-primary text-white shadow-[0_8px_24px_var(--primary-glow)] disabled:opacity-50 disabled:shadow-none"
              >
                {saving ? "Adding..." : "Add Road"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
