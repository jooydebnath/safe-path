"use client";

import { ChevronLeft, CheckCircle, XCircle, Filter, MapPin, Star } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { getRoadName, getRoadArea } from "@/lib/data";

export default function DashboardReviewsPage() {
  const { reviews, roads, areas, verifyReview } = useStore();

  const [areaFilter, setAreaFilter] = useState("all");
  const [roadFilter, setRoadFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const roadOptions = useMemo(() => {
    const inArea = areaFilter === "all" ? roads : roads.filter((r) => r.area === areaFilter);
    return inArea.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [roads, areaFilter]);

  const filtered = useMemo(() => {
    return reviews.filter((rv) => {
      const road = roads.find((r) => r.id === rv.roadId);
      if (areaFilter !== "all" && road?.area !== areaFilter) return false;
      if (roadFilter !== "all" && rv.roadId !== roadFilter) return false;
      if (statusFilter !== "all" && rv.status !== statusFilter) return false;
      return true;
    });
  }, [reviews, roads, areaFilter, roadFilter, statusFilter]);

  const onAreaChange = (val: string) => {
    setAreaFilter(val);
    setRoadFilter("all");
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified": return "bg-safe-soft text-safe";
      case "rejected": return "bg-danger-soft text-danger";
      default: return "bg-warning-soft text-warning";
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
            <h1 className="text-lg lg:text-xl font-bold text-foreground">Reviews — Ratings Verification</h1>
          </div>
          <span className="text-xs text-muted">{filtered.length} of {reviews.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-4">
        <div className="sp-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-strong">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <SelectField label="Area" value={areaFilter} onChange={onAreaChange} options={[{ value: "all", label: "All Areas" }, ...areas.map((a) => ({ value: a, label: a }))]} />
            <SelectField label="Route" value={roadFilter} onChange={setRoadFilter} options={[{ value: "all", label: "All Roads" }, ...roadOptions.map((r) => ({ value: r.id, label: r.name }))]} />
            <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "All Status" }, { value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }]} />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 lg:hidden">
          {filtered.length === 0 && <div className="text-center py-12 text-muted text-sm">No reviews match your filters.</div>}
          {filtered.map((rv) => (
            <div key={rv.id} className="sp-card p-4">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-1">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < rv.rating ? "fill-amber-400 text-amber-400" : "text-border-strong"}`} />
                  ))}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusBadge(rv.status)}`}>{rv.status}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{getRoadName(rv.roadId, roads)}</p>
                <span className="text-xs text-muted">· {getRoadArea(rv.roadId, roads)}</span>
              </div>
              {rv.comment && <p className="text-xs text-muted-strong mb-2">{rv.comment}</p>}
              <div className="text-[11px] text-muted mb-2">By {rv.userName} · {new Date(rv.timestamp).toLocaleDateString()}</div>
              {rv.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => verifyReview(rv.id, true)} className="flex-1 text-xs font-bold py-2 rounded-lg bg-safe-soft text-safe hover:brightness-110 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => verifyReview(rv.id, false)} className="flex-1 text-xs font-bold py-2 rounded-lg bg-danger-soft text-danger hover:brightness-110 flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block sp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Road</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Area</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Rating</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Comment</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-muted text-sm">No reviews match your filters.</td></tr>
                )}
                {filtered.map((rv) => (
                  <tr key={rv.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{getRoadName(rv.roadId, roads)}</td>
                    <td className="px-5 py-3 text-sm text-muted-strong">{getRoadArea(rv.roadId, roads)}</td>
                    <td className="px-5 py-3 text-sm text-muted-strong">{rv.userName}</td>
                    <td className="px-5 py-3 text-sm text-muted-strong">{rv.rating}★</td>
                    <td className="px-5 py-3 text-sm text-muted-strong max-w-xs truncate" title={rv.comment}>{rv.comment}</td>
                    <td className="px-5 py-3"><span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${statusBadge(rv.status)}`}>{rv.status}</span></td>
                    <td className="px-5 py-3 text-xs text-muted">{new Date(rv.timestamp).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      {rv.status === "pending" ? (
                        <div className="flex gap-1">
                          <button onClick={() => verifyReview(rv.id, true)} title="Approve" className="p-1.5 rounded-lg bg-safe-soft text-safe hover:brightness-110"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => verifyReview(rv.id, false)} title="Reject" className="p-1.5 rounded-lg bg-danger-soft text-danger hover:brightness-110"><XCircle className="w-4 h-4" /></button>
                        </div>
                      ) : <span className="text-xs text-muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted uppercase mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
