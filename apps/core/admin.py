from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from apps.core.models import PrivacyPolicy


class SingletonModelAdmin(admin.ModelAdmin):
    """Admin for a model that only ever holds a single row (pk=1) -- disables
    add/delete and sends the changelist straight to that row's change form,
    so nobody accidentally creates a second one."""

    def has_add_permission(self, request):
        return not self.model.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = self.model.load()
        url = reverse(
            f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_change",
            args=[obj.pk],
        )
        return redirect(url)


@admin.register(PrivacyPolicy)
class PrivacyPolicyAdmin(SingletonModelAdmin):
    fields = (
        "last_updated", "overview", "policy_updates",
        "data_collected", "data_usage", "third_party_services", "data_protection",
        "user_rights", "guestbook_limitations", "email_communications", "legal_basis",
        "cookies", "copyright_credits",
    )
