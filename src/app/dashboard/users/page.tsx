"use client";

import { Search, ChevronLeft, Users, UserCheck } from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useStore } from "@/lib/store";

export default function UsersPage() {
  const { users } = useStore();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [users, search, roleFilter]);

  const activeUsers = users.filter((u) => u.role === "user").length;
  const adminUsers = users.filter((u) => u.role === "admin").length;

  return (
    <DashboardLayout>
      <header className="bg-white border-b border-gray-200 px-4 py-3 lg:px-8 lg:py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden sm:flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm">
              <ChevronLeft className="w-4 h-4" /> Back
            </Link>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">Users</h1>
          </div>
          <span className="text-xs text-gray-400">{filtered.length} of {users.length}</span>
        </div>
      </header>

      <div className="p-4 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
              <p className="text-sm text-gray-500">Active Users</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{adminUsers}</p>
              <p className="text-sm text-gray-500">Admins</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="space-y-3 lg:hidden">
          {filtered.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{user.role}</span>
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
              <p className="text-xs text-gray-500 mt-1">{user.phone}</p>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                <span className="text-xs text-gray-500">Joined {user.joinedAt}</span>
                <span className="text-xs text-gray-500">{user.reportsCount} reports</span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Email</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Phone</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Joined</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Reports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold text-xs">
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{user.phone}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{user.role}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{user.joinedAt}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{user.reportsCount}</td>
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
