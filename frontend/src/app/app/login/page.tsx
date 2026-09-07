"use client";

import { Shield, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) {
      router.push("/app");
    } else {
      setError(res.error ?? "Login failed");
    }
  };

  return (
    <div className="mobile-container bg-background sp-glow flex flex-col">
      <div className="flex-1 flex flex-col justify-center p-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 sp-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_10px_30px_var(--primary-glow)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Welcome Back</h1>
          <p className="text-sm text-muted mt-1">Login to SafePath</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
          </div>

          {error && (
            <div className="bg-danger-soft border border-danger/30 rounded-2xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              <p className="text-xs text-danger font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full sp-gradient-primary text-white py-3.5 rounded-2xl font-bold text-sm shadow-[0_10px_30px_var(--primary-glow)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            Login <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-muted">Don&apos;t have an account? </span>
          <Link href="/app/register" className="text-sm text-primary font-bold hover:text-primary-strong">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
