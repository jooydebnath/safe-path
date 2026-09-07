"""Auto-generates a unique, URL/search-friendly username from a display
name — used at registration and for backfilling pre-existing accounts that
predate the username field."""

import re
import secrets

USERNAME_RE = re.compile(r"^[a-z0-9_]{3,30}$")


def slugify_base(name: str, fallback: str = "user") -> str:
    base = re.sub(r"[^a-z0-9]+", "_", (name or "").strip().lower()).strip("_")
    base = base[:20] or fallback
    return base


def generate_unique_username(User, name: str, fallback: str = "user") -> str:
    base = slugify_base(name, fallback)
    for _ in range(20):
        candidate = f"{base}_{secrets.randbelow(9000) + 1000}"
        if not User.objects.filter(username__iexact=candidate).exists():
            return candidate
    # Astronomically unlikely fallback: full random suffix.
    return f"{base}_{secrets.token_hex(4)}"


def is_valid_username(value: str) -> bool:
    return bool(USERNAME_RE.match(value or ""))
