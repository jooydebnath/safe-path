"use client";

import {
  TrendingUp, AlertTriangle, CheckCircle, Clock, ChevronRight, Users as UsersIcon, ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { typeLabels, typeColors, verificationColors, areas, statusColors } from "@/lib/data";

export default function DashboardPage() {
  const { roads, reports, surveys, users } = useStore();

  const safeCount = roads.filter((r) => r.status === "safe").length;
  const unsafeCount = roads.filter((r) => r.status === "unsafe").length;
  const pendingReports = reports.filter((r) => r.verification === "pending").length;
  const pendingSurveys = surveys.filter((s) => s.status === "pending").length;
  const totalUsers = users.length;
  const recentReports = reports.slice(0, 6);

  const verificationCounts = {
    pending: reports.filter((r) => r.verification === "pending").length,
    safe: reports.filter((r) => r.verification === "safe").length,
    unsafe: reports.filter((r) => r.verification === "unsafe").length,
    objected: reports.filter((r) => r.verification === "objected").length,
  };

  const maxAreaCount = Math.max(
    1,
    ...areas.map((a) => {
      const s = roads.filter((r) => r.area === a && r.status === "safe").length;
      const u = roads.filter((r) => r.area === a && r.status === "unsafe").length;
      return Math.max(s, u);
    })
  );

  return (
    <DashboardLayout>
      <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <h1 className="text-lg lg:text-xl font-bold text-gray-900">Dashboard</h1>
          <span className="text-xs text-gray-400 hidden sm:block">Overview</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Safe Roads" value={safeCount} icon={<CheckCircle className="w-5 h-5 text-green-600" />} />
          <StatCard title="Unsafe Roads" value={unsafeCount} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} />
          <StatCard title="Pending Reports" value={pendingReports} icon={<Clock className="w-5 h-5 text-amber-600" />} />
          <StatCard title="Pending Surveys" value={pendingSurveys} icon={<ClipboardCheck className="w-5 h-5 text-purple-600" />} />
          <StatCard title="Total Users" value={totalUsers} icon={<UsersIcon className="w-5 h-5 text-blue-600" />} />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Road Safety Status">
            <div className="space-y-3">
              {(["safe", "caution", "unsafe"] as const).map((status) => {
                const count = roads.filter((r) => r.status === status).length;
                const pct = roads.length ? Math.round((count / roads.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize text-gray-700">{status}</span>
                      <span className="text-sm font-medium text-gray-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${status === "safe" ? "bg-green-500" : status === "caution" ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Report Types">
            <div className="space-y-3">
              {Object.entries(typeLabels).map(([key, label]) => {
                const count = reports.filter((r) => r.type === key).length;
                const pct = reports.length ? Math.round((count / reports.length) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${typeColors[key]?.split(" ")[0] ?? "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Verification Breakdown">
            <div className="space-y-3">
              {(["pending", "safe", "unsafe", "objected"] as const).map((v) => {
                const count = verificationCounts[v];
                const pct = reports.length ? Math.round((count / reports.length) * 100) : 0;
                const barColor = v === "safe" ? "bg-green-500" : v === "unsafe" ? "bg-red-500" : v === "objected" ? "bg-orange-500" : "bg-yellow-500";
                return (
                  <div key={v}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize text-gray-700">{v}</span>
                      <span className="text-sm font-medium text-gray-900">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          <ChartCard title="Area-wise Safe / Unsafe">
            <div className="space-y-3">
              {areas.map((a) => {
                const s = roads.filter((r) => r.area === a && r.status === "safe").length;
                const u = roads.filter((r) => r.area === a && r.status === "unsafe").length;
                return (
                  <div key={a}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{a}</span>
                      <span className="text-xs text-gray-500">
                        <span className="text-green-600 font-medium">{s} safe</span> · <span className="text-red-600 font-medium">{u} unsafe</span>
                      </span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-green-500 rounded-l-full" style={{ width: `${(s / maxAreaCount) * 100}%` }} />
                      <div className="bg-red-500 rounded-r-full" style={{ width: `${(u / maxAreaCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Reports</h2>
            <Link href="/dashboard/reports" className="text-blue-600 text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden sm:table-cell">Location</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Verification</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${typeColors[report.type]}`}>
                        {typeLabels[report.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 hidden sm:table-cell">{report.location}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${verificationColors[report.verification]}`}>
                        {report.verification}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500 hidden md:table-cell">
                      {new Date(report.timestamp).toLocaleDateString()}
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

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">{icon}</div>
        <TrendingUp className="w-4 h-4 text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}
