from django.contrib import admin

from apps.guestbook.models import ChatMessage, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_author", "is_co_author", "co_author_order")
    list_filter = ("is_author", "is_co_author")
    search_fields = ("user__username", "user__email")


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("user", "message_preview", "timestamp", "is_pinned")
    list_filter = ("is_pinned",)
    search_fields = ("message", "user__username")

    @admin.display(description="Message")
    def message_preview(self, obj):
        return obj.message[:50]
