"use client";

import { Home, Route, Map as MapIcon, FileText, Siren } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Home", href: "/app", icon: Home },
  { label: "Routes", href: "/app/routes", icon: Route },
  { label: "Map", href: "/app/map", icon: MapIcon },
  { label: "Reports", href: "/app/reports", icon: FileText },
  { label: "SOS", href: "/app/sos", icon: Siren },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-surface/85 backdrop-blur-xl border-t border-border px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around items-end z-50">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const isSOS = item.href === "/app/sos";

        // SOS always carries its own red badge — even when not the active
        // tab — so it reads as the emergency action, not just another nav
        // item, no matter where the user currently is in the app.
        if (isSOS) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1 px-2 -mt-5"
            >
              <span
                className={`relative w-13 h-13 rounded-full flex items-center justify-center sp-gradient-primary shadow-[0_8px_24px_var(--primary-glow)] border-4 border-background transition-transform ${
                  isActive ? "scale-105" : ""
                }`}
                style={{ width: "3.25rem", height: "3.25rem" }}
              >
                <span className="absolute inset-0 rounded-full sp-gradient-primary sos-pulse" />
                <item.icon className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
              </span>
              <span className="text-[9px] font-bold text-primary tracking-wide">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-colors ${
              isActive ? "text-primary bg-primary-soft" : "text-muted hover:text-muted-strong"
            }`}
          >
            <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[9px] font-semibold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
