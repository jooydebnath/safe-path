"""National ID (NID) handling: format validation, at-rest encryption,
lookup hashing, and a stubbed verification step.

Bangladesh NID numbers come in two eras: the older 13-digit form and the
newer 10/17-digit form (the 17-digit form embeds date of birth). We accept
10, 13, or 17 digit numeric strings — this is a format check only, not a
guarantee the number is real.

Storage: the raw NID is never stored in plaintext.
  * `nid_encrypted` — Fernet-encrypted ciphertext of the raw number, so an
    admin action can decrypt it for legitimate review (e.g. manual
    verification against an uploaded NID photo). Encryption (not just a
    hash) is used specifically because that round-trip is needed.
  * `nid_hash` — SHA-256 hex digest of the raw number, used only to check
    for duplicate NID submissions across accounts without ever decrypting
    anything for that check.

Verification: there is no live integration with the Election Commission's
NID verification service here (that requires a formal API agreement this
project doesn't have). `verify_nid` is a stub that always returns "pending"
so an admin must confirm identity manually; swap its body for a real API
call once access is available, without touching any caller.
"""

import hashlib
import re

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

NID_PATTERN = re.compile(r"^\d{10}$|^\d{13}$|^\d{17}$")


class InvalidNidFormat(ValueError):
    pass


def validate_nid_format(raw: str) -> str:
    """Normalizes (strips whitespace) and validates an NID number's shape.
    Raises InvalidNidFormat if it isn't 10, 13, or 17 digits."""
    cleaned = re.sub(r"\s+", "", raw or "")
    if not NID_PATTERN.match(cleaned):
        raise InvalidNidFormat(
            "NID must be a 10, 13, or 17 digit number."
        )
    return cleaned


def hash_nid(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def _fernet() -> Fernet:
    return Fernet(settings.NID_ENCRYPTION_KEY)


def encrypt_nid(raw: str) -> str:
    return _fernet().encrypt(raw.encode("utf-8")).decode("utf-8")


def decrypt_nid(token: str) -> str | None:
    """Returns the plaintext NID, or None if it can't be decrypted (e.g. the
    encryption key rotated). Only ever call this from admin-facing,
    permission-checked code paths — never expose the result to a
    non-admin/non-owner."""
    try:
        return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return None


def verify_nid(raw_nid: str) -> str:
    """Placeholder for a real NID verification integration (e.g. the
    Bangladesh Election Commission's NID verification API). No such
    real-time integration is wired up yet, so every submission comes back
    "pending" and waits for an admin to manually confirm it. Replace this
    function's body with an actual API call when that access exists —
    callers only care about the returned status string, so nothing else
    needs to change.
    """
    return "pending"
