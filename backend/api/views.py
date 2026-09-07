from datetime import timedelta

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings
from django.db import models
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .geo import fetch_osrm_route, haversine_m, point_to_polyline_distance_m, point_to_segment_distance_m
from .models import Presence, Report, Review, Road, SosAlert, Survey, User
from .nid import encrypt_nid, hash_nid, verify_nid
from .permissions import IsAdminRole
from .serializers import (
    AdminPinSerializer,
    AuthUserSerializer,
    LoginSerializer,
    NidAdminReviewSerializer,
    PresenceHeartbeatSerializer,
    ProfileCompleteSerializer,
    RegisterSerializer,
    ReportObjectSerializer,
    ReportSerializer,
    ReportVerifySerializer,
    ReviewSerializer,
    ReviewVerifySerializer,
    RoadCreateSerializer,
    RoadSerializer,
    RoadStatusUpdateSerializer,
    RouteSafetySerializer,
    SosAlertCreateSerializer,
    SosAlertSerializer,
    SurveySerializer,
    SurveyVerifySerializer,
    UsernameAvailabilitySerializer,
    UserSerializer,
    UserStatusSerializer,
)
from .username import generate_unique_username


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        password = serializer.validated_data["password"]

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"error": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(password):
            return Response({"error": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            return Response({"error": "This account has been suspended."}, status=status.HTTP_403_FORBIDDEN)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": AuthUserSerializer(user).data})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        raw_nid = data["nid"]
        handle = data.get("username") or generate_unique_username(User, data["name"])

        user = User.objects.create_user(
            email=data["email"],
            password=data["password"],
            name=data["name"],
            phone=data.get("phone", ""),
            area=data.get("area", ""),
            role=User.Role.USER,
            handle=handle,
            nid_encrypted=encrypt_nid(raw_nid),
            nid_hash=hash_nid(raw_nid),
            nid_status=verify_nid(raw_nid),
        )
        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {"token": token.key, "user": AuthUserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class UsernameAvailabilityView(APIView):
    """Public, read-only check used for live availability feedback while
    typing a username (registration or profile completion)."""

    permission_classes = [AllowAny]

    def get(self, request):
        serializer = UsernameAvailabilitySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data["username"]
        available = not User.objects.filter(handle__iexact=username).exists()
        return Response({"available": available})


class ProfileCompleteView(APIView):
    """Backfills NID + username for accounts created before those fields
    were mandatory. The frontend's app-shell layout redirects any
    authenticated user with profileComplete=false here on their next
    login/visit until this succeeds."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProfileCompleteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user

        raw_nid = data["nid"]
        user.nid_encrypted = encrypt_nid(raw_nid)
        user.nid_hash = hash_nid(raw_nid)
        user.nid_status = verify_nid(raw_nid)
        user.handle = data.get("username") or generate_unique_username(User, user.name)
        user.save(update_fields=["nid_encrypted", "nid_hash", "nid_status", "handle"])

        return Response({"user": AuthUserSerializer(user).data})


class AdminPinView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def post(self, request):
        serializer = AdminPinSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pin = serializer.validated_data["pin"]
        if pin == settings.ADMIN_PIN:
            return Response({"ok": True})
        return Response({"ok": False, "error": "Invalid PIN"}, status=status.HTTP_400_BAD_REQUEST)


class RoadViewSet(viewsets.ModelViewSet):
    queryset = Road.objects.all()
    serializer_class = RoadSerializer
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "partial_update", "update"):
            return [IsAuthenticated(), IsAdminRole()]
        return [AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = RoadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        road = serializer.save()
        return Response(RoadSerializer(road).data, status=status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = RoadStatusUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(RoadSerializer(instance).data)


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.select_related("road").all()
    serializer_class = ReportSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action in ("verify", "object_report"):
            return [IsAuthenticated(), IsAdminRole()]
        return [AllowAny()]

    def perform_create(self, serializer):
        report = serializer.save()
        user = self.request.user
        if user and user.is_authenticated and not report.anonymous:
            User.objects.filter(pk=user.pk).update(reports_count=user.reports_count + 1)

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        report = self.get_object()
        serializer = ReportVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report.verification = serializer.validated_data["verification"]
        report.status = Report.Status.VERIFIED
        report.save()
        return Response(ReportSerializer(report).data)

    @action(detail=True, methods=["post"], url_path="object")
    def object_report(self, request, pk=None):
        report = self.get_object()
        serializer = ReportObjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        report.verification = Report.Verification.OBJECTED
        report.objection_reason = serializer.validated_data["reason"]
        report.status = Report.Status.VERIFIED
        report.save()
        return Response(ReportSerializer(report).data)


class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.select_related("road").all()
    serializer_class = SurveySerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "verify":
            return [IsAuthenticated(), IsAdminRole()]
        return [AllowAny()]

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        survey = self.get_object()
        serializer = SurveyVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approved = serializer.validated_data["approved"]
        admin_notes = serializer.validated_data.get("adminNotes", "")

        survey.status = Survey.Status.VERIFIED if approved else Survey.Status.REJECTED
        survey.admin_notes = admin_notes
        survey.save()

        if approved:
            road = survey.road
            road.status = Road.Status.SAFE if survey.safety_vote == Survey.Vote.SAFE else Road.Status.UNSAFE
            road.verified_by_admin = True
            road.save()

        return Response(SurveySerializer(survey).data)


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related("road", "user").all()
    serializer_class = ReviewSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        if self.action == "verify":
            return [IsAuthenticated(), IsAdminRole()]
        return [AllowAny()]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user, user_name=user.name or user.email)

    @staticmethod
    def _recompute_road_rating(road):
        verified = road.road_reviews.filter(status=Review.Status.VERIFIED)
        count = verified.count()
        avg = sum(r.rating for r in verified) / count if count else 0
        road.rating = round(avg, 1)
        road.reviews = count
        road.save(update_fields=["rating", "reviews"])

    @action(detail=True, methods=["post"])
    def verify(self, request, pk=None):
        review = self.get_object()
        serializer = ReviewVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        approved = serializer.validated_data["approved"]

        review.status = Review.Status.VERIFIED if approved else Review.Status.REJECTED
        review.save()
        self._recompute_road_rating(review.road)

        return Response(ReviewSerializer(review).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("joined_at")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminRole]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        # Admin search-by-username (as well as name/email) — the frontend's
        # client-side filter already covers name/email, so this only needs
        # to add username; kept simple (icontains) rather than pulling in
        # django-filter for one field.
        q = self.request.query_params.get("search")
        if q:
            qs = qs.filter(
                models.Q(handle__icontains=q)
                | models.Q(name__icontains=q)
                | models.Q(email__icontains=q)
            )
        return qs

    def get_serializer_class(self):
        if self.action == "partial_update":
            return UserStatusSerializer
        return UserSerializer

    def partial_update(self, request, *args, **kwargs):
        if str(request.user.pk) == str(kwargs.get("pk")):
            return Response({"error": "You cannot change your own account status."}, status=status.HTTP_400_BAD_REQUEST)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.pk == instance.pk:
            return Response({"error": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="nid-review")
    def nid_review(self, request, pk=None):
        """Admin manually approves/rejects a pending NID submission — there
        is no live government verification API wired up (see api/nid.py),
        so every submission lands here as the source of truth."""
        user = self.get_object()
        serializer = NidAdminReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.nid_status = (
            User.NidStatus.VERIFIED if serializer.validated_data["approved"] else User.NidStatus.REJECTED
        )
        user.save(update_fields=["nid_status"])
        return Response(UserSerializer(user).data)


class SosAlertViewSet(viewsets.ModelViewSet):
    queryset = SosAlert.objects.select_related("user").all()
    serializer_class = SosAlertSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminRole()]

    def create(self, request, *args, **kwargs):
        serializer = SosAlertCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alert = serializer.save(user=request.user)
        if alert.lat is not None and alert.lng is not None:
            _broadcast_sos_to_nearby(alert)
        return Response(SosAlertSerializer(alert).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.status = SosAlert.Status.RESOLVED
        alert.save()
        return Response(SosAlertSerializer(alert).data)


def _broadcast_sos_to_nearby(alert):
    """Finds other ACTIVE users (recent Presence heartbeat) within
    SOS_BROADCAST_RADIUS_M of the alert and pushes an emergency notification
    directly to each of their per-user channel-layer groups. Server-side
    proximity filtering (rather than a single shared broadcast group) keeps
    the sender from getting their own alert and keeps clients from having to
    do any distance math themselves."""
    cutoff = timezone.now() - timedelta(minutes=settings.PRESENCE_ACTIVE_MINUTES)
    nearby_user_ids = [
        p.user_id
        for p in Presence.objects.filter(last_seen__gte=cutoff).exclude(user_id=alert.user_id)
        if haversine_m(alert.lat, alert.lng, p.lat, p.lng) <= settings.SOS_BROADCAST_RADIUS_M
    ]
    if not nearby_user_ids:
        return

    channel_layer = get_channel_layer()
    payload = {
        "type": "sos_nearby",
        "alertId": alert.id,
        "userName": alert.user.name or alert.user.email,
        "lat": alert.lat,
        "lng": alert.lng,
        "timestamp": alert.timestamp.isoformat(),
    }
    for user_id in nearby_user_ids:
        async_to_sync(channel_layer.group_send)(
            f"user_{user_id}",
            {"type": "emergency.alert", "payload": payload},
        )


class PresenceHeartbeatView(APIView):
    """Authenticated heartbeat — upserts the caller's location + last_seen,
    powering both the "active users nearby" count and SOS proximity
    broadcast."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PresenceHeartbeatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Presence.objects.update_or_create(
            user=request.user,
            defaults={"lat": serializer.validated_data["lat"], "lng": serializer.validated_data["lng"]},
        )
        return Response({"ok": True})


class PresenceNearbyView(APIView):
    """Public — just returns a count, no identifying info. Counts active
    (recently-heartbeat) users within radius_m of (lat, lng); with no
    coordinates given, falls back to the app-wide active-user count."""

    permission_classes = [AllowAny]

    def get(self, request):
        cutoff = timezone.now() - timedelta(minutes=settings.PRESENCE_ACTIVE_MINUTES)
        active = Presence.objects.filter(last_seen__gte=cutoff)

        lat = request.query_params.get("lat")
        lng = request.query_params.get("lng")
        if lat is None or lng is None:
            return Response({"count": active.count()})

        try:
            lat, lng = float(lat), float(lng)
        except ValueError:
            return Response({"error": "Invalid lat/lng."}, status=status.HTTP_400_BAD_REQUEST)
        radius_m = float(request.query_params.get("radius_m", 2000))

        count = sum(1 for p in active if haversine_m(lat, lng, p.lat, p.lng) <= radius_m)
        return Response({"count": count})


class RouteSafetyView(APIView):
    """Fetches a real road-following route between origin and destination
    from OSRM's free public demo routing server, then checks which existing
    roads fall within a buffer distance of that *routed* polyline (not just
    the straight origin->dest segment) to decide the route's overall safety.
    This keeps the safety verdict consistent with the road-following line the
    frontend now draws (see RouteMap.tsx).

    OSRM's demo server carries no uptime guarantee, so any failure there
    (timeout, non-2xx, malformed response) is swallowed and we transparently
    fall back to the previous straight-line buffer check — the response
    always includes `routedPolyline: null` and `approximate: true` in that
    case so the frontend can show a small "showing approximate route" note
    instead of erroring out the page."""

    permission_classes = [AllowAny]
    BUFFER_M = 400

    def post(self, request):
        serializer = RouteSafetySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        origin = (d["originLat"], d["originLng"])
        dest = (d["destLat"], d["destLng"])

        polyline = fetch_osrm_route(origin, dest)
        approximate = polyline is None
        # Always check against *some* polyline — the OSRM route if we got
        # one, otherwise the straight origin->dest segment as before.
        check_line = polyline if polyline else [origin, dest]

        nearby_unsafe, nearby_caution = [], []
        for road in Road.objects.all():
            dist = point_to_polyline_distance_m((road.lat, road.lng), check_line)
            if dist > self.BUFFER_M:
                continue
            if road.status == Road.Status.UNSAFE:
                nearby_unsafe.append(road)
            elif road.status == Road.Status.CAUTION:
                nearby_caution.append(road)

        if nearby_unsafe:
            verdict = "unsafe"
            names = ", ".join(r.name for r in nearby_unsafe[:3])
            reason = f"Passes near {len(nearby_unsafe)} unsafe road(s) along the route: {names}"
        elif nearby_caution:
            verdict = "caution"
            names = ", ".join(r.name for r in nearby_caution[:3])
            reason = f"Passes near {len(nearby_caution)} caution road(s) along the route: {names}"
        else:
            verdict = "safe"
            reason = "No reported unsafe or caution roads along this route."

        return Response({
            "status": verdict,
            "reason": reason,
            "unsafeRoads": RoadSerializer(nearby_unsafe, many=True).data,
            "cautionRoads": RoadSerializer(nearby_caution, many=True).data,
            # [{lat, lng}, ...] road-following path for the frontend to draw
            # instead of a 2-point straight line; null when OSRM was
            # unreachable, in which case `approximate` is true.
            "routedPolyline": [{"lat": lat, "lng": lng} for lat, lng in polyline] if polyline else None,
            "approximate": approximate,
        })
