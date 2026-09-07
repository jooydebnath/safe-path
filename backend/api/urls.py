from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

# trailing_slash=False: the frontend goes through a Next.js rewrite proxy
# that doesn't reliably preserve a trailing slash, so URLs are matched
# without one (paired with APPEND_SLASH=False in settings) to avoid a
# Next<->Django redirect loop.
router = DefaultRouter(trailing_slash=False)
router.register("roads", views.RoadViewSet, basename="road")
router.register("reports", views.ReportViewSet, basename="report")
router.register("surveys", views.SurveyViewSet, basename="survey")
router.register("reviews", views.ReviewViewSet, basename="review")
router.register("users", views.UserViewSet, basename="user")
router.register("sos", views.SosAlertViewSet, basename="sos")

urlpatterns = [
    path("auth/login", views.LoginView.as_view(), name="auth-login"),
    path("auth/register", views.RegisterView.as_view(), name="auth-register"),
    path("auth/admin-pin", views.AdminPinView.as_view(), name="auth-admin-pin"),
    path("auth/username-available", views.UsernameAvailabilityView.as_view(), name="auth-username-available"),
    path("auth/complete-profile", views.ProfileCompleteView.as_view(), name="auth-complete-profile"),
    path("presence/heartbeat", views.PresenceHeartbeatView.as_view(), name="presence-heartbeat"),
    path("presence/nearby", views.PresenceNearbyView.as_view(), name="presence-nearby"),
    path("routes/safety", views.RouteSafetyView.as_view(), name="route-safety"),
    path("", include(router.urls)),
]
