"use client";

import {
  TrendingUp, AlertTriangle, CheckCircle, Clock, ChevronRight, Users as UsersIcon, ClipboardCheck, Siren,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { typeLabels, typeColors, verificationColors, statusColors } from "@/lib/data";

export default function DashboardPage() {
  const { roads, reports, surveys, users, sosAlerts, areas, refreshUsers, refreshSosAlerts } = useStore();

  useEffect(() => {
    refreshUsers();
    refreshSosAlerts();
  }, [refreshUsers, refreshSosAlerts]);

  const safeCount = roads.filter((r) => r.status === "safe").length;
  const unsafeCount = roads.filter((r) => r.status === "unsafe").length;
  const pendingReports = reports.filter((r) => r.verification === "pending").length;
  const pendingSurveys = surveys.filter((s) => s.status === "pending").length;
  const activeSosCount = sosAlerts.filter((a) => a.status === "active").length;
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
      <header className="bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <h1 className="text-lg lg:text-xl font-bold text-foreground">Dashboard</h1>
          <span className="text-xs text-muted hidden sm:block">Overview</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        {activeSosCount > 0 && (
          <Link
            href="/dashboard/sos"
            className="flex items-center gap-3 sp-gradient-primary text-white rounded-2xl p-4 shadow-[0_10px_28px_var(--primary-glow)] active:scale-[0.99] transition-transform"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Siren className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{activeSosCount} active SOS alert{activeSosCount > 1 ? "s" : ""}</p>
              <p className="text-xs text-white/80">Tap to review and respond</p>
            </div>
            <ChevronRight className="w-5 h-5" />
          </Link>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatCard title="Active SOS" value={activeSosCount} icon={<Siren className="w-5 h-5 text-danger" />} />
          <StatCard title="Safe Roads" value={safeCount} icon={<CheckCircle className="w-5 h-5 text-safe" />} />
          <StatCard title="Unsafe Roads" value={unsafeCount} icon={<AlertTriangle className="w-5 h-5 text-danger" />} />
          <StatCard title="Pending Reports" value={pendingReports} icon={<Clock className="w-5 h-5 text-warning" />} />
          <StatCard title="Pending Surveys" value={pendingSurveys} icon={<ClipboardCheck className="w-5 h-5 text-primary" />} />
          <StatCard title="Total Users" value={totalUsers} icon={<UsersIcon className="w-5 h-5 text-info" />} />
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
                      <span className="text-sm capitalize text-muted-strong">{status}</span>
                      <span className="text-sm font-medium text-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${status === "safe" ? "bg-safe" : status === "caution" ? "bg-warning" : "bg-danger"}`} style={{ width: `${pct}%` }} />
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
                      <span className="text-sm text-muted-strong">{label}</span>
                      <span className="text-sm font-medium text-foreground">{count}</span>
                    </div>
                    <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${typeColors[key]?.split(" ")[0] ?? "bg-muted"}`} style={{ width: `${pct}%` }} />
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
                const barColor = v === "safe" ? "bg-safe" : v === "unsafe" ? "bg-danger" : v === "objected" ? "bg-primary" : "bg-warning";
                return (
                  <div key={v}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm capitalize text-muted-strong">{v}</span>
                      <span className="text-sm font-medium text-foreground">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
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
                      <span className="text-sm text-muted-strong">{a}</span>
                      <span className="text-xs text-muted">
                        <span className="text-safe font-medium">{s} safe</span> · <span className="text-danger font-medium">{u} unsafe</span>
                      </span>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div className="bg-safe rounded-l-full" style={{ width: `${(s / maxAreaCount) * 100}%` }} />
                      <div className="bg-danger rounded-r-full" style={{ width: `${(u / maxAreaCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <div className="sp-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recent Reports</h2>
            <Link href="/dashboard/reports" className="text-info text-sm font-medium flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3 hidden sm:table-cell">Location</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Verification</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${typeColors[report.type]}`}>
                        {typeLabels[report.type]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-strong hidden sm:table-cell">{report.location}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${verificationColors[report.verification]}`}>
                        {report.verification}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted hidden md:table-cell">
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
    <div className="sp-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-surface-raised rounded-xl flex items-center justify-center">{icon}</div>
        <TrendingUp className="w-4 h-4 text-muted" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted">{title}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sp-card p-5">
      <h2 className="font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}
