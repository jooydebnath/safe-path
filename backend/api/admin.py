from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Presence, Report, Review, Road, SosAlert, Survey, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    model = User
    ordering = ["email"]
    list_display = ["email", "handle", "name", "role", "nid_status", "is_staff"]
    list_filter = DjangoUserAdmin.list_filter + ("nid_status",)
    # nid_encrypted/nid_hash are intentionally left out of every fieldset —
    # the raw NID is never surfaced in the Django admin UI, only through
    # the app's own admin-review flow (UserViewSet.nid_review) which never
    # decrypts it either. Decryption (api.nid.decrypt_nid) is reserved for
    # a future dedicated, audited manual-review screen, not general admin
    # access.
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("name", "handle", "phone", "area", "role", "reports_count")}),
        ("Identity verification", {"fields": ("nid_status",)}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "name", "role", "password1", "password2"),
        }),
    )
    search_fields = ["email", "name", "handle"]


@admin.register(Road)
class RoadAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "area", "status", "rating", "verified_by_admin"]
    list_filter = ["status", "area"]
    search_fields = ["name", "area"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["id", "type", "area", "status", "verification", "timestamp"]
    list_filter = ["type", "status", "verification"]


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ["id", "road", "safety_vote", "status", "timestamp"]
    list_filter = ["safety_vote", "status"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["id", "road", "rating", "status", "timestamp"]
    list_filter = ["status", "rating"]


@admin.register(SosAlert)
class SosAlertAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "lat", "lng", "status", "timestamp"]
    list_filter = ["status"]


@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ["user", "lat", "lng", "last_seen"]
