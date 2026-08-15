from django import forms
from django.contrib import admin

from apps.blog.models import BlogImage, BlogPost
from apps.core.admin_widgets import ContentBlockField, StringListField


class BlogPostAdminForm(forms.ModelForm):
    """BlogPost mixes two JSON shapes, which is exactly why these are declared
    per-field here rather than through ModelAdmin.formfield_overrides (that
    maps a whole field class to a single widget)."""

    content = ContentBlockField(
        required=False,
        help_text=(
            "Ordered content blocks. Text is rendered as raw HTML, so tags like "
            "&lt;strong&gt; and &lt;code&gt; work; the class field is passed "
            "straight through to the element."
        ),
    )
    tags = StringListField(required=False, item_label="tag")

    class Meta:
        model = BlogPost
        fields = "__all__"


class BlogImageInline(admin.TabularInline):
    model = BlogImage
    extra = 1


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    form = BlogPostAdminForm
    inlines = [BlogImageInline]
    list_display = ("title", "slug", "is_featured", "views", "created_at")
    list_filter = ("is_featured", "category", "created_at")
    search_fields = ("title", "description", "author")
    prepopulated_fields = {"slug": ("title",)}
