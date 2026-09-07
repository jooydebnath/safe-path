import uuid

from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


def gen_road_id():
    return "r" + uuid.uuid4().hex[:10]


def gen_report_id():
    return "rep" + uuid.uuid4().hex[:10]


def gen_survey_id():
    return "sv" + uuid.uuid4().hex[:10]


def gen_sos_id():
    return "sos" + uuid.uuid4().hex[:10]


def gen_review_id():
    return "rv" + uuid.uuid4().hex[:10]


class UserManager(BaseUserManager):
    """User manager keyed on email; keeps the inherited `username` field
    populated (equal to the email) so Django's auth internals stay happy."""

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", User.Role.ADMIN)
        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        USER = "user", "User"
        ADMIN = "admin", "Admin"

    class NidStatus(models.TextChoices):
        NOT_SUBMITTED = "not_submitted", "Not submitted"
        PENDING = "pending", "Pending review"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True)
    # City/area given at signup, so reports/reviews/nearby-roads can be
    # matched to the user widely (not just to a single road pin).
    area = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    joined_at = models.DateField(auto_now_add=True)
    reports_count = models.PositiveIntegerField(default=0)

    # Public, user-chosen (or auto-generated) handle — distinct from the
    # inherited `username` field, which stays populated as a copy of the
    # email purely for Django auth internals (see UserManager below).
    handle = models.CharField(max_length=30, unique=True, null=True, blank=True)

    # NID is stored encrypted (nid_encrypted, decryptable for admin review)
    # plus a SHA-256 lookup hash (nid_hash, for duplicate-detection without
    # decrypting anything) — see api/nid.py. The raw number is never stored.
    nid_encrypted = models.TextField(blank=True, null=True)
    nid_hash = models.CharField(max_length=64, unique=True, null=True, blank=True)
    nid_status = models.CharField(
        max_length=15, choices=NidStatus.choices, default=NidStatus.NOT_SUBMITTED
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    @property
    def profile_complete(self):
        """Existing accounts created before NID/handle were required must
        complete their profile on next login (see ProfileCompleteView) —
        this is the single source of truth the frontend gate checks."""
        return bool(self.handle) and self.nid_status != User.NidStatus.NOT_SUBMITTED


class Road(models.Model):
    class Status(models.TextChoices):
        SAFE = "safe", "Safe"
        CAUTION = "caution", "Caution"
        UNSAFE = "unsafe", "Unsafe"

    id = models.CharField(primary_key=True, max_length=20, default=gen_road_id, editable=False)
    name = models.CharField(max_length=200)
    area = models.CharField(max_length=100)
    rating = models.FloatField(default=0)
    reviews = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.SAFE)
    last_incident = models.CharField(max_length=100, blank=True, null=True)
    lat = models.FloatField()
    lng = models.FloatField()
    verified_by_admin = models.BooleanField(default=False)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.area})"


class Report(models.Model):
    class Type(models.TextChoices):
        HARASSMENT = "harassment", "Harassment"
        STALKING = "stalking", "Stalking"
        UNSAFE_AREA = "unsafe_area", "Unsafe Area"
        LIGHTING = "lighting", "Poor Lighting"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        RESOLVED = "resolved", "Resolved"

    class Verification(models.TextChoices):
        PENDING = "pending", "Pending"
        SAFE = "safe", "Safe"
        UNSAFE = "unsafe", "Unsafe"
        OBJECTED = "objected", "Objected"

    id = models.CharField(primary_key=True, max_length=30, default=gen_report_id, editable=False)
    type = models.CharField(max_length=20, choices=Type.choices)
    description = models.TextField()
    location = models.CharField(max_length=200)
    area = models.CharField(max_length=100)
    road = models.ForeignKey(Road, on_delete=models.CASCADE, related_name="reports")
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    verification = models.CharField(max_length=10, choices=Verification.choices, default=Verification.PENDING)
    objection_reason = models.TextField(blank=True, null=True)
    anonymous = models.BooleanField(default=False)
    user_name = models.CharField(max_length=150, blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.type} @ {self.location}"


class Survey(models.Model):
    class Vote(models.TextChoices):
        SAFE = "safe", "Safe"
        UNSAFE = "unsafe", "Unsafe"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    id = models.CharField(primary_key=True, max_length=30, default=gen_survey_id, editable=False)
    road = models.ForeignKey(Road, on_delete=models.CASCADE, related_name="surveys")
    user_id = models.CharField(max_length=30, blank=True, null=True)
    user_name = models.CharField(max_length=150)
    safety_vote = models.CharField(max_length=10, choices=Vote.choices)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    admin_notes = models.CharField(max_length=300, blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Survey({self.road_id}, {self.safety_vote})"


class Review(models.Model):
    """A user-submitted star rating + review for a road. Only counts toward
    the road's aggregate rating/reviews once an admin verifies it, mirroring
    how Report/Survey verification works."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        VERIFIED = "verified", "Verified"
        REJECTED = "rejected", "Rejected"

    id = models.CharField(primary_key=True, max_length=30, default=gen_review_id, editable=False)
    road = models.ForeignKey(Road, on_delete=models.CASCADE, related_name="road_reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews", null=True, blank=True)
    user_name = models.CharField(max_length=150)
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"Review({self.road_id}, {self.rating}★)"


class Presence(models.Model):
    """Lightweight heartbeat row — one per user, upserted on each heartbeat —
    used to power the "active users nearby" count and to find nearby users
    to notify when an SOS alert fires. A user counts as active while
    `last_seen` is within the last few minutes (see PRESENCE_ACTIVE_WINDOW)."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="presence")
    lat = models.FloatField()
    lng = models.FloatField()
    last_seen = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Presence({self.user.email}, {self.last_seen:%H:%M:%S})"


class SosAlert(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        RESOLVED = "resolved", "Resolved"

    id = models.CharField(primary_key=True, max_length=30, default=gen_sos_id, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sos_alerts")
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"SOS({self.user.name}, {self.timestamp:%Y-%m-%d %H:%M})"
