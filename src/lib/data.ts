export interface Road {
  id: string;
  name: string;
  area: string;
  rating: number; // 1-5
  reviews: number;
  status: "safe" | "caution" | "unsafe";
  lastIncident?: string;
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
  objectionReason?: string;
  anonymous: boolean;
  userName?: string;
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
  adminNotes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "user" | "admin";
  joinedAt: string;
  reportsCount: number;
}

export const roads: Road[] = [
  { id: "r1", name: "Mirpur Road", area: "Mirpur", rating: 3.2, reviews: 156, status: "caution", lastIncident: "2 days ago", coordinates: { lat: 23.8103, lng: 90.4125 } },
  { id: "r2", name: "Gulshan Avenue", area: "Gulshan", rating: 4.5, reviews: 203, status: "safe", coordinates: { lat: 23.7925, lng: 90.4078 }, verifiedByAdmin: true },
  { id: "r3", name: "Dhanmondi Road 27", area: "Dhanmondi", rating: 4.1, reviews: 178, status: "safe", coordinates: { lat: 23.7461, lng: 90.3742 }, verifiedByAdmin: true },
  { id: "r4", name: "Mohammadpur Bus Stand Road", area: "Mohammadpur", rating: 2.3, reviews: 89, status: "unsafe", lastIncident: "Yesterday", coordinates: { lat: 23.764, lng: 90.363 } },
  { id: "r5", name: "Bashundhara R/A Main Road", area: "Bashundhara", rating: 4.3, reviews: 134, status: "safe", coordinates: { lat: 23.8191, lng: 90.4526 }, verifiedByAdmin: true },
  { id: "r6", name: "Farmgate Overbridge Road", area: "Farmgate", rating: 2.8, reviews: 245, status: "caution", lastIncident: "3 days ago", coordinates: { lat: 23.7575, lng: 90.389 } },
  { id: "r7", name: "Uttara Sector 7 Road", area: "Uttara", rating: 3.9, reviews: 112, status: "safe", coordinates: { lat: 23.874, lng: 90.394 } },
  { id: "r8", name: "Jatrabari Circular Road", area: "Jatrabari", rating: 1.9, reviews: 67, status: "unsafe", lastIncident: "Today", coordinates: { lat: 23.7098, lng: 90.4341 } },
  { id: "r9", name: "Banani Road 11", area: "Banani", rating: 4.4, reviews: 198, status: "safe", coordinates: { lat: 23.7932, lng: 90.4008 }, verifiedByAdmin: true },
  { id: "r10", name: "Keraniganj Highway", area: "Keraniganj", rating: 2.1, reviews: 45, status: "unsafe", lastIncident: "1 week ago", coordinates: { lat: 23.695, lng: 90.355 } },
];

export const areas: string[] = Array.from(new Set(roads.map((r) => r.area))).sort();

export const reports: Report[] = [
  { id: "rep1", type: "harassment", description: "Group of men loitering near the bus stop, making inappropriate comments", location: "Mirpur 10 Bus Stand", area: "Mirpur", roadId: "r1", timestamp: "2026-07-18T18:30:00Z", status: "pending", verification: "pending", anonymous: true },
  { id: "rep2", type: "lighting", description: "Street lights not working for past 3 days, very dark at night", location: "Dhanmondi Road 27, near Abahani field", area: "Dhanmondi", roadId: "r3", timestamp: "2026-07-17T20:15:00Z", status: "verified", verification: "unsafe", anonymous: false, userName: "Sarah K." },
  { id: "rep3", type: "stalking", description: "A man followed me from the market to my house", location: "Mohammadpur Bus Stand", area: "Mohammadpur", roadId: "r4", timestamp: "2026-07-19T09:45:00Z", status: "pending", verification: "pending", anonymous: true },
  { id: "rep4", type: "unsafe_area", description: "Construction site with no barriers, unsafe for pedestrians especially at night", location: "Farmgate east side", area: "Farmgate", roadId: "r6", timestamp: "2026-07-16T17:00:00Z", status: "resolved", verification: "unsafe", anonymous: false, userName: "Nadia R." },
  { id: "rep5", type: "harassment", description: "Eve teasing by bike riders in the evening", location: "Jatrabari Circular Road", area: "Jatrabari", roadId: "r8", timestamp: "2026-07-19T16:20:00Z", status: "pending", verification: "pending", anonymous: true },
  { id: "rep6", type: "other", description: "Broken sidewalk forces women to walk on road close to traffic", location: "Keraniganj Highway", area: "Keraniganj", roadId: "r10", timestamp: "2026-07-15T14:30:00Z", status: "verified", verification: "unsafe", anonymous: false, userName: "Tasnim H." },
  { id: "rep7", type: "lighting", description: "No lights in alley connecting main road", location: "Gulshan 2 lane", area: "Gulshan", roadId: "r2", timestamp: "2026-07-18T21:00:00Z", status: "pending", verification: "pending", anonymous: true },
  { id: "rep8", type: "stalking", description: "Same person seen following women regularly in this area", location: "Uttara Sector 7", area: "Uttara", roadId: "r7", timestamp: "2026-07-14T19:15:00Z", status: "resolved", verification: "safe", anonymous: false, userName: "Ripa M." },
  { id: "rep9", type: "harassment", description: "Catcalling near the tea stall on the corner", location: "Banani Road 11", area: "Banani", roadId: "r9", timestamp: "2026-07-13T22:00:00Z", status: "pending", verification: "pending", anonymous: false, userName: "Maliha I." },
  { id: "rep10", type: "unsafe_area", description: "Stray dogs aggressive at night blocking the footpath", location: "Bashundhara Main Road", area: "Bashundhara", roadId: "r5", timestamp: "2026-07-12T20:30:00Z", status: "verified", verification: "safe", anonymous: false, userName: "Fatima A." },
];

export const surveys: Survey[] = [
  { id: "sv1", roadId: "r2", userId: "u1", userName: "Sarah Khan", safetyVote: "safe", notes: "Well lit, busy throughout the day, police patrol visible at night.", timestamp: "2026-07-18T10:00:00Z", status: "verified" },
  { id: "sv2", roadId: "r4", userId: "u2", userName: "Nadia Rahman", safetyVote: "unsafe", notes: "Bus stand gets deserted after 9pm, multiple incidents reported.", timestamp: "2026-07-17T15:30:00Z", status: "verified" },
  { id: "sv3", roadId: "r8", userId: "u8", userName: "Maliha Islam", safetyVote: "unsafe", notes: "Poor lighting and frequent harassment reports.", timestamp: "2026-07-19T11:00:00Z", status: "pending" },
  { id: "sv4", roadId: "r3", userId: "u3", userName: "Tasnim Hoque", safetyVote: "safe", notes: "Crowded, shops open late, feel safe walking here.", timestamp: "2026-07-16T18:00:00Z", status: "verified" },
  { id: "sv5", roadId: "r6", userId: "u4", userName: "Ripa Moni", safetyVote: "unsafe", notes: "Overbridge area is dim and isolated at night.", timestamp: "2026-07-15T19:45:00Z", status: "pending" },
  { id: "sv6", roadId: "r5", userId: "u6", userName: "Fatima Ali", safetyVote: "safe", notes: "Residential area with guards at every gate.", timestamp: "2026-07-14T09:00:00Z", status: "verified" },
  { id: "sv7", roadId: "r1", userId: "u7", userName: "Jannatul Ferdous", safetyVote: "unsafe", notes: "Bus stop crowded but harassment incidents frequent.", timestamp: "2026-07-13T17:30:00Z", status: "pending" },
];

export const users: User[] = [
  { id: "u1", name: "Sarah Khan", email: "sarah@email.com", phone: "+8801712345678", password: "user123", role: "user", joinedAt: "2026-01-15", reportsCount: 3 },
  { id: "u2", name: "Nadia Rahman", email: "nadia@email.com", phone: "+8801712345679", password: "user123", role: "user", joinedAt: "2026-02-20", reportsCount: 5 },
  { id: "u3", name: "Tasnim Hoque", email: "tasnim@email.com", phone: "+8801712345680", password: "user123", role: "user", joinedAt: "2026-03-10", reportsCount: 2 },
  { id: "u4", name: "Ripa Moni", email: "ripa@email.com", phone: "+8801712345681", password: "user123", role: "user", joinedAt: "2026-01-05", reportsCount: 4 },
  { id: "u5", name: "Admin User", email: "admin@safepath.com", phone: "+8801712345682", password: "admin123", role: "admin", joinedAt: "2025-12-01", reportsCount: 0 },
  { id: "u6", name: "Fatima Ali", email: "fatima@email.com", phone: "+8801712345683", password: "user123", role: "user", joinedAt: "2026-04-18", reportsCount: 1 },
  { id: "u7", name: "Jannatul Ferdous", email: "jannatul@email.com", phone: "+8801712345684", password: "user123", role: "user", joinedAt: "2026-05-22", reportsCount: 0 },
  { id: "u8", name: "Maliha Islam", email: "maliha@email.com", phone: "+8801712345685", password: "user123", role: "user", joinedAt: "2026-03-30", reportsCount: 6 },
];

export const adminCredentials = {
  email: "admin@safepath.com",
  password: "admin123",
  adminPin: "1234",
};

export const typeLabels: Record<string, string> = {
  harassment: "Harassment",
  stalking: "Stalking",
  unsafe_area: "Unsafe Area",
  lighting: "Poor Lighting",
  other: "Other",
};

export const typeColors: Record<string, string> = {
  harassment: "bg-rose-100 text-rose-700",
  stalking: "bg-purple-100 text-purple-700",
  unsafe_area: "bg-orange-100 text-orange-700",
  lighting: "bg-yellow-100 text-yellow-700",
  other: "bg-gray-100 text-gray-700",
};

export const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-blue-100 text-blue-700",
  resolved: "bg-green-100 text-green-700",
};

export const verificationColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  safe: "bg-green-100 text-green-700",
  unsafe: "bg-red-100 text-red-700",
  objected: "bg-orange-100 text-orange-700",
};

export const statusIcons: Record<string, string> = {
  safe: "✅",
  caution: "⚠️",
  unsafe: "🚨",
};

export function getStatusColor(status: string) {
  switch (status) {
    case "safe": return "text-green-600 bg-green-50";
    case "caution": return "text-amber-600 bg-amber-50";
    case "unsafe": return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
}

export function getStatusBorder(status: string) {
  switch (status) {
    case "safe": return "border-green-500";
    case "caution": return "border-amber-500";
    case "unsafe": return "border-red-500";
    default: return "border-gray-300";
  }
}

export function getRatingStars(rating: number) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
}

export function getRoadName(roadId: string, list: Road[] = roads) {
  return list.find((r) => r.id === roadId)?.name ?? "Unknown Road";
}

export function getRoadArea(roadId: string, list: Road[] = roads) {
  return list.find((r) => r.id === roadId)?.area ?? "Unknown Area";
}
