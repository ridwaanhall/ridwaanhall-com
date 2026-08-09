from django.contrib import admin

from apps.projects.models import Feature, Project, ProjectImage


class FeatureInline(admin.TabularInline):
    model = Feature
    extra = 1


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    inlines = [FeatureInline, ProjectImageInline]
    filter_horizontal = ("tech_stack",)
    list_display = ("title", "slug", "status", "is_featured", "featured_priority")
    list_filter = ("status", "is_featured")
    search_fields = ("title", "headline", "category")
    prepopulated_fields = {"slug": ("title",)}
