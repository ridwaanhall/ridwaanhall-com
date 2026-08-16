from django import forms
from django.contrib import admin

from apps.core.admin_widgets import KeyValueField
from apps.legal.models import LegalDocument, LegalSection


class LegalSectionForm(forms.ModelForm):
    # Definition lists get the structured key/value editor rather than a raw
    # JSON textarea, matching how every other JSON field in this project's
    # admin is handled.
    items = KeyValueField(required=False)

    class Meta:
        model = LegalSection
        exclude = ("document",)


class LegalSectionInline(admin.StackedInline):
    model = LegalSection
    form = LegalSectionForm
    extra = 0
    fields = ("order", "heading", "parent", "body", "items")
    ordering = ("order", "id")

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Only offer sections from the document being edited as a parent, and
        # only top-level ones -- nesting is deliberately one level deep.
        if db_field.name == "parent":
            document_id = request.resolver_match.kwargs.get("object_id")
            queryset = LegalSection.objects.filter(parent__isnull=True)
            kwargs["queryset"] = (
                queryset.filter(document_id=document_id)
                if document_id
                else queryset.none()
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(LegalDocument)
class LegalDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "document_type", "slug", "is_published", "section_count", "last_updated")
    list_filter = ("document_type", "is_published")
    search_fields = ("title", "slug", "summary")
    prepopulated_fields = {"slug": ("title",)}
    inlines = [LegalSectionInline]
    fieldsets = (
        (None, {"fields": ("title", "slug", "document_type", "sort_order", "is_published")}),
        ("Intro", {"fields": ("summary",)}),
    )

    @admin.display(description="Sections")
    def section_count(self, obj):
        return obj.sections.count()


@admin.register(LegalSection)
class LegalSectionAdmin(admin.ModelAdmin):
    """Registered so sections are searchable on their own; editing normally
    happens through the document's inline."""

    form = LegalSectionForm
    list_display = ("heading", "document", "parent", "order")
    list_filter = ("document",)
    search_fields = ("heading", "body")
    list_select_related = ("document", "parent")

    def get_form(self, request, obj=None, **kwargs):
        kwargs["form"] = type("LegalSectionAdminForm", (LegalSectionForm,), {
            "Meta": type("Meta", (LegalSectionForm.Meta,), {"exclude": None, "fields": "__all__"}),
        })
        return super().get_form(request, obj, **kwargs)
