"use client";

import { ChevronLeft, CheckCircle, XCircle, Filter, MapPin, ClipboardCheck, X } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { areas, getRoadName, getRoadArea } from "@/lib/data";

export default function DashboardSurveysPage() {
  const { surveys, roads, verifySurvey } = useStore();

  const [areaFilter, setAreaFilter] = useState("all");
  const [roadFilter, setRoadFilter] = useState("all");
  const [voteFilter, setVoteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const roadOptions = useMemo(() => {
    const inArea = areaFilter === "all" ? roads : roads.filter((r) => r.area === areaFilter);
    return inArea.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [roads, areaFilter]);

  const filtered = useMemo(() => {
    return surveys.filter((s) => {
      const road = roads.find((r) => r.id === s.roadId);
      if (areaFilter !== "all" && road?.area !== areaFilter) return false;
      if (roadFilter !== "all" && s.roadId !== roadFilter) return false;
      if (voteFilter !== "all" && s.safetyVote !== voteFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    });
  }, [surveys, roads, areaFilter, roadFilter, voteFilter, statusFilter]);

  const onAreaChange = (val: string) => {
    setAreaFilter(val);
    setRoadFilter("all");
  };

  const submitReject = () => {
    if (rejectModal && adminNotes.trim()) {
      verifySurvey(rejectModal, adminNotes.trim(), false);
      setRejectModal(null);
      setAdminNotes("");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified": return "bg-green-100 text-green-700";
      case "rejected": return "bg-red-100 text-red-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <DashboardLayout>
      <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Surveys — Route Verification</h1>
          </div>
          <span className="text-xs text-gray-400">{filtered.length} of {surveys.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Filter className="w-4 h-4" /> Filters
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <SelectField label="Area" value={areaFilter} onChange={onAreaChange} options={[{ value: "all", label: "All Areas" }, ...areas.map((a) => ({ value: a, label: a }))]} />
            <SelectField label="Route" value={roadFilter} onChange={setRoadFilter} options={[{ value: "all", label: "All Roads" }, ...roadOptions.map((r) => ({ value: r.id, label: r.name }))]} />
            <SelectField label="Vote" value={voteFilter} onChange={setVoteFilter} options={[{ value: "all", label: "All Votes" }, { value: "safe", label: "Safe" }, { value: "unsafe", label: "Unsafe" }]} />
            <SelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={[{ value: "all", label: "All Status" }, { value: "pending", label: "Pending" }, { value: "verified", label: "Verified" }, { value: "rejected", label: "Rejected" }]} />
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 lg:hidden">
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">No surveys match your filters.</div>}
          {filtered.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2 flex-wrap gap-1">
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.safetyVote === "safe" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {s.safetyVote === "safe" ? "Safe vote" : "Unsafe vote"}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusBadge(s.status)}`}>{s.status}</span>
              </div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <p className="text-sm font-semibold text-gray-900">{getRoadName(s.roadId, roads)}</p>
                <span className="text-xs text-gray-400">· {getRoadArea(s.roadId, roads)}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{s.notes}</p>
              <div className="text-[11px] text-gray-500 mb-2">By {s.userName} · {new Date(s.timestamp).toLocaleDateString()}{s.adminNotes && ` · Admin: ${s.adminNotes}`}</div>
              {s.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  <button onClick={() => verifySurvey(s.id, "Approved by admin", true)} className="flex-1 text-xs font-bold py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => { setRejectModal(s.id); setAdminNotes(""); }} className="flex-1 text-xs font-bold py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Road</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Area</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Vote</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Notes</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No surveys match your filters.</td></tr>
                )}
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">{getRoadName(s.roadId, roads)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{getRoadArea(s.roadId, roads)}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{s.userName}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${s.safetyVote === "safe" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{s.safetyVote}</span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate" title={s.notes}>{s.notes}{s.adminNotes && <span className="block text-xs text-gray-400">Admin: {s.adminNotes}</span>}</td>
                    <td className="px-5 py-3"><span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${statusBadge(s.status)}`}>{s.status}</span></td>
                    <td className="px-5 py-3 text-xs text-gray-500">{new Date(s.timestamp).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      {s.status === "pending" ? (
                        <div className="flex gap-1">
                          <button onClick={() => verifySurvey(s.id, "Approved by admin", true)} title="Approve" className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => { setRejectModal(s.id); setAdminNotes(""); }} title="Reject" className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"><XCircle className="w-4 h-4" /></button>
                        </div>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRejectModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" /> Reject Survey</h2>
              <button onClick={() => setRejectModal(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Add admin notes explaining why this survey is rejected.</p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Rejection reason..."
              className="w-full p-3 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none h-24 border border-gray-100"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setRejectModal(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">Cancel</button>
              <button onClick={submitReject} disabled={!adminNotes.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">Reject Survey</button>
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
      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
