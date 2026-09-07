from rest_framework import serializers

from .models import Presence, Report, Review, Road, SosAlert, Survey, User
from .nid import InvalidNidFormat, hash_nid, validate_nid_format
from .username import USERNAME_RE, is_valid_username


class RoadSerializer(serializers.ModelSerializer):
    lastIncident = serializers.CharField(source="last_incident", required=False, allow_null=True)
    verifiedByAdmin = serializers.BooleanField(source="verified_by_admin", required=False)
    coordinates = serializers.SerializerMethodField()

    class Meta:
        model = Road
        fields = [
            "id", "name", "area", "rating", "reviews", "status",
            "lastIncident", "coordinates", "verifiedByAdmin",
        ]

    def get_coordinates(self, obj):
        return {"lat": obj.lat, "lng": obj.lng}


class RoadStatusUpdateSerializer(serializers.ModelSerializer):
    verifiedByAdmin = serializers.BooleanField(source="verified_by_admin", required=False)

    class Meta:
        model = Road
        fields = ["status", "verifiedByAdmin"]


class RoadCreateSerializer(serializers.ModelSerializer):
    lastIncident = serializers.CharField(source="last_incident", required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Road
        fields = ["name", "area", "rating", "reviews", "status", "lastIncident", "lat", "lng"]


class ReportSerializer(serializers.ModelSerializer):
    roadId = serializers.PrimaryKeyRelatedField(source="road", queryset=Road.objects.all())
    objectionReason = serializers.CharField(source="objection_reason", required=False, allow_null=True, allow_blank=True)
    userName = serializers.CharField(source="user_name", required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Report
        fields = [
            "id", "type", "description", "location", "area", "roadId",
            "timestamp", "status", "verification", "objectionReason",
            "anonymous", "userName",
        ]
        read_only_fields = ["id", "timestamp", "status", "verification"]


class ReportVerifySerializer(serializers.Serializer):
    verification = serializers.ChoiceField(choices=["safe", "unsafe"])


class ReportObjectSerializer(serializers.Serializer):
    reason = serializers.CharField()


class SurveySerializer(serializers.ModelSerializer):
    roadId = serializers.PrimaryKeyRelatedField(source="road", queryset=Road.objects.all())
    userId = serializers.CharField(source="user_id", required=False, allow_null=True, allow_blank=True)
    userName = serializers.CharField(source="user_name")
    safetyVote = serializers.ChoiceField(source="safety_vote", choices=Survey.Vote.choices)
    adminNotes = serializers.CharField(source="admin_notes", required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Survey
        fields = [
            "id", "roadId", "userId", "userName", "safetyVote", "notes",
            "timestamp", "status", "adminNotes",
        ]
        read_only_fields = ["id", "timestamp", "status"]


class SurveyVerifySerializer(serializers.Serializer):
    approved = serializers.BooleanField()
    adminNotes = serializers.CharField(required=False, allow_blank=True)


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    joinedAt = serializers.DateField(source="joined_at", read_only=True)
    reportsCount = serializers.IntegerField(source="reports_count", read_only=True)
    isActive = serializers.BooleanField(source="is_active", read_only=True)
    username = serializers.CharField(source="handle", read_only=True)
    nidStatus = serializers.CharField(source="nid_status", read_only=True)

    class Meta:
        model = User
        fields = [
            "id", "name", "email", "username", "phone", "area", "role",
            "joinedAt", "reportsCount", "isActive", "nidStatus",
        ]


class UserStatusSerializer(serializers.ModelSerializer):
    """Admin-only, narrow serializer for suspending/reactivating a user.
    Only the active flag is writable here — everything else about a user
    account stays out of reach of this endpoint."""

    isActive = serializers.BooleanField(source="is_active")

    class Meta:
        model = User
        fields = ["isActive"]


class AuthUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    username = serializers.CharField(source="handle", read_only=True)
    nidStatus = serializers.CharField(source="nid_status", read_only=True)
    profileComplete = serializers.BooleanField(source="profile_complete", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "email", "username", "area", "role", "nidStatus", "profileComplete"]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    # City/area picked at signup so the user can be widely identified
    # (nearby roads, reports, reviews) rather than tied to one exact pin.
    area = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(min_length=6)
    # NID is mandatory going forward, but kept as a serializer-level
    # requirement (rather than a hard model constraint) so existing rows
    # created before this field existed don't break — see ProfileCompleteView
    # for how pre-existing accounts backfill it.
    nid = serializers.CharField(write_only=True)
    username = serializers.CharField(
        max_length=30, required=False, allow_blank=True,
        help_text="Optional — auto-generated from name if left blank.",
    )

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_nid(self, value):
        try:
            cleaned = validate_nid_format(value)
        except InvalidNidFormat as exc:
            raise serializers.ValidationError(str(exc))
        if User.objects.filter(nid_hash=hash_nid(cleaned)).exists():
            raise serializers.ValidationError("An account with this NID already exists.")
        return cleaned

    def validate_username(self, value):
        if not value:
            return value
        value = value.strip().lower()
        if not is_valid_username(value):
            raise serializers.ValidationError(
                "Username must be 3-30 characters: lowercase letters, numbers, underscores only."
            )
        if User.objects.filter(handle__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class UsernameAvailabilitySerializer(serializers.Serializer):
    username = serializers.CharField(max_length=30)

    def validate_username(self, value):
        value = value.strip().lower()
        if not is_valid_username(value):
            raise serializers.ValidationError(
                "Username must be 3-30 characters: lowercase letters, numbers, underscores only."
            )
        return value


class ProfileCompleteSerializer(serializers.Serializer):
    """Used by existing pre-NID/pre-username accounts to backfill both
    fields in one mandatory step, enforced by the frontend on next login
    (see ProfileCompleteView)."""

    nid = serializers.CharField(write_only=True)
    username = serializers.CharField(max_length=30, required=False, allow_blank=True)

    def validate_nid(self, value):
        try:
            cleaned = validate_nid_format(value)
        except InvalidNidFormat as exc:
            raise serializers.ValidationError(str(exc))
        user = self.context["request"].user
        if User.objects.filter(nid_hash=hash_nid(cleaned)).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("An account with this NID already exists.")
        return cleaned

    def validate_username(self, value):
        if not value:
            return value
        value = value.strip().lower()
        if not is_valid_username(value):
            raise serializers.ValidationError(
                "Username must be 3-30 characters: lowercase letters, numbers, underscores only."
            )
        user = self.context["request"].user
        if User.objects.filter(handle__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class NidAdminReviewSerializer(serializers.Serializer):
    approved = serializers.BooleanField()


class AdminPinSerializer(serializers.Serializer):
    pin = serializers.CharField()


class SosAlertSerializer(serializers.ModelSerializer):
    userName = serializers.CharField(source="user.name", read_only=True)
    userPhone = serializers.CharField(source="user.phone", read_only=True)

    class Meta:
        model = SosAlert
        fields = ["id", "userName", "userPhone", "lat", "lng", "timestamp", "status"]
        read_only_fields = ["id", "userName", "userPhone", "timestamp", "status"]


class SosAlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SosAlert
        fields = ["lat", "lng"]

    def validate_lat(self, value):
        if value is not None and not (-90 <= value <= 90):
            raise serializers.ValidationError("Invalid latitude.")
        return value

    def validate_lng(self, value):
        if value is not None and not (-180 <= value <= 180):
            raise serializers.ValidationError("Invalid longitude.")
        return value


class ReviewSerializer(serializers.ModelSerializer):
    roadId = serializers.PrimaryKeyRelatedField(source="road", queryset=Road.objects.all())
    userName = serializers.CharField(source="user_name")

    class Meta:
        model = Review
        fields = ["id", "roadId", "userName", "rating", "comment", "timestamp", "status"]
        read_only_fields = ["id", "timestamp", "status"]

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ReviewVerifySerializer(serializers.Serializer):
    approved = serializers.BooleanField()


class PresenceHeartbeatSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()

    def validate_lat(self, value):
        if not (-90 <= value <= 90):
            raise serializers.ValidationError("Invalid latitude.")
        return value

    def validate_lng(self, value):
        if not (-180 <= value <= 180):
            raise serializers.ValidationError("Invalid longitude.")
        return value


class RouteSafetySerializer(serializers.Serializer):
    """Route safety check between two points — origin/dest lat/lng is all
    that's needed since the frontend already resolves an area name or a
    geocoded address to coordinates before calling this endpoint. See
    views.RouteSafetyView for the OSRM-routed buffer-distance logic."""

    originLat = serializers.FloatField()
    originLng = serializers.FloatField()
    destLat = serializers.FloatField()
    destLng = serializers.FloatField()
