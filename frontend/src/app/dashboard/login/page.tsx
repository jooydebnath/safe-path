"use client";

import { Shield, Lock, Mail, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, adminVerified, login, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && isAuthenticated && isAdmin && adminVerified) {
      router.replace("/dashboard");
    }
  }, [mounted, isAuthenticated, isAdmin, adminVerified, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await login(email, password);
    if (!res.ok) {
      setError(res.error ?? "Login failed");
      return;
    }
    if (res.role === "admin") {
      router.replace("/dashboard");
    } else {
      setError("Admin access only");
      logout();
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Shield className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sp-glow flex items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-info rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_10px_30px_rgba(96,165,250,0.35)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Admin Access</h1>
          <p className="text-sm text-muted mt-1">SafePath Control Panel</p>
        </div>

        <div className="sp-card p-6">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-danger-soft border border-danger/30 text-sm text-danger">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-strong mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourdomain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-info"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-strong mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-raised border border-border rounded-xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-info"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-info hover:brightness-110 text-white font-semibold py-2.5 rounded-xl transition-all shadow-[0_8px_24px_rgba(96,165,250,0.3)]"
            >
              Log in <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
