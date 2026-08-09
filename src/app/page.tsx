"use client";

import { Shield, Smartphone, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";

// Hidden admin entry — subtle dot in top-right corner

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4 relative">
      {/* Hidden admin entry - subtle dot in top-right corner */}
      <Link
        href="/dashboard/login"
        title="Admin"
        aria-label="Admin"
        className="absolute top-3 right-3 w-6 h-6 rounded-full opacity-5 hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
      />

      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">SafePath</h1>
          <p className="text-gray-600">Women&apos;s Safety Companion</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/app"
            className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-900">User App</h2>
                <p className="text-sm text-gray-500">Mobile optimized</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-900">Admin Dashboard</h2>
                <p className="text-sm text-gray-500">All devices supported</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
          </Link>
        </div>

        <p className="mt-8 text-xs text-gray-400">
          SafePath helps women navigate safely by rating roads and reporting incidents.
        </p>
      </div>
    </div>
  );
}
