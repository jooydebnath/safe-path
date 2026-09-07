// Great-circle distance in kilometres — good enough for sorting "nearby" roads.
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/**
 * Reverse-geocodes coordinates to a short human-readable place name using
 * OSM's free Nominatim API (same source as the map tiles, no API key
 * needed). Prefers the neighbourhood-level field so results read like
 * "Dhanmondi" rather than a full postal address; falls back to whatever
 * locality field Nominatim did return, then null if it returned nothing
 * usable at all — callers should treat null as "couldn't resolve", not
 * silently show a wrong/stale place.
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = await res.json();
  const addr = data?.address ?? {};
  const place =
    addr.suburb || addr.neighbourhood || addr.city_district || addr.town || addr.village || addr.city;
  return place ?? null;
}

export interface PlaceResult {
  label: string;
  lat: number;
  lng: number;
}

/**
 * Forward-geocodes free-text address/place input to candidate locations
 * using OSM's free Nominatim API (same source/no key as reverseGeocode
 * above). Restricted to Bangladesh (`countrycodes=bd`) since that's the
 * app's whole scope, but a query Nominatim can't resolve there just yields
 * an empty array rather than throwing — callers should treat that as "no
 * matches", not an error. Pass an AbortSignal so a caller debouncing
 * keystrokes can cancel a stale in-flight request when the user keeps
 * typing.
 */
export async function forwardGeocode(
  query: string,
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&countrycodes=bd&limit=6`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data
    .map((d) => ({
      label: d.display_name as string,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}
