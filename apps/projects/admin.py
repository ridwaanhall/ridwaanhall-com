from django.contrib import admin

from apps.core.admin_forms import string_list_form
from apps.projects.models import Feature, Project, ProjectImage

# `description` is a list of paragraphs rendered WITHOUT |safe (unlike
# Profile.stories), so any HTML typed here would show up escaped on the page --
# hence allows_html stays off and no "raw HTML" badge is shown.
ProjectAdminForm = string_list_form(
    Project,
    ["description", "tags"],
    per_field={
        "description": {"multiline": True, "item_label": "paragraph"},
        "tags": {"item_label": "tag"},
    },
)


class FeatureInline(admin.TabularInline):
    model = Feature
    extra = 1


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    form = ProjectAdminForm
    inlines = [FeatureInline, ProjectImageInline]
    filter_horizontal = ("tech_stack",)
    list_display = ("title", "slug", "status", "is_featured", "featured_priority")
    list_filter = ("status", "is_featured")
    search_fields = ("title", "headline", "category")
    prepopulated_fields = {"slug": ("title",)}
