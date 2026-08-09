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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/90 backdrop-blur-md border-t border-gray-100 px-3 py-2 flex justify-around items-end z-50">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const isSOS = item.href === "/app/sos";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
              isSOS && isActive
                ? "text-red-500"
                : isSOS
                ? "text-gray-400 hover:text-red-400"
                : isActive
                ? "text-rose-500 bg-rose-50"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <item.icon className={`w-5 h-5 ${isSOS && isActive ? "fill-red-100" : ""}`} />
            <span className="text-[9px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
