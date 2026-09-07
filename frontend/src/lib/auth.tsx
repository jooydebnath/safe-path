"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError, getToken, setToken } from "./api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  area?: string;
  role: "user" | "admin";
  nidStatus: "not_submitted" | "pending" | "verified" | "rejected";
  profileComplete: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  adminVerified: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: "user" | "admin" }>;
  register: (
    name: string,
    email: string,
    phone: string,
    area: string,
    password: string,
    nid: string,
    username?: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  verifyAdminPin: (pin: string) => Promise<boolean>;
  clearAdminVerification: () => void;
  completeProfile: (nid: string, username?: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "safepath_auth_user";
const ADMIN_VERIFIED_KEY = "safepath_admin_verified";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [adminVerified, setAdminVerified] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
      const verified = localStorage.getItem(ADMIN_VERIFIED_KEY) === "true";
      setAdminVerified(verified);
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (adminVerified) localStorage.setItem(ADMIN_VERIFIED_KEY, "true");
    else localStorage.removeItem(ADMIN_VERIFIED_KEY);
  }, [adminVerified, hydrated]);

  const login: AuthContextValue["login"] = async (email, password) => {
    try {
      const res = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
        email: email.trim(),
        password,
      });
      setToken(res.token);
      setUser(res.user);
      if (res.user.role === "admin") setAdminVerified(true);
      return { ok: true, role: res.user.role };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Login failed";
      return { ok: false, error: message };
    }
  };

  const register: AuthContextValue["register"] = async (name, email, phone, area, password, nid, username) => {
    try {
      const res = await api.post<{ token: string; user: AuthUser }>("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        area,
        password,
        nid: nid.trim(),
        username: username?.trim() || undefined,
      });
      setToken(res.token);
      setUser(res.user);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed";
      return { ok: false, error: message };
    }
  };

  const completeProfile: AuthContextValue["completeProfile"] = async (nid, username) => {
    try {
      const res = await api.post<{ user: AuthUser }>("/auth/complete-profile", {
        nid: nid.trim(),
        username: username?.trim() || undefined,
      });
      setUser(res.user);
      return { ok: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not complete profile";
      return { ok: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setAdminVerified(false);
    setToken(null);
  };

  const verifyAdminPin: AuthContextValue["verifyAdminPin"] = async (pin) => {
    if (!getToken()) return false;
    try {
      await api.post<{ ok: boolean }>("/auth/admin-pin", { pin });
      setAdminVerified(true);
      return true;
    } catch {
      return false;
    }
  };

  const clearAdminVerification = () => setAdminVerified(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === "admin",
        isAuthenticated: !!user,
        adminVerified,
        login,
        register,
        logout,
        verifyAdminPin,
        clearAdminVerification,
        completeProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
