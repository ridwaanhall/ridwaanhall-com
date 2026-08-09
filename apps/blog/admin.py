from django.contrib import admin

from apps.blog.models import BlogImage, BlogPost


class BlogImageInline(admin.TabularInline):
    model = BlogImage
    extra = 1


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    inlines = [BlogImageInline]
    list_display = ("title", "slug", "is_featured", "views", "created_at")
    list_filter = ("is_featured", "category", "created_at")
    search_fields = ("title", "description", "author")
    prepopulated_fields = {"slug": ("title",)}
