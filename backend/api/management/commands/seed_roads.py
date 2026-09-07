from django.core.management.base import BaseCommand

from api.models import Road

# Real Dhaka roads/areas, seeded as neutral starting reference data — no
# fake ratings, reviews, or incident history. The community (or admins via
# the dashboard) builds that up for real from here.
ROADS = [
    dict(name="Mirpur Road", area="Mirpur", lat=23.8103, lng=90.4125),
    dict(name="Gulshan Avenue", area="Gulshan", lat=23.7925, lng=90.4078),
    dict(name="Dhanmondi Road 27", area="Dhanmondi", lat=23.7461, lng=90.3742),
    dict(name="Mohammadpur Bus Stand Road", area="Mohammadpur", lat=23.764, lng=90.363),
    dict(name="Bashundhara R/A Main Road", area="Bashundhara", lat=23.8191, lng=90.4526),
    dict(name="Farmgate Overbridge Road", area="Farmgate", lat=23.7575, lng=90.389),
    dict(name="Uttara Sector 7 Road", area="Uttara", lat=23.874, lng=90.394),
    dict(name="Jatrabari Circular Road", area="Jatrabari", lat=23.7098, lng=90.4341),
    dict(name="Banani Road 11", area="Banani", lat=23.7932, lng=90.4008),
    dict(name="Keraniganj Highway", area="Keraniganj", lat=23.695, lng=90.355),
]


class Command(BaseCommand):
    help = "Seed real Dhaka roads as neutral reference data (rating 0, no reviews) — idempotent."

    def handle(self, *args, **options):
        created = 0
        for data in ROADS:
            _, was_created = Road.objects.get_or_create(
                name=data["name"],
                area=data["area"],
                defaults={**data, "rating": 0, "reviews": 0, "status": Road.Status.SAFE},
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} new road(s); {len(ROADS) - created} already existed."))
