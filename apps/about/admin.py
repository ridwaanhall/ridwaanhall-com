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
    ProfileSkillHighlight,
    Skill,
)
from apps.core.admin import SingletonModelAdmin
from apps.core.admin_forms import string_list_form

# `stories` is rendered with |safe (about/sections/intro.html), so entries may
# contain raw HTML and get multi-line inputs; the rest are plain prose lines.
ProfileAdminForm = string_list_form(
    Profile,
    ["stories"],
    per_field={"stories": {"multiline": True, "allows_html": True, "item_label": "story"}},
)
ExperienceAdminForm = string_list_form(
    Experience,
    ["responsibilities"],
    per_field={"responsibilities": {"multiline": True, "item_label": "responsibility"}},
)
EducationAdminForm = string_list_form(
    Education,
    ["achievements"],
    per_field={"achievements": {"multiline": True, "item_label": "achievement"}},
)
CertificationAdminForm = string_list_form(
    Certification,
    ["achievements"],
    per_field={"achievements": {"multiline": True, "item_label": "achievement"}},
)


class DonateLinkInline(admin.TabularInline):
    model = DonateLink
    extra = 1


class ProfileSkillHighlightInline(admin.TabularInline):
    """Ordered picker for the highlighted skills.

    A through model rules out filter_horizontal (admin.E013), which is the
    right trade: that widget cannot express order anyway. `autocomplete_fields`
    keeps picking from the 100+ Skill rows searchable rather than a long
    <select>, and the `order` column is what JSON-LD `knowsAbout` follows.
    """

    model = ProfileSkillHighlight
    extra = 1
    autocomplete_fields = ["skill"]
    ordering = ("order",)
    verbose_name = "highlighted skill"
    verbose_name_plural = "highlighted skills"


@admin.register(Profile)
class ProfileAdmin(SingletonModelAdmin):
    form = ProfileAdminForm
    inlines = [ProfileSkillHighlightInline, DonateLinkInline]
    fieldsets = (
        (None, {"fields": ("name", "first_name", "last_name", "username", "aka", "role", "image")}),
        ("Links", {"fields": ("personal_website", "cv_main", "cv_latest", "cv_copy")}),
        ("Status", {"fields": ("is_open_to_work", "is_hiring", "is_sick")}),
        ("Bio", {"fields": ("short_description", "short_bio", "short_cta", "long_description", "stories")}),
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
    form = ExperienceAdminForm
    list_display = ("title", "company", "period_start", "period_end", "sort_order", "is_current")
    list_filter = ("is_current", "employment_type", "location_type",
                   ("period_start", admin.DateFieldListFilter))
    search_fields = ("title", "company")
    ordering = ("sort_order",)


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    form = EducationAdminForm
    list_display = ("degree", "institution", "years", "date_start", "is_last")
    list_filter = ("is_last",)
    search_fields = ("degree", "institution")


@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    # DateFieldListFilter gives "today / past 7 days / this month / this year"
    # rather than the flat list of years the integer column produced.
    list_display = ("title", "institution", "issued")
    list_filter = (("issued", admin.DateFieldListFilter),)
    date_hierarchy = "issued"
    search_fields = ("title", "institution")


@admin.register(Certification)
class CertificationAdmin(admin.ModelAdmin):
    form = CertificationAdminForm
    list_display = ("title", "institution", "is_featured", "issued")
    list_filter = ("is_featured", ("issued", admin.DateFieldListFilter))
    date_hierarchy = "issued"
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
