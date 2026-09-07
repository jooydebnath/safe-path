"""Imports real Bangladesh road data from OpenStreetMap (via the public
Overpass API) so the road database covers the whole country, not just the
~10 hand-picked Dhaka roads in seed_roads.py.

Queried per-division (admin_level=4) rather than one nationwide query — a
single query across all of Bangladesh's motorway/trunk/primary/secondary/
tertiary ways is large enough to regularly time out or get rate-limited on
the public Overpass instance, so scoping to one division per request (with
a generous but bounded [timeout:...]) keeps each call small and retryable.

Idempotent like seed_roads.py: get_or_create keyed on (name, area), and an
existing road's admin-set status/rating is never touched on a re-run.
"""

import time
import urllib.error
import urllib.parse
import urllib.request

from django.core.management.base import BaseCommand

from api.models import Road

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Bangladesh's 8 administrative divisions — each becomes its own bounded
# Overpass query (and, as a fallback, the road's "area" value when no more
# specific locality tag is present on the OSM way).
DIVISIONS = [
    "Dhaka Division",
    "Chattogram Division",
    "Khulna Division",
    "Rajshahi Division",
    "Rangpur Division",
    "Sylhet Division",
    "Barishal Division",
    "Mymensingh Division",
]

# Major road classes only — motorway/trunk/primary are the national/regional
# highway network; secondary/tertiary add meaningful town-to-town coverage
# without pulling in every residential street in the country.
HIGHWAY_CLASSES = "motorway|trunk|primary|secondary|tertiary"

# Per-division cap so one dense division (e.g. Dhaka) can't blow the import
# out to tens of thousands of rows; still leaves room for "several hundred"
# nationwide across 8 divisions.
PER_DIVISION_LIMIT = 120


def build_query(division_name, limit):
    return f"""
[out:json][timeout:180];
rel["admin_level"="4"]["name:en"="{division_name}"]["boundary"="administrative"];
map_to_area->.div;
(
  way["highway"~"^({HIGHWAY_CLASSES})$"]["name"](area.div);
);
out tags center {limit};
""".strip()


def fetch_overpass(query, attempts=4):
    """POSTs the query to Overpass, retrying with backoff on timeout/HTTP
    429/5xx — the public instance rate-limits and occasionally times out
    under load, so a single failed attempt shouldn't abort the whole import."""
    data = urllib.parse.urlencode({"data": query}).encode()
    last_err = None
    for attempt in range(1, attempts + 1):
        try:
            req = urllib.request.Request(
                OVERPASS_URL,
                data=data,
                method="POST",
                headers={
                    # Overpass's public instance rejects/deprioritizes
                    # requests with no descriptive User-Agent.
                    "User-Agent": "SafePathRoadImport/1.0 (contact: posclaudeai@gmail.com)",
                    "Accept": "*/*",
                },
            )
            with urllib.request.urlopen(req, timeout=200) as resp:
                import json

                return json.loads(resp.read())
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            last_err = e
            wait = 15 * attempt
            time.sleep(wait)
    raise last_err


class Command(BaseCommand):
    help = "Import real Bangladesh road data from OpenStreetMap/Overpass, nationwide, division by division."

    def add_arguments(self, parser):
        parser.add_argument(
            "--divisions", nargs="*", default=DIVISIONS,
            help="Subset of division names to import (defaults to all 8).",
        )
        parser.add_argument(
            "--limit", type=int, default=PER_DIVISION_LIMIT,
            help="Max road ways to pull per division.",
        )

    def handle(self, *args, **options):
        divisions = options["divisions"]
        limit = options["limit"]
        total_created, total_seen = 0, 0

        for division in divisions:
            self.stdout.write(f"Fetching {division} (limit {limit})...")
            try:
                result = fetch_overpass(build_query(division, limit))
            except Exception as e:
                self.stderr.write(self.style.WARNING(f"  Skipped {division}: {e}"))
                continue

            elements = result.get("elements", [])
            seen_names = set()
            created_here = 0

            for el in elements:
                tags = el.get("tags", {})
                name = tags.get("name:en") or tags.get("name")
                center = el.get("center")
                if not name or not center:
                    continue
                # A single named road is usually split into many OSM ways
                # (one per segment) — dedupe within this division so we
                # don't create a dozen near-duplicate rows for one highway.
                if name in seen_names:
                    continue
                seen_names.add(name)

                # OSM rarely tags addr:district/addr:city on highway ways;
                # fall back to the division name as a generic area label
                # rather than failing the row, per import scope.
                area = tags.get("addr:city") or tags.get("addr:district") or division

                _, was_created = Road.objects.get_or_create(
                    name=name,
                    area=area,
                    defaults=dict(
                        lat=center["lat"],
                        lng=center["lon"],
                        rating=0,
                        reviews=0,
                        status=Road.Status.SAFE,
                    ),
                )
                total_seen += 1
                if was_created:
                    created_here += 1
                    total_created += 1

            self.stdout.write(f"  {division}: {created_here} new road(s) from {len(elements)} way(s).")
            # Be polite to the shared public instance between divisions.
            time.sleep(2)

        self.stdout.write(self.style.SUCCESS(
            f"Done. {total_created} new road(s) created ({total_seen} matched rows seen) across {len(divisions)} division(s)."
        ))
