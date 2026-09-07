// Shared types + presentation helpers. Actual data now lives in the Django
// backend and is fetched at runtime via lib/store.tsx (see lib/api.ts).

export interface Road {
  id: string;
  name: string;
  area: string;
  rating: number; // 1-5
  reviews: number;
  status: "safe" | "caution" | "unsafe";
  lastIncident?: string | null;
  coordinates: { lat: number; lng: number };
  verifiedByAdmin?: boolean;
}

export interface Report {
  id: string;
  type: "harassment" | "stalking" | "unsafe_area" | "lighting" | "other";
  description: string;
  location: string;
  area: string;
  roadId: string;
  timestamp: string;
  status: "pending" | "verified" | "resolved";
  verification: "pending" | "safe" | "unsafe" | "objected";
  objectionReason?: string | null;
  anonymous: boolean;
  userName?: string | null;
}

export interface Survey {
  id: string;
  roadId: string;
  userId: string;
  userName: string;
  safetyVote: "safe" | "unsafe";
  notes: string;
  timestamp: string;
  status: "pending" | "verified" | "rejected";
  adminNotes?: string | null;
}

export type NidStatus = "not_submitted" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  phone: string;
  area: string;
  role: "user" | "admin";
  joinedAt: string;
  reportsCount: number;
  isActive: boolean;
  nidStatus: NidStatus;
}

export interface Review {
  id: string;
  roadId: string;
  userName: string;
  rating: number; // 1-5
  comment: string;
  timestamp: string;
  status: "pending" | "verified" | "rejected";
}

// Dhaka areas we currently track roads for — used for the signup city/area
// picker so new users are widely identifiable (not tied to one exact pin).
export const DHAKA_AREAS = [
  "Mirpur",
  "Gulshan",
  "Dhanmondi",
  "Mohammadpur",
  "Bashundhara",
  "Farmgate",
  "Uttara",
  "Jatrabari",
  "Banani",
  "Keraniganj",
];

export interface SosAlert {
  id: string;
  userName: string;
  userPhone: string;
  lat: number | null;
  lng: number | null;
  timestamp: string;
  status: "active" | "resolved";
}

// Pushed over the /ws/emergency WebSocket to nearby active users when
// someone else sends an SOS — see lib/emergencySocket.ts.
export interface NearbySosAlert {
  alertId: string;
  userName: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface RouteSafetyResult {
  status: "safe" | "caution" | "unsafe";
  reason: string;
  unsafeRoads: Road[];
  cautionRoads: Road[];
  // Road-following path from OSRM ([{lat,lng}, ...]); null when OSRM's free
  // demo routing server was unreachable, in which case `approximate` is
  // true and the frontend should fall back to a straight line + a small note.
  routedPolyline: { lat: number; lng: number }[] | null;
  approximate: boolean;
}

export const typeLabels: Record<string, string> = {
  harassment: "Harassment",
  stalking: "Stalking",
  unsafe_area: "Unsafe Area",
  lighting: "Poor Lighting",
  other: "Other",
};

export const typeColors: Record<string, string> = {
  harassment: "bg-primary-soft text-primary",
  stalking: "bg-info-soft text-info",
  unsafe_area: "bg-warning-soft text-warning",
  lighting: "bg-warning-soft text-warning",
  other: "bg-surface-hover text-muted-strong",
};

export const statusColors: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  verified: "bg-info-soft text-info",
  resolved: "bg-safe-soft text-safe",
};

export const verificationColors: Record<string, string> = {
  pending: "bg-warning-soft text-warning",
  safe: "bg-safe-soft text-safe",
  unsafe: "bg-danger-soft text-danger",
  objected: "bg-warning-soft text-warning",
};

export const statusIcons: Record<string, string> = {
  safe: "✅",
  caution: "⚠️",
  unsafe: "🚨",
};

export function getStatusColor(status: string) {
  switch (status) {
    case "safe": return "text-safe bg-safe-soft";
    case "caution": return "text-warning bg-warning-soft";
    case "unsafe": return "text-danger bg-danger-soft";
    default: return "text-muted bg-surface-hover";
  }
}

export function getStatusBorder(status: string) {
  switch (status) {
    case "safe": return "border-safe";
    case "caution": return "border-warning";
    case "unsafe": return "border-danger";
    default: return "border-border-strong";
  }
}

export function getRatingStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}

export function getRoadName(roadId: string, list: Road[] = []) {
  return list.find((r) => r.id === roadId)?.name ?? "Unknown Road";
}

export function getRoadArea(roadId: string, list: Road[] = []) {
  return list.find((r) => r.id === roadId)?.area ?? "Unknown Area";
}
