"use client";

import { Shield, Lock, Mail, KeyRound, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, adminVerified, login, verifyAdminPin, logout } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && isAuthenticated && isAdmin && adminVerified) {
      router.replace("/dashboard");
    }
  }, [mounted, isAuthenticated, isAdmin, adminVerified, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = login(email, password);
    if (!res.ok) {
      setError(res.error ?? "Login failed");
      return;
    }
    if (email.toLowerCase() === "admin@safepath.com") {
      setStep(2);
    } else {
      setError("Admin access only");
      logout();
    }
  };

  const handlePin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (verifyAdminPin(pin)) {
      router.replace("/dashboard");
    } else {
      setError("Invalid PIN. Please try again.");
      setPin("");
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Shield className="w-8 h-8 text-blue-300 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>

      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
          <p className="text-sm text-gray-500 mt-1">SafePath Control Panel</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex items-center gap-2 ${step === 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? "bg-blue-600 text-white" : "bg-gray-100"}`}>1</div>
              <span className="text-sm font-medium">Credentials</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className={`flex items-center gap-2 ${step === 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? "bg-blue-600 text-white" : "bg-gray-100"}`}>2</div>
              <span className="text-sm font-medium">Verification</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@safepath.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="admin123"
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handlePin} className="space-y-4">
              <div className="text-center mb-2">
                <KeyRound className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Enter the 4-digit admin PIN to verify your identity.</p>
              </div>
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                Verify & Enter <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => { setStep(1); setPin(""); setError(""); logout(); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Back to login
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Demo — Email: <span className="font-medium text-gray-500">admin@safepath.com</span> / Password: <span className="font-medium text-gray-500">admin123</span> / PIN: <span className="font-medium text-gray-500">1234</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
