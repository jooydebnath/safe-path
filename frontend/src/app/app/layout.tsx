"use client";

import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import LocationGate from "@/components/LocationGate";
import { AlertProvider } from "@/lib/alerts";
import SOSFab from "@/components/SOSFab";
import EmergencyListener from "@/components/EmergencyListener";

// Routes under /app that must stay reachable without being logged in.
const PUBLIC_PATHS = ["/app/login", "/app/register"];
// Reachable once logged in even with an incomplete profile — everything
// else under /app is blocked until NID + username are backfilled.
const PROFILE_GATE_PATH = "/app/complete-profile";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const needsProfileCompletion = !!user && !user.profileComplete;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isPublicPath) return;
    if (!isAuthenticated) {
      router.replace("/app/login");
      return;
    }
    if (needsProfileCompletion && pathname !== PROFILE_GATE_PATH) {
      router.replace(PROFILE_GATE_PATH);
    } else if (!needsProfileCompletion && pathname === PROFILE_GATE_PATH) {
      router.replace("/app");
    }
  }, [mounted, isPublicPath, isAuthenticated, needsProfileCompletion, pathname, router]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (pathname === PROFILE_GATE_PATH) {
    if (!mounted || !isAuthenticated) {
      return (
        <div className="mobile-container bg-background min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted">
            <Shield className="w-6 h-6 animate-pulse text-primary" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  if (!mounted || !isAuthenticated || needsProfileCompletion) {
    return (
      <div className="mobile-container bg-background min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <Shield className="w-6 h-6 animate-pulse text-primary" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  // Location access is required to use the app — gated here so nothing
  // under /app renders until it's granted. AlertProvider wraps it so the
  // pop-up alert system (SOS confirmations, etc.) is available anywhere
  // under /app, and SOSFab floats above every page so SOS is always
  // reachable, not just from the home screen and bottom nav.
  return (
    <AlertProvider>
      <LocationGate>
        <EmergencyListener />
        {children}
        <SOSFab />
      </LocationGate>
    </AlertProvider>
  );
}
