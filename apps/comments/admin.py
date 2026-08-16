from django.contrib import admin

from apps.comments.models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("user", "target_label", "short_body", "is_deleted", "created_at")
    list_filter = ("is_deleted", "content_type", "created_at")
    search_fields = ("body", "user__username", "user__email")
    autocomplete_fields = ("user",)
    readonly_fields = ("created_at",)
    list_select_related = ("user", "content_type")

    @admin.display(description="On")
    def target_label(self, obj):
        return f"{obj.content_type.model} #{obj.object_id}"

    @admin.display(description="Comment")
    def short_body(self, obj):
        return obj.body[:70] + ("…" if len(obj.body) > 70 else "")
