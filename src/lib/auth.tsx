"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { users as seedUsers, adminCredentials, User } from "./data";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  adminVerified: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  verifyAdminPin: (pin: string) => boolean;
  clearAdminVerification: () => void;
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

  const login = (email: string, password: string) => {
    const found = seedUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) {
      // Allow admin credentials override
      if (
        email.toLowerCase() === adminCredentials.email.toLowerCase() &&
        password === adminCredentials.password
      ) {
        const adminUser: AuthUser = {
          id: "u5",
          name: "Admin User",
          email: adminCredentials.email,
          role: "admin",
        };
        setUser(adminUser);
        return { ok: true };
      }
      return { ok: false, error: "Invalid email or password" };
    }
    setUser({ id: found.id, name: found.name, email: found.email, role: found.role });
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    setAdminVerified(false);
  };

  const verifyAdminPin = (pin: string) => {
    if (pin === adminCredentials.adminPin) {
      setAdminVerified(true);
      return true;
    }
    return false;
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
        logout,
        verifyAdminPin,
        clearAdminVerification,
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
