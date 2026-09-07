"use client";

import { Search, ChevronLeft, Users, UserCheck, Ban, CheckCircle2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export default function UsersPage() {
  const { users, refreshUsers, suspendUser, deleteUser } = useStore();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSuspendToggle = async (id: string, isActive: boolean) => {
    setBusyId(id);
    try {
      await suspendUser(id, isActive);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}'s account? This cannot be undone.`)) return;
    setBusyId(id);
    try {
      await deleteUser(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.username ?? "").toLowerCase().includes(q)
      ) return false;
      return true;
    });
  }, [users, search, roleFilter]);

  const nidBadge = (status: string) => {
    const map: Record<string, string> = {
      verified: "bg-safe-soft text-safe",
      pending: "bg-warning-soft text-warning",
      rejected: "bg-danger-soft text-danger",
      not_submitted: "bg-surface-raised text-muted",
    };
    const label: Record<string, string> = {
      verified: "NID Verified",
      pending: "NID Pending",
      rejected: "NID Rejected",
      not_submitted: "No NID",
    };
    return <span className={`text-xs font-medium px-2 py-1 rounded-full ${map[status] ?? map.not_submitted}`}>{label[status] ?? "No NID"}</span>;
  };

  const activeUsers = users.filter((u) => u.role === "user").length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  return (
    <DashboardLayout>
      <header className="bg-surface/90 backdrop-blur-md border-b border-border px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-muted hover:text-muted-strong text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-foreground">Users</h1>
          </div>
          <span className="text-xs text-muted">{filtered.length} of {users.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="sp-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-info-soft rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{activeUsers}</p>
              <p className="text-sm text-muted">Active Users</p>
            </div>
          </div>
          <div className="sp-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-soft rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{adminUsers}</p>
              <p className="text-sm text-muted">Admins</p>
            </div>
          </div>
        </div>

        <div className="sp-card p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search by name, email, or @username..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="px-3 py-2 bg-surface-raised border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer">
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="space-y-3 lg:hidden">
          {filtered.map((user) => {
            const isSelf = currentUser?.id === user.id;
            return (
              <div key={user.id} className="sp-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.role === "admin" ? "bg-primary-soft text-primary" : "bg-info-soft text-info"}`}>{user.role}</span>
                    {!user.isActive && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-danger-soft text-danger">Suspended</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-strong">{user.email}</p>
                {user.username && <p className="text-xs text-muted">@{user.username}</p>}
                <p className="text-xs text-muted mt-1">{user.phone}{user.area && ` · ${user.area}`}</p>
                <div className="mt-2">{nidBadge(user.nidStatus)}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <span className="text-xs text-muted">Joined {user.joinedAt}</span>
                  <span className="text-xs text-muted">{user.reportsCount} reports</span>
                </div>
                {!isSelf && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <button
                      disabled={busyId === user.id}
                      onClick={() => handleSuspendToggle(user.id, user.isActive)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg border border-border text-muted-strong hover:bg-surface-hover disabled:opacity-50"
                    >
                      {user.isActive ? <><Ban className="w-3.5 h-3.5" /> Suspend</> : <><CheckCircle2 className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                    <button
                      disabled={busyId === user.id}
                      onClick={() => handleDelete(user.id, user.name)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg border border-danger/30 text-danger hover:bg-danger-soft disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="hidden lg:block sp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-raised">
                <tr>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Username</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Area</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">NID</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Joined</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Reports</th>
                  <th className="text-left text-xs font-medium text-muted uppercase px-5 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted uppercase px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((user) => {
                  const isSelf = currentUser?.id === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-surface-hover">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sp-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {user.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-sm font-medium text-foreground">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted-strong">{user.username ? `@${user.username}` : "—"}</td>
                      <td className="px-5 py-3 text-sm text-muted-strong">{user.email}</td>
                      <td className="px-5 py-3 text-sm text-muted-strong">{user.phone}</td>
                      <td className="px-5 py-3 text-sm text-muted-strong">{user.area || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${user.role === "admin" ? "bg-primary-soft text-primary" : "bg-info-soft text-info"}`}>{user.role}</span>
                      </td>
                      <td className="px-5 py-3">{nidBadge(user.nidStatus)}</td>
                      <td className="px-5 py-3 text-xs text-muted">{user.joinedAt}</td>
                      <td className="px-5 py-3 text-sm text-muted-strong">{user.reportsCount}</td>
                      <td className="px-5 py-3">
                        {user.isActive ? (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-safe-soft text-safe">Active</span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-danger-soft text-danger">Suspended</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {!isSelf && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              disabled={busyId === user.id}
                              onClick={() => handleSuspendToggle(user.id, user.isActive)}
                              title={user.isActive ? "Suspend" : "Activate"}
                              className="p-1.5 rounded-lg border border-border text-muted hover:bg-surface-hover disabled:opacity-50"
                            >
                              {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button
                              disabled={busyId === user.id}
                              onClick={() => handleDelete(user.id, user.name)}
                              title="Delete"
                              className="p-1.5 rounded-lg border border-danger/30 text-danger hover:bg-danger-soft disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
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
