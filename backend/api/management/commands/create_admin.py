from django.core.management.base import BaseCommand, CommandError

from api.models import User


class Command(BaseCommand):
    help = "Create (or update) the one operator admin account needed to sign into /dashboard."

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--password", required=True)
        parser.add_argument("--name", default="Admin")

    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        password = options["password"]
        name = options["name"]

        if len(password) < 6:
            raise CommandError("Password must be at least 6 characters.")

        user, created = User.objects.get_or_create(
            email=email,
            defaults={"username": email, "name": name, "role": User.Role.ADMIN},
        )
        user.name = name
        user.role = User.Role.ADMIN
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        verb = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{verb} admin account: {email}"))
