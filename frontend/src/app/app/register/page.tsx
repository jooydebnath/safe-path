"use client";

import { Shield, Mail, Lock, Phone, User, MapPin, ArrowRight, AlertCircle, IdCard, AtSign } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DHAKA_AREAS } from "@/lib/data";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [nid, setNid] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nidDigitsOk = /^\d{10}$|^\d{13}$|^\d{17}$/.test(nid.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!nidDigitsOk) {
      setError("NID must be a valid 10, 13, or 17 digit number");
      return;
    }

    setLoading(true);
    const res = await register(name, email, phone, area, password, nid, username);
    setLoading(false);
    if (res.ok) {
      router.push("/app");
    } else {
      setError(res.error ?? "Registration failed");
    }
  };

  return (
    <div className="mobile-container bg-background sp-glow flex flex-col">
      <div className="flex-1 flex flex-col justify-center p-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 sp-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_10px_30px_var(--primary-glow)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Create Account</h1>
          <p className="text-sm text-muted mt-1">Join SafePath</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
          </div>

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
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">City / Area</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                required
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border appearance-none"
              >
                <option value="" disabled className="bg-surface text-foreground">Select your area...</option>
                {DHAKA_AREAS.map((a) => (
                  <option key={a} value={a} className="bg-surface text-foreground">{a}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-muted mt-1.5 ml-1">Helps us show you nearby roads and match your reports to the right area.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">National ID (NID) Number</label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={nid}
                onChange={(e) => setNid(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="10, 13, or 17 digit NID number"
                maxLength={17}
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5 ml-1">Required to verify your identity and keep SafePath accounts real. Stored encrypted — never shown to other users.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Username <span className="normal-case text-muted font-medium">(optional)</span></label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="Leave blank to auto-generate"
                maxLength={30}
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
            <p className="text-[11px] text-muted mt-1.5 ml-1">Your unique @handle — lowercase letters, numbers, underscores. You can change it later.</p>
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
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-muted uppercase tracking-wider mb-2 block">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3.5 bg-surface rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-border"
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
            Create Account <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-muted">Already have an account? </span>
          <Link href="/app/login" className="text-sm text-primary font-bold hover:text-primary-strong">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
