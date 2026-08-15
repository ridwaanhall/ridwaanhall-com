from django import forms
from django.contrib import admin
from django.shortcuts import redirect
from django.urls import reverse

from apps.core.admin_widgets import (
    CopyrightCreditsField,
    GroupedKeyValueField,
    KeyValueField,
)
from apps.core.models import PrivacyPolicy

# Every section renders as label/description rows in
# core/sections/privacy_policy_content.html, so each is edited as pairs rather
# than raw JSON. Three shapes are involved, which is precisely why these are
# declared per-field instead of via formfield_overrides.
_FLAT_SECTIONS = (
    "data_usage",
    "third_party_services",
    "data_protection",
    "user_rights",
    "guestbook_limitations",
    "email_communications",
    "legal_basis",
)


PrivacyPolicyAdminForm = type(
    "PrivacyPolicyAdminForm",
    (forms.ModelForm,),
    {
        **{name: KeyValueField(required=False) for name in _FLAT_SECTIONS},
        # Two-level: named groups holding label/description pairs.
        "data_collected": GroupedKeyValueField(
            required=False, group_label="Source", key_label="Data point",
        ),
        "cookies": GroupedKeyValueField(
            required=False, group_label="Cookie type", key_label="Cookie",
        ),
        # Fixed four-key hybrid; the template hardcodes all four, so the editor
        # cannot add or remove top-level keys.
        "copyright_credits": CopyrightCreditsField(required=False),
        "Meta": type("Meta", (), {"model": PrivacyPolicy, "fields": "__all__"}),
    },
)


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
    form = PrivacyPolicyAdminForm
    fields = (
        "last_updated", "overview", "policy_updates",
        "data_collected", "data_usage", "third_party_services", "data_protection",
        "user_rights", "guestbook_limitations", "email_communications", "legal_basis",
        "cookies", "copyright_credits",
    )
