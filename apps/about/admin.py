from django.contrib import admin

from apps.about.models import (
    Application,
    Award,
    Certification,
    DonateLink,
    Education,
    Experience,
    JourneyStep,
    Profile,
    Skill,
)
from apps.core.admin import SingletonModelAdmin


class DonateLinkInline(admin.TabularInline):
    model = DonateLink
    extra = 1


@admin.register(Profile)
class ProfileAdmin(SingletonModelAdmin):
    inlines = [DonateLinkInline]
    fieldsets = (
        (None, {"fields": ("name", "first_name", "last_name", "username", "aka", "role", "image")}),
        ("Links", {"fields": ("personal_website", "cv_main", "cv_latest", "cv_copy")}),
        ("Status", {"fields": ("is_open_to_work", "is_hiring", "is_sick")}),
        ("Bio", {"fields": ("short_description", "short_bio", "short_cta", "long_description", "stories", "skills_highlight")}),
        ("Location", {"fields": (
            "location_regency", "location_residency", "location_province",
            "location_prov", "location_country", "location_flag",
        )}),
        ("Social", {"fields": (
            "social_email", "social_github", "social_linkedin", "social_follow_linkedin",
            "social_instagram", "social_medium", "social_x", "social_website",
        )}),
    )


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ("title", "company", "sort_order", "is_current")
    list_filter = ("is_current", "employment_type", "location_type")
    search_fields = ("title", "company")
    ordering = ("sort_order",)


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ("degree", "institution", "is_last")
    list_filter = ("is_last",)
    search_fields = ("degree", "institution")


@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    list_display = ("title", "institution", "issued_year")
    list_filter = ("issued_year",)
    search_fields = ("title", "institution")


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    list_display = ("title", "institution", "is_featured", "issued_year")
    list_filter = ("is_featured", "issued_year")
    search_fields = ("title", "institution")


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "category")
    list_filter = ("category",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


class JourneyStepInline(admin.TabularInline):
    model = JourneyStep
    extra = 1


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    inlines = [JourneyStepInline]
    list_display = ("company_name", "position", "status", "employment_type", "location_type")
    list_filter = ("status", "employment_type", "location_type")
    search_fields = ("company_name", "position")
