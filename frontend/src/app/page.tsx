"use client";

import { Shield, Smartphone, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";

// Hidden admin entry — subtle dot in top-right corner

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative sp-glow overflow-hidden">
      {/* Hidden admin entry - subtle dot in top-right corner */}
      <Link
        href="/dashboard/login"
        title="Admin"
        aria-label="Admin"
        className="absolute top-3 right-3 w-6 h-6 rounded-full opacity-5 hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
      />

      <div className="max-w-md w-full text-center relative animate-fade-in">
        <div className="mb-10">
          <div className="w-20 h-20 sp-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_12px_36px_var(--primary-glow)]">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">SafePath</h1>
          <p className="text-muted-strong">Women&apos;s Safety Companion</p>
        </div>

        <div className="space-y-4">
          <Link
            href="/app"
            className="flex items-center justify-between sp-card p-5 hover:border-border-strong hover:bg-surface-hover transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-soft rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-foreground">User App</h2>
                <p className="text-sm text-muted">Mobile optimized</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-between sp-card p-5 hover:border-border-strong hover:bg-surface-hover transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-info-soft rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-info" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-foreground">Admin Dashboard</h2>
                <p className="text-sm text-muted">All devices supported</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-info group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted">
          SafePath helps women navigate safely by rating roads and reporting incidents.
        </p>
      </div>
    </div>
  );
}
