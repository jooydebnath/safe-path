"use client";

import { ChevronLeft, Filter, CheckCircle, XCircle, Ban, X, Search, MapPin } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import {
  typeLabels, typeColors, statusColors, verificationColors,
  getRoadName,
} from "@/lib/data";

export default function DashboardReportsPage() {
  const { reports, roads, areas, verifyReport, objectReport } = useStore();

  const [areaFilter, setAreaFilter] = useState("all");
  const [roadFilter, setRoadFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationSearch, setLocationSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [objectionModal, setObjectionModal] = useState<string | null>(null);
  const [objectionReason, setObjectionReason] = useState("");

  const roadOptions = useMemo(() => {
    const inArea = areaFilter === "all" ? roads : roads.filter((r) => r.area === areaFilter);
    return inArea.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [roads, areaFilter]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (areaFilter !== "all" && r.area !== areaFilter) return false;
      if (roadFilter !== "all" && r.roadId !== roadFilter) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (locationSearch && !r.location.toLowerCase().includes(locationSearch.toLowerCase())) return false;
      if (verificationFilter !== "all" && r.verification !== verificationFilter) return false;
      const ts = new Date(r.timestamp).getTime();
      if (dateFrom && ts < new Date(dateFrom).getTime()) return false;
      if (dateTo && ts > new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1) return false;
      return true;
    });
  }, [reports, areaFilter, roadFilter, typeFilter, locationSearch, verificationFilter, dateFrom, dateTo]);

  const onAreaChange = (val: string) => {
    setAreaFilter(val);
    setRoadFilter("all");
  };

  const submitObjection = () => {
    if (objectionModal && objectionReason.trim()) {
      objectReport(objectionModal, objectionReason.trim());
      setObjectionModal(null);
      setObjectionReason("");
    }
  };

  const clearFilters = () => {
    setAreaFilter("all"); setRoadFilter("all"); setTypeFilter("all");
    setLocationSearch(""); setDateFrom(""); setDateTo(""); setVerificationFilter("all");
  };

  return (
    <DashboardLayout>
      <header className="bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-muted hover:text-muted-strong text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">Reports — Community Labeling</h1>
          </div>
          <span className="text-xs text-muted">{filtered.length} of {reports.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-4">
        {/* Filters */}
        <div className="sp-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-strong">
              <Filter className="w-4 h-4" /> Filters
            </div>
            <button onClick={clearFilters} className="text-xs text-muted hover:text-muted-strong">Clear all</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SelectField label="Area" value={areaFilter} onChange={onAreaChange} options={[{ value: "all", label: "All Areas" }, ...areas.map((a) => ({ value: a, label: a }))]} />
            <SelectField label="Route" value={roadFilter} onChange={setRoadFilter} options={[{ value: "all", label: "All Roads" }, ...roadOptions.map((r) => ({ value: r.id, label: r.name }))]} />
            <SelectField label="Type" value={typeFilter} onChange={setTypeFilter} options={[{ value: "all", label: "All Types" }, ...Object.entries(typeLabels).map(([k, v]) => ({ value: k, label: v }))]} />
            <SelectField label="Verification" value={verificationFilter} onChange={setVerificationFilter} options={[
              { value: "all", label: "All Verifications" },
              { value: "pending", label: "Pending" },
              { value: "safe", label: "Verified Safe" },
              { value: "unsafe", label: "Verified Unsafe" },
              { value: "objected", label: "Objected" },
            ]} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase mb-1">Location search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={locationSearch}
                  onChange={(e) => setLocationSearch(e.target.value)}
                  placeholder="Location text..."
                  className="w-full pl-9 pr-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase mb-1">Date from</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted uppercase mb-1">Date to</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 lg:hidden">
          {filtered.length === 0 && <EmptyState />}
          {filtered.map((r) => (
            <div key={r.id} className="sp-card p-4">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeColors[r.type]}`}>{typeLabels[r.type]}</span>
                <div className="flex gap-1">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${verificationColors[r.verification]}`}>{r.verification}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[r.status]}`}>{r.status}</span>
                </div>
              </div>
              <p className="text-sm text-muted-strong mb-2">{r.description}</p>
              <div className="text-xs text-muted space-y-0.5 mb-2">
                <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location} · {r.area}</p>
                <p>Road: {getRoadName(r.roadId, roads)}</p>
                <p>{new Date(r.timestamp).toLocaleDateString()} · By {r.anonymous ? "Anonymous" : r.userName}</p>
                {r.objectionReason && <p className="text-warning">Objection: {r.objectionReason}</p>}
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button onClick={() => verifyReport(r.id, "safe")} className="flex-1 text-xs font-bold py-2 rounded-lg bg-safe-soft text-safe hover:brightness-110 flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Safe
                </button>
                <button onClick={() => verifyReport(r.id, "unsafe")} className="flex-1 text-xs font-bold py-2 rounded-lg bg-danger-soft text-danger hover:brightness-110 flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Unsafe
                </button>
                <button onClick={() => { setObjectionModal(r.id); setObjectionReason(""); }} className="flex-1 text-xs font-bold py-2 rounded-lg bg-warning-soft text-warning hover:brightness-110 flex items-center justify-center gap-1">
                  <Ban className="w-3.5 h-3.5" /> Object
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block sp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Description</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Area</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Road</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Verification</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-muted text-sm">No reports match your filters.</td></tr>
                )}
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-3"><span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${typeColors[r.type]}`}>{typeLabels[r.type]}</span></td>
                    <td className="px-5 py-3 text-sm text-muted-strong max-w-xs">{r.description}{r.objectionReason && <span className="block text-xs text-warning mt-1">⚠ {r.objectionReason}</span>}</td>
                    <td className="px-5 py-3 text-sm text-muted-strong">{r.area}</td>
                    <td className="px-5 py-3 text-sm text-muted-strong">{getRoadName(r.roadId, roads)}</td>
                    <td className="px-5 py-3"><span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${verificationColors[r.verification]}`}>{r.verification}</span></td>
                    <td className="px-5 py-3 text-xs text-muted">{new Date(r.timestamp).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => verifyReport(r.id, "safe")} title="Mark Safe" className="p-1.5 rounded-lg bg-safe-soft text-safe hover:brightness-110"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => verifyReport(r.id, "unsafe")} title="Mark Unsafe" className="p-1.5 rounded-lg bg-danger-soft text-danger hover:brightness-110"><XCircle className="w-4 h-4" /></button>
                        <button onClick={() => { setObjectionModal(r.id); setObjectionReason(""); }} title="Object" className="p-1.5 rounded-lg bg-warning-soft text-warning hover:brightness-110"><Ban className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Objection modal */}
      {objectionModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setObjectionModal(null)} />
          <div className="relative sp-card shadow-xl max-w-md w-full p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Ban className="w-5 h-5 text-warning" /> Object to Report</h2>
              <button onClick={() => setObjectionModal(null)} className="p-1 hover:bg-surface-hover rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <p className="text-sm text-muted mb-3">Provide a reason for objecting to this community report.</p>
            <textarea
              value={objectionReason}
              onChange={(e) => setObjectionReason(e.target.value)}
              placeholder="Objection reason..."
              className="w-full p-3 bg-surface-raised rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-warning resize-none h-24 border border-border"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setObjectionModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-surface-hover text-muted-strong hover:brightness-110">Cancel</button>
              <button onClick={submitObjection} disabled={!objectionReason.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-warning-soft text-warning border border-warning/30 hover:brightness-110 disabled:opacity-50">Submit Objection</button>
            </div>
          </div>
        </div>
      )}
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 text-muted">
      <p className="text-sm font-medium">No reports match your filters.</p>
    </div>
  );
}
