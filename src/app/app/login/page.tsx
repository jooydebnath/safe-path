"use client";

import { Shield, Mail, Lock, ArrowRight, User, AlertCircle } from "lucide-react";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = login(email.trim(), password);
    setLoading(false);
    if (res.ok) {
      router.push("/app");
    } else {
      setError(res.error ?? "Login failed");
    }
  };

  const fillDemo = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setError("");
  };

  return (
    <div className="mobile-container bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col">
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Welcome Back</h1>
          <p className="text-sm text-gray-500 mt-1">Login to SafePath</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 border border-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3.5 bg-white rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 border border-gray-100"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-500 text-white py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-rose-200 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
          >
            Login <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6">
          <div className="bg-white/70 rounded-2xl p-4 border border-rose-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Demo Credentials</p>
            <button
              onClick={() => fillDemo("sarah@email.com", "user123")}
              className="w-full text-left text-xs text-gray-600 py-1.5 hover:text-rose-600"
            >
              <User className="w-3 h-3 inline mr-1.5" /> sarah@email.com / user123
            </button>
            <button
              onClick={() => fillDemo("admin@safepath.com", "admin123")}
              className="w-full text-left text-xs text-gray-600 py-1.5 hover:text-rose-600"
            >
              <Shield className="w-3 h-3 inline mr-1.5" /> admin@safepath.com / admin123
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/app" className="text-sm text-gray-500 font-medium hover:text-rose-500">
            Continue as Guest →
          </Link>
        </div>
      </div>
    </div>
  );
}
