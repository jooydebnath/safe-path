"""Small geometry helpers shared by presence/SOS proximity and route-safety
checks. No external geo library — everything here is plain haversine math,
which is plenty accurate at city/country scale."""

import logging
import math

import requests

logger = logging.getLogger(__name__)

EARTH_RADIUS_M = 6_371_000

# Free, keyless public demo instance — no SLA, so callers must treat a slow
# or failed response as a normal, expected outcome (not an error to surface
# to the user) and fall back to the straight-line origin->dest segment.
OSRM_BASE_URL = "https://router.project-osrm.org"
OSRM_TIMEOUT_S = 6


def haversine_m(lat1, lng1, lat2, lng2):
    """Great-circle distance between two points, in meters."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)
    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def point_to_segment_distance_m(p, a, b):
    """Approximate distance from point `p` to line segment a-b (each a
    (lat, lng) tuple), in meters. Projects in an equirectangular
    approximation local to the segment — accurate enough for the short
    (city-scale) route segments this app draws; not meant for
    long-haul/polar geometry."""
    lat0 = math.radians((a[0] + b[0]) / 2)
    # Local meters-per-degree scale, so we can do flat-plane projection math.
    m_per_deg_lat = 111_320
    m_per_deg_lng = 111_320 * math.cos(lat0)

    def to_xy(pt):
        return (pt[1] * m_per_deg_lng, pt[0] * m_per_deg_lat)  # (x=lng, y=lat)

    px, py = to_xy(p)
    ax, ay = to_xy(a)
    bx, by = to_xy(b)

    dx, dy = bx - ax, by - ay
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq == 0:
        t = 0.0
    else:
        t = ((px - ax) * dx + (py - ay) * dy) / seg_len_sq
        t = max(0.0, min(1.0, t))

    closest_x, closest_y = ax + t * dx, ay + t * dy
    return math.hypot(px - closest_x, py - closest_y)


def point_to_polyline_distance_m(p, polyline):
    """Shortest distance from point `p` to any segment of `polyline` (a list
    of (lat, lng) tuples with at least 2 points). Just the minimum over each
    consecutive segment — fine at the polyline lengths OSRM returns for a
    single city-scale trip."""
    return min(
        point_to_segment_distance_m(p, polyline[i], polyline[i + 1])
        for i in range(len(polyline) - 1)
    )


def fetch_osrm_route(origin, dest):
    """Calls OSRM's free public demo routing server for a driving route
    between `origin` and `dest` (each a (lat, lng) tuple). Returns a list of
    (lat, lng) tuples tracing the road-following path, or None if the
    service is unreachable, times out, or returns no route — callers should
    treat None as "fall back to the straight line between origin and dest",
    not as an error, since this demo server carries no uptime guarantee."""
    url = f"{OSRM_BASE_URL}/route/v1/driving/{origin[1]},{origin[0]};{dest[1]},{dest[0]}"
    try:
        resp = requests.get(
            url,
            params={"overview": "full", "geometries": "geojson"},
            timeout=OSRM_TIMEOUT_S,
        )
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        logger.warning("OSRM route fetch failed, falling back to straight line: %s", exc)
        return None

    if data.get("code") != "Ok" or not data.get("routes"):
        return None

    # GeoJSON coordinates are [lng, lat]; flip to the (lat, lng) order used
    # everywhere else in this module.
    coords = data["routes"][0]["geometry"]["coordinates"]
    return [(lat, lng) for lng, lat in coords]
